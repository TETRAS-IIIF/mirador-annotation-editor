import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import HOTKEY_ACTIONS from './hotkeysDefinitions';

const hkSx = {
  bgcolor: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: '4px',
  fontSize: '0.75em',
  ml: 1,
  my: 1,
  px: 0.5,
  py: -0.25,
};

/** Find hotkey entry by its handler function reference */
function getHotkeyKeys(action) {
  return (
    Object.prototype.hasOwnProperty.call(HOTKEY_ACTIONS, action)
      ? HOTKEY_ACTIONS[action].keys
      : null
  );
}

/**
 * Tooltip content: label + styled hotkey tags
 * @param label
 * @param action
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function HotkeyTooltip({ label, action }) {
  const keys = getHotkeyKeys(action);
  if (!keys) return label;
  return (
    <Typography variant="body2" component="span" sx={{ alignItems: 'center', display: 'inline-flex' }}>
      {label}
      {keys.map((k) => (
        <Typography key={k} component="kbd" variant="caption" sx={hkSx}>
          {k}
        </Typography>
      ))}
    </Typography>
  );
}

HotkeyTooltip.propTypes = {
  action: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};
