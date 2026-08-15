import { WindowPlayer } from '../src/playerReferences';

vi.mock('mirador', () => ({
  getVisibleCanvasAudioResources: vi.fn(() => []),
  getVisibleCanvases: vi.fn(() => [{
    __jsonld: {
      height: 5000,
      width: 4089,
    },
  }]),
  getVisibleCanvasVideoResources: vi.fn(() => []),
}));

/**
 * Create a mocked OpenSeadragon viewer object.
 * @param topLeft
 * @param bottomRight
 * @returns {object}
 */
const createViewer = ({
  topLeft = { x: 200.2, y: 80.4 },
  bottomRight = { x: 1143.6, y: 1233.1 },
} = {}) => {
  const bounds = {
    getBottomRight: vi.fn(() => ({ x: 1, y: 1 })),
    getTopLeft: vi.fn(() => ({ x: 0, y: 0 })),
  };

  return {
    container: { clientHeight: 1180, clientWidth: 1749 },
    viewport: {
      getMaxZoom: vi.fn(() => 1),
      getZoom: vi.fn(() => 0.11),
      viewportToViewerElementCoordinates: vi.fn((point) => (
        point.x === 1 && point.y === 1 ? bottomRight : topLeft
      )),
    },
    world: {
      getItemAt: vi.fn(() => ({ getBounds: vi.fn(() => bounds) })),
      getItemCount: vi.fn(() => 1),
    },
  };
};

describe('WindowPlayer image geometry', () => {
  let media;

  beforeEach(() => {
    media = {
      current: {
        canvas: { clientHeight: 1180, clientWidth: 1749 },
        container: { clientHeight: 1180, clientWidth: 1749 },
      },
    };
  });

  it('uses OSD image bounds for displayed size and position', () => {
    media.current = {
      ...media.current,
      ...createViewer(),
    };
    const player = new WindowPlayer({}, 'window-1', media, {});

    expect(player.getDisplayedMediaWidth()).toBe(943);
    expect(player.getDisplayedMediaHeight()).toBe(1153);
    expect(player.getImagePosition()).toEqual({ x: 200, y: 80 });
    expect(player.getScale()).toBeCloseTo(943 / 4089, 6);
  });

  it('returns undefined geometry when no tiled image is available', () => {
    media.current = {
      ...media.current,
      ...createViewer(),
      world: {
        getItemAt: vi.fn(),
        getItemCount: vi.fn(() => 0),
      },
    };
    const player = new WindowPlayer({}, 'window-1', media, {});

    expect(player.getDisplayedMediaWidth()).toBeUndefined();
    expect(player.getDisplayedMediaHeight()).toBeUndefined();
    expect(player.getImagePosition()).toBeUndefined();
  });
});
