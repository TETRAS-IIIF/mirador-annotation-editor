import React from 'react';
import HotkeyTooltip from '../../src/hotkeys/HotkeyTooltip';
import { render } from '../test-utils';

describe('HotkeyTooltip', () => {
  it('shows the label with the keys as <kbd> elements', () => {
    const { container } = render(<HotkeyTooltip label="Save" action="save" />);
    expect(container).toHaveTextContent('Save');
    const keys = container.querySelectorAll('kbd');
    expect(keys.length).toBeGreaterThan(0);
    expect(container.querySelector('hotkey')).toBeNull();
  });

  it('shows the label alone for an action without a hotkey', () => {
    const { container } = render(<HotkeyTooltip label="Nothing" action="no-such-action" />);
    expect(container).toHaveTextContent('Nothing');
    expect(container.querySelector('kbd')).toBeNull();
  });
});
