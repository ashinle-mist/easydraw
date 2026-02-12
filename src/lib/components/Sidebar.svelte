<script lang="ts">
	import { useDnD } from '$lib/flow/DnDProvider.svelte';
	import NodeContainer from '$lib/components/NodeContainer.svelte';

	const type = useDnD();

	let fileName = $state('Untitled');
	let searchBar = $state('');

	const basicShapes = [
		{label: 'Rectangle', type: 'RectangleNode'}
	]
</script>

<aside>

	<input class="file-name" bind:value={fileName} />
	<input class="search-bar" bind:value={searchBar} placeholder="Search..." />

	<NodeContainer
		heading="Other shapes"
		nodes={basicShapes}
	/>
</aside>

<style>
    aside {
        width: 300px;
        height: 95vh;
        position: fixed;
        top: 20px;
        left: 0;

        padding: 3em 1.5em 1em;
        margin: 0;
        gap: 1em;

        display: flex;
        flex-direction: column;

        background: white;

        border-radius: 0 10px 10px 0;
        border-left: 0;

        box-shadow: 0 0 10px #808080;
    }

    input {
        appearance: none;
        -webkit-appearance: none;

        border: none;

        padding: 0;
        margin: 0;

        outline: none;
    }

    .file-name {
        font-weight: bold;
        font-size: 1.2rem;
    }

    .search-bar {
        font-size: 0.8rem;
    }
</style>