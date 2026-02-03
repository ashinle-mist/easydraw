<script lang="ts">
	import { useDnD } from '\$lib/flow/DnDProvider.svelte';

	const type = useDnD();

	let fileName = $state('Untitled');
	let searchBar = $state('');

	const onDragStart = (event: DragEvent, nodeType: string) => {
		if (!event.dataTransfer) {
			return null;
		}

		type.current = nodeType;
		event.dataTransfer.effectAllowed = 'move';
	};
</script>

<aside>

	<input class="file-name" bind:value={fileName} />
	<input class="search-bar" bind:value={searchBar} placeholder="Search..." />

	<div class="nodes-container">
		<section class="basic-shapes">
			<h2>Basic Shapes</h2>
			<ul>
				<li>
					<button type="button"
									class="rectangle-node node"
									aria-label="Add Rectangle"
									draggable={true}
									ondragstart={(event) => onDragStart(event, 'default')}
					>
					</button>
				</li>

                <li>
                    <button type="button"
                                    class="entity-node node"
                                    aria-label="Add Entity"
                                    draggable={true}
                                    ondragstart={(event) => onDragStart(event, 'EntityNode')}
                    >
                        <div class="preview-header">List</div>
                        <div class="preview-body">
                        </div>
                    </button>
                </li>
			</ul>
		</section>
	</div>
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

    h2 {
        font-size: 1.3rem;
    }

    .nodes-container {
        display: flex;
        flex-direction: column;
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

    .entity-node {
        width: 100px;
        min-height: 60px;
        margin: 0.5rem;
        border: 1px solid #111;
        background: white;
        cursor: grab;
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow: hidden;
        border-radius: 2px;
    }

    .preview-header {
        font-size: 0.7rem;
        font-weight: bold;
        padding: 2px 5px;
        border-bottom: 1px solid #111;
        background: #f9f9f9;
        text-align: center;
    }

    .preview-body {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px;
        background-color: #cbcaca;
        background-size: 6px 6px;
    }
</style>
