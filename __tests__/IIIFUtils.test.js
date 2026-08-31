import {
  getIIIFTargetFromMaeData,
  convertAnnotationStateToBeSaved,
  convertIIIFAnnoToMaeData,
  isEmptyValue,
  createV2Anno,
  createAnnotationPage,
} from '../src/IIIFUtils';
import { TEMPLATE, TARGET_TOOL_STATE } from '../src/annotationForm/AnnotationFormUtils';
import { SHAPES_TOOL } from '../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

// Characterization tests for the conversion logic pinned down in the issue #12 analysis
// (https://github.com/Tetras-dfb/root_repo/issues/12): these tests lock in the CURRENT
// behavior of the annotation<->IIIF conversion functions before any refactor touches them.
// They are not a statement of "correct" behavior, only of "current" behavior.

vi.mock('../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils', async () => {
  const actual = await vi.importActual('../src/annotationForm/AnnotationFormOverlay/KonvaDrawing/KonvaUtils');
  return {
    ...actual,
    getKonvaAsDataURL: vi.fn().mockResolvedValue('data:image/jpg;base64,mock'),
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

/** Two overlapping rectangle shapes - not collapsible into a single xywh string */
const complexShapes = () => ([
  simpleRectangleShape(),
  { ...simpleRectangleShape(), id: 'shape-2', x: 100 },
]);

describe('isEmptyValue', () => {
  it.each([
    ['', true],
    [undefined, true],
    [null, true],
    ['<p></p>', true],
    ['<p><br></p>', true],
    ['<p>  </p>', true],
    ['   ', true],
    ['<p>Hello</p>', false],
    ['Hello', false],
  ])('isEmptyValue(%p) === %p', (value, expected) => {
    expect(isEmptyValue(value)).toBe(expected);
  });
});

describe('getIIIFTargetFromMaeData', () => {
  it('returns the raw target verbatim for IIIF_TYPE (expert mode)', () => {
    const rawTarget = { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' }, source: 'canvas1' };
    const maeData = { target: rawTarget, templateType: TEMPLATE.IIIF_TYPE };

    expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toBe(rawTarget);
  });

  it.each([TEMPLATE.TAGGING_TYPE, TEMPLATE.TEXT_TYPE, TEMPLATE.MULTIPLE_BODY_TYPE])(
    'collapses a single un-rotated rectangle matching the target tool colors into a xywh string (%s)',
    (templateType) => {
      const maeData = {
        target: {
          drawingState: { shapes: [simpleRectangleShape()] },
          tend: undefined,
          tstart: undefined,
        },
        templateType,
      };

      expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toBe('canvas1#xywh=10,20,30,40');
    },
  );

  it('includes the temporal fragment when tstart/tend are set on the simple-rectangle path', () => {
    const maeData = {
      target: {
        drawingState: { shapes: [simpleRectangleShape()] },
        tend: 12,
        tstart: 5,
      },
      templateType: TEMPLATE.TAGGING_TYPE,
    };

    expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toBe('canvas1#xywh=10,20,30,40&t=5,12');
  });

  it('normalizes negative width/height so x/y always describe the top-left corner', () => {
    const shape = {
      ...simpleRectangleShape(), height: -40, width: -30, x: 40, y: 60,
    };
    const maeData = {
      target: { drawingState: { shapes: [shape] } },
      templateType: TEMPLATE.TAGGING_TYPE,
    };

    expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toBe('canvas1#xywh=10,20,30,40');
  });

  it('scales the rectangle by scaleX/scaleY when the shape was resized', () => {
    const shape = { ...simpleRectangleShape(), scaleX: 2, scaleY: 3 };
    const maeData = {
      target: { drawingState: { shapes: [shape] } },
      templateType: TEMPLATE.MULTIPLE_BODY_TYPE,
    };

    expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toBe('canvas1#xywh=10,20,60,120');
  });

  it('falls back to an SVG/FragmentSelector target when there is more than one shape', () => {
    const maeData = {
      target: {
        drawingState: { shapes: complexShapes() },
        svg: '<svg>mock</svg>',
        tend: 12,
        tstart: 5,
      },
      templateType: TEMPLATE.MULTIPLE_BODY_TYPE,
    };

    expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toEqual({
      selector: [
        { type: 'SvgSelector', value: '<svg>mock</svg>' },
        { type: 'FragmentSelector', value: 'canvas1#t=5,12' },
      ],
      source: 'canvas1',
    });
  });

  it('falls back to an SVG/FragmentSelector target when the single shape colors do not match the target tool', () => {
    const shape = { ...simpleRectangleShape(), fillColor: 'rgba(0,0,0,1)' };
    const maeData = {
      target: {
        drawingState: { shapes: [shape] },
        svg: '<svg>mock</svg>',
      },
      templateType: TEMPLATE.TAGGING_TYPE,
    };

    expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toEqual({
      selector: [
        { type: 'SvgSelector', value: '<svg>mock</svg>' },
        { type: 'FragmentSelector', value: 'canvas1#' },
      ],
      source: 'canvas1',
    });
  });

  it('uses the full-canvas target for an unknown/default templateType', () => {
    const maeData = {
      target: { fullCanvaXYWH: '0,0,800,600', tend: undefined },
      templateType: 'some-unknown-type',
    };

    expect(getIIIFTargetFromMaeData(maeData, 'canvas1')).toBe('canvas1#xywh=0,0,800,600');
  });
});

describe('convertAnnotationStateToBeSaved', () => {
  const playerReferences = {
    getDisplayedMediaHeight: vi.fn().mockReturnValue(100),
    getMediaTrueHeight: vi.fn().mockReturnValue(200),
    getScale: vi.fn().mockReturnValue(1),
    getZoom: vi.fn().mockReturnValue(1),
  };

  /** A minimal, valid annotationState for the given templateType */
  const baseAnnotationState = (templateType) => ({
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
      templateType,
      textBody: { purpose: 'describing', type: 'TextualBody', value: 'Hello world' },
    },
  });

  it('returns the annotation state unchanged for IIIF_TYPE without touching playerReferences', async () => {
    const annotationState = { maeData: { templateType: TEMPLATE.IIIF_TYPE } };

    const result = await convertAnnotationStateToBeSaved(
      annotationState,
      { id: 'canvas1' },
      'window1',
      undefined,
    );

    expect(result).toBe(annotationState);
  });

  it('strips unknown keys from maeData.target and stringifies drawingState', async () => {
    const annotationState = baseAnnotationState(TEMPLATE.MULTIPLE_BODY_TYPE);

    const result = await convertAnnotationStateToBeSaved(
      annotationState,
      { id: 'canvas1' },
      'window1',
      playerReferences,
    );

    expect(result.maeData.target).not.toHaveProperty('extraLegacyKey');
    expect(result.maeData.target.drawingState).toBe(JSON.stringify({ shapes: [] }));
  });

  it('defaults an empty textBody value to the current date/time string', async () => {
    const annotationState = baseAnnotationState(TEMPLATE.MULTIPLE_BODY_TYPE);
    annotationState.maeData.textBody.value = '<p></p>';

    const result = await convertAnnotationStateToBeSaved(
      annotationState,
      { id: 'canvas1' },
      'window1',
      playerReferences,
    );

    expect(result.maeData.textBody.value).not.toBe('');
    expect(isEmptyValue(result.maeData.textBody.value)).toBe(false);
  });

  it('builds the body array (text + tags) for MULTIPLE_BODY_TYPE', async () => {
    const annotationState = baseAnnotationState(TEMPLATE.MULTIPLE_BODY_TYPE);
    annotationState.maeData.tags = [{ value: 'foo' }, { value: 'bar' }];

    const result = await convertAnnotationStateToBeSaved(
      annotationState,
      { id: 'canvas1' },
      'window1',
      playerReferences,
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

  it('does not build a body array for TAGGING_TYPE (only MULTIPLE_BODY_TYPE gets one)', async () => {
    const annotationState = baseAnnotationState(TEMPLATE.TAGGING_TYPE);

    const result = await convertAnnotationStateToBeSaved(
      annotationState,
      { id: 'canvas1' },
      'window1',
      playerReferences,
    );

    expect(result.body).toBeUndefined();
  });

  it('computes maeData.target.scale from trueHeight/displayedHeight*zoom and sets `target` from getIIIFTargetFromMaeData', async () => {
    const annotationState = baseAnnotationState(TEMPLATE.TAGGING_TYPE);
    annotationState.maeData.target.drawingState.shapes = [simpleRectangleShape()];

    const result = await convertAnnotationStateToBeSaved(
      annotationState,
      { id: 'canvas1' },
      'window1',
      playerReferences,
    );

    expect(result.maeData.target.scale).toBe(2);
    expect(result.target).toBe('canvas1#xywh=10,20,30,40');
  });
});

describe('convertIIIFAnnoToMaeData', () => {
  it('is a no-op when the annotation already has maeData', () => {
    const anno = { maeData: { templateType: TEMPLATE.TAGGING_TYPE } };

    expect(convertIIIFAnnoToMaeData(anno)).toBe(anno);
  });

  it('derives TAGGING_TYPE (and an empty textBody) from a string `motivation`', () => {
    const anno = { motivation: 'tagging', target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' } } };

    const result = convertIIIFAnnoToMaeData(anno);

    expect(result.maeData.templateType).toBe(TEMPLATE.TAGGING_TYPE);
    expect(result.maeData.textBody).toEqual({});
  });

  it('derives TAGGING_TYPE from an array `motivation` containing "tagging"', () => {
    const anno = { motivation: ['tagging', 'commenting'], target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' } } };

    expect(convertIIIFAnnoToMaeData(anno).maeData.templateType).toBe(TEMPLATE.TAGGING_TYPE);
  });

  it('derives MULTIPLE_BODY_TYPE from `bodyValue`, forcing purpose to "describing"', () => {
    const anno = { bodyValue: 'legacy comment', target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' } } };

    const result = convertIIIFAnnoToMaeData(anno);

    expect(result.maeData.templateType).toBe(TEMPLATE.MULTIPLE_BODY_TYPE);
    expect(result.maeData.textBody).toEqual({ purpose: 'describing', type: 'TextualBody', value: 'legacy comment' });
  });

  it('derives MULTIPLE_BODY_TYPE from a single `body` object, always resetting purpose to "describing"', () => {
    const anno = {
      body: { purpose: 'commenting', value: 'a note' },
      target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' } },
    };

    const result = convertIIIFAnnoToMaeData(anno);

    expect(result.maeData.textBody).toEqual({ purpose: 'describing', type: 'TextualBody', value: 'a note' });
  });

  it('derives MULTIPLE_BODY_TYPE from an array `body`, converting each entry', () => {
    const anno = {
      body: [{ value: 'first' }, { value: 'second' }],
      target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' } },
    };

    const result = convertIIIFAnnoToMaeData(anno);

    expect(result.maeData.textBody).toEqual([
      { purpose: 'describing', type: 'TextualBody', value: 'first' },
      { purpose: 'describing', type: 'TextualBody', value: 'second' },
    ]);
  });

  it('rebuilds maeData.target from a FragmentSelector, parsing xywh as floats', () => {
    const anno = {
      bodyValue: 'x',
      id: 'anno1',
      target: { selector: { type: 'FragmentSelector', value: 'xywh=10.5,20,30,40' } },
    };

    const result = convertIIIFAnnoToMaeData(anno);
    const drawingState = JSON.parse(result.maeData.target.drawingState);

    expect(drawingState.shapes).toHaveLength(1);
    expect(drawingState.shapes[0]).toMatchObject({
      height: 40, type: SHAPES_TOOL.RECTANGLE, width: 30, x: 10.5, y: 20,
    });
    expect(result.maeData.target.svg).toContain('<svg');
  });

  describe('with a stubbed SVGGraphicsElement.getBBox', () => {
    // happy-dom's SVGGraphicsElement.getBBox is a stub that always returns a zero rect:
    // override it so the (real-browser-only) bbox extraction path is exercised deterministically.
    // Scoped to beforeEach/afterEach (rather than saved/restored inline) so the global prototype
    // is never left patched if an assertion throws mid-test.
    let originalGetBBox;

    beforeEach(() => {
      originalGetBBox = SVGGraphicsElement.prototype.getBBox;
      SVGGraphicsElement.prototype.getBBox = vi.fn().mockReturnValue({
        height: 40, width: 30, x: 5, y: 6,
      });
    });

    afterEach(() => {
      SVGGraphicsElement.prototype.getBBox = originalGetBBox;
    });

    it('rebuilds maeData.target from an SvgSelector, extracting the bounding box', () => {
      const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><path fill='red' stroke='blue' d='M0 0'/></svg>";
      const anno = {
        bodyValue: 'x',
        id: 'anno1',
        target: { selector: { type: 'SvgSelector', value: svg } },
      };

      const result = convertIIIFAnnoToMaeData(anno);
      const drawingState = JSON.parse(result.maeData.target.drawingState);

      expect(drawingState.shapes[0]).toMatchObject({
        fill: 'red', height: 40, stroke: 'blue', width: 30, x: 5, y: 6,
      });
      expect(result.maeData.target.fullCanvaXYWH).toBe('0,0,800,600');
    });

    it('falls back to returning `{}` for a non-XML/hostile SvgSelector value', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const anno = {
        bodyValue: 'x',
        id: 'anno1',
        target: {
          selector: {
            type: 'SvgSelector',
            value: 'not xml at all <script>alert(1)</script>',
          },
        },
      };

      const result = convertIIIFAnnoToMaeData(anno);

      expect(result.maeData.target).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('also falls back to `{}` when well-formed XML has no <svg> root element (e.g. a bare <script> tag)', () => {
      // NOTE: convertSvgSelectorToMae never checks that the parsed document is actually rooted
      // in <svg> before calling querySelector('svg').getAttribute(...); with no matching element
      // that throws a TypeError, which the caller's try/catch turns into the same graceful `{}`
      // fallback as unparseable input. Documenting this because it's the mechanism (an
      // accidental null-dereference, not deliberate validation) that currently keeps a
      // non-<svg>-rooted payload from being processed - it is not itself a safety guarantee to
      // rely on if this code is ever refactored.
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const anno = {
        bodyValue: 'x',
        id: 'anno1',
        target: {
          selector: { type: 'SvgSelector', value: '<script xmlns="http://www.w3.org/2000/svg">alert(1)</script>' },
        },
      };

      const result = convertIIIFAnnoToMaeData(anno);

      expect(result.maeData.target).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  it('logs an error and returns `{}` for maeData.target when no selector type is supported', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const anno = {
      bodyValue: 'x',
      id: 'anno1',
      target: { selector: { type: 'PointSelector', value: 'x=1,y=2' } },
    };

    const result = convertIIIFAnnoToMaeData(anno);

    expect(result.maeData.target).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('createV2Anno / createAnnotationPage (V2<->V3 legacy interoperability)', () => {
  it('creates a V2 "oa:Tag" body for a tagging body, and preserves the SAS id only if it starts with "http"', () => {
    const v3anno = {
      body: { purpose: 'tagging', type: 'TextualBody', value: 'my-tag' },
      id: 'https://sas.example.org/annotation/1',
      maeData: { templateType: TEMPLATE.TAGGING_TYPE },
      target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' }, source: 'canvas1' },
    };

    const v2anno = createV2Anno(v3anno);

    expect(v2anno['@id']).toBe('https://sas.example.org/annotation/1');
    expect(v2anno.resource).toEqual({ '@type': 'oa:Tag', chars: 'my-tag', motivation: 'tagging' });
    expect(v2anno.on).toEqual({
      '@type': 'oa:SpecificResource',
      full: 'canvas1',
      selector: { '@type': 'oa:FragmentSelector', value: 'xywh=1,2,3,4' },
    });
  });

  it('drops the id when it is a locally-generated (non-http) id', () => {
    const v3anno = {
      body: { type: 'TextualBody', value: 'a note' },
      id: 'canvas1/annotation/local-uuid',
      target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' }, source: 'canvas1' },
    };

    expect(createV2Anno(v3anno)['@id']).toBeUndefined();
  });

  it('round-trips a V2 annotation created by createV2Anno back to V3 through createAnnotationPage', () => {
    const v3anno = {
      body: [
        { purpose: 'describing', type: 'TextualBody', value: 'a note' },
        {
          id: 'foo', purpose: 'tagging', type: 'TextualBody', value: 'foo',
        },
      ],
      id: 'https://sas.example.org/annotation/1',
      maeData: { templateType: TEMPLATE.MULTIPLE_BODY_TYPE },
      target: { selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' }, source: 'canvas1' },
    };

    const v2anno = createV2Anno(v3anno);
    const v3page = createAnnotationPage([v2anno], 'annoPage1');

    expect(v3page.items).toHaveLength(1);
    expect(v3page.items[0]).toMatchObject({
      body: [
        { purpose: 'describing', type: 'TextualBody', value: 'a note' },
        { purpose: 'tagging', type: 'TextualBody', value: 'foo' },
      ],
      id: 'https://sas.example.org/annotation/1',
      maeData: { templateType: TEMPLATE.MULTIPLE_BODY_TYPE },
      target: {
        selector: { type: 'FragmentSelector', value: 'xywh=1,2,3,4' },
        source: 'canvas1',
      },
    });
  });

  it('reconstructs an "oa:Choice" pair of selectors (SVG + Fragment) back into a V3 selector array', () => {
    const v2anno = {
      '@context': 'https://iiif.io/api/presentation/2/context.json',
      '@id': 'https://sas.example.org/annotation/2',
      '@type': 'oa:Annotation',
      motivation: 'oa:commenting',
      on: {
        '@type': 'oa:SpecificResource',
        full: 'canvas1',
        selector: {
          '@type': 'oa:Choice',
          default: { '@type': 'oa:SvgSelector', value: '<svg/>' },
          item: { '@type': 'oa:FragmentSelector', value: 'xywh=1,2,3,4' },
        },
      },
      resource: { '@type': 'dctypes:Text', chars: 'a note' },
    };

    const v3page = createAnnotationPage([v2anno], 'annoPage1');

    expect(v3page.items[0].target.selector).toEqual([
      { type: 'SvgSelector', value: '<svg/>' },
      { type: 'FragmentSelector', value: 'xywh=1,2,3,4' },
    ]);
  });
});
