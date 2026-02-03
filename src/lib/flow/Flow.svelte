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
	import ContextMenu from '$lib/flow/ContextMenu.svelte';
	import RectangleNode from '$lib/flow/nodes/RectangleNode.svelte';
	import EntityNode from '$lib/flow/nodes/EntityNode.svelte';

	// import '@xyflow/svelte/dist/style.css';
	import '../../xy-theme.css';

	const nodeTypes = {
		RectangleNode: RectangleNode,
		EntityNode: EntityNode
	};

	let nodes = $state.raw([
		{
			id: '1',
			type: 'default',
			data: { label: 'Drag nodes to the canvas' },
			position: { x: 0, y: 0 }
		},
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
				label: 'List',
				items: [
					{ name: 'Item 1'},
					{ name: 'Item 2'},
					{ name: 'Item 3'}
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

		const defaultData = type.current === 'EntityNode'
			? {
				label: 'New Table',
				items: [{ name: 'id', type: 'integer' }] // Start with a PK
			}
			: { label: `${type.current} node` };

		const newNode = {
			id: `${Math.random()}`,
			type: type.current,
			position,
			data: { label: `${type.current} node` },
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
	<Controls position="top-right" />

</main>

<style>
    main {
        height: 100vh;
        display: flex;
        flex-direction: column-reverse;
    }
</style>