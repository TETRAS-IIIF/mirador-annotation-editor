import { getVisibleCanvases } from 'mirador';
import { WindowPlayer } from '../src/playerReferences';

vi.mock('mirador', () => ({
  getVisibleCanvasAudioResources: vi.fn(() => []),
  getVisibleCanvases: vi.fn(),
  getVisibleCanvasVideoResources: vi.fn(() => []),
}));

/** Minimal stand-in for OpenSeadragon.Point: only what WindowPlayer uses. */
class Point {
  /** */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /** */
  plus(point) {
    return new Point(this.x + point.x, this.y + point.y);
  }

  /** */
  times(factor) {
    return new Point(this.x * factor, this.y * factor);
  }
}

/**
 * A viewer whose viewport maps world coordinates to screen pixels linearly, like
 * OpenSeadragon without rotation: screen = offset + world * pixelsPerUnit.
 * `imageBounds` is where the painted image sits in world coordinates: it can be
 * smaller than the canvas, which must not change the geometry.
 */
const createMedia = ({
  imageBounds, offset, pixelsPerUnit,
}) => ({
  current: {
    canvas: { clientHeight: 900, clientWidth: 1400 },
    container: { clientHeight: 900, clientWidth: 1400 },
    viewport: {
      getCenter: vi.fn(() => new Point(700, 450)),
      getMaxZoom: vi.fn(() => 1),
      getZoom: vi.fn(() => 1),
      viewportToViewerElementCoordinates: vi.fn((point) => new Point(
        offset.x + point.x * pixelsPerUnit,
        offset.y + point.y * pixelsPerUnit,
      )),
    },
    world: {
      getItemAt: vi.fn(() => ({ getBounds: vi.fn(() => imageBounds) })),
      getItemCount: vi.fn(() => 1),
    },
  },
});

/** WindowPlayer on a single visible canvas of the given size. */
const createPlayer = (canvas, media) => {
  getVisibleCanvases.mockReturnValue([{ __jsonld: canvas }]);
  return new WindowPlayer({}, 'window-1', media, {});
};

describe('WindowPlayer image geometry', () => {
  it('covers a portrait canvas fitted to the window height', () => {
    // 1000x1600 canvas fitted to an 838px high viewer, centered horizontally
    const player = createPlayer(
      { height: 1600, width: 1000 },
      createMedia({
        imageBounds: {
          height: 1600, width: 1000, x: 0, y: 0,
        },
        offset: { x: 400, y: 0 },
        pixelsPerUnit: 838 / 1600,
      }),
    );

    expect(player.getDisplayedMediaWidth()).toBe(524);
    expect(player.getDisplayedMediaHeight()).toBe(838);
    expect(player.getImagePosition()).toEqual({ x: 400, y: 0 });
    expect(player.getScale()).toBeCloseTo(524 / 1000, 6);
  });

  it('keeps width and height scales equal for a tall portrait canvas', () => {
    const player = createPlayer(
      { height: 2400, width: 600 },
      createMedia({
        imageBounds: {
          height: 2400, width: 600, x: 0, y: 0,
        },
        offset: { x: 557, y: 0 },
        pixelsPerUnit: 838 / 2400,
      }),
    );

    const scale = player.getScale();
    expect(player.getDisplayedMediaWidth() / 600).toBeCloseTo(scale, 2);
    expect(player.getDisplayedMediaHeight() / 2400).toBeCloseTo(scale, 2);
  });

  it('follows the canvas, not the image, when a portrait image is narrower than its canvas', () => {
    // 1000x1600 image centered on a 1400x1600 canvas: annotation targets are in canvas
    // coordinates, so the drawing area must start at the canvas origin, 200 units left of the image
    const pixelsPerUnit = 838 / 1600;
    const player = createPlayer(
      { height: 1600, width: 1400 },
      createMedia({
        imageBounds: {
          height: 1600, width: 1000, x: 200, y: 0,
        },
        offset: { x: 295, y: 0 },
        pixelsPerUnit,
      }),
    );

    expect(player.getImagePosition()).toEqual({ x: 295, y: 0 });
    expect(player.getDisplayedMediaWidth()).toBe(Math.round(1400 * pixelsPerUnit));
    expect(player.getDisplayedMediaHeight()).toBe(838);
    expect(player.getScale()).toBeCloseTo(Math.round(1400 * pixelsPerUnit) / 1400, 6);
  });

  it('follows the canvas when the image is painted on a fragment of it', () => {
    // 1000x1600 image painted at #xywh=500,200,1000,1600 on a 2000x2000 canvas
    const pixelsPerUnit = 1048 / 2000;
    const player = createPlayer(
      { height: 2000, width: 2000 },
      createMedia({
        imageBounds: {
          height: 1600, width: 1000, x: 500, y: 200,
        },
        offset: { x: 138, y: -105 },
        pixelsPerUnit,
      }),
    );

    expect(player.getImagePosition()).toEqual({ x: 138, y: -105 });
    expect(player.getDisplayedMediaWidth()).toBe(1048);
    expect(player.getDisplayedMediaHeight()).toBe(1048);
  });

  it('returns undefined geometry when no image is loaded yet', () => {
    const media = createMedia({
      imageBounds: null,
      offset: { x: 0, y: 0 },
      pixelsPerUnit: 1,
    });
    media.current.world = {
      getItemAt: vi.fn(),
      getItemCount: vi.fn(() => 0),
    };
    const player = createPlayer({ height: 1600, width: 1000 }, media);

    expect(player.getDisplayedMediaWidth()).toBeUndefined();
    expect(player.getDisplayedMediaHeight()).toBeUndefined();
    expect(player.getImagePosition()).toBeUndefined();
  });
});
