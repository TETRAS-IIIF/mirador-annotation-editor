import { WindowPlayer } from '../src/playerReferences';

vi.mock('mirador', () => ({
  getVisibleCanvasAudioResources: vi.fn().mockReturnValue([]),
  getVisibleCanvases: vi.fn().mockReturnValue([{
    __jsonld: { height: 6000, width: 8000 },
  }]),
  getVisibleCanvasVideoResources: vi.fn().mockReturnValue([]),
}));

/**
 * Build a fake OpenSeadragon viewer whose TiledImage reports a displayed
 * size unrelated to the image's true pixel dimensions or a naive
 * `containerWidth * zoom` guess, so any regression to the old hand-rolled
 * formula (which multiplied in the true pixel size an extra time) would be
 * caught by asserting the exact mocked value is returned untouched.
 */
function createViewer({ displayedWidth = 300, displayedHeight = 225 } = {}) {
  const tiledImage = {
    getSizeInWindowCoordinates: vi.fn().mockReturnValue({
      x: displayedWidth,
      y: displayedHeight,
    }),
  };
  return {
    canvas: { clientHeight: 900, clientWidth: 1200 },
    container: { clientWidth: 1200 },
    // intentionally wrong/misleading, to prove they are no longer consulted
    viewport: { getZoom: vi.fn().mockReturnValue(0.15) },
    world: {
      getItemAt: vi.fn().mockReturnValue(tiledImage),
      getItemCount: vi.fn().mockReturnValue(1),
    },
  };
}

describe('WindowPlayer displayed media size', () => {
  it('derives displayed width/height from OpenSeadragon TiledImage#getSizeInWindowCoordinates, not from true-pixel-size * zoom', () => {
    const viewer = createViewer({ displayedHeight: 225, displayedWidth: 300 });
    const player = new WindowPlayer({}, 'window-1', { current: viewer }, {});

    expect(player.getDisplayedMediaWidth()).toBe(300);
    expect(player.getDisplayedMediaHeight()).toBe(225);
    // the old buggy formula was `containerWidth * trueWidth * zoom` = 1200 * 8000 * 0.15
    expect(player.getDisplayedMediaWidth()).not.toBe(Math.round(1200 * 8000 * 0.15));
  });

  it('a small image (true size close to container size) still reflects the viewer-reported size exactly', () => {
    const viewer = createViewer({ displayedHeight: 400, displayedWidth: 400 });
    const player = new WindowPlayer({}, 'window-1', { current: viewer }, {});

    expect(player.getDisplayedMediaWidth()).toBe(400);
    expect(player.getDisplayedMediaHeight()).toBe(400);
  });
});
