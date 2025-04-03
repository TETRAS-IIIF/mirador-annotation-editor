import {
  Button, Divider, Grid, Tooltip,
} from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import WhoAndWhenFormSection, { SECTION_MODE } from './WhoAndWhenFormSection';

/** Annotation form footer, save or cancel the edition/creation of an annotation */
function AnnotationFormFooter({
  annotationState,
  closeFormCompanionWindow,
  saveAnnotation,
}) {
  const { t } = useTranslation();

  /**
   * Validate form and save annotation
   */
  return (
    <>
      {
        (annotationState.creator && annotationState.creationDate) && (
          <Grid container>
            <WhoAndWhenFormSection
              lastSavedDate={annotationState.lastSavedDate}
              lastEditor={annotationState.lastEditor}
              creator={annotationState.creator}
              creationDate={annotationState.creationDate}
              displayMode={SECTION_MODE}
            />
          </Grid>
        )
      }
      <Divider sx={{ m: 1 }} />
      <Grid sx={{ mt: 1 }} container item spacing={1} justifyContent="flex-end">
        <Tooltip title={t('cancel')}>
          <Button
            sx={{ m: 1 }}
            onClick={closeFormCompanionWindow}
          >
            {t('cancel')}
          </Button>
        </Tooltip>
        <Tooltip title={t('save')}>
          <Button
            sx={{ m: 1 }}
            variant="contained"
            color="primary"
            type="submit"
            onClick={saveAnnotation}
          >
            {t('save')}
          </Button>
        </Tooltip>
      </Grid>
    </>
  );
}

AnnotationFormFooter.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  annotationState: PropTypes.object.isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
};

export default AnnotationFormFooter;
