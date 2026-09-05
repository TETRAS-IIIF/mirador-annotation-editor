declare module 'mirador-annotation-editor/dist/index.css';

declare const plugins: any[];
export default plugins;

// Mutates `anno` in place, adding a `maeData` field derived from its IIIF
// body/target when it doesn't already have one, then returns it - the same
// conversion AiiinotateAdapter.all() runs on every annotation it fetches so
// annotations created outside MAE (or reloaded from any external store) are
// still recognized as editable by CanvasListItem's `editable()` check.
export declare function convertIIIFAnnoToMaeData(anno: any): any;
