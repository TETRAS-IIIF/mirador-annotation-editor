import React from 'react';
import userEvent from '@testing-library/user-event';
import HotkeysListener from '../../src/hotkeys/HotkeysListener';
import HOTKEY_ACTIONS from '../../src/hotkeys/hotkeysDefinitions';
import { render, screen, waitFor } from '../test-utils';

// Delete/Backspace on a selected annotation asks before deleting it.
const annotation = {
  body: [{
    language: 'en', purpose: 'identifying', type: 'TextualBody', value: 'Cairo',
  }],
  id: 'anno/1',
};
const adapter = { annotationPageId: 'page/1', delete: vi.fn(async () => ({ items: [] })) };

vi.mock('mirador', async (importOriginal) => ({
  ...(await importOriginal()),
  getConfig: () => ({ annotation: { adapter: () => adapter }, language: 'en' }),
  getFocusedWindowId: () => 'window',
  getSelectedAnnotationId: () => 'anno/1',
  getVisibleCanvases: () => [{ id: 'canvas/1' }],
}));

const preloadedState = {
  annotations: { 'canvas/1': { 'page/1': { json: { items: [annotation] } } } },
  companionWindows: {},
  windows: { window: { companionWindowIds: [] } },
};

describe('Delete/Backspace hotkey', () => {
  beforeEach(() => adapter.delete.mockClear());

  it('deletes the selected annotation only once confirmed', async () => {
    render(<HotkeysListener />, { preloadedState });

    await userEvent.keyboard('{Delete}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(adapter.delete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(adapter.delete).toHaveBeenCalledWith('anno/1');
  });

  it('keeps it when cancelled, without other hotkeys firing meanwhile', async () => {
    const escape = vi.spyOn(HOTKEY_ACTIONS.escape, 'handler');
    render(<HotkeysListener />, { preloadedState });

    await userEvent.keyboard('{Backspace}');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(adapter.delete).not.toHaveBeenCalled();
    expect(escape).not.toHaveBeenCalled();
  });

  it('still deletes directly without a confirmation hook', () => {
    HOTKEY_ACTIONS.delete.handler({
      config: { annotation: { adapter: () => adapter } },
      dispatch: vi.fn(),
      state: preloadedState,
      windowId: 'window',
    });

    expect(adapter.delete).toHaveBeenCalledWith('anno/1');
  });
});
