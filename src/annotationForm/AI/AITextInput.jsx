import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PropTypes from 'prop-types';
/**
 * AI TextInput
 * @param handleSend
 * @param isLoading
 * @returns {React.JSX.Element}
 * @constructor
 */
export function AITextInput({
  handleSend,
  isLoading,
}) {
  const [input, setInput] = useState('');

  /**
   * Handle send wrapper to clear input after sending
   */
  const handleSendWrapper = () => {
    if (!input) return;
    handleSend();
    setInput('');
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2 }}>
      <TextField
        fullWidth
        placeholder="[Beta] Type a message..."
        variant="outlined"
        size="small"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendWrapper();
          }
        }}
        slotProps={{
          input: {
            endAdornment: (
              <IconButton color="primary" onClick={() => handleSendWrapper()} disabled={!input.trim() || isLoading}>
                <SendIcon />
              </IconButton>
            ),
            sx: { borderRadius: 6, pr: 0.5 },
          },
        }}
      />
    </Box>
  );
}

AITextInput.propTypes = {
  handleSend: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};
