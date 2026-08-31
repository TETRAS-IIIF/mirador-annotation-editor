import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { Grid } from '@mui/material';
import { TEMPLATE } from './AnnotationFormUtils';
import { resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { convertSingleBodyAnnotationToBeSaved } from '../IIIFUtils';
import { templateKit } from './templateKit';

const { AnnotationFormFooter, TargetFormSection, TextCommentInput } = templateKit;

const DEFAULT_BODY_VALUE = 'Annotation';

/**
 * Convert a TextCommentTemplate annotationState into a savable IIIF annotation. Same shape as
 * TaggingTemplate - a single `body.value` to default, no tags/textBody - so both share
 * convertSingleBodyAnnotationToBeSaved rather than duplicating it.
 */
export const convertTextCommentAnnotationToBeSaved = convertSingleBodyAnnotationToBeSaved;

// This template is only kept for backward compatibility, it will be removed in the future.
// Use MultipleBodyTemplate instead and set the templateType to TEMPLATE.MULTIPLE_BODY_TYPE.
// Phase 4 of the annotation-template migration (tetras-dfb/root_repo#12) retired part of its
// duplication with MultipleBodyTemplate by reusing TextCommentInput (the same rich-text/
// quick-template widget) instead of maintaining a separate, plainer TextFormSection. It does
// NOT reuse MultipleBodyTemplate's tags input or component wholesale: TEXT_TYPE's stored shape
// (a single body object, no tags array) and templateType are kept exactly as before - adding
// tag support here would silently change what gets saved for existing legacy annotations,
// which is the one thing this migration was explicitly asked not to do.
/** Form part for edit annotation content and body */
function TextCommentTemplate(
  {
    annotation,
    closeFormCompanionWindow,
    playerReferences,
    saveAnnotation,
    t,
    windowId,
  },
) {
  let maeAnnotation = annotation;

  if (!maeAnnotation.id) {
    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: {
        id: uuidv4(),
        type: 'TextualBody',
        value: '',
      },
      maeData: {
        target: null,
        templateType: TEMPLATE.TEXT_TYPE,
      },
      motivation: 'commenting',
      target: null,
    };
  } else if (maeAnnotation.maeData.target.drawingState && typeof maeAnnotation.maeData.target.drawingState === 'string') {
    // eslint-disable-next-line max-len
    maeAnnotation.maeData.target.drawingState = JSON.parse(maeAnnotation.maeData.target.drawingState);
  }

  const [annotationState, setAnnotationState] = useState(maeAnnotation);

  /**
   * Update the annotation's Body
   * */
  const updateAnnotationTextualBodyValue = (newTextValue) => {
    const newBody = annotationState.body;
    newBody.value = newTextValue;
    setAnnotationState({
      ...annotationState,
      body: newBody,
    });
  };

  /**
   * When the user selects a comment template, replace the body value with its content.
   * Unlike MultipleBodyTemplate's onChangeTemplate, there is no tag to associate: TEXT_TYPE
   * annotations have no tags array.
   * @param selectedTemplate
   */
  const onChangeTemplate = (selectedTemplate) => {
    updateAnnotationTextualBodyValue(selectedTemplate.content);
  };

  /** this code update annotationState with maeDate * */
  const updateTargetState = (target) => {
    const newMaeData = annotationState.maeData;
    newMaeData.target = target;
    setAnnotationState({
      ...annotationState,
      maeData: newMaeData,
    });
  };

  /** Save function * */
  const saveFunction = () => {
    resizeKonvaStage(
      windowId,
      playerReferences.getMediaTrueWidth(),
      playerReferences.getMediaTrueHeight(),
      1 / playerReferences.getScale(),
    );
    if (annotationState.body.value === undefined) {
      annotationState.body.value = DEFAULT_BODY_VALUE;
    }
    saveAnnotation(annotationState);
  };

  useEffect(() => {

  }, [annotationState.maeData.target]);

  return (
    <Grid container direction="column" spacing={2}>
      <Grid>
        <TextCommentInput
          comment={annotationState.body.value}
          setComment={updateAnnotationTextualBodyValue}
          onChangeTemplate={onChangeTemplate}
          t={t}
        />
      </Grid>
      <Grid>
        <TargetFormSection
          onChangeTarget={updateTargetState}
          playerReferences={playerReferences}
          spatialTarget
          target={annotationState.maeData.target}
          windowId={windowId}
        />
      </Grid>
      <Grid>
        <AnnotationFormFooter
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={saveFunction}
          t={t}
          annotationState={annotationState}
        />
      </Grid>
    </Grid>
  );
}

TextCommentTemplate.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  annotation: PropTypes.object.isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};

export default TextCommentTemplate;
