import React, { useEffect, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { getFocusedWindowId, getConfig } from 'mirador';
import HOTKEY_ACTIONS from './hotkeysDefinitions';
import { isEditableTarget } from './hotkeysEvents';
import DeleteAnnotationDialog, { annotationTitle } from '../DeleteAnnotationDialog';

// Track the active handler so we can always clean up correctly,
// even if React unmounts/remounts due to error boundaries.
let activeHandler = null;

/**
 * Registers a global keydown listener.
 * Uses the Redux store directly so the listener reads current state
 * without React re-renders.
 */
export default function HotkeysListener() {
  const store = useStore();
  // The annotation a Delete/Backspace is waiting to delete, until the dialog is answered.
  const [pendingDelete, setPendingDelete] = useState(null);
  // Read by the keydown handler, which is only registered once.
  const pendingDeleteRef = useRef(null);
  pendingDeleteRef.current = pendingDelete;

  useEffect(() => {
    // Remove any stale listener left from a previous mount
    // (e.g. after an error boundary re-creation)
    if (activeHandler) {
      document.removeEventListener('keydown', activeHandler);
      activeHandler = null;
    }

    /** Handler for keydown events */
    const handler = (e) => {
      // The confirmation dialog handles its own keys (Escape cancels it).
      if (pendingDeleteRef.current) return;
      if (isEditableTarget(e.target)) return;
      const match = Object.values(HOTKEY_ACTIONS).find((h) => h.keys.includes(e.key));
      if (!match) return;

      const state = store.getState();
      const windowId = getFocusedWindowId(state);
      if (!windowId) return;

      const config = getConfig(state);
      if (config?.annotation?.readonly) return;

      e.preventDefault();
      match.handler({
        config,
        confirmDelete: (annotation, performDelete) => setPendingDelete({
          performDelete,
          title: annotationTitle(annotation, config?.language),
        }),
        dispatch: store.dispatch,
        state,
        windowId,
      });
    };

    activeHandler = handler;
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (activeHandler === handler) {
        activeHandler = null;
      }
    };
  }, [store]);

  return (
    <DeleteAnnotationDialog
      onCancel={() => setPendingDelete(null)}
      onConfirm={() => {
        pendingDelete.performDelete();
        setPendingDelete(null);
      }}
      open={!!pendingDelete}
      title={pendingDelete?.title}
    />
  );
}
