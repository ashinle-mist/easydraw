<script lang="ts">
	interface Props {
		heading: string;
		nodes: { label: string; type: string }[];
	}

let { heading, nodes }: Props = $props();

	import { useDnD } from '$lib/flow/DnDProvider.svelte';

	const type = useDnD();

	const onDragStart = (event: DragEvent, nodeType: string) => {
		if (!event.dataTransfer) {
			return null;
		}

		type.current = nodeType;
		event.dataTransfer.effectAllowed = 'move';
	};
</script>

<main class="node-container">
		<h2>{heading}</h2>
		<ul>
			{#each nodes as node}
			<li>
				<button type="button"
								class="node {node.label.toLowerCase()}-node"
								aria-label="Add {node.label}"
								draggable={true}
								ondragstart={(event) => onDragStart(event, node.type)}
				>
				</button>
			</li>
				{/each}
		</ul>
</main>

<style>
    h2 {
        font-size: 1.3rem;
    }

    ul li {
        display: inline-block;
    }

    .node-container {
        display: flex;
        flex-direction: column;
    }


    button {
        /*
				Source - https://stackoverflow.com/a/45890842
				Posted by Kevinleary.net, modified by community. See post 'Timeline' for change history
				Retrieved 2026-02-10, License - CC BY-SA 4.0
				*/

        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
    }

    .rectangle-node {
        width: 80px;
        height: 40px;
        margin: 0.5rem;
        text-align: center;
        border: 1px solid #111;
        padding: 0.5rem 1rem;
        font-weight: 700;
        border-radius: 5px;
        cursor: grab;
    }
</style>