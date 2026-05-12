import React, { useState } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import AnnotationFormFooter from './AnnotationFormFooter';
import { TEMPLATE } from './AnnotationFormUtils';
import TargetFormSection from './TargetFormSection';
import { resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { MultiTagsInput } from './MultiTagsInput';
import { getContextParams } from '../contextParams';
import { TextCommentInput } from './TextCommentInput';
import UtilsChipTools from './AI/Chip/UtilsChipTools';

/** Tagging Template* */
export default function MultipleBodyTemplate(
  {
    annotation,
    closeFormCompanionWindow,
    playerReferences,
    saveAnnotation,
    t,
    windowId,
  },
) {
  const windows = useSelector((state) => state.windows);
  const config = useSelector((state) => getConfig(state));
  const annotationConfig = config.annotation;
  const tagsSuggestions = annotationConfig.tagsSuggestions ?? [];
  const manifestUrl = windows[windowId]?.manifestId;
  const [isLoading, setIsLoading] = useState(false);

  let maeAnnotation = annotation;

  if (!maeAnnotation.id) {
    const { defaultTags } = getContextParams(config);
    const initialTags = defaultTags.map((tag) => ({ label: tag, value: tag }));

    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: [],
      maeData: {
        tags: initialTags,
        target: null,
        templateType: TEMPLATE.MULTIPLE_BODY_TYPE,
        textBody: {
          purpose: 'describing',
          type: 'TextualBody',
          value: '',
        },
      },
      motivation: 'commenting',
      target: null,
    };
  } else {
    if (maeAnnotation.maeData.target.drawingState && typeof maeAnnotation.maeData.target.drawingState === 'string') {
      maeAnnotation.maeData.target.drawingState = JSON.parse(
        maeAnnotation.maeData.target.drawingState,
      );
      console.debug("Parsed drawingState:", maeAnnotation.maeData.target.drawingState);
      maeAnnotation.maeData.target.drawingState = {
        ...maeAnnotation.maeData.target.drawingState,
        currentShape: null,
      }
    }

    // We support only one textual body
    maeAnnotation.maeData.textBody = maeAnnotation.body.find((body) => body.purpose === 'describing');
    maeAnnotation.maeData.tags = maeAnnotation.body.filter((body) => body.purpose === 'tagging')
      .map((tag) => ({
        label: tag.value,
        value: tag.value,
      }));
    // if the textBody was removed by the above block, add an empty body. otherwise, there will be errors.
    if ( maeAnnotation.maeData.textBody === undefined ) {
      maeAnnotation.maeData.textBody = {
        purpose: "describing",
        type: "TextualBody",
        value: ""
      }
    }
  }

  const [annotationState, setAnnotationState] = useState(maeAnnotation);

  /**
   * Update the annotation's Body
   * */
  const updateAnnotationTextualBodyValue = (newTextValue) => {
    setAnnotationState((prevState) => ({
      ...prevState,
      maeData: {
        ...prevState.maeData,
        textBody: {
          ...prevState.maeData.textBody,
          value: newTextValue,
        },
      },
    }));
  };

  /** Update annotation with Tag Value * */
  const setTags = (newTags) => {
    setAnnotationState((prevState) => ({
      ...prevState,
      maeData: {
        ...prevState.maeData,
        tags: newTags,
      },
    }));
  };

  /** Update Target State * */
  const updateTargetState = (target) => {
    setAnnotationState((prevState) => ({
      ...prevState,
      maeData: {
        ...prevState.maeData,
        target,
      },
    }));
  };

  /** Save function * */
  const saveFunction = async () => {
    resizeKonvaStage(
      windowId,
      playerReferences.getMediaTrueWidth(),
      playerReferences.getMediaTrueHeight(),
      1 / playerReferences.getScale(),
    );
    saveAnnotation(annotationState);
  };
  const mappedSuggestionsTags = tagsSuggestions.map((suggestion) => ({
    label: suggestion,
    value: suggestion,
  }));
  /**
   * When the user selects a template, we change text comment and try to add the tag with same name
   * @param selectedTemplate
   */
  const onChangeTemplate = (selectedTemplate) => {
    const associatedTag = mappedSuggestionsTags.find(
      (tag) => tag.value === selectedTemplate.title,
    );

    if (associatedTag && !annotationState.maeData.tags.find(
      (tag) => tag.value === associatedTag.value,
    )) {
      setAnnotationState({
        ...annotationState,
        maeData: {
          ...annotationState.maeData,
          tags: [...annotationState.maeData.tags, associatedTag],
          textBody: {
            ...annotationState.maeData.textBody,
            value: selectedTemplate.content, // unified here
          },
        },
      });
      return;
    }

    updateAnnotationTextualBodyValue(selectedTemplate.content);
  };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid>
        <TextCommentInput
          comment={annotationState.maeData.textBody.value}
          setComment={updateAnnotationTextualBodyValue}
          onChangeTemplate={onChangeTemplate}
          t={t}
        />
      </Grid>
      <Grid>
        <MultiTagsInput
          t={t}
          tags={annotationState.maeData.tags}
          setTags={setTags}
          tagsSuggestions={mappedSuggestionsTags}
        />
      </Grid>
      <Grid>
        <TargetFormSection
          onChangeTarget={updateTargetState}
          playerReferences={playerReferences}
          spatialTarget
          t={t}
          target={annotationState.maeData.target}
          timeTarget
          windowId={windowId}
        />
      </Grid>
      <Grid>
        <UtilsChipTools
          annotationState={annotationState}
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          target={annotationState.maeData.target}
          setAnnotationState={setAnnotationState}
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

MultipleBodyTemplate.propTypes = {
  annotation: PropTypes.shape({
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
    manifestNetwork: PropTypes.string,
    target: PropTypes.string,
  }).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};
