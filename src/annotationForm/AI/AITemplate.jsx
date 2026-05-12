import React, {
  useState, useRef, useEffect, useMemo,
} from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { useSelector, useDispatch } from 'react-redux';
import { receiveAnnotation } from 'mirador';
import AnnotationFormFooter from '../AnnotationFormFooter';
import LLMServiceAdapter from '../../annotationAdapter/LLMServiceAdapter';
// eslint-disable-next-line import/no-named-as-default
import LLMApiService from '../../annotationAdapter/LLMApiService';
import UtilsChipTools from './Chip/UtilsChipTools';
import AIConversation from './AIConversation';
import { AITextInput } from './AITextInput';

/**
 * AITemplate component provides an interface for AI-assisted a
 * nnotation creation. It manages the conversation state,
 * handles user input, communicates with the LLM API, and saves
 * AI-generated annotations to the current canvas.
 * @param param0
 * @param param0.annotation
 * @param param0.canvases
 * @param param0.closeFormCompanionWindow
 * @param param0.playerReferences
 * @param param0.saveAnnotation
 * @param param0.t
 * @returns {React.JSX.Element}
 * @constructor
 */
export default function AITemplate({
  annotation,
  canvases,
  closeFormCompanionWindow,
  playerReferences,
  saveAnnotation,
  t,
}) {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.config);
  const windows = useSelector((state) => state.windows);
  const [annotationState] = useState(annotation);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState([]);

  const windowId = Object.keys(windows)[0];
  const manifestUrl = windows[windowId]?.manifestId;

  const conversationService = useMemo(() => new LLMServiceAdapter(), []);
  const llmApi = useMemo(() => new LLMApiService(config.llm.endpoint), [config.llm.endpoint]);

  useEffect(() => {
    if (!canvases?.length) return;
    const canvasId = canvases[0].id;
    const storageKey = `canvas-${canvasId}`;
    const conv = conversationService.getConversation(storageKey);

    if (!conv) {
      conversationService.data[storageKey] = {
        activeLeafId: null,
        id: storageKey,
        messages: {},
        rootMessageId: null,
      };
      // eslint-disable-next-line no-underscore-dangle
      conversationService._save();
    }
    setConversationId(storageKey);
    const branch = conversationService.getActiveBranch(storageKey) || [];
    setConversation(branch);
  }, [canvases]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  /**
   * Pushes a generic error message to the conversation in case of API failure
   * and refreshes the conversation state to trigger a re-render with the new message.
   */
  const pushErrorMessage = () => {
    if (!conversationId) return;

    conversationService.addMessage(
      conversationId,
      'assistant',
      'Oops — something went wrong on our side. Please try again in a moment.',
      null,
    );

    setConversation(conversationService.getActiveBranch(conversationId));
  };

  /**
   * Saves AI-generated segments as annotations on the current canvas. It retrieves the active
   * canvas,uses the configured annotation adapter to save each segment,
   * and dispatches the new annotations to the Redux store.
   * @param segments
   * @returns {Promise<void>}
   */
  const saveAISegments = async (segments) => {
    const activeCanvases = playerReferences.getCanvases?.() || [];
    if (!activeCanvases.length) return;
    const canvas = activeCanvases[0];

    const storageAdapter = config.annotation.adapter(canvas.id);
    // eslint-disable-next-line no-restricted-syntax
    for (const segment of segments) {
      try {
        const annotationToSave = {
          ...segment,
          target: { ...segment.target, source: canvas.id },

        };
        // eslint-disable-next-line no-await-in-loop
        const annoPage = await storageAdapter.create(annotationToSave);
        if (annoPage) {
          dispatch(receiveAnnotation(canvas.id, storageAdapter.annotationPageId, annoPage));
        }
      } catch (err) {
        console.error('AI Save Error:', err);
      }
    }
  };

  /**
   *
   * @param input
   * @returns {Promise<void>}
   */
  const handleSend = async (input = null) => {
    const textToSend = input;
    if (!textToSend.trim() || !conversationId) return;

    setIsLoading(true);
    const conv = conversationService.getConversation(conversationId);
    const parentId = conv?.activeLeafId || null;

    const userMessageId = conversationService.addMessage(
      conversationId,
      'user',
      textToSend,
      parentId,
    );

    const updatedBranch = conversationService.getActiveBranch(conversationId);
    setConversation(updatedBranch);

    try {
      const formattedConversation = updatedBranch.map((m) => ({
        content: m.content,
        role: m.role,
      }));

      const activeCanvases = playerReferences.getCanvases?.() || [];
      if (!activeCanvases.length) return;

      const canvasIndex = activeCanvases[0].index;
      const reply = await llmApi.callLLM(formattedConversation, manifestUrl, canvasIndex);
      if (reply.tool_output?.type === 'AnnotationPage' && reply.tool_output?.items?.length) {
        await saveAISegments(reply.tool_output.items);
      }

      if (reply.conversation && reply.conversation[reply.conversation.length - 1]) {
        const assistantMessage = reply.conversation[reply.conversation.length - 1].content;
        conversationService.addMessage(conversationId, 'assistant', assistantMessage, userMessageId);
      }

      const finalBranch = conversationService.getActiveBranch(conversationId);
      setConversation(finalBranch);
    } catch (err) {
      console.error(err);
      pushErrorMessage();
    }
    setIsLoading(false);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '700px',
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          alignItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', gap: 1.5, p: 2,
        }}
        >
          <SmartToyOutlinedIcon />
          <Typography variant="subtitle1" fontWeight="600">AI Assistant</Typography>
        </Box>

        <AIConversation
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          conversation={conversation}
        />

        <Divider />

        <UtilsChipTools
          manifestUrl={manifestUrl}
          playerReferences={playerReferences}
          conversationId={conversationId}
          conversationService={conversationService}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setConversation={setConversation}
          pushErrorMessage={pushErrorMessage}
        />

        <AITextInput handleSend={handleSend} isLoading={isLoading} />

      </Paper>

      <AnnotationFormFooter
        closeFormCompanionWindow={closeFormCompanionWindow}
        saveAnnotation={() => saveAnnotation(annotationState.newData, annotation.target)}
        t={t}
        annotationState={annotationState}
      />
    </>
  );
}

AITemplate.propTypes = {

  // eslint-disable-next-line react/forbid-prop-types
  annotation: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  canvases: PropTypes.arrayOf(PropTypes.object).isRequired,
  closeFormCompanionWindow: PropTypes.func.isRequired,
  playerReferences: PropTypes.shape({
    getCanvases: PropTypes.func,
  }).isRequired,
  saveAnnotation: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};
