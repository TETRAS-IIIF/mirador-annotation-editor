import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Chip, Tooltip, CircularProgress, Snackbar, Alert,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { processTargetAction } from '../UtilsLLMAPI';

/** Chip that triggers transcription of the current canvas. */
export default function TranscribeChip({
  endpoint,
  manifestUrl,
  playerReferences,
  setIsLoading,
  isLoading,
  target,
  handleSetAnnotationState,
  hasMultipleShapes,
}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  /** Calls the FastAPI target-action endpoint and dispatches resulting annotations. */
  const handleTranscribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl) return;

    setIsPending(true);
    setIsLoading(true);
    setErrorMessage(null);

    await processTargetAction(
      manifestUrl,
      activeCanvases[0],
      target,
      'transcribe',
      endpoint,
      (newAnnotation) => {
        handleSetAnnotationState?.(newAnnotation);
        setIsPending(false);
        setIsLoading(false);
      },
      (err) => {
        console.error('Transcription failed:', err);
        setIsPending(false);
        setIsLoading(false);
        setErrorMessage(
          err?.message || 'Failed to transcribe the selected region. Please try again.',
        );
      },
    );
  };

  return (
    <>
      <Tooltip title={hasMultipleShapes ? 'Transcription is not available with multiple shapes' : 'Transcribe this'}>
        <span>
          <Chip
            icon={
                isPending
                  ? <CircularProgress size={14} color="inherit" />
                  : <EditNoteIcon fontSize="small" />
              }
            onClick={handleTranscribe}
            disabled={isLoading || hasMultipleShapes}
            clickable
            size="medium"
            variant="outlined"
            color="primary"
          />
        </span>
      </Tooltip>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

TranscribeChip.propTypes = {
  endpoint: PropTypes.string.isRequired,
  handleSetAnnotationState: PropTypes.func,
  hasMultipleShapes: PropTypes.bool,
  isLoading: PropTypes.bool.isRequired,
  manifestUrl: PropTypes.string,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  setIsLoading: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  target: PropTypes.object,
};

TranscribeChip.defaultProps = {
  handleSetAnnotationState: null,
  hasMultipleShapes: false,
  manifestUrl: null,
  target: null,
};
