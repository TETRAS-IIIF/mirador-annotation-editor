import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import uuid from 'draft-js/lib/uuid';
import { Grid } from '@mui/material';
import TextFormSection from './TextFormSection';
import TargetFormSection from './TargetFormSection';
import AnnotationFormFooter from './AnnotationFormFooter';
import { TEMPLATE } from './AnnotationFormUtils';
import { resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import StructuredData from './StructuredData';

const DEFAULT_BODY_VALUE = 'Annotation';

/** Form part for edit annotation content and body */
function TextCommentTemplate(
  {
    annotation,
    closeFormCompanionWindow,
    playerReferences,
    saveAnnotation,
    windowId,
  },
) {
  let maeAnnotation = annotation;

  if (!maeAnnotation.id) {
    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: {
        id: uuid(),
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
  const [descriptionList, setDescriptionList] = useState([]);
  const [textEditorContent, setTextEditorContent] = useState(annotationState.body.value.split('structuredData')[0]);

  useEffect(() => {
    const descriptionListArray = [];
    const parser = new DOMParser();

    const doc = parser.parseFromString(annotationState.body.value.split('structuredData')[1], 'text/html');
    const dlElement = doc.querySelector('dl');

    if (dlElement) {
      const dtElements = dlElement.querySelectorAll('dt');
      const ddElements = dlElement.querySelectorAll('dd');

      dtElements.forEach((dt, index) => {
        descriptionListArray.push({
          dd: ddElements[index].textContent.trim(),
          dt: dt.textContent.trim(),
        });
      });
    }

    setDescriptionList(descriptionListArray);
  }, [annotationState.body.value]);

  /**
   * Updates the description list
    */
  const updateDescriptionList = (value, title) => {
    const listEntry = {
      dd: value.target.value,
      dt: title,
    };
    setDescriptionList((prevList) => {
      const index = prevList.findIndex((item) => item.dt === title);
      if (index !== -1) {
        const updatedList = [...prevList];
        updatedList[index] = { ...updatedList[index], dd: value.target.value };
        return updatedList;
      }
      return [...prevList, listEntry];
    });
  };

  /**
   * Update the annotation's body
   * */
  const updateAnnotationTextualBodyValue = (newTextValue) => {
    setTextEditorContent(newTextValue);
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
    if (annotationState.body.value === '') {
      annotationState.body.value = DEFAULT_BODY_VALUE;
    }
    annotationState.body.value = textEditorContent;
    annotationState.body.value += `
    structuredData
    <dl>
      ${descriptionList.map((item) => `<dt>${item.dt}</dt><dd>${item.dd}</dd>`).join('')}
    </dl>
  `;
    saveAnnotation(annotationState);
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item>
        <TargetFormSection
          onChangeTarget={updateTargetState}
          playerReferences={playerReferences}
          spatialTarget
          target={annotationState.maeData.target}
          windowId={windowId}
        />
      </Grid>
      <Grid item>
        <TextFormSection
          annoHtml={textEditorContent}
          updateAnnotationBody={updateAnnotationTextualBodyValue}
        />
      </Grid>
      <Grid item>
        <StructuredData
          descriptionList={descriptionList}
          updateDescriptionList={updateDescriptionList}
        />
      </Grid>
      <Grid item>
        <AnnotationFormFooter
          closeFormCompanionWindow={closeFormCompanionWindow}
          saveAnnotation={saveFunction}
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
  windowId: PropTypes.string.isRequired,
};

export default TextCommentTemplate;
