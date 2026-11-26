import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Chip, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { acceptDraft } from './draftUtils';

/** Badge and Accept / Reject buttons shown under a draft in the annotation list. */
export function DraftItemActions({
  annotation, canvasId, marker, receiveAnnotation, storageAdapter,
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  /** Runs an adapter call and pushes the returned page to Mirador. */
  const run = (action) => async (event) => {
    event.stopPropagation();
    setBusy(true);
    const adapter = storageAdapter(canvasId);
    try {
      const page = await action(adapter);
      receiveAnnotation(canvasId, adapter.annotationPageId, page);
    } catch (error) {
      console.error('Draft action failed', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="flex-end"
      sx={{ pb: 1, pr: 1 }}
      data-testid="draft-actions"
    >
      <Chip size="small" color="warning" variant="outlined" label={t('draft_badge')} />
      <Button
        size="small"
        color="inherit"
        disabled={busy}
        onClick={run((adapter) => adapter.delete(annotation.id))}
      >
        {t('reject')}
      </Button>
      <Button
        size="small"
        variant="contained"
        disabled={busy}
        onClick={run((adapter) => acceptDraft(adapter, annotation, marker))}
      >
        {t('accept')}
      </Button>
    </Stack>
  );
}

DraftItemActions.propTypes = {
  annotation: PropTypes.shape({ id: PropTypes.string }).isRequired,
  canvasId: PropTypes.string.isRequired,
  marker: PropTypes.shape({ property: PropTypes.string }).isRequired,
  receiveAnnotation: PropTypes.func.isRequired,
  storageAdapter: PropTypes.func.isRequired,
};

/** "N drafts [Reject all] [Accept all]" under the annotation list. */
export function DraftsFooter({ count, onAcceptAll, onRejectAll }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  if (count === 0) return null;

  /** Disables the buttons while the action runs. */
  const run = (action) => async () => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 1 }}
      data-testid="drafts-footer"
    >
      <span style={{ flexGrow: 1 }}>{t('drafts_count', { count })}</span>
      <Button size="small" color="inherit" disabled={busy} onClick={run(onRejectAll)}>
        {t('reject_all')}
      </Button>
      <Button size="small" variant="contained" disabled={busy} onClick={run(onAcceptAll)}>
        {t('accept_all')}
      </Button>
    </Stack>
  );
}

DraftsFooter.propTypes = {
  count: PropTypes.number.isRequired,
  onAcceptAll: PropTypes.func.isRequired,
  onRejectAll: PropTypes.func.isRequired,
};
