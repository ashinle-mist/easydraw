<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useSvelteFlow,
		addEdge,
		type Node,
		type Edge,
		type NodeEventWithPointer,
		ConnectionMode,
		type Connection
	} from '@xyflow/svelte';
	import { nanoid } from 'nanoid';
	import {
		derived,
		get,
		type Subscriber,
		type Unsubscriber,
		type Updater,
		type Writable
	} from 'svelte/store';

	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import EditorFooter from '$lib/components/EditorFooter.svelte';
	import ContextMenu from '$lib/flow/ContextMenu.svelte';
	import RectangleNode from '$lib/flow/nodes/RectangleNode.svelte';
	import {
		activePageStore,
		createPage,
		loadEditorStateFromStorage,
		saveActivePageToStorage,
		switchPage,
		updateActiveGraph
	} from '$lib/stores/editor.store';

	import '../../xy-theme.css';

	// NOTE: Register currently available node components in this branch.
	const nodeTypes = {
		RectangleNode
	};

	// NOTE: Writable bridge so SvelteFlow node mutations are immediately written to editorStore.
	function createActiveNodesStore(): Writable<Node[]> {
		const subscribe = (run: Subscriber<Node[]>): Unsubscriber =>
			derived(activePageStore, (page) => page?.nodes ?? []).subscribe(run);

		const set = (nextNodes: Node[]) => {
			const activePage = get(activePageStore);
			if (!activePage) return;

			updateActiveGraph(nextNodes, activePage.edges);
		};

		const update = (updater: Updater<Node[]>) => {
			set(updater(get(activePageStore)?.nodes ?? []));
		};

		return { subscribe, set, update };
	}

	// NOTE: Writable bridge so SvelteFlow edge mutations are immediately written to editorStore.
	function createActiveEdgesStore(): Writable<Edge[]> {
		const subscribe = (run: Subscriber<Edge[]>): Unsubscriber =>
			derived(activePageStore, (page) => page?.edges ?? []).subscribe(run);

		const set = (nextEdges: Edge[]) => {
			const activePage = get(activePageStore);
			if (!activePage) return;

			updateActiveGraph(activePage.nodes, nextEdges);
		};

		const update = (updater: Updater<Edge[]>) => {
			set(updater(get(activePageStore)?.edges ?? []));
		};

		return { subscribe, set, update };
	}

	const activeNodesStore = createActiveNodesStore();
	const activeEdgesStore = createActiveEdgesStore();

	const { screenToFlowPosition } = useSvelteFlow();
	const type = useDnD();

	const defaultEdgeOptions = {
		type: 'smoothstep'
	};

	const onDragOver = (event: DragEvent) => {
		event.preventDefault();

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	};

	// NOTE: New node is added directly to active page graph in editorStore.
	const onDrop = (event: DragEvent) => {
		event.preventDefault();

		if (!type.current) {
			return;
		}

		const position = screenToFlowPosition({
			x: event.clientX,
			y: event.clientY
		});

		const newNode = {
			id: nanoid(),
			type: type.current,
			position,
			data: { label: 'New Node' },
			origin: [0.5, 0.0]
		} satisfies Node;

		activeNodesStore.update((nodes) => [...nodes, newNode]);
	};

	let menu: {
		id: string;
		top?: number;
		left?: number;
		right?: number;
		bottom?: number;
	} | null = $state(null);
	let clientWidth: number = $state(0);
	let clientHeight: number = $state(0);

	const handleContextMenu: NodeEventWithPointer<MouseEvent> = ({ event, node }) => {
		event.preventDefault();

		menu = {
			id: node.id,
			top: event.clientY < clientHeight - 200 ? event.clientY : undefined,
			left: event.clientX < clientWidth - 200 ? event.clientX : undefined,
			right: event.clientX >= clientWidth - 200 ? clientWidth - event.clientX : undefined,
			bottom: event.clientY >= clientHeight - 200 ? clientHeight - event.clientY : undefined
		};
	};

	function handlePaneClick() {
		menu = null;
	}

	// NOTE: Page switch now only changes activePageId because graph already syncs live into store.
	function handleSwitchPage(pageId: string) {
		switchPage(pageId);
		handlePaneClick();
	}

	function handleCreatePage() {
		createPage();
		handlePaneClick();
	}

	function onConnect(connection: Connection) {
		const newEdge: Edge = {
			...connection,
			id: nanoid(),
			type: defaultEdgeOptions.type
		};
		activeEdgesStore.update((edges) => addEdge(newEdge, edges));
	}

	// NOTE: On startup, hydrate editorStore from localStorage snapshot if available.
	onMount(() => {
		loadEditorStateFromStorage();

		// NOTE: Ctrl/Cmd+S saves active page from editorStore into localStorage.
		const handleSaveShortcut = (event: KeyboardEvent) => {
			const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
			if (!isSaveShortcut) return;

			event.preventDefault();
			saveActivePageToStorage();
		};

		window.addEventListener('keydown', handleSaveShortcut);
		return () => {
			window.removeEventListener('keydown', handleSaveShortcut);
		};
	});
</script>

<main style="width:100vw; height:100vh;" bind:clientWidth bind:clientHeight>
	<section class="canvas-shell" bind:clientWidth bind:clientHeight>
		<SvelteFlow
			bind:nodes={$activeNodesStore}
			bind:edges={$activeEdgesStore}
			{defaultEdgeOptions}
			fitView
			ondragover={onDragOver}
			ondrop={onDrop}
			onnodecontextmenu={handleContextMenu}
			onpaneclick={handlePaneClick}
			{nodeTypes}
			connectionMode={ConnectionMode.Loose}
			onconnect={onConnect}
		>
			<Background variant={BackgroundVariant.Dots} />
			{#if menu}
				<ContextMenu
					onclick={handlePaneClick}
					id={menu.id}
					top={menu.top}
					left={menu.left}
					right={menu.right}
					bottom={menu.bottom}
				/>
			{/if}
			<MiniMap />
		</SvelteFlow>
		<Sidebar />
		<Controls position="top-right" />
	</section>

	<EditorFooter onSwitchPage={handleSwitchPage} onCreatePage={handleCreatePage} />
</main>

<style>
	main {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.canvas-shell {
		flex: 1;
		position: relative;
		width: 100%;
		min-height: 0;
	}
</style>
