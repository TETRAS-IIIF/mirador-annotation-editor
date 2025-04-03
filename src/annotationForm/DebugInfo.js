import React from 'react';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import './debug.css';

/** */
export default function DebugInfo({ debugMode, playerReferences }) {
  const { t } = useTranslation();

  if (!debugMode) {
    return null;
  }

  return (
    <>
      <Typography>
        {playerReferences.getMediaType()}
      </Typography>
      <Typography>
        {t('scale')}
        :
        {playerReferences.getScale()}
      </Typography>
      <Typography>
        {t('zoom')}
        :
        {playerReferences.getZoom()}
      </Typography>
      <Typography>
        {t('image_true_size')}
        :
        {playerReferences.getMediaTrueWidth()}
        {' '}
        x
        {playerReferences.getMediaTrueHeight()}
      </Typography>
      <Typography>
        {t('container_size')}
        :
        {playerReferences.getContainerWidth()}
        {' '}
        x
        {playerReferences.getContainerHeight()}
      </Typography>
      <Typography>
        {t('image_displayed')}
        :
        {playerReferences.getDisplayedMediaWidth()}
        {' '}
        x
        {playerReferences.getDisplayedMediaHeight()}
      </Typography>
    </>
  );
}
DebugInfo.propTypes = {
  debugMode: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
};
