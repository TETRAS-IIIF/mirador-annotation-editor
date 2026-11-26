import { convertIIIFAnnoToMaeData } from './IIIFUtils';

/**
 * Draft annotations: suggestions waiting for review (e.g. written by an
 * assistant). They are recognized with the same declarative marker as the
 * Mirador viewer, read from `annotations.draftMarker` (or, as a fallback,
 * `annotation.draftMarker`):
 *
 *   { property: 'status', value: 'draft', modelProperty?, batchProperty? }
 *
 * `modelProperty` / `batchProperty` name the annotation fields shown in the
 * editor banner ("Suggested by <model>, batch #<batch>"). The W3C
 * `generator` is used when there is no model property.
 */
export function getDraftMarker(config) {
  return config?.annotations?.draftMarker ?? config?.annotation?.draftMarker ?? null;
}

/** True when the annotation matches the draft marker. */
export function isDraft(annotation, marker) {
  if (!annotation || !marker || !marker.property) return false;
  const actual = annotation[marker.property];
  const expected = marker.value === undefined ? true : marker.value;
  return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
}

/** A copy of the annotation without its draft marker: what publishing saves. */
export function withoutDraftMarker(annotation, marker) {
  if (!annotation || !marker || !marker.property) return annotation;
  const copy = { ...annotation };
  delete copy[marker.property];
  return copy;
}

/** Model and batch shown in the editor banner. */
export function draftProvenance(annotation, marker) {
  const generator = annotation?.generator;
  const generatorName = typeof generator === 'string' ? generator : generator?.name;
  return {
    batch: marker?.batchProperty ? annotation?.[marker.batchProperty] ?? null : null,
    model: (marker?.modelProperty && annotation?.[marker.modelProperty]) || generatorName || null,
  };
}

/**
 * Drafts written outside MAE have no maeData: build it (as for any IIIF
 * annotation) so they open in the regular editor instead of expert mode.
 */
export function prepareDraftForEditing(annotation, marker) {
  if (!isDraft(annotation, marker) || annotation.maeData) return annotation;
  return convertIIIFAnnoToMaeData(structuredClone(annotation));
}

/** All drafts of the given canvases, as [{ canvasId, annotation }]. */
export function draftsOnCanvases(canvases, annotationsOnCanvases, marker) {
  if (!marker) return [];
  const drafts = [];
  canvases.forEach((canvas) => {
    Object.values(annotationsOnCanvases?.[canvas.id] ?? {}).forEach((page) => {
      (page?.json?.items ?? []).forEach((annotation) => {
        if (isDraft(annotation, marker)) drafts.push({ annotation, canvasId: canvas.id });
      });
    });
  });
  return drafts;
}

/**
 * Publishes a draft through the storage adapter: `adapter.accept(id)` when
 * the adapter supports drafts, otherwise an update without the marker.
 * Resolves to the annotation page returned by the adapter.
 */
export function acceptDraft(adapter, annotation, marker) {
  if (typeof adapter.accept === 'function') return adapter.accept(annotation.id);
  return adapter.update(withoutDraftMarker(annotation, marker));
}

/** Publishes every draft of a canvas (`adapter.acceptAll` when available). */
export async function acceptAllDrafts(adapter, annotations, marker) {
  if (typeof adapter.acceptAll === 'function') return adapter.acceptAll();
  let page;
  // Sequential: adapters that rewrite whole pages must not race.
  // eslint-disable-next-line no-restricted-syntax
  for (const annotation of annotations) {
    // eslint-disable-next-line no-await-in-loop
    page = await acceptDraft(adapter, annotation, marker);
  }
  return page;
}

/** Deletes every draft of a canvas (`adapter.rejectAll` when available). */
export async function rejectAllDrafts(adapter, annotations) {
  if (typeof adapter.rejectAll === 'function') return adapter.rejectAll();
  let page;
  // eslint-disable-next-line no-restricted-syntax
  for (const annotation of annotations) {
    // eslint-disable-next-line no-await-in-loop
    page = await adapter.delete(annotation.id);
  }
  return page;
}
