<script lang="ts">
    import type { Node } from '@xyflow/svelte';

    let { node = $bindable() } = $props<{ node: Node | null }>();

    function addField() {
        if(node?.data.fields) {
            node.data.fields = [...node.data.fields, { name: 'New Field', type: 'Type' }];
        }
    }
</script>

{#if node}
    <div class="inspector">
        <h3>Entity ({node.data.label})</h3>

        <div class="section">
            <label>Table Name</label>
            <input bind:value={node.data.label} />
        </div>

        {#if node.type === 'EntityNode'}
            <div class='section'>
                <label>Fields ({node.data.fields?.length || 0})</label>
                <div class="field-list">
                    {#each node.data.fields as field}
                        <div class="field-row">
                            <input bind:value={field.name} placeholder="Name" />
                            <input bind:value={field.type} placeholder="NTypee" />
                        </div>
                    {/each}
                </div>
                <button onclick={addField}>+ Add Field</button>
            </div>
        {/if}
    </div>
{/if}

<style>
</style>