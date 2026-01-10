<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useSvelteFlow,
		type Node,
	} from '@xyflow/svelte';

	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	import '@xyflow/svelte/dist/style.css';

	let nodes = $state.raw([
		{
			id: '1',
			type: 'default',
			data: { label: 'Drag nodes to the canvas' },
			position: { x: 0, y: 0 },
		},
	]);

	let edges = $state.raw([]);

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

	const onDrop = (event: DragEvent) => {
		event.preventDefault();

		if (!type.current) {
			return;
		}

		const position = screenToFlowPosition({
			x: event.clientX,
			y: event.clientY,
		});

		const newNode = {
			id: `${Math.random()}`,
			type: type.current,
			position,
			data: { label: `${type.current} node`},
			origin: [0.5, 0.0],
		} satisfies Node;

		nodes = [...nodes, newNode];
	};
</script>

<main style:width="100vw" style:height="100vh">
	<SvelteFlow bind:nodes bind:edges {defaultEdgeOptions} fitView ondragover={onDragOver} ondrop={onDrop}>
		<Background variant={BackgroundVariant.Dots} />
		<MiniMap />

	</SvelteFlow>
	<Sidebar />
	<Controls position="top-right"/>

</main>

<style>
	main {
			height: 100vh;
			display: flex;
			flex-direction: column-reverse;
	}
</style>