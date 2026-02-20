<script lang="ts">
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

	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import RightSidebar from '$lib/components/RightSidebar.svelte';
	import ContextMenu from '$lib/flow/ContextMenu.svelte';
	import RectangleNode from '$lib/flow/nodes/RectangleNode.svelte';
	import EntityNode from '$lib/flow/nodes/EntityNode.svelte';

	// import '@xyflow/svelte/dist/style.css';
	import '../../xy-theme.css';

	// Define all of our custom node here
	const nodeTypes = {
		RectangleNode: RectangleNode,
		EntityNode: EntityNode,
	};

	// Define the default starting nodes in the canvas
	let nodes = $state.raw([
		{
			id: '1',
			type: 'RectangleNode',
			data: { label: 'Drag nodes to the canvas' },
			position: { x: 0, y: 0 }
		},
		{
			id: '2',
			type: 'EntityNode',
			position: { x: 100, y: 100 },
			data: {
				label: 'New Entity',
				fields: [
					{ name: 'id', type: 'PK' },
					{ name: 'field', type: 'varchar' },
					{ name: 'field', type: 'varchar' }
				]
			}
		}
	]);

	let edges = $state.raw([]);

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

		const newNode = {
			id: `${Math.random()}`,
			type: type.current,
			position,
			data: nodeData,
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

	// Reactive state to find the currently selected EntityNode
	let selectedEntityNode = $derived(
        nodes.find((n: any) => n.selected && n.type === 'EntityNode')
    );

	// Function to update the data of a specific node
	function updateNodeData(nodeId: string, newData: any) {
        // Since you use $state.raw, we must trigger a full reassignment
        nodes = nodes.map((n) => {
            if (n.id === nodeId) {
                // Merge existing data with the new data from RightSidebar
                return { 
                    ...n, 
                    data: { ...n.data, ...newData } 
                };
            }
            return n;
        });
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

	{#if selectedEntityNode}
        {@const activeNode = selectedEntityNode}
        <RightSidebar 
            node={activeNode} 
            onUpdate={(updatedData: any) => updateNodeData(activeNode.id, updatedData)} 
        />
    {/if}

	<Controls position="top-right" />

</main>

<style>
    main {
        height: 100vh;
        display: flex;
        flex-direction: column-reverse;
    }
</style>