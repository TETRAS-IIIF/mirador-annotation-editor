import React, {
  useEffect, useLayoutEffect, useRef, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import AnnotationDrawing from '../../AnnotationFormOverlay/AnnotationDrawing';
import { TARGET_TOOL_STATE, TARGET_VIEW } from '../../AnnotationFormUtils';
import { getContextParams } from '../../../contextParams';
import AnnotationFormOverlay from '../../AnnotationFormOverlay/AnnotationFormOverlay';
import { KONVA_MODE, OVERLAY_TOOL } from '../../AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { MAE_DELETE_SHAPE_EVENT } from '../../../hotkeys/hotkeysEvents';

/**
 * TargetSpatialInput - Target spatial input component
 * @param playerReferences
 * @param setTargetDrawingState
 * @param targetDrawingState
 * @param windowId
 */
export function TargetSpatialInput({
  playerReferences,
  setTargetDrawingState,
  targetDrawingState,
  windowId,
}) {
  const { t } = useTranslation();
  const config = useSelector((state) => getConfig(state));
  const { editMode: isEditMode } = getContextParams(config);

  const [drawingState, setDrawingState] = useState(() => {
    const shapes = Array.isArray(targetDrawingState?.shapes) ? targetDrawingState.shapes : [];
    return {
      currentShape: null,
      isDrawing: false,
      shapes,
      ...targetDrawingState,
      // In editMode, auto-select the first shape for immediate resize
      ...(isEditMode && shapes.length > 0 ? { currentShape: shapes[0] } : {}),
    };
  });

  const hasExistingShapes = Array.isArray(targetDrawingState?.shapes)
    && targetDrawingState.shapes.length > 0;

  const [toolState, setToolState] = useState(hasExistingShapes
    ? TARGET_TOOL_STATE
    : { ...TARGET_TOOL_STATE, activeTool: OVERLAY_TOOL.SHAPE });
  const [, setViewTool] = useState(TARGET_VIEW);
  const [scale, setScale] = useState(playerReferences.getScale());

  const updateScale = useCallback(() => {
    const nxt = playerReferences.getScale();
    setScale((prev) => (prev === nxt ? prev : nxt));
  }, [playerReferences]);

  // Emit to parent only when shapes identity actually changes
  const lastShapesRef = useRef(drawingState.shapes);
  useLayoutEffect(() => {
    const prev = lastShapesRef.current;
    const next = drawingState.shapes;
    if (prev === next) return;
    if (prev && next && prev.length === next.length && prev.every((s, i) => s === next[i])) return;
    lastShapesRef.current = next;
    setTargetDrawingState({ drawingState });
  }, [drawingState.shapes, setTargetDrawingState, drawingState]);

  const deleteShape = useCallback((shapeId) => {
    setDrawingState((prev) => {
      if (!shapeId) {
        if (prev.shapes.length === 0 && prev.currentShape == null) return prev;
        return { ...prev, currentShape: null, shapes: [] };
      }
      const filtered = prev.shapes.filter((s) => s.id !== shapeId);
      if (filtered.length === prev.shapes.length) return prev;
      return { ...prev, currentShape: null, shapes: filtered };
    });
  }, []);

  const drawingStateRef = useRef(drawingState);
  drawingStateRef.current = drawingState;

  useEffect(() => {
    /** Action to delete shape when selected */
    const handleDeleteShape = () => {
      const { currentShape, shapes } = drawingStateRef.current;

      if (currentShape) {
        // Delete the selected shape
        const remaining = shapes.filter((s) => s.id !== currentShape.id);
        setDrawingState((prev) => ({ ...prev, currentShape: null, shapes: remaining }));

        // if (remaining.length === 0) {
        //   // No shapes left: notify AnnotationForm to clean up
        //   document.dispatchEvent(new CustomEvent(MAE_ANNOTATION_EMPTY_EVENT));
        // }
      } else {
        // // No shapes at all: just signal empty
        // document.dispatchEvent(new CustomEvent(MAE_ANNOTATION_EMPTY_EVENT));
      }
    };

    // Listen for MAE_DELETE_SHAPE_EVENT triggered by hotkey
    document.addEventListener(MAE_DELETE_SHAPE_EVENT, handleDeleteShape);
    return () => document.removeEventListener(MAE_DELETE_SHAPE_EVENT, handleDeleteShape);
  }, []);

  // Synchronize currentShape with both drawingState.currentShape and
  // drawingState.shapes without triggering redundant re-renders or state churn.
  const updateCurrentShapeInShapes = useCallback((currentShape) => {
    // Defer in case Overlay calls during render
    setTimeout(() => {
      setDrawingState((prev) => {
        if (!currentShape) {
          if (prev.currentShape == null) {
            return prev;
          }
          return { ...prev, currentShape: null };
        }
        const idx = prev.shapes.findIndex((s) => s.id === currentShape.id);
        if (idx !== -1) {
          const prevShape = prev.shapes[idx];
          if (prevShape === currentShape && prev.currentShape === currentShape) {
            return prev;
          }
          const nextShapes = prev.shapes === undefined ? [] : [...prev.shapes];
          nextShapes[idx] = currentShape;
          return { ...prev, currentShape, shapes: nextShapes };
        }
        return { ...prev, currentShape, shapes: [...(prev.shapes || []), currentShape] };
      });
    }, 0);
  }, []);

  return (
    <Grid container direction="column">
      <Grid container direction="column">
        <Typography variant="subFormSectionTitle">{t('spatialTarget')}</Typography>
        <Grid direction="row" spacing={2}>
          <AnnotationDrawing
            displayMode={KONVA_MODE.TARGET}
            drawingState={drawingState}
            playerReferences={playerReferences}
            scale={scale}
            setColorToolFromCurrentShape={() => {}}
            setDrawingState={setDrawingState}
            tabView="edit"
            toolState={toolState}
            updateCurrentShapeInShapes={updateCurrentShapeInShapes}
            updateScale={updateScale}
            windowId={windowId}
            setToolState={setToolState}
          />

          <AnnotationFormOverlay
            toolState={toolState}
            deleteShape={deleteShape}
            setToolState={setToolState}
            shapes={drawingState.shapes}
            currentShape={drawingState.currentShape}
            setViewTool={setViewTool}
            t={t}
            displayMode={KONVA_MODE.TARGET}
            updateCurrentShapeInShapes={updateCurrentShapeInShapes}
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

TargetSpatialInput.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  setTargetDrawingState: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  targetDrawingState: PropTypes.object.isRequired,
  windowId: PropTypes.string.isRequired,
};
