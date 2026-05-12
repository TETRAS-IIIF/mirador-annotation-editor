import React, {
  useCallback, useEffect, useReducer, useRef, useState,
} from 'react';
import { ConnectedCompanionWindow } from 'mirador';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { convertAnnotationStateToBeSaved } from '../IIIFUtils';
import AnnotationFormTemplateSelector from './AnnotationFormTemplateSelector';
import {
  getTemplateType, saveAnnotationInStorageAdapter, TEMPLATE, DEFAULT_FORM_MAP,
} from './AnnotationFormUtils';
import { getContextParams } from '../contextParams';
import AnnotationFormHeader from './AnnotationFormHeader';
import AnnotationFormBody from './AnnotationFormBody';
import '../custom.css';
import UnsupportedMedia from './UnsupportedMedia';

/**
 * Component for submitting a form to create or edit an annotation.
 * */
function AnnotationForm(
  {
    annotation,
    canvases,
    closeCompanionWindow,
    config,
    id,
    playerReferences,
    receiveAnnotation,
    windowId,
  },
) {
  const { t } = useTranslation();
  const [templateType, setTemplateType] = useState(null);
  // eslint-disable-next-line no-underscore-dangle
  const [mediaType, setMediaType] = useState(playerReferences.getMediaType());

  // TDOO perhaps useless
  const [retryCount, setRetryCount] = useState(0);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  if (!playerReferences.isInitializedCorrectly() && retryCount < 10) {
    console.log('AnnotationForm.js: retryCount', retryCount);
    setTimeout(() => {
      setRetryCount(retryCount + 1);
      forceUpdate();
    }, 100);
  }

  // Add a state to trigger redraw
  const [windowSize, setWindowSize] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  if (!templateType) {
    if (annotation.id) {
      if (annotation.maeData && annotation.maeData.templateType) {
        // Annotation has been created with MAE
        setTemplateType(getTemplateType(t, annotation.maeData.templateType));
      } else {
        // Annotation has been created with other IIIF annotation editor
        setTemplateType(getTemplateType(t, TEMPLATE.IIIF_TYPE));
      }
    } else {
      // Use defaultForm if configured, otherwise show selector
      const { defaultForm } = getContextParams(config);
      if (defaultForm && DEFAULT_FORM_MAP[defaultForm]) {
        setTemplateType(getTemplateType(t, DEFAULT_FORM_MAP[defaultForm]));
      }
    }
  }

  useEffect(() => {
    setTemplateType(null);
    setMediaType(playerReferences.getMediaType());
    // eslint-disable-next-line react/prop-types
  }, [canvases[0].index]);

  // Listen to window resize event
  useEffect(() => {
    /**
     * Updates the state with the current window size when the window is resized.
     * @function handleResize
     * @returns {void}
     */
    const handleResize = () => {
      setWindowSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!playerReferences.isInitCorrectly) {
    playerReferences.isInitializedCorrectly();
  }
  if (!playerReferences.isInitCorrectly) {
    return (
      <UnsupportedMedia id={id} mediaType={mediaType} windowId={windowId} />
    );
  }

  /**
   * Closes the companion window with the specified ID and position.
   *
   * @returns {void}
   */
  const closeFormCompanionWindow = useCallback(() => {
    closeCompanionWindow('annotationCreation', {
      id,
      position: 'right',
    });
  }, [closeCompanionWindow, id]);

  const annotationRef = useRef(annotation);
  annotationRef.current = annotation;

  // useEffect(() => {
  //   /** Action when all annotation shapes have been deleted */
  //   const handleAnnotationEmpty = () => {
  //     const anno = annotationRef.current;
  //
  //     if (anno?.id) {
  //       // Existing annotation: delete from storage
  //       canvases.forEach((canvas) => {
  //         const storageAdapter = config.annotation.adapter(canvas.id);
  //         storageAdapter.delete(anno.id).then((annoPage) => {
  //           receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage);
  //         });
  //       });
  //     }
  //
  //     closeFormCompanionWindow();
  //   };
  //
  //   // Listen for MAE_ANNOTATION_EMPTY_EVENT
  //   document.addEventListener(MAE_ANNOTATION_EMPTY_EVENT, handleAnnotationEmpty);
  //   return () => document.removeEventListener(MAE_ANNOTATION_EMPTY_EVENT, handleAnnotationEmpty);
  // }, [canvases, config, receiveAnnotation, closeFormCompanionWindow]);

  /**
   * Save the annotation
   * @param {Object} annotationState - The annotation state to save
   * @returns {Promise} Promise that resolves when all annotations are saved
   */
  const saveAnnotation = (annotationState) => {
    const annotationProps = annotationState;

    const promises = playerReferences.getCanvases()
      .map(async (canvas) => {
        let annotationStateToBeSaved;
        if (annotationProps?.maeData && annotationProps.maeData.templateType) {
          annotationStateToBeSaved = await convertAnnotationStateToBeSaved(
            annotationProps,
            canvas,
            windowId,
            playerReferences,
          );
        } else {
          annotationStateToBeSaved = annotationProps;
        }
        const storageAdapter = config.annotation.adapter(canvas.id);
        return saveAnnotationInStorageAdapter(
          canvas.id,
          storageAdapter,
          receiveAnnotation,
          annotationStateToBeSaved,
        );
      });

    return Promise.all(promises)
      .then(() => {
        closeFormCompanionWindow();
      });
  };
  return (
    <ConnectedCompanionWindow
      title={annotation.id ? t('edit_annotation') : t('new_annotation')}
      windowId={windowId}
      id={id}
    >
      {templateType === null
        ? (
          <AnnotationFormTemplateSelector
            setCommentingType={setTemplateType}
            mediaType={mediaType}
          />
        )
        : (
          <Grid container direction="column" spacing={1}>
            <Grid container>
              <AnnotationFormHeader
                setCommentingType={setTemplateType}
                templateType={templateType}
                annotation={annotation}
              />
            </Grid>
            <Grid>
              <AnnotationFormBody
                annotation={annotation}
                canvases={canvases}
                closeFormCompanionWindow={closeFormCompanionWindow}
                playerReferences={playerReferences}
                saveAnnotation={saveAnnotation}
                templateType={templateType}
                windowId={windowId}
              />
            </Grid>
          </Grid>
        )}
    </ConnectedCompanionWindow>
  );
}

AnnotationForm.propTypes = {
  annotation: PropTypes.oneOfType([
    PropTypes.shape({
      body: PropTypes.shape({
        format: PropTypes.string,
        id: PropTypes.string,
        type: PropTypes.string,
        value: PropTypes.string,
      }),
      drawingState: PropTypes.string,
      id: PropTypes.string,
      manifestNetwork: PropTypes.string,
      motivation: PropTypes.string,
      target: PropTypes.string,
    }),
    PropTypes.string,
  ]).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string }),
  ).isRequired,
  closeCompanionWindow: PropTypes.func.isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
      debug: PropTypes.bool,
      defaults: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string]),
      ),
    }),
    language: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    translations: PropTypes.objectOf(PropTypes.object),
  }).isRequired,
  id: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};

export default AnnotationForm;
