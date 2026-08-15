import {
  getVisibleCanvases,
  getVisibleCanvasAudioResources,
  getVisibleCanvasVideoResources,
} from 'mirador';
import { MEDIA_TYPES } from './annotationForm/AnnotationFormUtils';

/** */
export class WindowPlayer {
  actions;

  mediaType;

  canvases;

  windowId;

  overlay;

  isInitCorrectly;

  /**
   * Constructor
   * @param state
   * @param windowId
   * @param media
   * @param miradorActions
   */
  constructor(state, windowId, media, miradorActions) {
    /** ***********************************************************
     * Init stuff
     *********************************************************** */
    this.actions = miradorActions;
    this.media = media;
    this.mediaType = checkMediaType(state, windowId);
    // Get Visible Canvases return an array but inside the array there is only one element
    this.canvases = getVisibleCanvases(state, { windowId });
    this.windowId = windowId;
    this.isInitCorrectly = false;

    if (this.isInitializedCorrectly()) {
      switch (this.mediaType) {
        case MEDIA_TYPES.IMAGE:
          this.overlay = {
            canvasHeight: this.media.current.canvas.clientHeight,
            canvasWidth: this.media.current.canvas.clientWidth,
            containerHeight: this.media.current.canvas.clientHeight,
            containerWidth: this.media.current.canvas.clientWidth,
          };
          break;
        default:
          console.error('Unknown media type');
          break;
      }
    }
  }

  /**
   * Pauses execution for a specified amount of time.
   *
   * @param {number} ms - The number of milliseconds to sleep.
   * @returns {Promise<void>} A promise that resolves after the specified duration.
   */
  // eslint-disable-next-line class-methods-use-this,require-jsdoc
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Get player initialisation status
   * // TODO in MAEV env add this.media.canvasOverlay check
   * @returns {*|boolean}
   */
  isInitializedCorrectly() {
    this.isInitCorrectly = this.media
      && ((this.mediaType === MEDIA_TYPES.IMAGE && this.media.current && this.media.current.canvas)
        || (this.mediaType === MEDIA_TYPES.VIDEO && this.media.video))
      && (this.mediaType !== MEDIA_TYPES.UNKNOWN && this.mediaType !== MEDIA_TYPES.AUDIO);

    return this.isInitCorrectly;
  }

  /** ***********************************************************
   * Global stuff
   *********************************************************** */

  /**
   * Return MEDIA_TYPE (so fat Image, Video, Audio
   * @returns {*}
   */
  getMediaType() {
    return this.mediaType;
  }

  /** *******************
   * Get all canvases
   * @returns {*}
   */
  getCanvases() {
    return this.canvases;
  }

  /** *****************
   * Get audioElement linked
   * @returns {HTMLAudioElement}
   */
  getAudioElement() {
    if (this.mediaType === MEDIA_TYPES.AUDIO) {
      return document.querySelector('audio');
    }
    console.error('Something is wrong with audio ressource');
    return null;
  }

  /**
   * Get windowId
   * @returns {*}
   */
  getWindowId() {
    return this.windowId;
  }

  /** ***********************************************************
   * Spatial stuff
   *********************************************************** */
  /**
   * Get IIIF Canvas Height
   * @returns {*}
   */
  getCanvasHeight() {
    return this.overlay.canvasHeight;
  }

  /**
   * Get IIIF Canvas Width
   * @returns {*}
   */
  getCanvasWidth() {
    return this.overlay.canvasWidth;
  }

  /**
   * Get container aka the player
   * @returns {HTMLElement|*|null}
   */
  getContainer() {
    if (this.mediaType === MEDIA_TYPES.IMAGE) {
      return this.media.current.container;
    }
    return null;
  }

  /**
   * Get container height aka player height
   * @returns {*}
   */
  getContainerHeight() {
    return this.overlay.containerHeight;
  }

  /**
   * Get container width aka player width
   * @returns {*}
   */
  getContainerWidth() {
    return this.overlay.containerWidth;
  }

  /**
   * Get displayed height of the media. It include zoom and scale stuff
   *
   * NOTE: uses OpenSeadragon's TiledImage#getSizeInWindowCoordinates(), which converts the
   * image's true pixel dimensions to on-screen container pixels while correctly accounting
   * for zoom/pan/rotation. A previous hand-rolled formula (`containerWidth * trueHeight * zoom`)
   * multiplied in the true pixel dimension an extra, spurious time, producing wildly wrong
   * sizes for images whose true pixel dimensions differ a lot from the container size
   * (see issue #267).
   * @returns {undefined|*|number}
   */
  getDisplayedMediaHeight() {
    if (this.mediaType === MEDIA_TYPES.IMAGE) {
      const viewer = this.media.current;
      if (viewer && viewer.world.getItemCount() > 0) {
        const tiledImage = viewer.world.getItemAt(0);
        return Math.round(tiledImage.getSizeInWindowCoordinates().y);
      }
    }
    return undefined;
  }

  /**
   * Get displayed width of the media. It include zoom and scale stuff
   * @returns {undefined|*|number}
   */
  getDisplayedMediaWidth() {
    if (this.mediaType === MEDIA_TYPES.IMAGE) {
      const viewer = this.media.current;
      if (viewer && viewer.world.getItemCount() > 0) {
        const tiledImage = viewer.world.getItemAt(0);
        return Math.round(tiledImage.getSizeInWindowCoordinates().x);
      }
    }
    return undefined;
  }

  /**
   * Get media height as described in manifest
   * @returns {undefined|*}
   */
  getMediaTrueHeight() {
    if (this.mediaType === MEDIA_TYPES.IMAGE) {
      // eslint-disable-next-line no-underscore-dangle
      return this.canvases[0].__jsonld.height;
    }
    console.error('Unknown media type');
    return undefined;
  }

  /**
   * Get true width of the media
   * @returns {undefined|*}
   */
  getMediaTrueWidth() {
    if (this.mediaType === MEDIA_TYPES.IMAGE) {
      // eslint-disable-next-line no-underscore-dangle
      return this.canvases[0].__jsonld.width;
    }
    return undefined;
  }

  /**
   * Get scale between true size of media and size displayed
   * @returns {number}
   */
  getScale() {
    if (this.isInitializedCorrectly()) {
      return this.getDisplayedMediaWidth() / this.getMediaTrueWidth();
    }

    return null;
  }

  /**
   * Some players allow zoom/unzoom
   * @returns {undefined|number}
   */
  getZoom() {
    if (this.mediaType === MEDIA_TYPES.IMAGE) {
      const currentZoom = this.media.current.viewport.getZoom();
      const maxZoom = this.media.current.viewport.getMaxZoom();
      let zoom = currentZoom / maxZoom;
      zoom = Math.round(zoom * 100) / 100;
      return zoom;
    }
    return undefined;
  }

  /**
   * Some players allow to move on the image
   * @returns {undefined|{x: number, y: number}}
   */
  getImagePosition() {
    if (this.mediaType === MEDIA_TYPES.IMAGE) {
      const viewer = this.media.current;
      if (viewer) {
        // Assuming one image in OpenSeadragon for now
        const tiledImage = viewer.world.getItemAt(0);
        // Get the bounds of the image in viewport coordinates
        const bounds = tiledImage.getBounds();
        // Convert the top-left corner of the bounds to pixel coordinates
        const topLeft = viewer.viewport.viewportToViewerElementCoordinates(bounds.getTopLeft());
        // Round the coordinates for consistency
        const position = {
          x: Math.round(topLeft.x),
          y: Math.round(topLeft.y),
        };
        return position;
      }
    }
    return undefined;
  }

  /**
   * Get reasonable stroke width for target sha
   * @returns {number}
   */
  getTargetStrokeWidth() {
    return Math.max(this.getDisplayedMediaWidth() / 500, 3);
    // TODO DAxid
  }
}

/** ***********************
 * Get media type of visible canvas
 * @param state
 * @param windowId
 */
export function checkMediaType(state, windowId) {
  const audioResources = getVisibleCanvasAudioResources(state, { windowId }) || [];
  const videoResources = getVisibleCanvasVideoResources(state, { windowId }) || [];

  if (videoResources.length > 0) {
    return MEDIA_TYPES.VIDEO;
  }
  if (audioResources.length > 0) {
    return MEDIA_TYPES.AUDIO;
  }

  return MEDIA_TYPES.IMAGE;
}
