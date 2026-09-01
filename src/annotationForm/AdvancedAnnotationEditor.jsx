import React from 'react';
import { Grid } from '@mui/material';
import ace from 'brace';
import PropTypes from 'prop-types';
import { JsonEditor } from 'json-edit-react';
import AnnotationFormFooter from './templates/templateComponents/AnnotationFormFooter';

// TODO reimport react editor

// TODO is this still use somewhere ?


/** Advanced Annotation Editor * */
/** This component is used to render the advanced annotation editor */
export function AdvancedAnnotationEditor({
  closeFormCompanionWindow,
  onChange,
  saveAnnotation,
  t,
  value,
}) {
  return (
    <Grid container direction="column" spacing={1} justifyContent="flex-end" padding={1}>
      <Grid marginTop={1}>
        <AnnotationFormFooter
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={saveAnnotation}
          t={t}
          annotationState={value}
        />
      </Grid>
    </Grid>
  );
}

AdvancedAnnotationEditor.propTypes = {
  closeFormCompanionWindow: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  value: PropTypes.PropTypes.shape({
    adapter: PropTypes.func,
    body: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
      }),
    ),
    defaults: PropTypes.objectOf(
      PropTypes.oneOfType(
        [PropTypes.bool, PropTypes.func, PropTypes.number, PropTypes.string],
      ),
    ),
    drawingState: PropTypes.string,
    maeData: PropTypes.shape({
      // eslint-disable-next-line react/forbid-prop-types
      target: PropTypes.object,
      templateType: PropTypes.string,
    }),
    manifestNetwork: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
};
