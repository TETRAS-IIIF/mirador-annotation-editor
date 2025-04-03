import { Grid, Tooltip } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import TitleIcon from '@mui/icons-material/Title';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import CategoryIcon from '@mui/icons-material/Category';
import { useTranslation } from 'react-i18next';
import CursorIcon from '../../icons/Cursor';
import AnnotationFormOverlayTool from './AnnotationFormOverlayTool';
import {
  DEFAULT_TOOL_STATE,
  OVERLAY_VIEW,
  StyledToggleButtonGroup,
  TARGET_VIEW,
} from '../AnnotationFormUtils';
import { isShapesTool, KONVA_MODE, OVERLAY_TOOL } from './KonvaDrawing/KonvaUtils';

const OverlayIconAndTitleContainer = styled(Grid)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
}));

/** All the stuff to manage to choose the drawing tool */
function AnnotationFormOverlay(
  {
    displayMode,
    setToolState,
    toolState,
    deleteShape,
    currentShape,
    updateCurrentShapeInShapes,
    setViewTool,
    shapes,
  },
) {
  const { t } = useTranslation();
  useEffect(() => {

  }, [toolState.fillColor, toolState.strokeColor, toolState.strokeWidth]);
  /**
   * Handle tool's change
   * @param e
   * @param tool
   */
  const changeTool = (e, tool) => {
    if (!displayMode) {
      if (tool === OVERLAY_TOOL.SHAPE) {
        setToolState({
          ...DEFAULT_TOOL_STATE,
          activeTool: tool,
        });
      }
      updateCurrentShapeInShapes(null);
    } else {
      setToolState({
        ...toolState,
        activeTool: tool,
      });
    }
  };
  /**
   * Handle Tab change to set the shapes focusable
   * @param event
   * @param TabIndex
   */
  const tabHandler = (event, TabIndex) => setViewTool(TabIndex);
  const {
    activeTool,
  } = toolState;

  return (
    <Grid container>
      <OverlayIconAndTitleContainer item xs={12}>
        <StyledToggleButtonGroup
          value={activeTool} // State or props ?
          exclusive
          onChange={changeTool}
          aria-label={t('tool_selection')}
          size="small"
        >
          <Tooltip title={t('shape_selection')}>
            <ToggleButton
              value={isShapesTool(activeTool) ? activeTool : OVERLAY_TOOL.SHAPE}
              aria-label={t('select_cursor')}
              onClick={tabHandler(OVERLAY_VIEW)}
            >
              <CategoryIcon />
            </ToggleButton>
          </Tooltip>
          {displayMode === KONVA_MODE.DRAW && (
            <Tooltip title={t('text')}>
              <ToggleButton
                value={OVERLAY_TOOL.TEXT}
                aria-label={t('select_text')}
                onClick={tabHandler(OVERLAY_VIEW)}
              >
                <TitleIcon />
              </ToggleButton>
            </Tooltip>
          )}
          {false && (
            <Tooltip title={t('image')}>
              <ToggleButton
                value={OVERLAY_TOOL.IMAGE}
                aria-label={t('select_cursor')}
                onClick={tabHandler(OVERLAY_VIEW)}
              >
                <ImageIcon />
              </ToggleButton>
            </Tooltip>
          )}
          <Tooltip title={t('edit')}>
            <ToggleButton
              value={OVERLAY_TOOL.EDIT}
              aria-label={t('select_cursor')}
              onClick={tabHandler(TARGET_VIEW)}
            >
              <CursorIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('delete')}>
            <ToggleButton
              value={OVERLAY_TOOL.DELETE}
              aria-label={t('select_cursor')}
              onClick={tabHandler(OVERLAY_VIEW)}
            >
              <DeleteIcon />
            </ToggleButton>
          </Tooltip>
        </StyledToggleButtonGroup>
        <AnnotationFormOverlayTool
          currentShape={currentShape}
          deleteShape={deleteShape}
          displayMode={displayMode}
          setToolState={setToolState}
          shapes={shapes}
          t={t}
          toolState={toolState}
          updateCurrentShapeInShapes={updateCurrentShapeInShapes}
        />
      </OverlayIconAndTitleContainer>
    </Grid>
  );
}

AnnotationFormOverlay.propTypes = {
  currentShape: PropTypes.shape({
    id: PropTypes.string,
    rotation: PropTypes.number,
    scaleX: PropTypes.number,
    scaleY: PropTypes.number,
    type: PropTypes.string,
    url: PropTypes.string,
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
  deleteShape: PropTypes.func.isRequired,
  displayMode: PropTypes.string.isRequired,
  setToolState: PropTypes.func.isRequired,
  setViewTool: PropTypes.func.isRequired,
  shapes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      rotation: PropTypes.number,
      scaleX: PropTypes.number,
      scaleY: PropTypes.number,
      type: PropTypes.string,
      url: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ).isRequired,
  toolState: PropTypes.shape({
    activeTool: PropTypes.string.isRequired,
    closedMode: PropTypes.bool.isRequired,
    fillColor: PropTypes.string.isRequired,
    image: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
    strokeColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    updateColor: PropTypes.func.isRequired,
  }).isRequired,
  updateCurrentShapeInShapes: PropTypes.func.isRequired,
};

export default AnnotationFormOverlay;
