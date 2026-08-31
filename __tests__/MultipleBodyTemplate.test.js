import { convertMultipleBodyAnnotationToBeSaved } from '../src/annotationForm/MultipleBodyTemplate';
import { isEmptyValue } from '../src/IIIFUtils';
import { TARGET_TOOL_STATE } from '../src/annotationForm/AnnotationFormUtils';
import { SHAPES_TOOL } from '../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

// Regression tests for issue #12 Phase 2d (tetras-dfb/root_repo#12): MultipleBodyTemplate is the
// last and primary template to get its own convertToAnnotation, extracted out of IIIFUtils.js's
// convertAnnotationStateToBeSaved. These pin down that the extraction is behavior-preserving
// against the MULTIPLE_BODY_TYPE cases already characterized in IIIFUtils.test.js (Phase 0),
// which now exercise convertAnnotationStateToBeSaved only in its remaining role as
// AnnotationForm.jsx's fallback for an unrecognized templateType - not as MultipleBodyTemplate's
// real conversion path any more.

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

/** A minimal, valid MultipleBodyTemplate annotationState */
const baseMultipleBodyState = () => ({
  maeData: {
    tags: [],
    target: {
      drawingState: { shapes: [] },
      extraLegacyKey: 'should be stripped',
      fullCanvaXYWH: '0,0,800,600',
      scale: undefined,
      tend: undefined,
      tstart: undefined,
    },
    templateType: 'multiple_body',
    textBody: { purpose: 'describing', type: 'TextualBody', value: 'Hello world' },
  },
});

describe('convertMultipleBodyAnnotationToBeSaved', () => {
  it('strips unknown keys from maeData.target and stringifies drawingState', async () => {
    const state = baseMultipleBodyState();

    const result = await convertMultipleBodyAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.maeData.target).not.toHaveProperty('extraLegacyKey');
    expect(result.maeData.target.drawingState).toBe(JSON.stringify({ shapes: [] }));
  });

  it('defaults an empty textBody value to the current date/time string', async () => {
    const state = baseMultipleBodyState();
    state.maeData.textBody.value = '<p></p>';

    const result = await convertMultipleBodyAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.maeData.textBody.value).not.toBe('');
    expect(isEmptyValue(result.maeData.textBody.value)).toBe(false);
  });

  it('builds the body array (text + tags)', async () => {
    const state = baseMultipleBodyState();
    state.maeData.tags = [{ value: 'foo' }, { value: 'bar' }];

    const result = await convertMultipleBodyAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.body).toEqual([
      { purpose: 'describing', type: 'TextualBody', value: 'Hello world' },
      {
        id: 'foo', purpose: 'tagging', type: 'TextualBody', value: 'foo',
      },
      {
        id: 'bar', purpose: 'tagging', type: 'TextualBody', value: 'bar',
      },
    ]);
  });

  it('builds a body array even with no tags (text body only)', async () => {
    const state = baseMultipleBodyState();

    const result = await convertMultipleBodyAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.body).toEqual([
      { purpose: 'describing', type: 'TextualBody', value: 'Hello world' },
    ]);
  });

  it('computes maeData.target.scale and derives `target` from the drawn shape, same as the shared converter', async () => {
    const state = baseMultipleBodyState();
    state.maeData.target.drawingState.shapes = [simpleRectangleShape()];

    const result = await convertMultipleBodyAnnotationToBeSaved(
      state,
      { canvas: { id: 'canvas1' }, playerReferences, windowId: 'window1' },
    );

    expect(result.maeData.target.scale).toBe(2);
    expect(result.target).toBe('canvas1#xywh=10,20,30,40');
  });
});
