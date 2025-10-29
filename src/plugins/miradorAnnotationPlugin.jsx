import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AddBoxIcon from '@mui/icons-material/AddBox';
import GetAppIcon from '@mui/icons-material/GetApp';
import {
  getWindowViewType,
  MiradorMenuButton,
  getVisibleCanvases,
  addCompanionWindow as addCompanionWindowAction,
  setWindowViewType as setWindowViewTypeAction,
  getCompanionWindowsForContent,
} from 'mirador';
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import SingleCanvasDialog from '../SingleCanvasDialog';
import AnnotationExportDialog from '../AnnotationExportDialog';
import LocalStorageAdapter from '../annotationAdapter/LocalStorageAdapter';
import translations from '../locales/locales';

const StyledDiv = styled('div')(() => ({
  display: 'flex',
}));

/** Mirador annotation plugin component. Get all the stuff
 * and info to manage annotation functionnality */
function MiradorAnnotation(
  {
    targetProps,
    TargetComponent,
    annotationEditCompanionWindowIsOpened,
  },
) {
  const { t } = useTranslation();

  const [annotationExportDialogOpen, setAnnotationExportDialogOpen] = useState(false);
  const [singleCanvasDialogOpen, setSingleCanvasDialogOpen] = useState(false);
  const [currentCompanionWindowId, setCurrentCompanionWindowId] = useState(null);

  const dispatch = useDispatch();

  /** Open the companion window for annotation */
  const addCompanionWindow = (content, additionalProps) => {
    setCurrentCompanionWindowId(targetProps.windowId);
    dispatch(addCompanionWindowAction(targetProps.windowId, { content, ...additionalProps }));
  };

  useEffect(() => {
  }, [annotationEditCompanionWindowIsOpened]);
  /** */
  const switchToSingleCanvasView = () => {
    dispatch(setWindowViewTypeAction(targetProps.windowId, 'single'));
  };

  const windowViewType = useSelector(
    (state) => getWindowViewType(state, { windowId: targetProps.windowId }),
  );
  const canvases = useSelector(
    (state) => getVisibleCanvases(state, { windowId: targetProps.windowId }),
  );
  const config = useSelector((state) => state.config);

  const openCreateAnnotationCompanionWindow = useCallback((e) => {
    addCompanionWindow('annotationCreation', {
      position: 'right',
    });
  }, [targetProps.windowId]);

  const toggleSingleCanvasDialogOpen = useCallback(() => {
    setSingleCanvasDialogOpen(!singleCanvasDialogOpen);
  }, [singleCanvasDialogOpen]);

  const toggleCanvasExportDialog = useCallback((e) => {
    setAnnotationExportDialogOpen(!annotationExportDialogOpen);
  }, [annotationExportDialogOpen]);

  const storageAdapter = config?.annotation?.adapter && config.annotation.adapter('poke');
  const offerExportDialog = config.annotation && storageAdapter instanceof LocalStorageAdapter
    && config.annotation.exportLocalStorageAnnotations;

  return (
    <StyledDiv>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TargetComponent {...targetProps} />
      {
        config?.annotation?.readonly === true ? null : (
          <Tooltip title={t('create_annotation')}>
            <span>
              <MiradorMenuButton
                aria-label={t('create_annotation')}
                onClick={
                  windowViewType === 'single'
                    ? openCreateAnnotationCompanionWindow
                    : toggleSingleCanvasDialogOpen
                }
                size="small"
                disabled={!annotationEditCompanionWindowIsOpened}
              >
                <AddBoxIcon />
              </MiradorMenuButton>
            </span>
          </Tooltip>
        )
      }
      {singleCanvasDialogOpen && (
        <SingleCanvasDialog
          open={singleCanvasDialogOpen}
          handleClose={toggleSingleCanvasDialogOpen}
          switchToSingleCanvasView={switchToSingleCanvasView}
          t={t}
        />
      )}
      {offerExportDialog && (
        <Tooltip title={t('export_local_annotation')}>
          <div>
            <MiradorMenuButton
              aria-label="Export local annotations for visible items"
              onClick={toggleCanvasExportDialog}
              size="small"
            >
              <GetAppIcon />
            </MiradorMenuButton>
          </div>
        </Tooltip>
      )}
      {offerExportDialog && (
        <AnnotationExportDialog
          canvases={canvases}
          config={config}
          handleClose={toggleCanvasExportDialog}
          open={annotationExportDialogOpen}
        />
      )}
    </StyledDiv>
  );
}

MiradorAnnotation.propTypes = {
  annotationEditCompanionWindowIsOpened: PropTypes.bool.isRequired,
  canvases: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      index: PropTypes.number,
    }),
  ).isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func,
      exportLocalStorageAnnotations: PropTypes.bool,
      readonly: PropTypes.bool,
    }),
  }).isRequired,
  t: PropTypes.func.isRequired,
  TargetComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  targetProps: PropTypes.object.isRequired,
  windowViewType: PropTypes.string.isRequired,
};

// TODO use selector in main componenent
/**
 * this function map the state to the annotationPlugin's props
 * */
function mapStateToProps(state, { targetProps: { windowId } }) {
  // Annotation edit companion window ou annotation creation companion window is the same thing
  const annotationCreationCompanionWindows = getCompanionWindowsForContent(state, { content: 'annotationCreation', windowId });
  let annotationEditCompanionWindowIsOpened = true;
  if (Object.keys(annotationCreationCompanionWindows).length !== 0) {
    annotationEditCompanionWindowIsOpened = false;
  }
  return {
    annotationEditCompanionWindowIsOpened,
    canvases: getVisibleCanvases(state, { windowId }),
    config: state.config,
    windowViewType: getWindowViewType(state, { windowId }),
  };
}

const miradorAnnotationPlugin = {
  component: MiradorAnnotation,
  config: {
    translations,
  },
  mapStateToProps,
  mode: 'wrap',
  target: 'AnnotationSettings',
};

export default miradorAnnotationPlugin;
