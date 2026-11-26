/** Custom DOM event name used to trigger annotation save from hotkeys */
export const MAE_SAVE_EVENT = 'mae-save-annotation';

/** Custom DOM event to delete the currently selected shape */
export const MAE_DELETE_SHAPE_EVENT = 'mae-delete-shape';

/** Dispatched by TargetSpatialInput when the last shape has been removed */
export const MAE_ANNOTATION_EMPTY_EVENT = 'mae-annotation-empty';

/** Elements where keystrokes belong to the field being typed in, never to a hotkey */
const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Whether a keydown's target is a field the user is typing in */
export const isEditableTarget = (el) => IGNORED_TAGS.has(el?.tagName) || !!el?.isContentEditable;
