import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack } from '@mui/material';
import { useSelector } from 'react-redux';
import TranslateChip from './TranslateChip';
import TranscribeChip from './TranscribeChip';
import DescribeChip from '../../DescribeChip';
import OverwriteConfirmDialog from './OverwriteConfirmDialog';

/**
 * Toolbar grouping the AI action chips (Translate, Transcribe, Describe).
 *
 * Wraps all chips inside an `OverwriteConfirmDialog` so that any AI result
 * that would overwrite existing annotation content triggers a confirmation
 * dialog before being applied.
 */
export default function UtilsChipTools({
  manifestUrl,
  playerReferences,
  isLoading,
  setIsLoading,
  setAnnotationState,
  annotationState,
  target,
}) {
  const hasMultipleShapes = (target?.drawingState?.shapes?.length ?? 0) > 1;
  const endpoint = useSelector((state) => state.config?.llm?.endpoint);

  /**
   * Applies an AI-generated annotation to the local annotation state.
   * Extracts the text value from the annotation body, updates the text body,
   * and ensures the AI tag is present exactly once in the tags list.
   * @param {Object} aiAnnotation - The AI-generated annotation object.
   * @param {string} [aiTagLabel='IA Generated'] - The tag label to attach to the annotation.
   */
  const applyAnnotation = (aiAnnotation, aiTagLabel = 'IA Generated') => {
    const { body } = aiAnnotation;
    const aiTextValue = Array.isArray(body)
      ? body.find((b) => b.purpose !== 'tagging')?.value || body[0]?.value
      : body?.value;

    if (!aiTextValue) return;

    setAnnotationState((prevState) => {
      const currentTags = prevState.maeData?.tags || [];
      const filteredTags = currentTags.filter((tag) => tag.value !== aiTagLabel);
      return {
        ...prevState,
        maeData: {
          ...prevState.maeData,
          tags: [...filteredTags, { label: aiTagLabel, value: aiTagLabel }],
          textBody: {
            ...prevState.maeData.textBody,
            value: aiTextValue,
          },
        },
      };
    });
  };

  return (
    <Box sx={{ pt: 1.5, px: 2 }}>
      <OverwriteConfirmDialog
        currentValue={annotationState?.maeData?.textBody?.value}
        onApply={applyAnnotation}
      >
        {(trigger) => (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TranslateChip
              endpoint={endpoint}
              manifestUrl={manifestUrl}
              playerReferences={playerReferences}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              target={target}
              handleSetAnnotationState={trigger}
              hasMultipleShapes={hasMultipleShapes}
            />
            <TranscribeChip
              endpoint={endpoint}
              manifestUrl={manifestUrl}
              playerReferences={playerReferences}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              target={target}
              handleSetAnnotationState={trigger}
              hasMultipleShapes={hasMultipleShapes}
            />
            <DescribeChip
              endpoint={endpoint}
              manifestUrl={manifestUrl}
              playerReferences={playerReferences}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              target={target}
              handleSetAnnotationState={trigger}
              hasMultipleShapes={hasMultipleShapes}
            />
          </Stack>
        )}
      </OverwriteConfirmDialog>
    </Box>
  );
}

UtilsChipTools.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  annotationState: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  manifestUrl: PropTypes.string,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  setAnnotationState: PropTypes.func,
  setIsLoading: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  target: PropTypes.object,
};

UtilsChipTools.defaultProps = {
  annotationState: null,
  manifestUrl: null,
  setAnnotationState: null,
  target: null,
};
