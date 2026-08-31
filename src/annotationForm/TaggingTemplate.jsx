import React, { useState } from 'react';
import { Grid, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import AnnotationFormFooter from './AnnotationFormFooter';
import { TEMPLATE } from './AnnotationFormUtils';
import TargetFormSection from './TargetFormSection';
import { resizeKonvaStage } from './AnnotationFormOverlay/KonvaDrawing/KonvaUtils';
import { getContextParams } from '../contextParams';
import { finalizeSpatialTarget, getDefaultValue, isEmptyValue } from '../IIIFUtils';

/**
 * Convert a TaggingTemplate annotationState into a savable IIIF annotation. Tagging has no
 * body array or tags to build (unlike MultipleBodyTemplate) and no textBody (unlike
 * TextCommentTemplate/MultipleBodyTemplate) - only its single `body.value` needs defaulting
 * before the shared spatial-target pipeline runs.
 * @param {object} state
 * @param {{ canvas: object, windowId: string, playerReferences: object }} ctx
 * @returns {Promise<object>}
 */
export const convertTaggingAnnotationToBeSaved = async (
  state,
  { canvas, windowId, playerReferences },
) => {
  const stateToSave = state;
  if (isEmptyValue(stateToSave.body.value)) {
    stateToSave.body.value = getDefaultValue();
  }
  return finalizeSpatialTarget(stateToSave, canvas, windowId, playerReferences);
};

/** Tagging Template* */
export default function TaggingTemplate(
  {
    annotation,
    closeFormCompanionWindow,
    playerReferences,
    saveAnnotation,
    t,
    windowId,
  },
) {
  const config = useSelector((state) => getConfig(state));
  let maeAnnotation = annotation;

  if (!maeAnnotation.id) {
    const { defaultTags } = getContextParams(config);
    const initialValue = defaultTags.length > 0 ? defaultTags[0] : '';

    // If the annotation does not have maeData, the annotation was not created with mae
    maeAnnotation = {
      body: {
        type: 'Image',
        value: initialValue,
      },
      maeData: {
        target: null,
        templateType: TEMPLATE.TAGGING_TYPE,
      },
      motivation: 'tagging',
      target: null,
    };
  } else if (maeAnnotation.maeData.target.drawingState && typeof maeAnnotation.maeData.target.drawingState === 'string') {
    maeAnnotation.maeData.target.drawingState = JSON.parse(
      maeAnnotation.maeData.target.drawingState,
    );
  }

  const [annotationState, setAnnotationState] = useState(maeAnnotation);

  /** Update annotation with Tag Value * */
  const updateTaggingValue = (newTextValue) => {
    const newBody = annotationState.body;
    newBody.value = newTextValue;
    setAnnotationState({
      ...annotationState,
      body: newBody,
    });
  };

  /** Update Target State * */
  const updateTargetState = (target) => {
    const newMaeData = annotationState.maeData;
    newMaeData.target = target;
    setAnnotationState({
      ...annotationState,
      maeData: newMaeData,
    });
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

  return (
    <Grid container direction="column" spacing={2}>
      <Grid>
        <Typography variant="formSectionTitle">
          {t('tag')}
          {' '}
        </Typography>
      </Grid>
      <Grid>
        <TextField
          id="outlined-basic"
          label={t('your_tag_here')}
          value={annotationState.body.value}
          variant="outlined"
          onChange={(event) => updateTaggingValue(event.target.value)}
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

TaggingTemplate.propTypes = {
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
  // eslint-disable-next-line react/forbid-prop-types
  closeFormCompanionWindow: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  playerReferences: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};
