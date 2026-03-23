<script lang="ts">
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
		type NodeEventWithPointer, ConnectionMode,
		type Connection
	} from '@xyflow/svelte';

	import { setContext } from 'svelte';

	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import RightSidebar from '$lib/components/RightSidebar.svelte';
	import ContextMenu from '$lib/flow/ContextMenu.svelte';
	import RectangleNode from '$lib/flow/nodes/RectangleNode.svelte';
	import EntityNode from '$lib/flow/nodes/EntityNode.svelte';

	// import '@xyflow/svelte/dist/style.css';
	import '../../xy-theme.css';

	setContext('updateNode', (id: string, data: any) => updateNodeData(id, data));

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
				],
				onEdit: (newData: any) => updateNodeData('2', newData)
			}
		}
	]);

	let edges = $state.raw<Edge[]>([]);

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

		const newNodeId = `${Math.random()}`;

		const newNode = {
			id: `${Math.random()}`,
			type: type.current,
			position,
			data: {
				...nodeData,
				onEdit: (newData: any) => updateNodeData(newNodeId, newData)
			},
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

	// Function to handle new connections between nodes
	function onConnect(connection: Connection) {
		const newEdge: Edge = {
			...connection,
			id: `${Math.random()}`,
			type: 'smoothstep',
			data: { relationship: 'one-to-many' } // default 
		};
		edges = addEdge(newEdge, edges);
	}

	let selectedEdge = $derived(
		edges.find((e: any) => e.selected)
	);
	
	function updateEdgeData(edgeId: string, newData: any) {
		edges = edges.map((e) => 
			e.id === edgeId ? { ...e, data: { ...e.data, ...newData}} : e
		);
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

</main>

<style>
    main {
        height: 100vh;
        display: flex;
        flex-direction: column-reverse;
    }

	.edge-editor {
		position: fixed;
		bottom: 40px;
		left: 50%;
		transform: translateX(-50%);
		background: white;
		padding: 10px 20px;
		border-radius: 10px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		display: flex;
		align-items: center;
		gap: 12px;
		z-index: 100;
	}

	.context-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #888;
		font-weight: 600;
	}

	select {
		border: 1px solid #eee;
		border-radius: 6px;
		padding: 6px 10px;
		font-size: 0.85rem;
		outline: none;
		background: #f8f9fa;
	}
</style>