import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  addCompanionWindow,
  addCompanionWindow as addCompanionWindowAction,
  deselectAnnotation as deselectAnnotationAction,
  getCompanionWindowsForContent,
  getVisibleCanvases,
  getWindow,
  getWindowViewType,
  receiveAnnotation as receiveAnnotationAction,
  setWindowViewType as setWindowViewTypeAction,
  updateWindow as updateWindowAction,
} from 'mirador';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import CanvasListItem from '../CanvasListItem';
import AnnotationActionsContext from '../AnnotationActionsContext';
import SingleCanvasDialog from '../SingleCanvasDialog';
import translations from '../locales/locales';
import {
  scrollToSelectedAnnotation,
} from './canvasAnnotationsPluginUtils';
import { useContextParams } from '../contextParams';
import { DraftsFooter } from '../DraftActions';
import {
  acceptAllDrafts, draftsOnCanvases, getDraftMarker, isDraft, rejectAllDrafts,
} from '../draftUtils';

// TODO Attention merge M4upstream
/**
 * CanvasAnnotationsWrapper
 *
 * Re-implements "scroll to selected annotation" inside the wrapper:
 * - Observes selectedAnnotationId and scrolls the correct container so the <li> is visible.
 * - Robust container resolution (ancestor/descendant/window).
 * - Retries to survive focus/reflow resetting scrollTop.
 *
 * Props of interest:
 * - targetProps.selectedAnnotationId: the currently selected annotation id.
 * - scrollOffsetTop: px reserved for sticky header inside the scroller (default 96).
 * - scrollRetries / scrollRetryDelay / scrollBehavior: tuning for robustness.
 */
function CanvasAnnotationsWrapper({
  addCompanionWindow,
  annotationsOnCanvases = {},
  canvases = [],
  config,
  deselectAnnotation,
  highlightAllAnnotations,
  receiveAnnotation,
  switchToSingleCanvasView,
  TargetComponent,
  targetProps,
  updateWindow,
  windowViewType,
  annotationEditCompanionWindowIsOpened,
}) {
  const [singleCanvasDialogOpen, setSingleCanvasDialogOpen] = useState(false);

  const { t } = useTranslation();

  const wrapperRef = useRef(null);
  const bridgedScrollRef = useRef(null);

  useEffect(() => {
    const selId = targetProps?.selectedAnnotationId;
    if (!selId) return;

    const node = wrapperRef.current?.querySelector(`li[annotationid="${selId}"]`)
      || wrapperRef.current?.querySelector('li.MuiMenuItem-root.Mui-selected');
    if (!node) return;

    scrollToSelectedAnnotation(node, bridgedScrollRef);
  }, [
    targetProps?.selectedAnnotationId,
  ]);
  /**
   * Toggle the visibility state of the single canvas dialog.
   *
   * - Flips `singleCanvasDialogOpen` between `true` and `false`.
   * - Used as the `handleClose` callback for the dialog and to open it.
   *
   * @function
   * @returns {void}
   */
  const toggleSingleCanvasDialogOpen = useCallback(() => {
    setSingleCanvasDialogOpen((prev) => !prev);
  });

  // Add translations from config to i18n
  useEffect(() => {
    if (i18n.isInitialized && config.translations) {
      Object.keys(config.translations)
        .forEach((language) => {
          i18n.addResourceBundle(
            language,
            'translation',
            config.translations[language],
            true,
            true,
          );
        });

      if (config.language) {
        i18n.changeLanguage(config.language);
      }
    }
  }, [config.translations, config.language]);

  const { editMode: isEditMode } = useContextParams(config);

  useEffect(() => {
    if (isEditMode && !highlightAllAnnotations) {
      // make all annotations visible when edit mode is active
      updateWindow({ highlightAllAnnotations: true });
    }
  }, [isEditMode, highlightAllAnnotations, updateWindow]);

  const isAnnotationEditable = useCallback((annotationId) => {
    if (!annotationId) return false;
    return canvases.some((canvas) => {
      const anno = annotationsOnCanvases[canvas.id];
      if (!anno) return false;
      return Object.values(anno).some((value) => {
        if (value.json && value.json.items) {
          // need maeData property for edition (drafts get it when opened)
          return value.json.items.some((item) => item.id === annotationId
            && (item.maeData || isDraft(item, getDraftMarker(config))));
        }
        return false;
      });
    });
  }, [canvases, annotationsOnCanvases, config]);

  const draftMarker = getDraftMarker(config);
  const drafts = useMemo(
    () => draftsOnCanvases(canvases, annotationsOnCanvases, draftMarker),
    [canvases, annotationsOnCanvases, draftMarker],
  );

  /** Runs a bulk draft action on each visible canvas that has drafts. */
  const onEachCanvasWithDrafts = (action) => Promise.all(
    [...new Set(drafts.map((d) => d.canvasId))].map(async (canvasId) => {
      const adapter = config.annotation.adapter(canvasId);
      const own = drafts.filter((d) => d.canvasId === canvasId).map((d) => d.annotation);
      const page = await action(adapter, own);
      receiveAnnotation(canvasId, adapter.annotationPageId, page);
    }),
  ).catch((error) => console.error('Draft action failed', error));

  const wasCloseCompanionWindowRef = useRef(annotationEditCompanionWindowIsOpened);
  useEffect(() => {
    const wasOpen = !wasCloseCompanionWindowRef.current;
    const isClosed = annotationEditCompanionWindowIsOpened;
    wasCloseCompanionWindowRef.current = annotationEditCompanionWindowIsOpened;

    // deselect anno when companion window closes (save or close btn)
    if (isEditMode && wasOpen && isClosed) {
      deselectAnnotation();
    }
  }, [isEditMode, annotationEditCompanionWindowIsOpened, deselectAnnotation]);

  const prevSelectedIdRef = useRef(null);
  useEffect(() => {
    if (!isEditMode) return;
    // auto-open companion window when annotation is selected
    const selId = targetProps?.selectedAnnotationId;

    if (selId === prevSelectedIdRef.current) return;
    prevSelectedIdRef.current = selId;

    if (!selId) return;
    if (!annotationEditCompanionWindowIsOpened) return; // companion window already open
    if (!isAnnotationEditable(selId)) return;

    addCompanionWindow('annotationCreation', {
      annotationid: selId,
      position: 'right',
    });
  }, [isEditMode, targetProps?.selectedAnnotationId, annotationEditCompanionWindowIsOpened,
    isAnnotationEditable, addCompanionWindow]);

  const props = {
    containerRef: bridgedScrollRef,
    ...targetProps,
    listContainerComponent: CanvasListItem,
  };

  const contextValue = useMemo(() => ({
    addCompanionWindow,
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config,
    receiveAnnotation,
    storageAdapter: config.annotation.adapter,
    t,
    toggleSingleCanvasDialogOpen,
    windowId: targetProps.windowId,
    windowViewType,
  }), [
    addCompanionWindow,
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config,
    receiveAnnotation,
    t,
    toggleSingleCanvasDialogOpen,
    targetProps.windowId,
    windowViewType,
  ]);
  return (
    <AnnotationActionsContext.Provider value={contextValue}>
      <div ref={wrapperRef} style={{ height: '100%', position: 'relative' }}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <TargetComponent {...props} />
      </div>
      {config.annotation?.readonly !== true && (
        <DraftsFooter
          count={drafts.length}
          onAcceptAll={() => onEachCanvasWithDrafts(
            (adapter, own) => acceptAllDrafts(adapter, own, draftMarker),
          )}
          onRejectAll={() => onEachCanvasWithDrafts(
            (adapter, own) => rejectAllDrafts(adapter, own),
          )}
        />
      )}

      {windowViewType !== 'single' && (
        <SingleCanvasDialog
          handleClose={toggleSingleCanvasDialogOpen}
          open={singleCanvasDialogOpen}
          switchToSingleCanvasView={switchToSingleCanvasView}
        />
      )}
    </AnnotationActionsContext.Provider>
  );
}

CanvasAnnotationsWrapper.propTypes = {
  addCompanionWindow: PropTypes.func.isRequired,
  annotationEditCompanionWindowIsOpened: PropTypes.bool.isRequired,
  annotationsOnCanvases: PropTypes.shape({
    id: PropTypes.string,
    isFetching: PropTypes.bool,
    json: PropTypes.shape({
      id: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          body: PropTypes.shape({
            format: PropTypes.string,
            id: PropTypes.string,
            value: PropTypes.string,
          }),
          drawingState: PropTypes.string,
          id: PropTypes.string,
          manifestNetwork: PropTypes.string,
          motivation: PropTypes.string,
          target: PropTypes.string,
          type: PropTypes.string,
        }),
      ),
      type: PropTypes.string,
    }),
  }).isRequired,
  canvases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      index: PropTypes.number,
    }),
  ).isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
      editMode: PropTypes.bool,
    }),
    language: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    translations: PropTypes.objectOf(PropTypes.object),
  }).isRequired,
  deselectAnnotation: PropTypes.func.isRequired,
  highlightAllAnnotations: PropTypes.bool.isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  switchToSingleCanvasView: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  TargetComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  targetProps: PropTypes.object.isRequired,
  updateWindow: PropTypes.func.isRequired,
  windowViewType: PropTypes.string.isRequired,
};

/** mapStateToProps / mapDispatchToProps unchanged from your version */
function mapStateToProps(state, { targetProps: { windowId } }) {
  const canvases = getVisibleCanvases(state, { windowId });
  const annotationsOnCanvases = {};
  const creation = getCompanionWindowsForContent(state, { content: 'annotationCreation', windowId });
  const annotationEditCompanionWindowIsOpened = Object.keys(creation).length === 0;

  canvases.forEach((canvas) => {
    const anno = state.annotations[canvas.id];
    if (anno) {
      annotationsOnCanvases[canvas.id] = anno;
    }
  });

  // TODO Before merging we were injecting translation inside config.
  //  Perhaps a regression to remove it
  return {
    annotationEditCompanionWindowIsOpened,
    annotationsOnCanvases,
    canvases,
    config: {
      ...state.config,
      translations,
    },
    highlightAllAnnotations: getWindow(state, { windowId }).highlightAllAnnotations,
    windowViewType: getWindowViewType(state, { windowId }),
  };
}
/**
 * Map Redux dispatch actions to props for the CanvasAnnotationsWrapper.
 *
 * Provides callback props that allow the wrapped component to interact
 * with the Mirador Redux store, including:
 *
 * - `addCompanionWindow`: Open a companion window for the given window ID,
 *   with specified content and optional extra props.
 * - `receiveAnnotation`: Add or update an annotation in the Redux store
 *   for a specific target.
 * - `switchToSingleCanvasView`: Change the current window's view type
 *   to `"single"`.
 *
 * @function
 * @param {Function} dispatch - Redux dispatch function.
 * @param {object} props - The wrapper component props.
 * @param {object} props.targetProps - Props passed down to the wrapped target component.
 * @param {string} props.targetProps.windowId - The ID of the Mirador window.
 * @returns {object} An object mapping action dispatchers to props.
 * @property {function(string, object):void} addCompanionWindow
 * @property {function(string, string, object):void} receiveAnnotation
 * @property {function():void} switchToSingleCanvasView
 */
const mapDispatchToProps = (dispatch, props) => ({
  addCompanionWindow: (content, additionalProps) => dispatch(addCompanionWindow(
    props.targetProps.windowId,
    { content, ...additionalProps },
  )),
  deselectAnnotation: () => dispatch(
    deselectAnnotationAction(props.targetProps.windowId),
  ),
  receiveAnnotation: (targetId, id, annotation) => dispatch(
    receiveAnnotationAction(targetId, id, annotation),
  ),
  switchToSingleCanvasView: () => dispatch(
    setWindowViewTypeAction(props.targetProps.windowId, 'single'),
  ),
  updateWindow: (payload) => dispatch(
    updateWindowAction(props.targetProps.windowId, payload),
  ),
});
const canvasAnnotationsPlugin = {
  component: CanvasAnnotationsWrapper,
  mapDispatchToProps,
  mapStateToProps,
  mode: 'wrap',
  target: 'CanvasAnnotations',
};
export default canvasAnnotationsPlugin;
