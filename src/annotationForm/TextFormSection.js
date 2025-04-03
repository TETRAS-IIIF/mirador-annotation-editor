import React from 'react';
import { Grid, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import TextEditor from '../TextEditor';

/**
 * TextAnnotation section
 * @param annoHtml
 * @param updateAnnotationBody
 * @returns {Element}
 * @constructor
 */
export default function TextFormSection(
  {
    annoHtml,
    updateAnnotationBody,
  },
) {
  const { t } = useTranslation();
  return (
    <Grid container direction="column" spacing={1}>
      <Grid container item>
        <Typography variant="formSectionTitle">
          {t('note')}
        </Typography>
      </Grid>
      <Grid container item>
        <TextEditor
          annoHtml={annoHtml}
          updateAnnotationBody={updateAnnotationBody}
        />
      </Grid>
    </Grid>
  );
}

TextFormSection.propTypes = {
  annoHtml: PropTypes.string.isRequired,
  updateAnnotationBody: PropTypes.func.isRequired,
};
