<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useSvelteFlow,
		addEdge,
		type Connection,
		type Node,
		type Edge,
		type NodeEventWithPointer, ConnectionMode
	} from '@xyflow/svelte';

	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ContextMenu from '$lib/flow/ContextMenu.svelte';
	import RectangleNode from '$lib/flow/nodes/RectangleNode.svelte';
	import EntityNode from '$lib/flow/nodes/EntityNode.svelte';

	// import '@xyflow/svelte/dist/style.css';
	import '../../xy-theme.css';

	// Define all of our custom node here
	const nodeTypes = {
		RectangleNode: RectangleNode,
		EntityNode: EntityNode
	};

<<<<<<< HEAD
	let nodes = $state<Node[]>([
=======
	// Define the default starting nodes in the canvas
	let nodes = $state.raw([
>>>>>>> 4143f89087cd66c5163cb59df8828a4e802ca73c
		{
			id: '1',
			type: 'default',
			data: { label: 'Drag nodes to the canvas' },
			position: { x: 0, y: 0 }
		},
<<<<<<< HEAD
		{
			id: '2',
			type: 'RectangleNode',
			data: { label: 'test' },
			position: { x: 50, y: 50 }
		},
		{
			id: '3',
			type: 'RectangleNode',
			data: { label: '' },
			position: { x: 100, y: 100 }
		},
		{
			id: '4',
			type: 'EntityNode',
			position: { x:250, y:200 },
			data: {
				label: 'New Table',
				fields: [
					{ name: 'Field', type: 'PK'},
					{ name: 'Field', type: 'Type'},
					{ name: 'Field', type: 'Type'}
				]
			}
		}
=======
>>>>>>> 4143f89087cd66c5163cb59df8828a4e802ca73c
	]);

	let edges = $state.raw([]);

	const { screenToFlowPosition } = useSvelteFlow();

	const type = useDnD();

	const defaultEdgeOptions = {
		type: 'smoothstep'
	};

	// const onConnect = (params: Connection) => {
	// 	edges = addEdge(params, [...edges]);
	// }

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

		const initialData = type.current === 'EntityNode'
			? {
				label: 'New Table',
				fields: [
					{ name: 'Field', type: 'PK'}, // Start with a PK
					{ name: 'Field', type: 'Type'},
					{ name: 'Field', type: 'Type'}
				]
			}
			: { label: 'New Node' };

		const newNode: Node = {
			id: crypto.randomUUID(),
			type: type.current,
			position,
<<<<<<< HEAD
			data: initialData,
			origin: [0.5, 0.0] as [number, number]
		};
=======
			data: { label: `` }, // Define labels in the nodes themselves
			origin: [0.5, 0.0]
		} satisfies Node;
>>>>>>> 4143f89087cd66c5163cb59df8828a4e802ca73c

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

	// Right Sidebar when clicking the nodes
	let selectedNode = $state<Node | null>(null);

	const onNodeClick = ({ node }: {node: Node }) => {
		selectedNode = node;
	}
</script>

<main style="width:100vw; height:100vh;" bind:clientWidth bind:clientHeight>
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
			onnodeclick={onNodeClick}
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

</main>

<style>
    main {
        height: 100vh;
        display: flex;
        flex-direction: column-reverse;
    }
</style>