import {
  Box, Avatar, CircularProgress, Paper, Typography,
} from '@mui/material';
import React from 'react';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PropTypes from 'prop-types';
/**
 *
 * @param props
 * @returns {React.JSX.Element}
 * @constructor
 */
function AIConversation({
  isLoading,
  messagesEndRef,
  conversation,
}) {
  return (
    <Box sx={{
      bgcolor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      gap: 2,
      overflowY: 'auto',
      p: 2,
    }}
    >
      {conversation.map((msg) => {
        const isAi = msg.role === 'assistant';
        return (
          <Box
            key={msg.id}
            sx={{
              alignItems: 'flex-end',
              alignSelf: isAi ? 'flex-start' : 'flex-end',
              display: 'flex',
              flexDirection: isAi ? 'row' : 'row-reverse',
              gap: 1,
              maxWidth: '100%',
            }}
          >
            <Avatar sx={{
              bgcolor: isAi ? 'secondary.main' : 'primary.dark',
              fontSize: '1rem',
              height: 32,
              width: 32,
            }}
            >
              {isAi ? <SmartToyOutlinedIcon fontSize="inherit" />
                : <PersonOutlineIcon fontSize="inherit" />}
            </Avatar>
            <Paper
              elevation={isAi ? 1 : 0}
              sx={{
                bgcolor: isAi ? 'white' : 'primary.main',
                borderRadius: isAi ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                color: isAi ? 'text.primary' : 'primary.contrastText',
                p: 1.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </Typography>
            </Paper>
          </Box>
        );
      })}
      {isLoading && (
        <Box sx={{
          alignItems: 'center',
          display: 'flex',
          gap: 1,
          ml: 1,
          mt: 1,
        }}
        >
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">Generating...</Typography>
        </Box>
      )}
      <div ref={messagesEndRef} />
    </Box>
  );
}

AIConversation.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  conversation: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  messagesEndRef: PropTypes.object.isRequired,
};

export default AIConversation;
