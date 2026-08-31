import { convertTextCommentAnnotationToBeSaved } from '../src/annotationForm/TextCommentTemplate';
import { isEmptyValue } from '../src/IIIFUtils';
import { TARGET_TOOL_STATE } from '../src/annotationForm/AnnotationFormUtils';
import { SHAPES_TOOL } from '../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

// Regression tests for issue #12 Phase 2b (tetras-dfb/root_repo#12): TextCommentTemplate is the
// second template to get its own convertToAnnotation, extracted out of IIIFUtils.js's
// convertAnnotationStateToBeSaved. Mirrors TaggingTemplate.test.js - same shape (a single
// body.value, no tags/textBody) - pinned against the same TEXT_TYPE cases already
// characterized in IIIFUtils.test.js.

vi.mock('../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils', async () => {
  const actual = await vi.importActual('../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils');
  return {
    ...actual,
    getSvg: vi.fn().mockResolvedValue('<svg>mock</svg>'),
  };
});

/** A single un-rotated Konva rectangle shape matching the target-tool colors */
const simpleRectangleShape = () => ({
  fill: TARGET_TOOL_STATE.fillColor,
  fillColor: TARGET_TOOL_STATE.fillColor,
  height: 40,
  id: 'shape-1',
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  stroke: TARGET_TOOL_STATE.strokeColor,
  strokeColor: TARGET_TOOL_STATE.strokeColor,
  type: SHAPES_TOOL.RECTANGLE,
  width: 30,
  x: 10,
  y: 20,
});

const playerReferences = {
  getDisplayedMediaHeight: vi.fn().mockReturnValue(100),
  getMediaTrueHeight: vi.fn().mockReturnValue(200),
  getScale: vi.fn().mockReturnValue(1),
  getZoom: vi.fn().mockReturnValue(1),
};

/** A minimal, valid TextCommentTemplate annotationState */
const baseTextCommentState = () => ({
  body: { id: 'body-1', type: 'TextualBody', value: 'a comment' },
  maeData: {
    target: {
      drawingState: { shapes: [] },
      extraLegacyKey: 'should be stripped',
      fullCanvaXYWH: '0,0,800,600',
      scale: undefined,
      tend: undefined,
      tstart: undefined,
    },
    templateType: 'text',
  },
});

describe('convertTextCommentAnnotationToBeSaved', () => {
  it('defaults an empty body.value to the current date/time string', async () => {
    const state = baseTextCommentState();
    state.body.value = '<p></p>';

    const result = await convertTextCommentAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.body.value).not.toBe('<p></p>');
    expect(isEmptyValue(result.body.value)).toBe(false);
  });

  it('leaves a non-empty body.value untouched', async () => {
    const state = baseTextCommentState();

    const result = await convertTextCommentAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.body.value).toBe('a comment');
  });

  it('strips unknown keys from maeData.target and stringifies drawingState', async () => {
    const state = baseTextCommentState();

    const result = await convertTextCommentAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.maeData.target).not.toHaveProperty('extraLegacyKey');
    expect(result.maeData.target.drawingState).toBe(JSON.stringify({ shapes: [] }));
  });

  it('computes maeData.target.scale and derives `target` from the drawn shape, same as the shared converter', async () => {
    const state = baseTextCommentState();
    state.maeData.target.drawingState.shapes = [simpleRectangleShape()];

    const result = await convertTextCommentAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.maeData.target.scale).toBe(2);
    expect(result.target).toBe('canvas1#xywh=10,20,30,40');
  });

  it('never builds a body array (unlike MultipleBodyTemplate): body stays the single object', async () => {
    const state = baseTextCommentState();

    const result = await convertTextCommentAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(Array.isArray(result.body)).toBe(false);
    expect(result.body).toEqual({ id: 'body-1', type: 'TextualBody', value: 'a comment' });
  });
});
