import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Paper } from '@mui/material';
import { JsonEditor } from 'json-edit-react';
import { templateKit } from './templateKit';

const { AnnotationFormFooter } = templateKit;

/**
 * Convert an IIIFTemplate annotationState into a savable IIIF annotation. IIIF_TYPE
 * ("expert mode") annotations are a raw, hand-edited IIIF annotation via the JSON editor
 * below - there is nothing to convert.
 * @param {object} state
 * @returns {Promise<object>}
 */
export const convertIIIFAnnotationToBeSaved = async (state) => state;

/**
 * IIIFTemplate component
 * @param annotation
 * @param canvases
 * @param closeFormCompanionWindow
 * @param saveAnnotation
 * @param t
 * @returns {JSX.Element}
 */
export default function IIIFTemplate({
  annotation,
  canvases,
  closeFormCompanionWindow,
  saveAnnotation,
  t,
}) {
  const [annotationState, setAnnotationState] = useState(annotation);

  /**
   * Save function for the annotation
   * @returns {Object}
   */
  const saveFunction = () => {
    // We return annotation to save it
    canvases.forEach(async (canvas) => {
      // Adapt target to the canvas
      // eslint-disable-next-line no-param-reassign
      // annotation.target = `${canvas.id}#xywh=${target.xywh}&t=${target.t}`;
      saveAnnotation(annotationState.newData, canvas.id);
    });
    closeFormCompanionWindow();
  };

  return (
    <>
      <Paper
        elevation={0}
        style={{ minHeight: '300px' }}
      >
        <JsonEditor
          data={annotationState}
          onUpdate={setAnnotationState}
        />
      </Paper>
      <AnnotationFormFooter
        closeFormCompanionWindow={closeFormCompanionWindow}
        saveAnnotation={saveFunction}
        t={t}
        annotationState={annotationState}
      />
    </>
  );
}

IIIFTemplate.propTypes = {
  annotation: PropTypes.shape({
    body: PropTypes.shape({
      format: PropTypes.string,
      id: PropTypes.string,
      type: PropTypes.string,
      value: PropTypes.string,
    }),
    drawingState: PropTypes.string,
    id: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    maeData: PropTypes.object,
    manifestNetwork: PropTypes.string,
    motivation: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
