import React, {
  forwardRef, useContext, useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import ToggleButton from '@mui/material/ToggleButton';
import SettingsIcon from '@mui/icons-material/Settings';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import flatten from 'lodash/flatten';
import { Tooltip } from '@mui/material';
import { withTranslation } from 'react-i18next';
import InfoIcon from '@mui/icons-material/Info';
import AnnotationActionsContext from './AnnotationActionsContext';
import WhoAndWhenFormSection, { TOOLTIP_MODE } from './annotationForm/WhoAndWhenFormSection';

// TODO missing TRAD
const CanvasListItem = forwardRef((props, ref) => {
  const [isHovering, setIsHovering] = useState(false);
  const context = useContext(AnnotationActionsContext);

  const annotationData = useMemo(() => {
    const { annotationid } = props;
    const {
      canvases,
      annotationsOnCanvases,
    } = context;
    let annotation;
    canvases.some((canvas) => {
      if (annotationsOnCanvases[canvas.id]) {
        Object.entries(annotationsOnCanvases[canvas.id])
          .forEach(([key, value]) => {
            if (value.json && value.json.items) {
              annotation = value.json.items.find((anno) => anno.id === annotationid);
              if (annotation) {
                return annotation;
              }
            }
          });
      }
      return (annotation);
    });
    return annotation;
  }, [props.annotationid]);

  /**
   * Handle deletion of annotation.
   * @function
   * @name handleDelete
   * @returns {void}
   */
  const handleDelete = () => {
    const {
      canvases,
      receiveAnnotation,
      storageAdapter,
    } = context;
    const { annotationid } = props;
    canvases.forEach((canvas) => {
      const adapter = storageAdapter(canvas.id);
      adapter.delete(annotationid)
        .then((annoPage) => {
          receiveAnnotation(canvas.id, adapter.annotationPageId, annoPage);
        });
    });
  };
  /**
   * Handles editing of an annotation.
   * @function handleEdit
   * @returns {void}
   */
  const handleEdit = () => {
    const {
      addCompanionWindow,
    } = context;
    const { annotationid } = props;

    addCompanionWindow('annotationCreation', {
      annotationid,
      position: 'right',
    });
  };
  /**
   * Checks if a given annotation ID is editable.
   * @returns {boolean} Returns true if the annotation ID is editable, false otherwise.
   */
  const editable = () => {
    const {
      annotationsOnCanvases,
      canvases,
    } = context;
    const { annotationid } = props;
    const annoIds = canvases.map((canvas) => {
      if (annotationsOnCanvases[canvas.id]) {
        return flatten(Object.entries(annotationsOnCanvases[canvas.id])
          .map(([key, value]) => {
            if (value.json && value.json.items) {
              return value.json.items.filter((item) => item.maeData)
                .map((item) => item.id);
            }
            return [];
          }));
      }
      return [];
    });
    return flatten(annoIds)
      .includes(annotationid);
  };

  // eslint-disable-next-line react/prop-types
  const { t, tReady, ...filteredProps } = props;

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="mirador-annotation-list-item"
      data-testid="mirador-annotation-list-item"
      ref={ref}
    >
      {(isHovering && editable()) && (
        <div>
          <ToggleButtonGroup
            aria-label="annotation tools"
            size="small"
            style={{
              backgroundColor: 'white',
              position: 'absolute',
              right: 0,
              zIndex: 10000,
            }}
          >
            {
              context.config?.debug && (
                <Tooltip title={t('debugAnnotation')}>
                  <ToggleButton
                    aria-label="Debug"
                    onClick={() => console.log(annotationData)} // TODO Open IIIIF debug window
                    value="Debug in console"
                    visible={context.config.debug}
                  >
                    <SettingsIcon />
                  </ToggleButton>
                </Tooltip>
              )
            }
            <Tooltip title={(
              <WhoAndWhenFormSection
                creator={annotationData.creator}
                creationDate={annotationData.creationDate}
                lastEditor={annotationData.lastEditor}
                lastSavedDate={annotationData.lastSavedDate}
                displayMode={TOOLTIP_MODE}
              />
            )}
            >
              <ToggleButton
                aria-label="Metadata"
                value="metadata"
                visible={annotationData?.creator}
              >
                <InfoIcon />
              </ToggleButton>
            </Tooltip>
            <Tooltip title={t('edit_annotation')}>
              <ToggleButton
                aria-label="Edit"
                onClick={context.windowViewType === 'single' ? handleEdit : context.toggleSingleCanvasDialogOpen}
                value="edit"
                disabled={!context.annotationEditCompanionWindowIsOpened}
              >
                <EditIcon />
              </ToggleButton>
            </Tooltip>
            <Tooltip title={t('deleteAnnotation')}>
              <ToggleButton
                aria-label="Delete"
                onClick={handleDelete}
                value="delete"
                disabled={!context.annotationEditCompanionWindowIsOpened}
              >
                <DeleteIcon />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </div>
      )}
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <li {...filteredProps}>
        {props.children}
      </li>
    </div>
  );
});

CanvasListItem.propTypes = {
  annotationid: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
  ]).isRequired,
};

export default withTranslation()(CanvasListItem);
