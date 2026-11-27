import { Grid, Tooltip } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import TitleIcon from '@mui/icons-material/Title';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import CategoryIcon from '@mui/icons-material/Category';
import CursorIcon from '../../icons/Cursor';
import AnnotationFormOverlayTool from './AnnotationFormOverlayTool';
import {
  DEFAULT_TOOL_STATE,
  OVERLAY_VIEW,
  StyledToggleButtonGroup,
  TARGET_VIEW,
} from '../AnnotationFormUtils';
import { isShapesTool, KONVA_MODE, OVERLAY_TOOL } from './KonvaDrawing/KonvaUtils';
import HotkeyTooltip from "../../hotkeys/HotkeyTooltip";

// eslint-disable-next-line no-empty-pattern
const OverlayIconAndTitleContainer = styled(Grid)(({  }) => ({
  display: 'flex',
  flexDirection: 'column',
}));

/**
 * Renders the overlay tool selection panel for the annotation form.
 * Provides UI controls to switch between tools (shape, text, image, edit, delete)
 * and manages synchronization between tool state, shape selection, and view mode.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {string} props.displayMode - Current mode of the Konva canvas (e.g., DRAW, IMAGE).
 * @param {function(Object):void} props.setToolState - Updates the global tool state.
 * @param {Object} props.toolState - Current tool configuration and state.
 * @param {string} props.toolState.activeTool - Identifier of the active overlay tool.
 * @param {string} props.toolState.closedMode - Mode defining if drawing is closed or open.
 * @param {string} props.toolState.fillColor - Current fill color.
 * @param {Object} props.toolState.image - Image-related metadata.
 * @param {string} props.toolState.image.id - Identifier or URL of the image.
 * @param {string} props.toolState.strokeColor - Current stroke color.
 * @param {number} props.toolState.strokeWidth - Current stroke width.
 * @param {function():void} props.toolState.updateColor - Updates stroke and fill colors globally.
 * @param {function(Object):void} props.deleteShape - Removes a shape from the canvas.
 * @param {Object} props.currentShape - Currently selected shape for editing.
 * @param {function(Object|null):void} props.updateCurrentShapeInShapes
 * - Updates or clears the selected shape within the shapes array.
 * @param {function(number):void} props.setViewTool
 * - Switches between overlay and target view modes.
 * @param {Array<Object>} props.shapes - List of existing shapes on the canvas.
 * @param {function(string):string} props.t - Translation function for UI labels.
 *
 * @example
 * <AnnotationFormOverlay
 *   displayMode={KONVA_MODE.DRAW}
 *   setToolState={setToolState}
 *   toolState={toolState}
 *   deleteShape={handleDelete}
 *   currentShape={selectedShape}
 *   updateCurrentShapeInShapes={syncShape}
 *   setViewTool={switchView}
 *   shapes={shapeList}
 *   t={translate}
 * />
 *
 * @returns {JSX.Element} Overlay panel with toggle buttons for annotation tools.
 */
function AnnotationFormOverlay({
  displayMode,
  setToolState,
  toolState,
  deleteShape,
  currentShape,
  updateCurrentShapeInShapes,
  setViewTool,
  shapes,
  t,
}) {
  useEffect(() => {}, [toolState.fillColor, toolState.strokeColor, toolState.strokeWidth]);

  const changeTool = useCallback(
    (e, tool) => {
      if (!tool) return;
      if (!displayMode) {
        if (tool === OVERLAY_TOOL.SHAPE) {
          setToolState({ ...DEFAULT_TOOL_STATE, activeTool: tool });
        }
        updateCurrentShapeInShapes(null);
      } else {
        setToolState((s) => (s.activeTool === tool ? s : { ...s, activeTool: tool }));
        // Deselect shape when switching to drawing tool
        if (tool !== OVERLAY_TOOL.EDIT) {
          updateCurrentShapeInShapes(null);
        }
      }
    },
    [displayMode, setToolState, updateCurrentShapeInShapes],
  );

  const tabClick = useCallback(
    (index) => () => {
      setViewTool(index);
    },
    [setViewTool],
  );

  const { activeTool } = toolState;

  return (
    <Grid container>
      <OverlayIconAndTitleContainer>
        <StyledToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={changeTool}
          aria-label={t('tool_selection')}
          size="small"
        >
          {displayMode !== KONVA_MODE.IMAGE && (
            <Tooltip title={t('shape_selection')}>
              <ToggleButton
                value={isShapesTool(activeTool) ? activeTool : OVERLAY_TOOL.SHAPE}
                aria-label={t('select_cursor')}
                onClick={tabClick(OVERLAY_VIEW)}
              >
                <CategoryIcon />
              </ToggleButton>
            </Tooltip>
          )}
          {displayMode === KONVA_MODE.DRAW && (
            <Tooltip title={t('text')}>
              <ToggleButton
                value={OVERLAY_TOOL.TEXT}
                aria-label={t('select_text')}
                onClick={tabClick(OVERLAY_VIEW)}
              >
                <TitleIcon />
              </ToggleButton>
            </Tooltip>
          )}
          {displayMode === KONVA_MODE.IMAGE && (
            <Tooltip title={t('image')}>
              <ToggleButton
                value={OVERLAY_TOOL.IMAGE}
                aria-label={t('select_cursor')}
                onClick={tabClick(OVERLAY_VIEW)}
              >
                <ImageIcon />
              </ToggleButton>
            </Tooltip>
          )}
          <Tooltip title={t('edit')}>
            <ToggleButton
              value={OVERLAY_TOOL.EDIT}
              aria-label={t('select_cursor')}
              onClick={tabClick(TARGET_VIEW)}
            >
              <CursorIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={<HotkeyTooltip label={t('delete')} action="delete" />}>
            <ToggleButton
              value={OVERLAY_TOOL.DELETE}
              aria-label={t('select_cursor')}
              onClick={tabClick(OVERLAY_VIEW)}
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
  t: PropTypes.func.isRequired,
  toolState: PropTypes.shape({
    activeTool: PropTypes.string.isRequired,
    closedMode: PropTypes.string.isRequired,
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
