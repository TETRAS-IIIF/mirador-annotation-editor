import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import GetAppIcon from '@mui/icons-material/GetApp';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { styled } from '@mui/system';
import { useTranslation } from 'react-i18next';

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  '&:focus': { backgroundColor: theme.palette.action.focus },
  '&:hover': { backgroundColor: theme.palette.action.hover }
}));

/**
 * AnnotationExportDialog
 * @param canvases
 * @param config
 * @param handleClose
 * @param open
 * @returns {Element}
 * @constructor
 */
function AnnotationExportDialog({
  canvases,
  config,
  handleClose,
  open
}) {
  const [exportLinks, setExportLinks] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    /**
     * Fetch export links
     */
    const fetchExportLinks = async () => {
      /**
       * Reducer to get all annotations for each canvas
       * @param acc
       * @param canvas
       * @returns {Promise<[...*,{canvasId, id: *, label: *, url: string}]|*>}
       */
      const reducer = async (acc, canvas) => {
        const store = config.annotation.adapter(canvas.id);
        const resolvedAcc = await acc;
        const content = await store.all();
        if (!content) return resolvedAcc;

        // eslint-disable-next-line no-underscore-dangle
        const label = (canvas.__jsonld && canvas.__jsonld.label) || canvas.id;
        const data = new Blob([JSON.stringify(content)], { type: 'application/json' });
        const url = window.URL.createObjectURL(data);

        return [
          ...resolvedAcc,
          {
            canvasId: canvas.id,
            id: content.id || content['@id'],
            label,
            url
          }
        ];
      };

      if (canvases?.length > 0) {
        const links = await canvases.reduce(reducer, []);
        setExportLinks(links);
      }
    };

    fetchExportLinks();
  }, [canvases, config, open]);

  /**
   * Close dialog
   */
  const closeDialog = () => {
    exportLinks.forEach((l) => {
      try {
        URL.revokeObjectURL(l.url);
      } catch { /* empty */
      }
    });
    setExportLinks([]);
    handleClose();
  };

  /**
   * Handle dialog close
   * @param event
   * @param reason
   */
  const handleDialogClose = (event, reason) => {
    if (reason === 'escapeKeyDown' || reason === 'backdropClick') {
      closeDialog();
      return;
    }
    handleClose();
  };

  return (
    <Dialog
      aria-labelledby="annotation-export-dialog-title"
      id="annotation-export-dialog"
      onClose={handleDialogClose}
      open={open}
    >
      <DialogTitle id="annotation-export-dialog-title">
        <Typography variant="h2" component="span">
          {t('export_annotation')}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {exportLinks.length === 0 ? (
          <Typography variant="body1">{t('no_annotation')}</Typography>
        ) : (
          <MenuList>
            {exportLinks.map((dl) => (
              <StyledMenuItem
                component="a"
                key={dl.canvasId}
                aria-label={t('export_annotation_for', { label: dl.canvasId })}
                href={dl.url}
                download={`${dl.id}.json`}
              >
                <ListItemIcon>
                  <GetAppIcon />
                </ListItemIcon>
                <ListItemText>{t('export_annotation_for', { label: dl.canvasId })}</ListItemText>
              </StyledMenuItem>
            ))}
          </MenuList>
        )}
      </DialogContent>
    </Dialog>
  );
}

AnnotationExportDialog.propTypes = {
  canvases: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })).isRequired,
  config: PropTypes.shape({
    annotation: PropTypes.shape({
      adapter: PropTypes.func
    })
  }).isRequired,
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default AnnotationExportDialog;
