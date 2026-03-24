<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useSvelteFlow,
		type Node,
		type Edge,
		type NodeEventWithPointer, ConnectionMode
	} from '@xyflow/svelte';
	import { get } from 'svelte/store';

	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import EditorFooter from '$lib/components/EditorFooter.svelte';
	import ContextMenu from '$lib/flow/ContextMenu.svelte';
	import RectangleNode from '$lib/flow/nodes/RectangleNode.svelte';
	import {
		clearCanvasDirtyPage,
		createPage,
		editorStore,
		loadEditorStateFromStorage,
		markCanvasDirtyPage,
		saveActivePageToStorage,
		switchPage,
		updateActiveGraph
	} from '$lib/stores/editor.store';

	// import '@xyflow/svelte/dist/style.css';
	import '../../xy-theme.css';

	// Define all of our custom node here
	const nodeTypes = {
		RectangleNode: RectangleNode,
	};

	// Returns the active page snapshot from editor store.
	const getActivePageSnapshot = () => {
		const state = get(editorStore);
		return state.pages.find((page) => page.id === state.activePageId) ?? state.pages[0] ?? null;
	};

	// Deep-clones graph arrays so canvas edits do not mutate store by reference.
	const cloneGraph = <T,>(items: T[]) => {
		return typeof structuredClone === 'function'
			? structuredClone(items)
			: (JSON.parse(JSON.stringify(items)) as T[]);
	};
	// Creates a stable signature for dirty-checking canvas graph state.
	const createCanvasSignature = (currentNodes: Node[], currentEdges: Edge[]) => {
		return JSON.stringify({
			nodes: currentNodes,
			edges: currentEdges
		});
	};

	const initialPage = getActivePageSnapshot();
	const initialNodes = cloneGraph(initialPage?.nodes ?? ([] as Node[]));
	const initialEdges = cloneGraph(initialPage?.edges ?? ([] as Edge[]));

	// Local graph state used by SvelteFlow bindings.
	let nodes = $state.raw(initialNodes);
	let edges = $state.raw(initialEdges);
	let canvasPageId: string | null = $state(initialPage?.id ?? null);
	let baselineCanvasSignature = $state(createCanvasSignature(initialNodes, initialEdges));
	let isHydratingCanvas = $state(false);

	const { screenToFlowPosition } = useSvelteFlow();

	const type = useDnD();

	const defaultEdgeOptions = {
		type: 'smoothstep'
	};

	// Drag and drop behavior
	const onDragOver = (event: DragEvent) => {
		event.preventDefault();

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	};

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
			id: `${Math.random()}`,
			type: type.current,
			position,
			data: { label: `` }, // Define labels in the nodes themselves
			origin: [0.5, 0.0]
		} satisfies Node;

		nodes = [...nodes, newNode];
	};

	// Context Menu
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
		// Prevent native context menu from showing
		event.preventDefault();

		// Calculate position of the context menu. We want to make sure it
		// doesn't get positioned off-screen.
		menu = {
			id: node.id,
			top: event.clientY < clientHeight - 200 ? event.clientY : undefined,
			left: event.clientX < clientWidth - 200 ? event.clientX : undefined,
			right: event.clientX >= clientWidth - 200 ? clientWidth - event.clientX : undefined,
			bottom: event.clientY >= clientHeight - 200 ? clientHeight - event.clientY : undefined
		};
	};

	// Close the context menu if it's open whenever the window is clicked.
	function handlePaneClick() {
		menu = null;
	}

	// Persists the current canvas graph into the active page in store.
	function persistCanvasToStore() {
		updateActiveGraph(nodes, edges);
		baselineCanvasSignature = createCanvasSignature(nodes, edges);
		if (canvasPageId) {
			clearCanvasDirtyPage(canvasPageId);
		}
	}

	// Loads the active page graph from store into canvas state.
	function hydrateCanvasFromStore() {
		const activePage = getActivePageSnapshot();
		const nextNodes = cloneGraph(activePage?.nodes ?? []);
		const nextEdges = cloneGraph(activePage?.edges ?? []);

		isHydratingCanvas = true;
		nodes = nextNodes;
		edges = nextEdges;
		canvasPageId = activePage?.id ?? null;
		baselineCanvasSignature = createCanvasSignature(nextNodes, nextEdges);
		if (canvasPageId) {
			clearCanvasDirtyPage(canvasPageId);
		}

		queueMicrotask(() => {
			isHydratingCanvas = false;
		});
	}

	// Switches page with explicit two-step sync: persist old page, then hydrate new page.
	function handleSwitchPage(pageId: string) {
		persistCanvasToStore();
		switchPage(pageId);
		hydrateCanvasFromStore();
		handlePaneClick();
	}

	// Creates a new page and hydrates its graph into canvas.
	function handleCreatePage() {
		persistCanvasToStore();
		createPage();
		hydrateCanvasFromStore();
		handlePaneClick();
	}

	// Marks active page as dirty immediately when canvas diverges from last synced state.
	$effect(() => {
		nodes;
		edges;

		if (!canvasPageId || isHydratingCanvas) return;

		const currentCanvasSignature = createCanvasSignature(nodes, edges);

		if (currentCanvasSignature !== baselineCanvasSignature) {
			markCanvasDirtyPage(canvasPageId);
		} else {
			clearCanvasDirtyPage(canvasPageId);
		}
	});

	// Loads editor store from localStorage once and hydrates canvas from it.
	onMount(() => {
		loadEditorStateFromStorage();
		hydrateCanvasFromStore();

		// Saves the current active page snapshot when user presses Ctrl/Cmd + S.
		const handleSaveShortcut = (event: KeyboardEvent) => {
			const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
			if (!isSaveShortcut) return;

			event.preventDefault();
			persistCanvasToStore();
			saveActivePageToStorage();
		};

		window.addEventListener('keydown', handleSaveShortcut);
		return () => {
			window.removeEventListener('keydown', handleSaveShortcut);
		};
	});
</script>

<main class="editor-root">
	<section class="canvas-shell" bind:clientWidth bind:clientHeight>
		<SvelteFlow
				bind:nodes
				bind:edges
				{defaultEdgeOptions}
				fitView
				ondragover={onDragOver}
				ondrop={onDrop}
				onnodecontextmenu={handleContextMenu}
				onpaneclick={handlePaneClick}
				onpointerdown={handlePaneClick}
				{nodeTypes}
				connectionMode={ConnectionMode.Loose}
				proOptions={{ hideAttribution: true }}
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
	/* Root editor layout: canvas on top, footer pinned as the last row. */
	.editor-root {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Canvas shell reserves all remaining height above the footer. */
	.canvas-shell {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
	}

	/* Keep SvelteFlow sized to the available canvas shell area. */
	.canvas-shell :global(.svelte-flow) {
		width: 100%;
		height: 100%;
	}
</style>