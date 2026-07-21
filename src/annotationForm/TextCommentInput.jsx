import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import CreatableSelect from 'react-select/creatable';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { getConfig } from 'mirador';
import TextEditor from '../TextEditor';

/**
 * TextCommentInput component
 * @param commentTemplates - The list of comment templates
 * @param comment - The current comment
 * @param setComment - Function to set the comment
 * @param onChangeTemplate - Function to handle template selection
 * @param t - Translation function
 * @constructor
 */
export function TextCommentInput({
  comment,
  onChangeTemplate,
  setComment,
  t,
}) {
  /**
   * Format the option label for the select component
   * @param option
   * @returns {React.JSX.Element}
   */
  const formatOptionLabel = (option) => (
    <div title={option.title}>
      {option.label}
    </div>
  );
  const annotationConfig = useSelector((state) => getConfig(state)).annotation;
  const commentTemplates = annotationConfig.commentTemplates ?? [];

  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [mergedComment, setMergedComment] = useState('');
  const [selectResetKey, setSelectResetKey] = useState(0);

  /**
   * Handle template selection change, asking the user to merge the template
   * with the current comment if it would otherwise be overwritten
   * @param selectedOption
   */
  const onLocalChangeTemplate = (selectedOption) => {
    if (!selectedOption) return;

    if (comment.trim().length > 0) {
      setPendingTemplate(selectedOption);
      setMergedComment(comment);
      return;
    }

    onChangeTemplate(selectedOption.value);
  };

  /** Confirm the pending template selection, applying the merged comment */
  const confirmTemplateChange = () => {
    onChangeTemplate({ ...pendingTemplate.value, content: mergedComment });
    setPendingTemplate(null);
    setMergedComment('');
  };

  /** Cancel the pending template selection, keeping the current comment */
  const cancelTemplateChange = () => {
    setPendingTemplate(null);
    setMergedComment('');
    setSelectResetKey((key) => key + 1);
  };

  return (
    <>
      <Grid container>
        <Typography variant="formSectionTitle">
          {t('note')}
        </Typography>
      </Grid>
      {commentTemplates.length > 0 && (
        <Grid style={{ marginBottom: '10px' }}>
          <CreatableSelect
            key={selectResetKey}
            options={commentTemplates.map((template) => ({
              label: template.title,
              title: template.content,
              value: template,
            }))}
            placeholder={t('useTemplate')}
            onChange={onLocalChangeTemplate}
            isClearable
            isSearchable
            formatOptionLabel={formatOptionLabel}
            styles={{
              marginBottom: '20px',
            }}
          />
        </Grid>
      )}

      <Grid container>
        <TextEditor
          text={comment}
          setText={setComment}
        />
      </Grid>

      <Dialog
        aria-labelledby="confirm-template-selection-title"
        fullWidth
        maxWidth="sm"
        onClose={cancelTemplateChange}
        open={pendingTemplate !== null}
      >
        <DialogTitle id="confirm-template-selection-title">
          <Typography variant="h2" component="span">
            {t('confirmTemplateSelectionTitle')}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <DialogContentText variant="body1" color="inherit">
            {t('confirmTemplateSelectionContent')}
          </DialogContentText>

          <Typography variant="subtitle2" sx={{ marginTop: '16px' }}>
            {t('selectedTemplateContent')}
          </Typography>
          <Box
            sx={{
              border: '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              marginBottom: '16px',
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '8px 12px',
            }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: pendingTemplate?.value.content ?? '' }}
          />

          <Typography variant="subtitle2">
            {t('currentNoteContent')}
          </Typography>
          <TextEditor
            text={mergedComment}
            setText={setMergedComment}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={cancelTemplateChange}>{t('cancel')}</Button>
          <Button color="primary" onClick={confirmTemplateChange} variant="contained">
            {t('applyMerge')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

TextCommentInput.propTypes = {
  comment: PropTypes.string.isRequired,
  onChangeTemplate: PropTypes.func.isRequired,
  setComment: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
