import { v4 as uuidv4 } from 'uuid';

import {
  getKonvaAsDataURL,
  getSvg,
  SHAPES_TOOL,
  OVERLAY_TOOL,
} from './annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { TARGET_TOOL_STATE, TEMPLATE } from './annotationForm/AnnotationFormUtils';

/**
 * Check if annotation is exportable to image in case of Konva annotation
 * @param maeData
 * @returns {boolean}
 */
function isAnnotationExportableToImage(maeData) {
  return false;
}

/**
 * Check if the shape has the same stroke and fill colors as the TARGET_TOOL_STATE
 * It's used to create SVG target instead simple target when user create only one shape
 * and edit it.
 * @param shape
 * @returns {boolean}
 */
const hasMatchingStrokeAndFillColors = (shape) => {
  return shape.strokeColor === TARGET_TOOL_STATE.strokeColor
    && shape.fillColor === TARGET_TOOL_STATE.fillColor;
};

/**
 * Check if the shape is a rectangle
 * @param shape
 * @returns {boolean}
 */
const isRectangleShape = (shape) => shape.type === SHAPES_TOOL.RECTANGLE;

/**
 * Check if the target is a simple rectangle with the same color as the tool
 * If only one, check if target need to be an SVG Target
 * @param shapes
 * @returns {boolean}
 */
const isSimpleTarget = (shapes) => {
  if (shapes.length !== 1) return false;
  const shape = shapes[0];

  return isRectangleShape(shape) && (!shape?.rotation || shape.rotation === 0)
    && hasMatchingStrokeAndFillColors(shape);
};

/**
 * Get the IIIF target from the full canvas
 * @param maeData
 * @param canvasId
 * @returns {`${string}#${string}`}
 */
const getIIIFTargetFullCanvas = (maeData, canvasId) => {
  console.info('Implement target as string on fullSizeCanvas.');
  const maeTarget = maeData.target;
  return `${canvasId}#${maeTarget.tend ? `xywh=${maeTarget.fullCanvaXYWH}&t=${maeTarget.tstart},${maeTarget.tend}` : `xywh=${maeTarget.fullCanvaXYWH}`}`;
};

/**
 * Get the IIIF target from a rectangle shape
 * @param maeTarget
 * @param canvasId
 * @param shape
 * @returns {`${string}#${string}`}
 */
const getIIIFTargetFromRectangleShape = (maeTarget, canvasId, shape) => {
  console.info('Implement target as string with one shape (rectangle)');
  let {
    x,
    y,
    width,
    height,
    scaleX,
    scaleY,
  } = shape;

  // if `width` or `height` may be negative if the annotation was not created by dragging from the top left.
  // convert to ensure that x and y always describe the top-left corner of an annotation and that
  // `width` and `height` are positive.
  // (can be useful to use xywh in Cantaloupe, for example).
  if (width < 0) {
    width = -width;
    x -= width;
  }
  if (height < 0) {
    height = -height;
    y -= height;
  }

  // Image have not tstart and tend
  // We use scaleX and scaleY to have the real size of the shape, if it has been resized
  return `${canvasId}#${maeTarget.tend ? `xywh=${x},${y},${width * scaleX},${height * scaleY}&t=${maeTarget.tstart},${maeTarget.tend}` : `xywh=${x},${y},${width * scaleX},${height * scaleY}`}`;
};

/**
 * Get the IIIF target as a fragment selector with SVG
 * @param maeTarget
 * @param canvasId
 * @returns {{selector: [{type: string, value},{type: string, value: string}], source}}
 */
const getIIIFTargetAsFragmentSVGSelector = (maeTarget, canvasId) => {
  const fragmentTarget = `${maeTarget.tend ? `t=${maeTarget.tstart},${maeTarget.tend}` : ''}`;
  return {
    selector: [
      {
        type: 'SvgSelector',
        value: maeTarget.svg,
      },
      {
        type: 'FragmentSelector',
        value: `${canvasId}#${fragmentTarget}`,
      },
    ],
    source: canvasId,
  };
};

/** Get the IIIF target from the annotation state
 * @param maeData
 * @param canvasId
 * @param windowId NEEDED By MAEV
 * @param playerScale NEEDED By MAEV
 * @returns {{selector: [{type: string, value},{type: string, value: string}], source}|*|string}
 */
export const getIIIFTargetFromMaeData = (
  maeData,
  canvasId,
  windowId = null,
  playerScale = null,
) => {
  const maeTarget = maeData.target;
  const { templateType } = maeData;

  switch (templateType) {
    case TEMPLATE.IIIF_TYPE:
      return maeTarget;
    case TEMPLATE.TAGGING_TYPE:
    case TEMPLATE.TEXT_TYPE:
    case TEMPLATE.MULTIPLE_BODY_TYPE:
      // In some case the target can be simplified in a string
      if (isSimpleTarget(maeTarget.drawingState.shapes)) {
        console.info('Simple target detected');
        return getIIIFTargetFromRectangleShape(
          maeTarget,
          canvasId,
          maeTarget.drawingState.shapes[0],
        );
      }
      // On the other case, the target is a SVG
      console.info('Implement target as SVG/Fragment with shapes');
      return getIIIFTargetAsFragmentSVGSelector(maeTarget, canvasId);
    default:
      return getIIIFTargetFullCanvas(maeData, canvasId);
  }
};

/**
 * generate the maeData body from a IIIF annotation
 * NOTE: only textual bodies are supported.
 *
 * @param {object} anno
 * @returns {Array<string, object|object[]}
 */
const convertIIIFBodyToMae = (anno) => {
  const maeBodyTemplate = {
    purpose: 'describing',
    type: 'TextualBody',
    value: '',
  };
  // convert body if it's an object
  const convertBodyObjToMae = (_bodyObj) => {
    const maeBody = structuredClone(maeBodyTemplate);
    maeBody.value = _bodyObj.value || '';
    return maeBody;
  };
  // convert body if it's just a string
  const convertBodyValueToMae = (_bodyValue) => {
    const maeBody = structuredClone(maeBodyTemplate);
    maeBody.value = _bodyValue || '';
    return maeBody;
  };

  // NOTE if body is an array, textBody will be retyped to array
  let templateType = '';
  let textBody = {};

  // if it's not a tagging annotation, we consider it's a multiple body.
  // if templateType === TEMPLATE.TAGGING_TYPE, textBody must be undefined
  if (anno.motivation === 'tagging' || (Array.isArray(anno.motivation) && anno.motivation.includes('tagging'))) {
    templateType = TEMPLATE.TAGGING_TYPE;
  } else {
    templateType = TEMPLATE.MULTIPLE_BODY_TYPE;
    if (anno.bodyValue) {
      textBody = convertBodyValueToMae(anno.bodyValue);
    } else if (anno.body) {
      textBody = Array.isArray(anno.body)
        ? anno.body.map(convertBodyObjToMae)
        : convertBodyObjToMae(anno.body);
    }
  }

  return [templateType, textBody];
};

/**
 * quick and dirty function to compute bounding box from an SVG Document using a hidden off-screen insertion.
 * @param {XMLDocument} svgDoc - the parsed SVG
 * @returns {{ x: number, y: number, width: number, height: number }} in the SVG's user coordinate system.
 */
const svgToXywh = (svgDoc) => {
  const parsedSvg = svgDoc.documentElement;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.width = '0';
  container.style.height = '0';
  container.style.overflow = 'hidden';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  const svg = document.importNode(parsedSvg, true);
  // some SVGs don't have explicit width/height/viewBox. We still want user-space coords.
  // wrap everything into a <g> so we can call getBBox on that group.
  const ns = 'http://www.w3.org/2000/svg';
  const wrapper = document.createElementNS(ns, 'svg');
  for (const attr of svg.attributes || []) {
    wrapper.setAttribute(attr.name, attr.value);
  }
  // move children into a group so getBBox returns combined extents
  const g = document.createElementNS(ns, 'g');
  while (svg.firstChild) g.appendChild(svg.firstChild);
  wrapper.appendChild(g);
  container.appendChild(wrapper);

  // force layout/render so getBBox is correct (reading offsetWidth is one way)
  container.offsetWidth;

  const bbox = g.getBBox(); // SVGRect-like: { x, y, width, height }
  document.body.removeChild(container);
  return bbox;
};

/**
 * generate a string-representation of an SVG rectangle based on XYWH coordinates
 * @param {{ x: number|string, y: number|string, w: number|string, fullW: number|string|undefined, fullH: number|string|undefined }}
 * @returns {string}
 */
const xywhToSvg = ({
  x, y, w, h, fullW = undefined, fullH = undefined,
}) => {
  // retype just in case
  x = parseFloat(x);
  y = parseFloat(y);
  w = parseFloat(w);
  h = parseFloat(h);
  if (fullH) {
    fullH = parseFloat(fullH);
  } else if (fullW) {
    fullW = parseFloat(fullW);
  }
  const svgWh = fullW && fullH
    ? `width='${fullW}' height='${fullH}'`
    : '';
  if ([x, y, w, h].some((val) => typeof val !== 'number')) {
    throw new Error(`xywhToSvg: x,y,w,h must be floats (got x=${x}, y=${y}, w=${w}, h=${h})`);
  }

  return `<svg
      version='1.1'
      xmlns='http://www.w3.org/2000/svg'
      xmlns:xlink='http://www.w3.org/1999/xlink'
      ${svgWh}
  >
    <defs/>
    <g><g>
      <path
        d=' M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${x + h} L ${x} ${y} Z Z'
        fill='${TARGET_TOOL_STATE.fillColor}'
        stroke='${TARGET_TOOL_STATE.strokeColor}'
        stroke-width='${TARGET_TOOL_STATE.strokeWidth}'
        fill-opacity='0'
        stroke-miterlimit='10'
        stroke-dasharray=''
      />
    </g></g>
  </svg>`;
};

const convertFragmentSelectorToMae = (selector) => {
  // NOTE: parseFloat is VERY important. without it, when modifying annotation, it will be displayed VERY weirdly.
  const [x, y, w, h] = selector.value.replace('xywh=', '').split(',').map(parseFloat);
  const currentShape = {
    id: uuidv4(),
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    x,
    y,
    width: w,
    height: h,
    type: SHAPES_TOOL.RECTANGLE,
    fill: TARGET_TOOL_STATE.fillColor,
    stroke: TARGET_TOOL_STATE.strokeColor,
    strokeWidth: TARGET_TOOL_STATE.strokeWidth,
  };

  return {
    drawingState: JSON.stringify({
      currentShape,
      shapes: [currentShape],
      isDrawing: false,
    }),
    svg: xywhToSvg({
      x, y, w, h,
    }),
  };
};

const convertSvgSelectorToMae = (selector) => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(selector.value, 'image/svg+xml');
  const xywh = svgToXywh(svgDoc);
  const fullW = svgDoc.querySelector('svg').getAttribute('width') || undefined;
  const fullH = svgDoc.querySelector('svg').getAttribute('height') || undefined;
  // when building the `currentShape` and `maeTarget`, we try to extract as much infoermation as possible from the SVG
  const currentShape = {
    id: uuidv4(),
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    x: xywh.x,
    y: xywh.y,
    width: xywh.width,
    height: xywh.height,
    type: SHAPES_TOOL.RECTANGLE,
    fill: svgDoc.querySelector('path[fill]')?.getAttribute('fill') || TARGET_TOOL_STATE.fillColor,
    stroke: svgDoc.querySelector('path[stroke]')?.getAttribute('stroke') || TARGET_TOOL_STATE.strokeColor,
    strokeWidth: svgDoc.querySelector('path[stroke-width]')?.getAttribute('stroke-width') || TARGET_TOOL_STATE.strokeWidth,
  };
  const maeTarget = {
    drawingState: JSON.stringify({
      currentShape,
      shapes: [currentShape],
      isDrawing: false,
    }),
    svg: selector.value,
  };
  if (fullW && fullH) {
    maeTarget.fullCanvaXYWH = `0,0,${fullW},${fullH}`;
    // ratio of area of annotation / full canvas area
    // maeTarget.scale = (xywh.width * xywh.height) / (fullW * fullH);
  }
  return maeTarget;
};

/**
 * generate `maeData.target` from an annotation's `target` field.
 *
 * NOTE: limitations:
 * - currently, only 2 types of targets are supported:
 *    - FragmentSelectors
 *    - SvgSelectors
 * - if there is an array of selectors, the first supported selector is used
 * - we extract bounding boxes from SVGs, so we expect SVGs to be rectangular
 *
 * @param {object} target
 * @param {string} annotationId
 * @returns {object}
 */
const convertIIIFTargetToMae = (target, annotationId) => {
  const supportedSelectorTypes = ['SvgSelector', 'FragmentSelector'];
  const selectorArray = Array.isArray(target.selector) ? target.selector : [target.selector];

  for (const selector of selectorArray) {
    // NOTE: order of selector types is important
    // we put the try..catch in the loop to skip the error and fallback to another selector if possible
    try {
      if (selector.type === 'SvgSelector') {
        return convertSvgSelectorToMae(selector);
      } if (selector.type === 'FragmentSelector') {
        return convertFragmentSelectorToMae(selector);
      }
    } catch (err) {
      console.error(`Error generating maeData from selector ${selector.type}, attempting to fallback to other selector`, err);
    }
  }
  // if at the end of the loop, no selector could be processed, log an error and return.
  console.error(`On annotation '${annotationId}': none of the selector types in the annotation are unsupported: ${selectorArray.map((selector) => selector.type)}. Supported selectors are: [${supportedSelectorTypes}].`);
  return {};
};

/**
 * generate the maeData field for IIIF annotations that lack one (i.e., all annotations that are created outside of MAE).
 * this allows to open them and update them as with any MAE-created annotation.
 * @param {*} anno
 * @returns
 */
export function convertIIIFAnnoToMaeData(anno) {
  if (!anno.maeData || Object.keys(anno.maeData || {}).length === 0) {
    try {
      const maeData = {
        target: {},
        templateType: '',
        tags: [],
        textBody: {},
      };

      const [templateType, textBody] = convertIIIFBodyToMae(anno);
      maeData.templateType = templateType;
      maeData.textBody = textBody;

      maeData.target = convertIIIFTargetToMae(anno.target, anno.id);
      anno.maeData = maeData;
      return anno;
    } catch (e) {
      console.error('Error generating maeData from annotation', e);
      return anno;
    }
  }
  return anno;
}

/**
 * Checks if a value is empty or contains only whitespace/HTML tags
 * @param {string} value - The string value to check
 * @returns {boolean} True if the value is empty, undefined, or contains only HTML tags/whitespace
 * @example
 * isEmptyValue('') // true
 * isEmptyValue('<p></p>') // true
 * isEmptyValue('<p><br></p>') // true
 * isEmptyValue('<p>  </p>') // true
 * isEmptyValue('<p>Hello</p>') // false
 */
export const isEmptyValue = (value) => {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  const withoutTags = trimmed.replace(/<[^>]*>/g, '').trim();
  return withoutTags === '';
};

/**
 * Get default value for the annotation body when the body is empty. The default value is a string with the current date and time.
 * @returns {`${string}`}
 */
const getDefaultValue = () => `${new Date().toLocaleString()}`;
/**
 * Convert annotation state to be saved. Function change the annotationState object
 * @param annotationState
 * @param canvas
 * @param windowId
 * @param playerReferences
 * @returns {Promise<void>}
 */
export const convertAnnotationStateToBeSaved = async (
  annotationState,
  canvas,
  windowId,
  playerReferences,
) => {
  const annotationStateForSaving = annotationState;

  if (annotationState.maeData.templateType === TEMPLATE.IIIF_TYPE) {
    return annotationState;
  }

  // Duplicated code, not ideal but it will be erase by isolation template refactoring.
  // All template will integrate their specific logic to convert annotationState to be saved in
  // their own way, so we will not need this big function anymore.
  if (
    annotationStateForSaving.body
      && !Array.isArray(annotationStateForSaving.body)
      && isEmptyValue(annotationStateForSaving.body.value)
  ) {
    annotationStateForSaving.body.value = getDefaultValue();
  }

  if (
    annotationStateForSaving.maeData?.textBody
      && isEmptyValue(annotationStateForSaving.maeData.textBody.value)
  ) {
    annotationStateForSaving.maeData.textBody.value = getDefaultValue();
  }

  // TODO I dont know why this code is here? To clean the object ?
  annotationStateForSaving.maeData.target = {
    drawingState: annotationStateForSaving.maeData.target.drawingState,
    fullCanvaXYWH: annotationStateForSaving.maeData.target.fullCanvaXYWH,
    scale: annotationStateForSaving.maeData.target.scale,
    tend: annotationStateForSaving.maeData.target.tend,
    tstart: annotationStateForSaving.maeData.target.tstart,
  };

  console.info('Annotation state target', annotationState.maeData.target);

  if (annotationStateForSaving.maeData.templateType === TEMPLATE.TAGGING_TYPE
    || annotationStateForSaving.maeData.templateType === TEMPLATE.TEXT_TYPE
    || annotationStateForSaving.maeData.templateType === TEMPLATE.MULTIPLE_BODY_TYPE) {
    // Complex annotation
    if (annotationStateForSaving.maeData.target.drawingState.shapes.length > 0) {
      annotationStateForSaving.maeData.target.svg = await getSvg(windowId);
    }
  }

  if (annotationStateForSaving.maeData.templateType === TEMPLATE.MULTIPLE_BODY_TYPE) {
    annotationStateForSaving.body = [annotationState.maeData.textBody];
    annotationStateForSaving.body.push(...annotationState.maeData.tags.map((tag) => ({
      id: tag.value,
      purpose: 'tagging',
      type: 'TextualBody',
      value: tag.value,
    })));
  }

  if (isAnnotationExportableToImage(annotationStateForSaving.maeData)) {
    annotationStateForSaving.body.id = await getKonvaAsDataURL(windowId);
    annotationStateForSaving.body.format = 'image/jpg';
    annotationStateForSaving.type = 'Annotation';
  }

  // TODO Always relevant ?
  annotationStateForSaving.maeData.target.scale = playerReferences.getMediaTrueHeight()
    / playerReferences.getDisplayedMediaHeight() * playerReferences.getZoom();

  annotationStateForSaving.target = getIIIFTargetFromMaeData(
    annotationStateForSaving.maeData,
    canvas.id,
    windowId,
    playerReferences.getScale(),
  );

  annotationStateForSaving.maeData.target.drawingState = JSON.stringify(
    annotationStateForSaving.maeData.target.drawingState,
  );

  return annotationStateForSaving;
};

//* *******************************************

/**
 * Create the body of a V2 annotation from a V3 annotation
 * @param {object} v3body
 * @returns {object}
 */
function createV2AnnoBody(v3body) {
  const v2body = {
    chars: v3body.value,
  };
  if (v3body.purpose === 'tagging') {
    v2body['@type'] = 'oa:Tag';
  } else {
    v2body['@type'] = 'dctypes:Text';
  }
  if (v3body.format) {
    v2body.format = v3body.format;
  }
  if (v3body.language) {
    v2body.language = v3body.language;
  }
  if (v3body.purpose) {
    v2body.motivation = v3body.purpose;
  }
  return v2body;
}

/**
 * Create a V2 selector from a V3 selector
 * @param {object} v3selector
 * @returns {object|null}
 */
function createV2AnnoSelector(v3selector) {
  switch (v3selector.type) {
    case 'SvgSelector':
      return {
        '@type': 'oa:SvgSelector',
        value: v3selector.value,
      };
    case 'FragmentSelector':
      return {
        '@type': 'oa:FragmentSelector',
        value: v3selector.value,
      };
    default:
      return null;
  }
}

/**
 * Creates a V2 annotation from a V3 annotation
 * @param {object} v3anno
 * @returns {object}
 */
export function createV2Anno(v3anno) {
  const v2anno = {
    '@context': 'https://iiif.io/api/presentation/2/context.json',
    '@type': 'oa:Annotation',
    maeData: v3anno.maeData || {},
    motivation: 'oa:commenting',
  };
  // copy id if it is SAS-generated
  if (v3anno.id?.startsWith('http')) {
    v2anno['@id'] = v3anno.id;
  }
  if (Array.isArray(v3anno.body)) {
    v2anno.resource = v3anno.body.map((b) => createV2AnnoBody(b));
  } else {
    v2anno.resource = createV2AnnoBody(v3anno.body);
  }
  // v3anno.target can be either a string or an object =>
  // if it's an object, extract it.
  if (typeof v3anno.target === 'object' && !Array.isArray(v3anno.target) && v3anno.target !== null) {
    v2anno.on = {
      '@type': 'oa:SpecificResource',
      full:
        // `target` has a `source` with `id` object pointing to the proper canvas
        v3anno.target.source?.id
        // `target` has an id
        || v3anno.target.id
        // `target` is an object and `target.source` is a string
        || v3anno.target.source,
    };
    // if v3anno.target is a string, don't process it
  } else {
    v2anno.on = v3anno.target;
  }
  if (v3anno.target.selector) {
    if (Array.isArray(v3anno.target.selector)) {
      const selectors = v3anno.target.selector.map((s) => createV2AnnoSelector(s));
      // create choice, assuming two elements and 0 is default
      v2anno.on.selector = {
        '@type': 'oa:Choice',
        default: selectors[0],
        item: selectors[1],
      };
    } else {
      v2anno.on.selector = createV2AnnoSelector(v3anno.target.selector);
    }
    if (v3anno.target.source?.partOf) {
      v2anno.on.within = {
        '@id': v3anno.target.source.partOf.id,
        '@type': 'sc:Manifest',
      };
    }
  }
  return v2anno;
}

/**
 * create a V3 body from a V2 body
 * @param {object} v2body
 * @returns {object}
 */
function createV3AnnoBody(v2body) {
  const v3body = {
    type: 'TextualBody',
    value: v2body.chars,
  };
  if (v2body.motivation) {
    v3body.purpose = v2body.motivation;
  }
  if (v2body.format) {
    v3body.format = v2body.format;
  }
  if (v2body.language) {
    v3body.language = v2body.language;
  }
  if (v2body['@type'] === 'oa:Tag') {
    v3body.purpose = 'tagging';
  }
  return v3body;
}

/**
 * Create a V3 selector from a V2 selector
 * @param {object} v2selector
 * @returns {object}
 */
function createV3AnnoSelector(v2selector) {
  switch (v2selector['@type']) {
    case 'oa:SvgSelector':
      return {
        type: 'SvgSelector',
        value: v2selector.value,
      };
    case 'oa:FragmentSelector':
      return {
        type: 'FragmentSelector',
        value: v2selector.value,
      };
    case 'oa:Choice':
      /* create alternate selectors */
      return [
        createV3AnnoSelector(v2selector.default),
        createV3AnnoSelector(v2selector.item),
      ];
    default:
      return null;
  }
}

/**
 * Creates a V3 annotation from a V2 annotation
 * @param {object} v2anno
 * @returns {object}
 */
function createV3Anno(v2anno) {
  const v3anno = {
    id: v2anno['@id'],
    maeData: v2anno.maeData || {},
    motivation: 'commenting',
    type: 'Annotation',
  };
  if (Array.isArray(v2anno.resource)) {
    v3anno.body = v2anno.resource.map((b) => createV3AnnoBody(b));
  } else if (v2anno.resource) {
    // it's an object
    v3anno.body = createV3AnnoBody(v2anno.resource);
  } else {
    // no body is defined
    v3anno.body = {};
  }
  let v2target = v2anno.on;
  if (Array.isArray(v2target)) {
    [v2target] = v2target;
  }
  v3anno.target = {
    selector: createV3AnnoSelector(v2target.selector),
    source: v2target.full,
  };
  if (v2target.within) {
    v3anno.target.source = {
      id: v2target.full,
      partOf: {
        id: v2target.within['@id'],
        type: 'Manifest',
      },
      type: 'Canvas',
    };
  }
  return v3anno;
}

/**
 * from an array of IIIF V2 annotations, create a V3 annotationPage
 * @param {object[]} v2annos - array of IIIF V2 annotations
 * @param {string} annotationPageId - '@id' of the annotationPage
 * @returns {object}
 */
export function createAnnotationPage(v2annos, annotationPageId) {
  if (Array.isArray(v2annos)) {
    const v3annos = v2annos.map((a) => createV3Anno(a));
    return {
      id: annotationPageId,
      items: v3annos,
      type: 'AnnotationPage',
    };
  }
  return v2annos;
}
