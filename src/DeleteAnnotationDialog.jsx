import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

/**
 * An annotation's own title (its identifying TextualBody), in
 * `language` when it has one, else in any language - or null for an untitled annotation.
 */
export const annotationTitle = (annotation, language) => {
  const titles = (Array.isArray(annotation?.body) ? annotation.body : [])
    .filter((item) => item?.purpose === 'identifying' && item?.type === 'TextualBody' && item.value);
  const preferred = titles.find((item) => item.language === (language ?? '').split('-')[0]);
  return (preferred ?? titles[0])?.value ?? null;
};

/**
 * Asks before deleting an annotation: a deleted annotation can't be restored, its content would
 * have to be recreated.
 */
function DeleteAnnotationDialog({
  onCancel, onConfirm, open, title = null,
}) {
  const { t } = useTranslation();

  return (
    <Dialog
      aria-describedby="delete-annotation-dialog-content"
      aria-labelledby="delete-annotation-dialog-title"
      fullWidth
      maxWidth="sm"
      onClose={onCancel}
      open={open}
    >
      <DialogTitle id="delete-annotation-dialog-title">
        <Typography variant="h2" component="span">
          {title ? t('delete_annotation_confirm_title', { title }) : t('delete_annotation_confirm_title_untitled')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-annotation-dialog-content" variant="body1" color="inherit">
          {t('delete_annotation_confirm_content')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {/* Focused first, so a stray Enter/Space keeps the annotation. */}
        <Button autoFocus onClick={onCancel}>{t('cancel')}</Button>
        <Button color="error" onClick={onConfirm} variant="contained">
          {t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DeleteAnnotationDialog.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/require-default-props -- defaulted in the signature
  title: PropTypes.string,
};

export default DeleteAnnotationDialog;
