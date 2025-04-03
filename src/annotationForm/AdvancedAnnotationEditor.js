import React from 'react';
import { Grid } from '@mui/material';
import { JsonEditor as Editor } from 'jsoneditor-react';
import ace from 'brace';
import PropTypes from 'prop-types';
import AnnotationFormFooter from './AnnotationFormFooter';

/** Advanced Annotation Editor * */
/** This component is used to render the advanced annotation editor */
export function AdvancedAnnotationEditor({
  closeFormCompanionWindow,
  onChange,
  saveAnnotation,
  value,
}) {
  return (
    <Grid container direction="column" spacing={1} justifyContent="flex-end" padding={1}>
      <Grid item>
        <Editor
          value={value}
          ace={ace}
          theme="ace/theme/github"
          onChange={onChange}
        />
      </Grid>
      <Grid item marginTop={1}>
        <AnnotationFormFooter
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={saveAnnotation}
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
      target: PropTypes.object,
      templateType: PropTypes.string,
    }),
    manifestNetwork: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
};
