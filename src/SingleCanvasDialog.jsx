import React, { useCallback } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Dialog to enforce single view for annotation creation / editing
 */
function SingleCanvasDialog({ handleClose, open, switchToSingleCanvasView }) {
  const { t } = useTranslation();

  const confirm = useCallback(() => {
    switchToSingleCanvasView();
    handleClose();
  }, [handleClose, switchToSingleCanvasView]);

  const onClose = useCallback(
    (event, reason) => {
      // Close on ESC or backdrop, or any other close request
      // If you want to block ESC/backdrop, add disableEscapeKeyDown or check reason
      handleClose();
    },
    [handleClose],
  );

  return (
    <Dialog
      aria-labelledby="single-canvas-dialog-title"
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <DialogTitle id="single-canvas-dialog-title">
        <Typography variant="h2" component="span">
          {t('switch_view_h2')}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText variant="body1" color="inherit">
          {t('switch_view_content')}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Tooltip title={t('cancel')}>
          <Button onClick={handleClose}>{t('cancel')}</Button>
        </Tooltip>
        <Tooltip title={t('switch_view')}>
          <Button color="primary" onClick={confirm} variant="contained">
            {t('switch_view')}
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}

SingleCanvasDialog.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  switchToSingleCanvasView: PropTypes.func.isRequired,
};

export default SingleCanvasDialog;
