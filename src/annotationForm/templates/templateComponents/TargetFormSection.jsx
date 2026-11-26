import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MEDIA_TYPES } from '../../AnnotationFormUtils';
import { TargetSpatialInput } from './TargetSpatialInput';

/**
 * Section of Time and Space Target
 * @param onChangeTarget
 * @param spatialTarget
 * @param playerReferences
 * @param target
 * @param windowId
 * @returns {Element}
 * @constructor
 */
export default function TargetFormSection({
  onChangeTarget,
  spatialTarget,
  playerReferences,
  target,
  windowId,
}) {
  const { t } = useTranslation();

  const mediaType = playerReferences.getMediaType();
  const defaultTarget = useMemo(() => {
    if (target) return target;

    const next = {
      drawingState: {
        currentShape: null,
        isDrawing: false,
        shapes: [],
      },
    };

    if (mediaType === MEDIA_TYPES.IMAGE) {
      next.fullCanvaXYWH = `0,0,${playerReferences.getMediaTrueWidth()},${playerReferences.getMediaTrueHeight()}`;
    }

    return next;
    // Only depends on values used to compute defaults
    // DO NOT include onChangeTarget here
  }, [target, mediaType, playerReferences]);

  // Post-render sync: if parent didn't provide target, set it once
  useEffect(() => {
    if (!target) onChangeTarget(defaultTarget);
  }, [target, defaultTarget, onChangeTarget]);

  const onChangeTargetInput = (newData) => {
    onChangeTarget({
      ...defaultTarget,
      ...newData,
    });
  };

  if (!spatialTarget) return null;

  return (
    <Grid container direction="column" spacing={1}>
      <Grid>
        <Typography variant="formSectionTitle">
          {t('target')}
        </Typography>
      </Grid>

      {spatialTarget && mediaType !== MEDIA_TYPES.AUDIO && (
        <Grid container direction="column">
          <TargetSpatialInput
            playerReferences={playerReferences}
            setTargetDrawingState={onChangeTargetInput}
            targetDrawingState={defaultTarget.drawingState}
            windowId={windowId}
          />
        </Grid>
      )}
    </Grid>
  );
}

TargetFormSection.propTypes = {
  onChangeTarget: PropTypes.func.isRequired,
  playerReferences: PropTypes.object.isRequired,
  spatialTarget: PropTypes.bool.isRequired,
  target: PropTypes.object, // allow undefined/null; child will hydrate once
  windowId: PropTypes.string.isRequired,
};
