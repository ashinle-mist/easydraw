/**
 * Editor Store Module
 *
 * This module is the single state hub for page metadata and persisted graph data.
 * It intentionally separates 3 different "freshness" layers:
 * 1) Canvas-local graph state in Flow.svelte (live edits while user is drawing)
 * 2) editorStoreSvelte state in this file (in-memory app state across pages)
 * 3) localStorage snapshot (explicitly saved storage state)
 *
 * Public API contract (exported symbols)
 * --------------------------------------
 *
 * Internal helper signatures (non-exported):
 * - getPageSignature(page: EditorPage): string
 *   Used by:
 *   - unsavedPageIdsStore
 *   - saveActivePageToStorage()
 *   Purpose:
 *   - Build a deterministic page-level snapshot string for dirty checks
 *
 * - buildPageSignatures(pages: EditorPage[]): Record<string, string>
 *   Used by:
 *   - loadEditorStateFromStorage()
 *   Purpose:
 *   - Build page-id -> signature map from persisted snapshot
 *
 * - isEditorPage(value: unknown): value is EditorPage
 *   Used by:
 *   - isEditorState()
 *   Purpose:
 *   - Runtime validation guard for localStorage payload shape
 *
 * - isEditorState(value: unknown): value is EditorState
 *   Used by:
 *   - saveActivePageToStorage()
 *   - loadEditorStateFromStorage()
 *   Purpose:
 *   - Runtime validation guard for full snapshot structure
 *
 * Core stores:
 * - editorStoreSvelte: Writable<EditorState>
 *   Signature: `Writable<EditorState>`
 *   Called by:
 *   - Flow.svelte for reading active page snapshot and page arrays
 *   - EditorFooter.svelte for rendering page tabs and active tab state
 *   Behavior:
 *   - Holds `pages[]` and `activePageId`
 *   - Is the source of truth for app-level page data
 *
 * - unsavedPageIdsStore: Readable<string[]>
 *   Signature: `Readable<string[]>`
 *   Called by:
 *   - visibleUnsavedPageIdsStore (internal composition)
 *   Behavior:
 *   - Derived from `editorStoreSvelte` vs `savedPageSignaturesStore`
 *   - Marks pages that differ from last saved localStorage signature
 *
 * - visibleUnsavedPageIdsStore: Readable<string[]>
 *   Signature: `Readable<string[]>`
 *   Called by:
 *   - EditorFooter.svelte to display the unsaved indicator dot
 *   Behavior:
 *   - Union of `unsavedPageIdsStore` and canvas-only dirty pages
 *   - Supports both "store vs storage" and "canvas vs store" dirty states
 *
 * Persistence functions:
 * - saveActivePageToStorage(): boolean
 *   Called by:
 *   - Flow.svelte on Ctrl/Cmd + S
 *   Behavior:
 *   - Saves only the currently active page into localStorage
 *   - Merges active page into existing snapshot instead of overwriting all pages
 *   - Updates saved signature and clears canvas-dirty marker for that page
 *
 * - loadEditorStateFromStorage(): boolean
 *   Called by:
 *   - Flow.svelte on initial mount (onLoad path)
 *   Behavior:
 *   - Validates localStorage snapshot shape
 *   - Replaces editorStoreSvelte state with persisted snapshot
 *   - Rebuilds saved signatures and clears canvas-only dirty markers
 *
 * Editor state mutation functions:
 * - switchPage(pageId: string): void
 *   Called by:
 *   - Flow.svelte page-switch handler (before/after canvas-store sync flow)
 *   - EditorFooter.svelte fallback path when no callback prop is injected
 *   Behavior:
 *   - Updates `activePageId` only if target page exists
 *
 * - createPage(name?: string): string | null
 *   Called by:
 *   - Flow.svelte create-page handler
 *   - EditorFooter.svelte fallback path when no callback prop is injected
 *   Behavior:
 *   - Appends a new blank page
 *   - Makes the new page active
 *   - Returns created page id for optional caller-side hydration
 *
 * - updateActiveGraph(nodes: Node[], edges: Edge[]): void
 *   Called by:
 *   - Flow.svelte right before page switch
 *   - Flow.svelte right before page create
 *   - Flow.svelte right before Ctrl/Cmd + S storage save
 *   Behavior:
 *   - Writes canvas graph snapshot into currently active page in editorStoreSvelte
 *   - Does not touch localStorage directly
 *
 * - renamePage(pageId: string, nextName: string): void
 *   Called by:
 *   - EditorFooter.svelte inline name input handler
 *   Behavior:
 *   - Updates page `name` only, keeps id and graph intact
 *
 * - deletePage(pageId: string): void
 *   Called by:
 *   - EditorFooter.svelte dropdown Delete action
 *   Behavior:
 *   - Deletes target page when more than one page exists
 *   - Re-points activePageId if active page is deleted
 *   - Clears canvas-dirty marker for deleted page id
 *
 * Canvas dirty marker functions:
 * - markCanvasDirtyPage(pageId: string): void
 *   Called by:
 *   - Flow.svelte when live canvas content diverges from last baseline
 *   Behavior:
 *   - Adds page to canvas-only dirty list (no localStorage writes)
 *
 * - clearCanvasDirtyPage(pageId: string): void
 *   Called by:
 *   - Flow.svelte after explicit canvas->store sync
 *   - saveActivePageToStorage() after page was saved
 *   - deletePage() for removed page cleanup
 *   Behavior:
 *   - Removes page from canvas-only dirty list
 *
 * - clearAllCanvasDirtyPages(): void
 *   Called by:
 *   - loadEditorStateFromStorage() after state hydration
 *   Behavior:
 *   - Resets all canvas-only dirty markers
 *
 * Derived active page:
 * - activePageStore: Readable<EditorPage | null>
 *   Called by:
 *   - Flow.svelte (snapshot-based hydration helpers may also read editorStoreSvelte directly)
 *   Behavior:
 *   - Resolves current active page
 *   - Falls back to first page when active id becomes stale
 *   - Repairs stale activePageId in editorStoreSvelte
 */
import { browser } from '$app/environment';
import type { Edge, Node } from '@xyflow/svelte';
import { nanoid } from 'nanoid';
import { derived, get, writable } from 'svelte/store';

export const editorMetaData = $state({
	fileName: 'Untitled',
	lastSaved: Date.now()
})

// A single editable page in the diagram editor.
export interface EditorPage {
	id: string;
	name: string;
	nodes: Node[];
	edges: Edge[];
}

// Global editor state: all pages + currently active page id.
export interface EditorState {
	pages: EditorPage[];
	activePageId: string;
}

const STORAGE_KEY = 'easydraw.editor.v1';

// Stores the last-saved signature for each page id.
const savedPageSignaturesStore = writable<Record<string, string>>({});
// Stores pages that are dirty in the canvas but not yet synced back into editorStoreSvelte.
const canvasDirtyPageIdsStore = writable<string[]>([]);

// Creates a stable string signature for dirty-checking a page against localStorage snapshot.
function getPageSignature(page: EditorPage) {
	return JSON.stringify({
		name: page.name,
		nodes: page.nodes,
		edges: page.edges
	});
}

// Builds a signature index for all pages in a snapshot.
function buildPageSignatures(pages: EditorPage[]) {
	return pages.reduce<Record<string, string>>((acc, page) => {
		acc[page.id] = getPageSignature(page);
		return acc;
	}, {});
}

// Checks whether a value looks like a persisted editor page.
function isEditorPage(value: unknown): value is EditorPage {
	if (!value || typeof value !== 'object') return false;

	const page = value as Partial<EditorPage>;
	return (
		typeof page.id === 'string' &&
		typeof page.name === 'string' &&
		Array.isArray(page.nodes) &&
		Array.isArray(page.edges)
	);
}

// Checks whether a value looks like a persisted editor state snapshot.
function isEditorState(value: unknown): value is EditorState {
	if (!value || typeof value !== 'object') return false;

	const state = value as Partial<EditorState>;
	if (!Array.isArray(state.pages) || typeof state.activePageId !== 'string') return false;
	if (!state.pages.every(isEditorPage)) return false;
	if (state.pages.length === 0) return false;

	return state.pages.some((page) => page.id === state.activePageId);
}

// Bootstraps the editor with one default page and one starter node.
export const initialEditorState: EditorState = {
	pages: [
		{
			id: 'page-1',
			name: 'Page 1',
			nodes: [
				{
					id: '1',
					type: 'RectangleNode',
					data: { label: 'Drag nodes to the canvas' },
					position: { x: 0, y: 0 }
				}
			],
			edges: []
		}
	],
	activePageId: 'page-1'
};

// Shared writable store used by Flow, footer, and other editor UI parts.
export const editorStoreSvelte = writable<EditorState>(initialEditorState);

// List of page ids whose editor data is newer than the localStorage snapshot.
export const unsavedPageIdsStore = derived(
	[editorStoreSvelte, savedPageSignaturesStore],
	([$editorState, $savedSignatures]) => {
		return $editorState.pages
			.filter((page) => $savedSignatures[page.id] !== getPageSignature(page))
			.map((page) => page.id);
	}
);

// Combined indicator for "not saved" state: store-vs-storage OR canvas-vs-store.
export const visibleUnsavedPageIdsStore = derived(
	[unsavedPageIdsStore, canvasDirtyPageIdsStore],
	([$unsavedPageIds, $canvasDirtyPageIds]) => {
		return [...new Set([...$unsavedPageIds, ...$canvasDirtyPageIds])];
	}
);

// Marks a page as dirty in canvas-only state.
export function markCanvasDirtyPage(pageId: string) {
	canvasDirtyPageIdsStore.update((ids) => (ids.includes(pageId) ? ids : [...ids, pageId]));
}

// Clears dirty marker for a page once canvas has been synced to store.
export function clearCanvasDirtyPage(pageId: string) {
	canvasDirtyPageIdsStore.update((ids) => ids.filter((id) => id !== pageId));
}

// Clears all canvas-dirty markers, typically after reloading from storage.
export function clearAllCanvasDirtyPages() {
	canvasDirtyPageIdsStore.set([]);
}

// Saves only the currently active page into localStorage.
export function saveActivePageToStorage() {
	if (!browser) return false;

	const currentState = get(editorStoreSvelte);
	const activePage = currentState.pages.find((page) => page.id === currentState.activePageId);
	if (!activePage) return false;

	let storedState: EditorState | null = null;
	const rawState = localStorage.getItem(STORAGE_KEY);
	if (rawState) {
		try {
			const parsedState = JSON.parse(rawState) as unknown;
			storedState = isEditorState(parsedState) ? parsedState : null;
		} catch {
			storedState = null;
		}
	}

	const nextPages = storedState
		? storedState.pages.some((page) => page.id === activePage.id)
			? storedState.pages.map((page) => (page.id === activePage.id ? { ...activePage } : page))
			: [...storedState.pages, { ...activePage }]
		: [{ ...activePage }];

	const nextState: EditorState = {
		pages: nextPages,
		activePageId: activePage.id
	};

	localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
	savedPageSignaturesStore.update((currentSignatures) => ({
		...currentSignatures,
		[activePage.id]: getPageSignature(activePage)
	}));
	clearCanvasDirtyPage(activePage.id);
	return true;
}

// Loads the full editor snapshot from localStorage and hydrates editor store.
export function loadEditorStateFromStorage() {
	if (!browser) return false;

	const rawState = localStorage.getItem(STORAGE_KEY);
	if (!rawState) return false;

	try {
		const parsedState = JSON.parse(rawState) as unknown;
		if (!isEditorState(parsedState)) return false;

		editorStoreSvelte.set(parsedState);
		savedPageSignaturesStore.set(buildPageSignatures(parsedState.pages));
		clearAllCanvasDirtyPages();
		return true;
	} catch {
		return false;
	}
}

// Updates the active page only when the target page id exists.
export function switchPage(pageId: string) {
	editorStoreSvelte.update((state) => {
		// Guard against invalid page ids from the UI.
		const pageExists = state.pages.some((page) => page.id === pageId);
		if (!pageExists) return state;

		return {
			...state,
			activePageId: pageId
		};
	});
}

// Creates a new page, appends it to state, and makes it the active page.
export function createPage(name?: string) {
	let createdPageId: string | null = null;

	editorStoreSvelte.update((state) => {
		// Page name can follow display order and does not need to be unique.
		const nextPageNumber = state.pages.length + 1;

		// Page id must be globally unique for stable references.
		const pageId = nanoid();
		const pageName = name?.trim() || `Page ${nextPageNumber}`;

		const newPage: EditorPage = {
			id: pageId,
			name: pageName,
			nodes: [],
			edges: []
		};
		createdPageId = newPage.id;

		return {
			...state,
			pages: [...state.pages, newPage],
			activePageId: newPage.id
		};
	});

	// Returns the new id so UI can hydrate the just-created page immediately.
	return createdPageId;
}

// Updates graph content (nodes + edges) for the currently active page.
export function updateActiveGraph(nodes: Node[], edges: Edge[]) {
	editorStoreSvelte.update((state) => {
		const activePageExists = state.pages.some((page) => page.id === state.activePageId);
		if (!activePageExists) return state;

		return {
			...state,
			pages: state.pages.map((page) =>
				page.id === state.activePageId
					? {
							...page,
							nodes: [...nodes],
							edges: [...edges]
						}
					: page
			)
		};
	});
}

// Renames a page by id using the exact text from inline page-name input.
export function renamePage(pageId: string, nextName: string) {
	editorStoreSvelte.update((state) => ({
		...state,
		pages: state.pages.map((page) =>
			page.id === pageId
				? {
						...page,
						name: nextName
					}
				: page
		)
	}));
}

// Deletes a page by id while keeping at least one page alive.
export function deletePage(pageId: string) {
	editorStoreSvelte.update((state) => {
		const pageExists = state.pages.some((page) => page.id === pageId);
		if (!pageExists) return state;
		if (state.pages.length <= 1) return state;

		const nextPages = state.pages.filter((page) => page.id !== pageId);
		const nextActivePageId =
			state.activePageId === pageId ? nextPages[0]?.id ?? state.activePageId : state.activePageId;

		return {
			...state,
			pages: nextPages,
			activePageId: nextActivePageId
		};
	});
	clearCanvasDirtyPage(pageId);
}

// Read-only store for the currently active page object.
// If activePageId is stale, it falls back to the first page and repairs the id in editorStoreSvelte.
export const activePageStore = derived(editorStoreSvelte, ($editorState, set) => {
	const activePage = $editorState.pages.find((page) => page.id === $editorState.activePageId);
	if (activePage) {
		set(activePage);
		return;
	}

	const fallbackPage = $editorState.pages[0] ?? null;
	set(fallbackPage);

	// Keep source state consistent with the fallback page.
	if (fallbackPage && $editorState.activePageId !== fallbackPage.id) {
		editorStoreSvelte.update((state) => ({
			...state,
			activePageId: fallbackPage.id
		}));
	}
});
