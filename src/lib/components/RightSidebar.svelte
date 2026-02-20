<script lang="ts">
    let { node, onUpdate } = $props();

    function addField() {
        const newField = { name: 'field', type: 'varchar' };
        const updatedFields = [...(node.data.fields || []), newField];
        onUpdate(updatedFields);
    }

    function removeField(index: number) {
        const updatedFields = node.data.fields.filter((_: any, i: number) => i !== index);
        onUpdate(updatedFields);
    }
</script>

<aside class="right-sidebar">
    <h3>Edit Table: {node.data.label}</h3>

    <div class="field-list">
        {#each node.data.fields as field, i}
            <div class="field-row">
                <input bind:value={field.name} oninput={() => onUpdate(node.data.fields)} />
                <select bind:value={field.type} onchange={() => onUpdate(node.data.fields)}>
                    <option value="PK">PK</option>
                    <option value="varchar">varchar</option>
                    <option value="int">int</option>
                    <option value="datetime">datetime</option>
                </select>
                <button onclick={() => removeField(i)}>x</button>
            </div>
        {/each}
    </div>

    <button class="add-btn" onclick={addField}>Add Field</button>
</aside>

<style>
    .right-sidebar {
        width: 280px;
        height: 95vh;
        position: fixed;
        top: 20px;
        right: 0;
        background: white;
        padding: 2rem 1rem;
        border-radius: 10px 0 0 10px;
        box-shadow: -5px 0 15px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        z-index: 10;
    }

    h3 { margin: 0; font-size: 1.1rem; }

    .field-row {
        display: flex;
        gap: 5px;
        margin-bottom: 10px;
    }

    input, select {
        padding: 4px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .add-btn {
        background: #222138;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
    }
</style>