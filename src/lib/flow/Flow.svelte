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
	import { nanoid } from 'nanoid';
	import { derived, get, type Subscriber, type Unsubscriber, type Updater, type Writable } from 'svelte/store';

	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import EditorFooter from '$lib/components/EditorFooter.svelte';
	import ContextMenu from '$lib/flow/ContextMenu.svelte';
	import RectangleNode from '$lib/flow/nodes/RectangleNode.svelte';
	import {
		activePageStore,
		createPage,
		editorStore,
		loadEditorStateFromStorage,
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

<<<<<<< Updated upstream
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
=======
	// Define the default starting nodes in the canvas
	// let nodes = $state.raw([
	// 	{
	// 		id: '1',
	// 		type: 'RectangleNode',
	// 		data: { label: 'Drag nodes to the canvas' },
	// 		position: { x: 0, y: 0 }
	// 	},
	// 	{
	// 		id: '2',
	// 		type: 'EntityNode',
	// 		position: { x: 100, y: 100 },
	// 		data: {
	// 			label: 'New Entity',
	// 			fields: [
	// 				{ name: 'id', type: 'PK' },
	// 				{ name: 'field', type: 'varchar' },
	// 				{ name: 'field', type: 'varchar' }
	// 			],
	// 			onEdit: (newData: any) => updateNodeData('2', newData)
	// 		}
	// 	}
	// ]);

	// let edges = $state.raw<Edge[]>([]);

	const edgeTypes = {
		relationship: RelationshipEdge
	};

	// NOTE: Attaches node-level edit callback so EntityNode can push changes to editorStore immediately.
	const withNodeEditHandlers = (nodes: Node[]) =>
		nodes.map((node) => ({
			...node,
			data: {
				...node.data,
				onEdit: (newData: any) => updateNodeData(node.id, newData)
			}
		}));

	// NOTE: Ensures active page nodes in editorStore always have runtime callbacks after load/switch.
	function ensureActivePageNodeHandlers() {
		const activePage = get(activePageStore);
		if (!activePage) return;

		updateActiveGraph(withNodeEditHandlers(activePage.nodes), activePage.edges);
	}
>>>>>>> Stashed changes

	// NOTE: Writable bridge so `bind:nodes` writes straight into editorStore active page.
	function createActiveNodesStore(): Writable<Node[]> {
		const subscribe = (run: Subscriber<Node[]>): Unsubscriber =>
			derived(activePageStore, (page) => page?.nodes ?? []).subscribe(run);

		const set = (nextNodes: Node[]) => {
			const activePage = get(activePageStore);
			if (!activePage) return;

			updateActiveGraph(withNodeEditHandlers(nextNodes), activePage.edges);
		};

		const update = (updater: Updater<Node[]>) => {
			set(updater(get(activePageStore)?.nodes ?? []));
		};

		return { subscribe, set, update };
	}

	// NOTE: Writable bridge so `bind:edges` writes straight into editorStore active page.
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

<<<<<<< Updated upstream
=======
		let nodeData: any = { label: 'New Node' };

		if (type.current === 'EntityNode') {
			nodeData = {
				label: 'New Entity',
				fields: [
					{ name: 'id', type: 'PK' },
					{ name: 'field', type: 'varchar' },
					{ name: 'field', type: 'varchar' }
				]
			};
		}

		const newNodeId = nanoid();

>>>>>>> Stashed changes
		const newNode = {
			id: newNodeId,
			type: type.current,
			position,
			data: { label: `` }, // Define labels in the nodes themselves
			origin: [0.5, 0.0]
		} satisfies Node;

		activeNodesStore.update((nodes) => [...nodes, newNode]);
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

<<<<<<< Updated upstream
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
=======
	// NOTE: Page switch is now metadata-only because graph state is already synced into editorStore live.
>>>>>>> Stashed changes
	function handleSwitchPage(pageId: string) {
		switchPage(pageId);
		ensureActivePageNodeHandlers();
		handlePaneClick();
	}

	// NOTE: Creating page only updates editorStore; canvas follows via active-page binding.
	function handleCreatePage() {
		createPage();
		handlePaneClick();
	}

	// NOTE: Initial load hydrates editorStore from localStorage, then re-attaches runtime callbacks.
	onMount(() => {
		loadEditorStateFromStorage();
		ensureActivePageNodeHandlers();

		// NOTE: Ctrl/Cmd + S persists active page from editorStore to localStorage.
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
<<<<<<< Updated upstream
=======

	// Reactive state to find the currently selected EntityNode
	let selectedEntityNode = $derived(
        ($activePageStore?.nodes ?? []).find((n: any) => n.selected && n.type === 'EntityNode')
    );

	// Function to update the data of a specific node
	function updateNodeData(nodeId: string, newData: any) {
        activeNodesStore.update((nodes) =>
			nodes.map((n) => {
				if (n.id === nodeId) {
					return {
						...n,
						data: { ...n.data, ...newData }
					};
				}
				return n;
			})
		);
    }

	// Function to handle new connections between nodes
	function onConnect(connection: Connection) {
		const newEdge: Edge = {
			...connection,
			id: nanoid(),
			type: 'relationship',
			data: { relationship: 'one-to-many' } // default 
		};
		activeEdgesStore.update((edges) => addEdge(newEdge, edges));
	}

	let selectedEdge = $derived(
		($activePageStore?.edges ?? []).find((e: any) => e.selected)
	);
	
	function updateEdgeData(edgeId: string, newData: any) {
		activeEdgesStore.update((edges) =>
			edges.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, ...newData } } : e))
		);
	}
>>>>>>> Stashed changes
</script>

<main class="editor-root">
	<section class="canvas-shell" bind:clientWidth bind:clientHeight>
<<<<<<< Updated upstream
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
=======
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
			{edgeTypes}
	>
		<CrowsFootMarkers />
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

	{#if selectedEntityNode}
        {@const activeNode = selectedEntityNode}
        <RightSidebar 
            node={activeNode} 
            onUpdate={(updatedData: any) => updateNodeData(activeNode.id, updatedData)} 
        />
    {/if}

	{#if selectedEdge}
		{@const activeEdge = selectedEdge}
		{@const edgeData = activeEdge.data as { relationship: string } | undefined}
		<div class="edge-editor">
			<span class="context-label">RELATIONSHIP</span>
			<select
				value={edgeData?.relationship ?? 'one-to-many'}
				onchange={(e) => updateEdgeData(activeEdge.id, {
					relationship: e.currentTarget.value
				})}
			>
				<option value="one-to-one">One to One</option>
				<option value="one-to-many">One to Many</option>
				<option value="many-to-many">Many to Many</option>
			</select>
		</div>
	{/if}

	<Controls position="top-right" />

>>>>>>> Stashed changes
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
