import React, { useState } from 'react';
import { Grid, Rating, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { templateKit } from '../annotationForm/templateKit';

const { AnnotationFormFooter } = templateKit;

/**
 * Example third-party annotation template (tetras-dfb/root_repo#12, Phase 5): living
 * documentation of the config.annotation.templates extension point. See the README's
 * "External templates" section for how to register this (or your own) via config.
 *
 * Deliberately minimal: a 1-5 star rating attached to the whole canvas, no spatial target, no
 * tags - showing what the extension point actually requires, not a full-featured template.
 */
export const EXAMPLE_TEMPLATE_ID = 'example-org/rating-template';

/**
 * The template's UI: receives the same props every built-in template does (see
 * AnnotationFormBody.jsx and templateRegistry.jsx's contract), even though this example only
 * needs a few of them.
 * @param {object} annotation
 * @param {Function} closeFormCompanionWindow
 * @param {Function} saveAnnotation
 * @param {Function} t
 */
export function ExampleRatingTemplate({
  annotation, closeFormCompanionWindow, saveAnnotation, t,
}) {
  const [rating, setRating] = useState(
    annotation.body?.value ? Number(annotation.body.value) : 0,
  );

  const annotationState = {
    ...annotation,
    body: { purpose: 'tagging', type: 'TextualBody', value: String(rating) },
    maeData: { templateType: EXAMPLE_TEMPLATE_ID },
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid>
        <Typography variant="formSectionTitle">{t('rating')}</Typography>
        <Rating
          value={rating}
          onChange={(_event, newValue) => setRating(newValue ?? 0)}
        />
      </Grid>
      <Grid>
        <AnnotationFormFooter
          annotationState={annotationState}
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={() => saveAnnotation(annotationState)}
          t={t}
        />
      </Grid>
    </Grid>
  );
}

ExampleRatingTemplate.propTypes = {
  annotation: PropTypes.shape({
    body: PropTypes.shape({ value: PropTypes.string }),
  }).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

/**
 * Convert an ExampleRatingTemplate annotationState into a savable IIIF annotation: the whole
 * canvas is the target (no spatial selector to derive), and the body is a single
 * tagging-purpose text body carrying the numeric rating as its value.
 * @param {object} state
 * @param {{ canvas: object }} ctx
 * @returns {Promise<object>}
 */
export const convertExampleRatingAnnotationToBeSaved = async (state, { canvas }) => ({
  ...state,
  target: canvas.id,
});

/**
 * The registry-entry-shaped descriptor for this example template: spread it (or your own
 * equivalent) into config.annotation.templates to register it. See templateRegistry.jsx's
 * TEMPLATE_REGISTRY JSDoc for the full contract every entry (built-in or external) follows.
 */
export const exampleExternalTemplate = {
  Component: ExampleRatingTemplate,
  convertToAnnotation: convertExampleRatingAnnotationToBeSaved,
  description: 'Example third-party template: rate the canvas 1-5 stars (no spatial target)',
  icon: null,
  id: EXAMPLE_TEMPLATE_ID,
  isCompatibleWithMediaType: (mediaType) => mediaType === 'Image',
  label: 'Rating (example)',
  selectable: true,
};
