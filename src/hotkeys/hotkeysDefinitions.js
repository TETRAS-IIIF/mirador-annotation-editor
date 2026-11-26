import {
  addCompanionWindow,
  deselectAnnotation,
  getCompanionWindowsForContent,
  getSelectedAnnotationId,
  getVisibleCanvases,
  receiveAnnotation,
  removeCompanionWindow,
} from 'mirador';
import { MAE_DELETE_SHAPE_EVENT, MAE_SAVE_EVENT } from './hotkeysEvents';

/** Return the open companion windows for a given window */
function getAnnotationCompanionWindows(state, windowId) {
  const cws = getCompanionWindowsForContent(state, {
    content: 'annotationCreation',
    windowId,
  });
  return Object.values(cws).filter((cw) => cw?.id);
}

/** Close every open companion window for a given window */
function closeAnnotationCompanionWindows(state, dispatch, windowId) {
  getAnnotationCompanionWindows(state, windowId).forEach((cw) => {
    dispatch(removeCompanionWindow(windowId, cw.id));
  });
}

/** The selected annotation's raw JSON, from the window's visible canvases */
function findAnnotation(state, windowId, annotationId) {
  return getVisibleCanvases(state, { windowId })
    .flatMap((canvas) => Object.values(state.annotations?.[canvas.id] ?? {}))
    .flatMap((page) => page?.json?.items ?? [])
    .find((item) => item.id === annotationId) ?? null;
}

/** Delete the currently selected shape - or, outside the edit form, the selected annotation
 * itself, once `confirmDelete` (HotkeysListener's dialog, issue #460) has been answered */
function deleteSelectedShape({
  state, dispatch, windowId, config, confirmDelete = (annotation, performDelete) => performDelete(),
}) {
  const companionWindows = getAnnotationCompanionWindows(state, windowId);

  if (companionWindows.length > 0) {
    // dispatch MAE_DELETE_SHAPE_EVENT so TargetSpatialInput can handle shape removal
    // If last shape is removed, TargetSpatialInput will dispatch MAE_ANNOTATION_EMPTY_EVENT
    // and AnnotationForm will be empty
    document.dispatchEvent(new CustomEvent(MAE_DELETE_SHAPE_EVENT));
    return;
  }

  // No companion window, delete the whole annotation
  const annotationId = getSelectedAnnotationId(state, { windowId });
  if (!annotationId) return;

  const storageAdapter = config?.annotation?.adapter;
  if (!storageAdapter) return;

  confirmDelete(findAnnotation(state, windowId, annotationId), () => {
    const canvases = getVisibleCanvases(state, { windowId });
    canvases.forEach((canvas) => {
      const adapter = storageAdapter(canvas.id);
      adapter.delete(annotationId).then((annoPage) => {
        dispatch(receiveAnnotation(canvas.id, adapter.annotationPageId, annoPage));
      });
    });

    dispatch(deselectAnnotation(windowId));
  });
}

/** Save the current annotation */
function saveSelectedAnnotation({ state, windowId }) {
  const companionWindows = getAnnotationCompanionWindows(state, windowId);
  if (companionWindows.length === 0) return;

  // dispatch MAE_SAVE_EVENT so AnnotationFormFooter can handle annotation saving
  document.dispatchEvent(new CustomEvent(MAE_SAVE_EVENT));
}

/** Create a new annotation by opening companion window */
function createAnnotation({ state, dispatch, windowId }) {
  const companionWindows = getAnnotationCompanionWindows(state, windowId);
  // Only create if no annotation companion window is already open
  if (companionWindows.length > 0) return;

  dispatch(addCompanionWindow(windowId, { content: 'annotationCreation', position: 'right' }));
}

/** Escape handler: unselect anno / close companion window */
function escapeAction({ state, dispatch, windowId }) {
  const annotationId = getSelectedAnnotationId(state, { windowId });

  if (annotationId) {
    dispatch(deselectAnnotation(windowId));
    return;
  }

  closeAnnotationCompanionWindows(state, dispatch, windowId);
}

/**
 * Maps a keyboard event to an action
 * The action is only performed on the focused Mirador window
 * The handler receives the full Redux state and a dispatch
 * function so it can read any selector and fire any action
 *
 * {
 *   keys:        string[] KeyboardEvent.key values that trigger the action
 *   description:          Human-readable description
 *   handler:     (ctx) => void
 *       ctx.state         current Redux state
 *       ctx.dispatch      Redux dispatch
 *       ctx.windowId      focused window ID
 *       ctx.config        Mirador config object
 * }
 */
const HOTKEY_ACTIONS = {
  create: {
    description: 'Create a new annotation',
    handler: createAnnotation,
    keys: ['a'],
  },
  delete: {
    description: 'Delete selected shape or annotation',
    handler: deleteSelectedShape,
    keys: ['Delete', 'Backspace'],
  },
  escape: {
    description: 'Deselect annotation / close companion window',
    handler: escapeAction,
    keys: ['Escape'],
  },
  save: {
    description: 'Save current annotation',
    handler: saveSelectedAnnotation,
    keys: ['Enter'],
  },
};

export default HOTKEY_ACTIONS;
