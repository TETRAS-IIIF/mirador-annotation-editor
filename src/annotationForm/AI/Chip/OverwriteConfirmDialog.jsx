import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button, TextField,
} from '@mui/material';

/**
 * Strips HTML tags from a string, returning plain text.
 * @param {string} html - The HTML string to strip.
 * @returns {string} Plain text content.
 */
const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

/**
 * Extracts the main text value from an annotation body.
 * Handles both array and object body formats.
 * @param {Array|Object} body - The annotation body.
 * @returns {string} The extracted text value.
 */
const extractTextValue = (body) => {
  if (!body) return '';
  return Array.isArray(body)
    ? body.find((b) => b.purpose !== 'tagging')?.value || body[0]?.value || ''
    : body?.value || '';
};

/**
 * Injects a new value into an annotation body, preserving its structure.
 * Handles both array and object body formats.
 * @param {Array|Object} body - The original annotation body.
 * @param {string} newValue - The new text value to inject.
 * @returns {Array|Object} The updated annotation body.
 */
const injectTextValue = (body, newValue) => {
  if (!body) return body;

  if (Array.isArray(body)) {
    return body.map((b) => {
      // Only update the main content entry, not tags
      if (b.purpose !== 'tagging') return { ...b, value: newValue };
      return b;
    });
  }

  return { ...body, value: newValue };
};

/**
 * A confirmation dialog that guards against accidentally overwriting
 * existing annotation content with AI-generated text.
 * Users can also edit the AI-generated text before confirming.
 */
export default function OverwriteConfirmDialog({
  currentValue,
  onApply,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  /**
     * Trigger function passed to children via render prop.
     * If the annotation already has content, opens the confirmation dialog.
     * Otherwise, applies the annotation immediately.
     * @param {Object} aiAnnotation - The AI-generated annotation object.
     * @param {string} [aiTagLabel='IA Generated'] - The tag label to attach.
     */
  const trigger = useCallback((aiAnnotation, aiTagLabel = 'IA Generated') => {
    const existingBody = stripHtml(currentValue);
    if (existingBody?.trim()) {
      const aiText = stripHtml(extractTextValue(aiAnnotation?.body));
      setPending({ aiAnnotation, aiTagLabel });
      setEditedText(aiText);
      setIsEditing(false);
      setOpen(true);
    } else {
      onApply(aiAnnotation, aiTagLabel);
    }
  }, [currentValue, onApply]);

  /**
     * Confirms overwrite — applies the pending annotation (with any edits) and closes the dialog.
     */
  const handleConfirm = () => {
    if (pending) {
      // If the user edited the text, inject the new value back into the annotation body
      const originalText = stripHtml(extractTextValue(pending.aiAnnotation?.body));
      const hasEdits = editedText.trim() !== originalText.trim();

      if (hasEdits) {
        const updatedBody = injectTextValue(pending.aiAnnotation?.body, editedText);
        const updatedAnnotation = { ...pending.aiAnnotation, body: updatedBody };
        onApply(updatedAnnotation, pending.aiTagLabel);
      } else {
        onApply(pending.aiAnnotation, pending.aiTagLabel);
      }
    }

    setOpen(false);
    setPending(null);
    setEditedText('');
    setIsEditing(false);
  };

  /**
     * Cancels the overwrite — discards the pending annotation and closes the dialog.
     */
  const handleCancel = () => {
    setOpen(false);
    setPending(null);
    setEditedText('');
    setIsEditing(false);
  };

  /**
     * Resets edited text back to the original AI-generated value.
     */
  const handleResetEdit = () => {
    const originalText = stripHtml(extractTextValue(pending?.aiAnnotation?.body));
    setEditedText(originalText);
  };

  const hasEdits = editedText.trim()
        !== stripHtml(extractTextValue(pending?.aiAnnotation?.body)).trim();

  return (
    <>
      {children(trigger)}

      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="overwrite-dialog-title"
        aria-describedby="overwrite-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="overwrite-dialog-title">
          Overwrite existing content?
        </DialogTitle>

        <DialogContent>
          <DialogContentText id="overwrite-dialog-description">
            This annotation already has content. Applying an AI-generated result will
            overwrite the existing text. You may edit the new content before confirming.
          </DialogContentText>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            mt: 2,
          }}
          >
            <Box>
              <DialogContentText
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
              >
                Current content
              </DialogContentText>
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  mt: 0.5,
                  p: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {stripHtml(currentValue)}
              </Box>
            </Box>

            <Box>
              <Box sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.5,
              }}
              >
                <DialogContentText
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}
                >
                  New AI-generated content
                  {hasEdits && (
                    <Box
                      component="span"
                      sx={{
                        bgcolor: 'warning.light',
                        borderRadius: 0.5,
                        color: 'warning.dark',
                        fontSize: '0.7rem',
                        ml: 1,
                        px: 0.75,
                        py: 0.25,
                      }}
                    >
                      Edited
                    </Box>
                  )}
                </DialogContentText>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {hasEdits && (
                    <Button
                      size="small"
                      onClick={handleResetEdit}
                      sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={() => setIsEditing((prev) => !prev)}
                    sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                  >
                    {isEditing ? 'Preview' : 'Edit'}
                  </Button>
                </Box>
              </Box>

              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={10}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  variant="outlined"
                  size="small"
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderColor: 'success.main',
                      fontSize: '0.875rem',
                    },
                  }}
                  inputProps={{ 'aria-label': 'Edit AI-generated content' }}
                />
              ) : (
                <Box
                  sx={{
                    bgcolor: hasEdits ? 'warning.light' : 'success.light',
                    border: '1px solid',
                    borderColor: hasEdits ? 'warning.main' : 'success.main',
                    borderRadius: 1,
                    color: hasEdits ? 'warning.contrastText' : 'success.contrastText',
                    cursor: 'text',
                    fontSize: '0.875rem',
                    p: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Click to edit AI-generated content"
                  onClick={() => setIsEditing(true)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
                >
                  {editedText || (
                    <Box component="span" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                      No content
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            color="error"
            variant="contained"
            autoFocus={!isEditing}
            disabled={!editedText.trim()}
          >
            {hasEdits ? 'Overwrite with edits' : 'Overwrite'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

OverwriteConfirmDialog.propTypes = {
  children: PropTypes.func.isRequired,
  currentValue: PropTypes.string,
  onApply: PropTypes.func.isRequired,
};

OverwriteConfirmDialog.defaultProps = {
  currentValue: '',
};
