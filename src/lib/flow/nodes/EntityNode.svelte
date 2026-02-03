<script lang="ts">
    import { Handle, Position, useSvelteFlow, type NodeProps } from '@xyflow/svelte';

    let { id, data, isConnectable }: NodeProps = $props();
    let { updateNodeData } = useSvelteFlow();

    // Update the table name
    function onInput(evt: Event){
        const target = evt.target as HTMLInputElement;
		updateNodeData(id, { label: target.value });
    }

    // Updates a specific field name based on index
    function onFieldInput(evt: Event, index: number) {
        const target = evt.target as HTMLInputElement;
        const newFields = [...(data.fields as any[])];
        newFields[index].name = target.value;
        updateNodeData(id, { fields: newFields });
    }

    // Adds a new row to the entity
    function addField() {
        const currentFields = (data.fields as any[]) ?? [];

        const newField = currentFields.length === 0
            ? { name: 'id', type: 'PK' }
            : { name: 'new_field', type: 'VARCHAR' };
        
        const newFields = [...currentFields, newField];

        updateNodeData(id, { fields: newFields });
    }
</script>

<div class="entity-node">

    <Handle type="source" position={Position.Top} {isConnectable} id="top" />
	<Handle type="source" position={Position.Right} {isConnectable} id="right" />
	<Handle type="source" position={Position.Bottom} {isConnectable} id="bottom" />
	<Handle type="source" position={Position.Left} {isConnectable} id="left" />

    <div class="header">
        <input
            type="text"
            value={data.label ?? 'Table Name'}
            oninput={onInput}
            class="nodrag"
        >
    </div>

    <div class="field-list">
        {#each (data.fields as any[]) ?? [] as field, i}
            <div class="field-row">
                <span class="type-tag {field.type === 'PK' ? 'pk-tag' : ''}">{field.type}</span>
                <input
                    type="text"
                    value={field.name}
                    oninput={(e) => onFieldInput(e, i)}
                    class="nodrag"
                >
            </div>
        {/each}
    </div>

    <button onclick={addField} class="nodrag add-row-btn">+</button>
</div>

<style>
    .entity-node {
        background: white;
        border: 1.5px solid #1a192b;
        border-radius: 4px;
        min-width: 150px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .header {
        background: rgb(143, 141, 141);
        padding: 6px;
        border-bottom: 1.5px solid #1a192b;
    }

    .header input {
        background: transparent;
        color: white;
        font-weight: bold;
        text-align: center;
        width: 100%;
        border: none;
        outline: none;
    }

    .field-list {
        background: white;
    }

    .field-row {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        gap: 8px;
        border-bottom: 1px solid #f0f0f0;
    }

    .pk-tag {
        color: #f59e0b;
        font-weight: bold;
    }

    .type-tag {
        font-size: 0.65rem;
        color: #999;
        font-family: monospace;
        text-transform: uppercase;
    }

    .field-row input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 0.8rem;
        color: #333;
    }

    .add-row-btn {
        background: #fcfcfc;
        border: none;
        border-top: 1px solif #f0f0f0;
        cursor: pointer;
        font-size: 1rem;
        color: #bbb;
        padding: 2px;
    }

    .add-row-btn:hover {
        background: #f3f4f6;
        color: #333;
    }
</style>