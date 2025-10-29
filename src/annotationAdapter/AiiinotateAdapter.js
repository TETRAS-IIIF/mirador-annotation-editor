import {
  createV2Anno,
  createAnnotationPage,
} from '../IIIFUtils';
import { ANONYMOUS_USER } from './LocalStorageAdapter';

/**
 * @typedef WebAnnotationBodyContent
 * @type {object}
 * @property {"TextualBody"} type
 * @property {string} value - HTML string
 */

/**
 * @typedef {[]} WebAnnotationBodyEmpty - always empty array when there are no annotations
 */

/**
 * @typedef WebAnnotationBody
 * @type {WebAnnotationBodyEmpty|WebAnnotationBodyContent}
 */

/**
 * @typedef {string} WebAnnotationTargetString - URI to the canvas
 */

/**
 * @typedef WebAnnotationTargetSelectorObject
 * @type {object}
 * @property {string} type - "FragmentSelector", "SvgSelector"...
 * @property {string} value - the selector: "xywh=758,58,778,824", "<svg>...</svg>"
 */

/**
 * @typedef {WebAnnotationTargetSelectorObject[]} WebAnnotationTargetSelectorArray
 *  - 1st element is just a FragmentSelector (bounding box of annotation),
 *  - second element is more sophisticated (SVG selector with CSS)
 */

/**
 * @typedef WebAnnotationTargetPartOf
 * @type {object}
 * @property {string} id - URI of the manifest
 * @property {"Manifest"} type
 */

/**
 * @typedef WebAnnotationTargetSource
 * @type {object}
 * @property {string} id - ID of the canvas
 * @property {WebAnnotationTargetPartOf} partOf
 */

/**
 * @typedef WebAnnotationTargetObject
 * @type {object}
 * @property {WebAnnotationTargetSelectorArray} selector
 * @property {WebAnnotationTargetSource} source
 */

/**
 * @typedef WebAnnotationTarget
 * @type {WebAnnotationTargetString|WebAnnotationTargetObject}
 */

/**
 * @typedef WebAnnotation - Mirador 3 uses Web Annotatins, compatible directly with IIIF 3.x
 * @type object
 * @property {string} id - uuid of the annotation
 * @property {"Annotation"} type
 * @property {WebAnnotationTarget} target - either canvas URI or array of selectors.
 * @property {string} motivation - "commenting"
 * @property {WebAnnotationBody} body
 */

/** @typedef {AiiinotateAdapter} AiiinotateAdapterType */

/**
 * @param {string} funcName
 * @param {Promise<Response>} response
 * @returns {void}
 */
const logResponse = async (funcName, response) =>
  console.log(`AiinotateAdapter.${funcName} response:`, await response.json());

/**
 * @param {string} funcName
 * @param {Error} err
 * @returns {void}
 */
const logError = (funcName, err) => {
  console.error(`AiinotateAdapter.${funcName} error: `, err);
}

/**
 * @param {Response} r
 */
const successOrThrow = async (r) => {
  if (! r.ok ) {
    throw new Error(`Fetch error: response ${r.status} on url: ${r.url}`);
  }
}

/**
 * @class
 * @type {AiiinotateAdapterType}
 */
export default class AiiinotateAdapter {
  /**
   * @param {endpointUrl} string - URL of the annotation server
   * @param {2 | 3} iiifPresentationVersion - the IIIF presentation API version in which to store annotations.
   * @param {string} canvasId
   * @param {string} user
   */
  constructor(endpointUrl, iiifPresentationVersion, canvasId, user) {
    if (![2, 3].includes(iiifPresentationVersion)) {
      throw new Error(`AiiinotateAdapter: unrecognized value for 'iiifPresentationVersion'. expected one of [2,3], got '${iiifPresentationVersion}'`);
    }
    this.user = user || ANONYMOUS_USER;
    this.canvasId = canvasId;
    this.iiifPresentationVersion = iiifPresentationVersion;
    this.endpointUrl = endpointUrl;
    this.endpointUrlAnnotations = `${this.endpointUrl}/annotations/${iiifPresentationVersion}`;
    this.endpointUrlManifests = `${this.endpointUrl}/manifests/${iiifPresentationVersion}`;
  }

  /**
   * Get the storage adapter user
   * @returns {string}
   */
    getStorageAdapterUser() {
      return this.user;
    }

  /**
   * NOTE: if `this.iiifPresentationVersion===2`, an URI to an annotationList will be returned.
   * @returns {string} the ID of the current annotationPage
   */
  get annotationPageId() {
    const uriBase = `${this.endpointUrlAnnotations}/search?uri=${this.canvasId}`;
    return this.iiifPresentationVersion === 2
      ? `${uriBase}&asAnnotationList=true`
      : uriBase;
  }

  /**
   * convert a Mirador annotation from v3 to v2 to match the Aiiinotate expected annotation version
   * @param {WebAnnotation} annotation
   * @returns {object}
   */
  maybeConvert(annotation) {
    return this.iiifPresentationVersion === 2
      ? createV2Anno(annotation)
      : annotation;
  }

  handleResponse = async (funcName, r) => {
    await successOrThrow(r);
    return this.all();
  }

  handleError = (funcName, r) => {
    logError(funcName, r);
    return this.all();
  }

  /**
   * @param {WebAnnotation} annotation
   */
  async create(annotation) {
    annotation = this.maybeConvert(annotation);
    return fetch(`${this.endpointUrlAnnotations}/create`, {
      method: 'POST',
      body: JSON.stringify(annotation),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    .then(async (r) => await this.handleResponse("create", r))
    .catch((err) => this.handleError("create", err));
  }

  /**
   * @param {WebAnnotation} annotation
   */
  async update(annotation) {
    annotation = this.maybeConvert(annotation);
    return fetch(`${this.endpointUrlAnnotations}/update`, {
      method: "POST",
      body: JSON.stringify(annotation),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    .then(async (r) => await this.handleResponse("update", r))
    .catch((err) => this.handleError("update", err));
  }

  /** @param {string} annotationId */
  async delete(annotationId) {
    return fetch(`${this.endpointUrlAnnotations}/delete?uri=${annotationId}`, {
      method: "DELETE",
    })
    .then(async (r) => await this.handleResponse("delete", r))
    .catch((err) => this.handleError("delete", err));
  }

  /**
   * get a single annotation
   * @param {string} annotationId
   * @returns {object} - {} if `annotationId` was not found, an annotation otherwise
   */
  async get(annotationId) {
    return await fetch(annotationId);
  }

  /** @returns {Promise<object>} an annotationPage (IIIF 3) with all annotations for the current canvas */
  async all() {
    const r = await fetch(this.annotationPageId);
    const annotations = await r.json();
    return this.iiifPresentationVersion === 2
      ? createAnnotationPage(annotations.resources, this.annotationPageId)
      : annotations;
  }
}
