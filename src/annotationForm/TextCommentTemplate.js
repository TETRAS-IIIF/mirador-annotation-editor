import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import TextFormSection from './TextFormSection';
import TargetFormSection from './TargetFormSection';
import AnnotationFormFooter from './AnnotationFormFooter';
import { resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import StructuredData from './StructuredData';
import { parseDescriptionList, initalizeMaeAnnotation, generateStructuredHtml } from './utils';
import { TEMPLATE } from './AnnotationFormUtils';

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
  const { t } = useTranslation();
  const structuredDataKey = t('structuredData.structuredData');
  // initalize mae text annotation
  const maeAnnotation = initalizeMaeAnnotation(annotation, 'TextualBody', 'commenting', TEMPLATE.TEXT_TYPE);
  const [annotationState, setAnnotationState] = useState(maeAnnotation);
  const [descriptionList, setDescriptionList] = useState([]);
  const [textEditorContent, setTextEditorContent] = useState(annotationState.body.value.split('structuredData')[0]);

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
    const updatedBodyValue = textEditorContent || DEFAULT_BODY_VALUE;
    const structuredHtml = generateStructuredHtml(descriptionList, structuredDataKey);

    const updatedAnnotation = {
      ...annotationState,
      body: {
        ...annotationState.body,
        value: updatedBodyValue + structuredHtml,
      },
    };

    saveAnnotation(updatedAnnotation);
  };

  useEffect(() => {
    // eslint-disable-next-line max-len
    const parsedDescriptionList = parseDescriptionList(annotationState.body.value, structuredDataKey);
    setDescriptionList(parsedDescriptionList);
  }, [annotationState.body.value, structuredDataKey]);

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
