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
import { useTheme } from '@mui/material/styles';
import { useTranslation, withTranslation } from 'react-i18next';
import InfoIcon from '@mui/icons-material/Info';
import AnnotationActionsContext from './AnnotationActionsContext';
import WhoAndWhenFormSection, { TOOLTIP_MODE } from './annotationForm/WhoAndWhenFormSection';

// TODO missing TRAD
const CanvasListItem = forwardRef((props, ref) => {
  const theme = useTheme();
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
    // include context deps to avoid stale reads when style-only changes are present
  }, [props.annotationid, context.canvases, context.annotationsOnCanvases]);

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
        // returns the id of all editable annotations for all canvases in `annotationsOnCanvas`
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

  // TODO perhaps M4 regression with props
  const { t } = useTranslation();

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
            sx={{
              bgcolor: theme.palette.background.paper,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[2],
              position: 'absolute',
              right: 0,
              zIndex: theme.zIndex.modal + 1,
            }}
          >
            {context.config?.debug && (
            <Tooltip title={t('debugAnnotation')}>
              <span>
                <ToggleButton
                  aria-label="Debug"
                  onClick={() => console.log(annotationData)}
                  value="debug"
                >
                  <SettingsIcon />
                </ToggleButton>
              </span>
            </Tooltip>
            )}

            {!!annotationData?.creator && (
            <Tooltip
              title={(
                <WhoAndWhenFormSection
                  creator={annotationData.creator}
                  creationDate={annotationData.creationDate}
                  lastEditor={annotationData.lastEditor}
                  lastSavedDate={annotationData.lastSavedDate}
                  displayMode={TOOLTIP_MODE}
                  t={t}
                />
                                )}
            >
              <span>
                <ToggleButton aria-label="Metadata" value="metadata">
                  <InfoIcon />
                </ToggleButton>
              </span>
            </Tooltip>
            )}

            {context.config?.annotation?.readonly !== true && [
              <Tooltip
                title={t('edit_annotation')}
                key="edit"
              >
                <span>
                  <ToggleButton
                    aria-label="Edit"
                    onClick={context.windowViewType === 'single' ? handleEdit : context.toggleSingleCanvasDialogOpen}
                    value="edit"
                    disabled={!context.annotationEditCompanionWindowIsOpened}
                  >
                    <EditIcon />
                  </ToggleButton>
                </span>
              </Tooltip>,

              <Tooltip title={t('deleteAnnotation')} key="delete">
                <span>
                  <ToggleButton
                    aria-label="Delete"
                    onClick={handleDelete}
                    value="delete"
                    disabled={!context.annotationEditCompanionWindowIsOpened}
                  >
                    <DeleteIcon />
                  </ToggleButton>
                </span>
              </Tooltip>,
            ]}
          </ToggleButtonGroup>
        </div>

      )}
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <li {...props}>
        {props.children}
      </li>
    </div>
  );
});

CanvasListItem.propTypes = {
  annotationEditCompanionWindowIsOpened: PropTypes.bool.isRequired,
  annotationid: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
};

export default withTranslation()(CanvasListItem);
