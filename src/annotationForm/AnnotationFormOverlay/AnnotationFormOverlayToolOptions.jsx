import { Grid, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import ImageFormField from './ImageFormField';
import {
  isShapesTool,
  KONVA_MODE,
  objToRgba,
  OVERLAY_TOOL,
  rgbaToObj,
  SHAPES_TOOL,
} from './KonvaDrawing/KonvaUtils';
import ColorPicker from './KonvaDrawing/shapes/ColorPicker';

/** All the tools options for the overlay options */
function AnnotationFormOverlayToolOptions({
  currentShape,
  displayMode,
  setToolState,
  t,
  toolState,
}) {
  // set toolOptionsValue
  const [toolOptions, setToolOptions] = useState({
    colorPopoverOpen: false,
    currentColorType: null,
    lineWeightPopoverOpen: false,
    popoverAnchorEl: null,
    popoverLineWeightAnchorEl: null,
  });

  // Set unused default color to avoid error on render
  const currentColor = toolOptions.currentColorType ? rgbaToObj(toolState[toolOptions.currentColorType]) : 'rgba(255, 0, 0, 0.5)';

  // Fonction to manage option displaying
  /** */
  const openChooseLineWeight = (e) => {
    setToolOptions({
      ...toolOptions,
      lineWeightPopoverOpen: true,
      popoverLineWeightAnchorEl: e.currentTarget,
    });
  };

  /** */
  const handleLineWeightSelect = (e) => {
    setToolOptions({
      ...toolOptions,
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
    });
    setToolState({
      ...toolState,
      strokeWidth: e.currentTarget.value,
    });
  };

  /** Close color popover window */
  const closeChooseColor = (e) => {
    setToolOptions({
      ...toolOptions,
      colorPopoverOpen: false,
      currentColorType: null,
      popoverAnchorEl: null,
    });
  };

  /** */
  const openChooseColor = (e) => {
    setToolOptions({
      ...toolOptions,
      colorPopoverOpen: true,
      currentColorType: e.currentTarget.value,
      popoverAnchorEl: e.currentTarget,
    });
  };

  /** */
  const handleCloseLineWeight = (e) => {
    setToolOptions({
      ...toolOptions,
      lineWeightPopoverOpen: false,
      popoverLineWeightAnchorEl: null,
    });
  };

  /**  closed mode change */
  const changeClosedMode = (e) => {
    setToolState({
      ...toolState,
      closedMode: e.currentTarget.value,
    });
  };

  /** Update color : fillColor or strokeColor */
  const updateColor = (color) => {
    setToolState({
      ...toolState,
      [toolOptions.currentColorType]: objToRgba(color.rgb),
    });
  };

  /** Handle Image Change * */
  const handleImgChange = (newUrl, imgRef) => {
    setToolState({
      ...toolState,
      image: {
        ...toolState.image,
        id: newUrl,
      },
    });
  };
  /** Handle Image into toolstate * */
  const addImage = () => {
    const data = {
      id: toolState?.image?.id,
      uuid: uuidv4(),
    };

    setToolState({
      ...toolState,
      image: { id: null },
      imageEvent: data,
    });
  };

  /** Handle text change from AnnotationFormOverlayToolOption * */
  const handleTextChange = (e) => {
    const text = e.target.value;
    setToolState(
      {
        ...toolState,
        text,
      },
    );
  };

  const annotationConfig = useSelector((state) => getConfig(state)).annotation;
  const allowTargetShapesStyling = annotationConfig?.allowTargetShapesStyling === true;


  return (
    <div>
      {
        ((displayMode === KONVA_MODE.DRAW || (allowTargetShapesStyling && displayMode === KONVA_MODE.TARGET))
          && isShapesTool(toolState.activeTool)) && (
          <Grid container>
            <ColorPicker
              currentColor={currentColor}
              changeClosedMode={changeClosedMode}
              closeChooseColor={closeChooseColor}
              handleCloseLineWeight={handleCloseLineWeight}
              handleLineWeightSelect={handleLineWeightSelect}
              openChooseColor={openChooseColor}
              openChooseLineWeight={openChooseLineWeight}
              updateColor={updateColor}
              toolOptions={toolOptions}
              toolState={toolState}
            />
          </Grid>
        )
      }
      {
        toolState.activeTool === OVERLAY_TOOL.TEXT && (
          <Grid container direction="column" spacing={1}>
            <Grid>
              <Typography variant="overline">
                {t('text')}
              </Typography>
            </Grid>
            {currentShape ? (
              <>
                <Grid>
                  <TextField
                    value={toolState.text}
                    placeholder={t('text')}
                    fullwidth
                    onChange={handleTextChange}
                  />
                </Grid>
                <Grid>
                  <ColorPicker
                    changeClosedMode={changeClosedMode}
                    closeChooseColor={closeChooseColor}
                    currentColor={currentColor}
                    handleCloseLineWeight={handleCloseLineWeight}
                    handleLineWeightSelect={handleLineWeightSelect}
                    openChooseColor={openChooseColor}
                    openChooseLineWeight={openChooseLineWeight}
                    toolOptions={toolOptions}
                    toolState={toolState}
                    updateColor={updateColor}
                  />
                </Grid>
              </>
            ) : (
              <Grid>
                <Typography>{t('click_on_canvas_to_write')}</Typography>
              </Grid>
            )}
          </Grid>
        )
      }
      {
        toolState.activeTool === OVERLAY_TOOL.IMAGE && (
          <Grid container>
            <ImageFormField
              size={{ xs: 8 }}
              imageUrl={toolState.image?.id}
              onChange={handleImgChange}
              isReadOnly={Boolean(currentShape)}
              onAddImage={addImage}
              t={t}
            />
          </Grid>
        )
      }
      {
        toolState.activeTool === SHAPES_TOOL.POLYGON && (
          <Typography>
            {t('pressEscapeToFinish')}
          </Typography>
        )
      }
    </div>
  );
}

AnnotationFormOverlayToolOptions.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  currentShape: PropTypes.object.isRequired,
  displayMode: PropTypes.string.isRequired,
  setToolState: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  toolState: PropTypes.shape({
    activeTool: PropTypes.string.isRequired,
    closedMode: PropTypes.string.isRequired,
    fillColor: PropTypes.string,
    image: PropTypes.shape({
      id: PropTypes.string,
    }),
    strokeColor: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    text: PropTypes.string,
    textBody: PropTypes.string,
    updateColor: PropTypes.func,
  }).isRequired,
};

export default AnnotationFormOverlayToolOptions;
