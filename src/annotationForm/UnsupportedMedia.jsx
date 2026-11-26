import React from 'react';
import { CompanionWindow } from 'mirador';
import { Grid } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/** */
export default function UnsupportedMedia({ id, windowId, mediaType }) {
  const { t } = useTranslation();
  return (
    <CompanionWindow title={t('media_not_supported')} windowId={windowId} id={id}>
      <Grid container spacing={1} sx={{ padding: 1 }}>
        <Grid>
          <Typography>{t('media_not_supported')}</Typography>
        </Grid>
        <Grid>
          <Typography>
            {t('detected_media_type', { mediaType })}
          </Typography>
        </Grid>
      </Grid>
    </CompanionWindow>
  );
}

UnsupportedMedia.propTypes = {
  id: PropTypes.string.isRequired,
  mediaType: PropTypes.string.isRequired,
  windowId: PropTypes.string.isRequired,
};
