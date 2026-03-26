<script lang="ts">
	import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/svelte';

	let { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps = $props();

	// NOTE: Compute path from latest edge props on each render to avoid stale captured values.
	const getEdgePath = () =>
		getSmoothStepPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition
		})[0];

	// NOTE: Relationship type is read from edge data and controls crow's-foot markers.
	const getRelationship = () => (data as { relationship?: string } | undefined)?.relationship ?? 'one-to-many';
	const getSourceMarker = () => (getRelationship() === 'many-to-many' ? 'url(#many)' : 'url(#one)');
	const getTargetMarker = () => (getRelationship() === 'one-to-one' ? 'url(#one)' : 'url(#many)');
</script>

<BaseEdge
	path={getEdgePath()}
	markerStart={getSourceMarker()}
	markerEnd={getTargetMarker()}
/>
