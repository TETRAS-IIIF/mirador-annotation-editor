import { receiveAnnotation } from 'mirador';
import { saveAnnotationInStorageAdapter, TEMPLATE } from '../AnnotationFormUtils';

export const IA_TAGGING_BODY = {
  motivation: 'tagging',
  purpose: 'tagging',
  value: 'IA Generated',
};

const IA_TRANSCRIPTION_BODY = {
  motivation: 'tagging',
  purpose: 'tagging',
  value: 'IA Transcribed',
};

const IA_MAE_DATA = {
  templateType: TEMPLATE.IIIF_TYPE,
};

/**
 * Generic function to save AI-generated annotations to the storage adapter
 * and dispatch them to the Redux store.
 *
 * @param annotationPages
 * @param canvasId
 * @param storageAdapter
 * @param dispatch
 * @param taggingBody - the specific IA tagging body to append
 * @returns {Promise<void>}
 */
function saveIAAnnotations(annotationPages, canvasId, storageAdapter, dispatch, taggingBody) {
  const allAnnotations = annotationPages.flatMap((annoPage) => annoPage.items || []);
  /**
   * Dispatches a `receiveAnnotation` action to the Redux store.
   * @param {string} targetId - The canvas or target ID the annotation belongs to.
   * @param {string} annoId - The unique identifier of the annotation.
   * @param {Object} annotation - The annotation object to store.
   */
  const dispatchReceiveAnnotation = (targetId, annoId, annotation) => dispatch(
    receiveAnnotation(targetId, annoId, annotation),
  );
  return allAnnotations.reduce(
    (chain, anno) => chain.then(() => {
      const annoToSave = {
        ...anno,
        body: Array.isArray(anno.body)
          ? [...anno.body, taggingBody]
          : [anno.body, taggingBody],
        id: null,
        maeData: IA_MAE_DATA,
      };

      return saveAnnotationInStorageAdapter(
        canvasId,
        storageAdapter,
        dispatchReceiveAnnotation,
        annoToSave,
      );
    }),
    Promise.resolve(),
  );
}

/**
 * Transcribe a canvas using the AI endpoint and save the resulting annotations.
 *
 * @param manifestUrl
 * @param canvas
 * @param endpoint
 * @param storageAdapter
 * @param dispatch
 * @param successCallBack
 * @param errorCallBack
 * @returns {Promise<void>}
 */
export async function transcribe(
  manifestUrl,
  canvas,
  endpoint,
  storageAdapter,
  dispatch,
  successCallBack,
  errorCallBack,
) {
  try {
    const response = await fetch(`${endpoint}iiif/transcribe`, {
      body: JSON.stringify({
        canvas_index: canvas.index,
        manifest_url: manifestUrl,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const updatedManifest = await response.json();
    const newAnnos = updatedManifest.items?.[canvas.index]?.annotations || [];

    // eslint-disable-next-line max-len
    await saveIAAnnotations(newAnnos, canvas.id, storageAdapter(canvas.id), dispatch, IA_TRANSCRIPTION_BODY);
    successCallBack();
  } catch (err) {
    console.error('Transcription error', err);
    errorCallBack(err);
  }
}

const IA_ANNOTATION_BODY = {
  motivation: 'tagging',
  purpose: 'tagging',
  value: 'IA Annotated',
};

/**
 * Annotate a canvas using the AI endpoint and save the resulting annotations.
 *
 * @param manifestUrl
 * @param canvas
 * @param endpoint
 * @param storageAdapter
 * @param dispatch
 * @param successCallBack
 * @param errorCallBack
 * @returns {Promise<void>}
 */
export async function annotate(
  manifestUrl,
  canvas,
  endpoint,
  storageAdapter,
  dispatch,
  successCallBack,
  errorCallBack,
) {
  try {
    const response = await fetch(`${endpoint}iiif/annotate-manifest`, {
      body: JSON.stringify({
        canvas_index: canvas.index,
        manifest_url: manifestUrl,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const updatedManifest = await response.json();
    const newAnnos = updatedManifest.items?.[canvas.index]?.annotations || [];

    // eslint-disable-next-line max-len
    await saveIAAnnotations(newAnnos, canvas.id, storageAdapter(canvas.id), dispatch, IA_ANNOTATION_BODY);
    successCallBack();
  } catch (err) {
    console.error('Annotation error', err);
    errorCallBack(err);
  }
}

/**
 * Perform an AI action (describe, transcribe, translate) on a targeted region.
 * Returns the generated annotation to the callback to update the UI (does NOT save).
 *
 * @param {string} manifestUrl - URL of the IIIF manifest
 * @param {object} canvas - The current canvas object
 * @param {object} targetData - The drawn shape coordinates
 * @param {string} action - The action to perform: 'describe', 'transcribe', or 'translate'
 * @param {string} endpoint - The backend API endpoint base URL
 * @param {Function} successCallBack - Called on success with the generated annotation
 * @param {Function} errorCallBack - Called on error
 * @returns {Promise<void>}
 */
export async function processTargetAction(
  manifestUrl,
  canvas,
  targetData,
  action,
  endpoint,
  successCallBack,
  errorCallBack,
) {
  try {
    const response = await fetch(`${endpoint}iiif/target-action`, {
      body: JSON.stringify({
        action,
        canvas_index: canvas.index,
        manifest_url: manifestUrl,
        target_data: targetData,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    // The backend returns the IIIF Web Annotation object
    const newAnnotation = await response.json();
    successCallBack(newAnnotation);
  } catch (err) {
    console.error(`Targeted ${action} error:`, err);
    errorCallBack(err);
  }
}
