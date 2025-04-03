import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MEDIA_TYPES } from './AnnotationFormUtils';
import { TargetSpatialInput } from './TargetSpatialInput';

/**
 *
 * @param onChangeTarget
 * @param spatialTarget
 * @param playerReferences
 * @param target
 * @param windowId
 * @returns {Element}
 * @constructor
 */
export default function TargetFormSection(
  {
    onChangeTarget,
    spatialTarget,
    playerReferences,
    target,
    windowId,
  },
) {
  const { t } = useTranslation();
  if (!target) {
    // eslint-disable-next-line no-param-reassign
    target = {};

    // TODO Check if its possible to use overlay ?
    switch (playerReferences.getMediaType()) {
      case MEDIA_TYPES.IMAGE:
        // eslint-disable-next-line no-param-reassign
        target.fullCanvaXYWH = `0,0,${playerReferences.getMediaTrueWidth()},${playerReferences.getMediaTrueHeight()}`;
        break;
      default:
        break;
    }

    target.drawingState = {
      currentShape: null,
      isDrawing: false,
      shapes: [],
    };

    onChangeTarget(target);
  }

  /** Handle spatialTargetInput* */
  const onChangeTargetInput = (newData) => {
    onChangeTarget({
      ...target,
      ...newData,
    });
  };

  if (!spatialTarget) {
    return <> </>;
  }

  return (
    <Grid item container direction="column" spacing={1}>
      <Grid item>
        <Typography variant="formSectionTitle">
          {t('target')}
        </Typography>
      </Grid>
      {
        (spatialTarget && playerReferences.getMediaType() !== MEDIA_TYPES.AUDIO) && (
          <Grid item container direction="column">
            <TargetSpatialInput
              playerReferences={playerReferences}
              setTargetDrawingState={onChangeTargetInput}
              targetDrawingState={target.drawingState}
              windowId={windowId}
            />
          </Grid>
        )
      }
    </Grid>
  );
}

TargetFormSection.propTypes = {
  onChangeTarget: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  spatialTarget: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  target: PropTypes.object.isRequired,
  windowId: PropTypes.string.isRequired,
};
