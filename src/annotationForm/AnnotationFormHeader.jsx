import React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PropTypes from 'prop-types';
import { MiradorMenuButton } from 'mirador';
import { Grid } from '@mui/material';

/**
 * React component for rendering the header of the annotation form.
 * */
export default function AnnotationFormHeader(
  {
    templateType,
    setCommentingType,
    annotation,
  },
) {
  /**
   * Function to navigate back to the template selection.
   */
  const goBackToTemplateSelection = () => {
    setCommentingType(null);
  };

  return (
    <Grid
      container
      direction="row"
      sx={{ alignItems: 'center', justifyContent: 'space-between', marginRight: '10px' }}
      spacing={2}
    >
      <Grid>
        {annotation.id == null
          && (
            <MiradorMenuButton aria-label="back" TooltipProps={{ title: 'back' }}>
              <ChevronLeftIcon onClick={goBackToTemplateSelection} />
            </MiradorMenuButton>
          )}
      </Grid>
      <Grid>
        {templateType.icon}
      </Grid>
    </Grid>
  );
}
AnnotationFormHeader.propTypes = {
  annotation: PropTypes.oneOfType([
    PropTypes.shape({
      body: PropTypes.shape({
        format: PropTypes.string,
        id: PropTypes.string,
        type: PropTypes.string,
        value: PropTypes.string,
      }),
      drawingState: PropTypes.string,
      id: PropTypes.string,
      manifestNetwork: PropTypes.string,
      motivation: PropTypes.string,
      target: PropTypes.string,
    }),
    PropTypes.string,
  ]).isRequired,
  setCommentingType: PropTypes.func.isRequired,
  templateType: PropTypes.shape(
    {
      description: PropTypes.string,
      icon: PropTypes.element,
      id: PropTypes.string,
      label: PropTypes.string,
    },
  ).isRequired,
};
