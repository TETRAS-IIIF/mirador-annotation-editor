import PropTypes from 'prop-types';
import { Grid, Typography } from '@mui/material';
import CreatableSelect from 'react-select/creatable';
import React from 'react';
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

  /**
   * Handle template selection change
   * @param selectedOption
   */
  const onLocalChangeTemplate = (selectedOption) => {
    if (selectedOption) {
      onChangeTemplate(selectedOption.value);
    }
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
    </>
  );
}

TextCommentInput.propTypes = {
  comment: PropTypes.string.isRequired,
  onChangeTemplate: PropTypes.func.isRequired,
  setComment: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
