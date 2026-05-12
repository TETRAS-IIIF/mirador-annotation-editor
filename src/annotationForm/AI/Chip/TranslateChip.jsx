import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Chip, CircularProgress, Tooltip, Snackbar, Alert,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { processTargetAction } from '../UtilsLLMAPI';

/** Chip that triggers translation of a targeted region on the current canvas. */
export default function TranslateChip({
  endpoint,
  manifestUrl,
  playerReferences,
  target,
  isLoading,
  setIsLoading,
  handleSetAnnotationState,
  hasMultipleShapes,
}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  /** Calls the FastAPI target-action endpoint and dispatches resulting annotations. */
  const handleTranslate = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl || !target) return;

    setIsPending(true);
    setIsLoading(true);
    setErrorMessage(null);

    await processTargetAction(
      manifestUrl,
      activeCanvases[0],
      target,
      'translate',
      endpoint,
      (newAnnotation) => {
        handleSetAnnotationState?.(newAnnotation);
        setIsPending(false);
        setIsLoading(false);
      },
      (err) => {
        console.error('Translation failed:', err);
        setIsPending(false);
        setIsLoading(false);
        setErrorMessage(
          err?.message || 'Failed to translate the selected region. Please try again.',
        );
      },
    );
  };

  return (
    <>
      <Tooltip title={hasMultipleShapes ? 'Translation is not available with multiple shapes' : 'Translate this'}>
        <span>
          <Chip
            icon={
                isPending
                  ? <CircularProgress size={14} color="inherit" />
                  : <TranslateIcon fontSize="small" />
              }
            onClick={handleTranslate}
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

TranslateChip.propTypes = {
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

TranslateChip.defaultProps = {
  handleSetAnnotationState: null,
  hasMultipleShapes: false,
  manifestUrl: null,
  target: null,
};
