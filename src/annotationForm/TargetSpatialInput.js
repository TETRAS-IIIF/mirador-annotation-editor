import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AnnotationDrawing from './AnnotationFormOverlay/AnnotationDrawing';
import { getTargetSVGToolState, TARGET_VIEW } from './AnnotationFormUtils';
import AnnotationFormOverlay from './AnnotationFormOverlay/AnnotationFormOverlay';
import { KONVA_MODE } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';

/** Handle target spacial for annot templates * */
export function TargetSpatialInput({
  playerReferences,
  setTargetDrawingState,
  targetDrawingState,
  windowId,
}) {
  const { t } = useTranslation();
  // TODO the targetSVGToolSTate is not used. Why the defaultToolState is used?
  const [toolState, setToolState] = useState(getTargetSVGToolState());
  const [viewTool, setViewTool] = useState(TARGET_VIEW);
  const [scale, setScale] = useState(playerReferences.getScale());
  /** Change scale from container / canva */
  const updateScale = () => {
    setScale(playerReferences.getScale());
  };

  const [drawingState, setDrawingState] = useState({
    ...targetDrawingState,
    currentShape: null,
    isDrawing: false,
  });
  useEffect(() => {
    setTargetDrawingState({ drawingState });
  }, [drawingState.shapes]);

  /**
   * Deletes a shape from the drawing state based on its ID.
   * If no shape ID is provided, clears all shapes from the drawing state.
   *
   * @param {string} [shapeId] - The ID of the shape to delete.
   * If not provided, clears all shapes.
   */
  const deleteShape = (shapeId) => {
    if (!shapeId) {
      setDrawingState((prevState) => ({
        ...prevState,
        currentShape: null,
        shapes: [],
      }));
    } else {
      setDrawingState((prevState) => ({
        ...prevState,
        currentShape: null,
        shapes: prevState.shapes.filter((shape) => shape.id !== shapeId),
      }));
    }
  };

  /** handle the update of currentShape into drawingState */
  const updateCurrentShapeInShapes = (currentShape) => {
    if (currentShape) {
      const index = drawingState.shapes.findIndex((s) => s.id === currentShape.id);
      if (index !== -1) {
        // eslint-disable-next-line max-len
        const updatedShapes = drawingState.shapes.map((shape, i) => (i === index ? currentShape : shape));
        setDrawingState({
          ...drawingState,
          currentShape,
          shapes: updatedShapes,
        });
      } else {
        setDrawingState({
          ...drawingState,
          currentShape,
          shapes: [...drawingState.shapes, currentShape],
        });
      }
    } else {
      setDrawingState({
        ...drawingState,
        currentShape,
      });
    }
  };
  const showSVGSelector = true;

  return (
    <Grid container direction="column">
      {showSVGSelector && (
        <Grid item container direction="column">
          <Typography variant="subFormSectionTitle">
            {t('spatialTarget')}
          </Typography>
          <Grid item direction="row" spacing={2}>
            <AnnotationDrawing
              displayMode={KONVA_MODE.TARGET}
              drawingState={drawingState}
              playerReferences={playerReferences}
              scale={scale}
              setColorToolFromCurrentShape={() => {
              }}
              setDrawingState={setDrawingState}
              tabView="edit" // TODO change
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
              displayMode={KONVA_MODE.TARGET}
              updateCurrentShapeInShapes={updateCurrentShapeInShapes}
            />
          </Grid>
        </Grid>
      )}
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
