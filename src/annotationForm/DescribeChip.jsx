import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Chip, CircularProgress, Tooltip, Snackbar, Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { processTargetAction } from './AI/UtilsLLMAPI';

/** Chip that triggers visual description of a targeted region on the current canvas. */
export default function DescribeChip({
  endpoint,
  manifestUrl,
  playerReferences,
  isLoading,
  setIsLoading,
  target,
  handleSetAnnotationState,
  hasMultipleShapes,
}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  /** Calls the FastAPI target-action endpoint and dispatches resulting annotations. */
  const handleDescribe = async () => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length || !manifestUrl || !target) return;

    const canvas = activeCanvases[0];

    setIsPending(true);
    setIsLoading(true);
    setErrorMessage(null);

    await processTargetAction(
      manifestUrl,
      canvas,
      target,
      'describe',
      endpoint,
      (newAnnotation) => {
        setIsPending(false);
        handleSetAnnotationState(newAnnotation);
        setIsLoading(false);
      },
      (error) => {
        console.error('Description error:', error);
        setIsPending(false);
        setIsLoading(false);
        setErrorMessage(
          error?.message || 'Failed to describe the selected region. Please try again.',
        );
      },
    );
  };

  return (
    <>
      <Tooltip title={hasMultipleShapes ? 'Description is not available with multiple shapes' : 'Describe this'}>
        <span>
          <Chip
            icon={
                isPending
                  ? <CircularProgress size={14} color="inherit" />
                  : <AutoAwesomeIcon fontSize="small" />
              }
            onClick={handleDescribe}
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

DescribeChip.propTypes = {
  endpoint: PropTypes.string.isRequired,
  handleSetAnnotationState: PropTypes.func.isRequired,
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

DescribeChip.defaultProps = {
  hasMultipleShapes: false,
  manifestUrl: null,
  target: null,
};
