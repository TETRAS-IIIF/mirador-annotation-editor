import { v4 as uuid } from 'uuid';

export default class LLMServiceAdapter {
  constructor(storageKey = 'mirador_llm_conversations') {
    this.storageKey = storageKey;
    this.data = this._load();
  }

  /* ===============================
       Internal Storage Helpers
    =============================== */

  _load = () => {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch (e) {
      console.warn('Failed to load LLM storage:', e);
      return {};
    }
  };

  _save = () => {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  };

  _reload = () => {
    this.data = this._load();
  };

  /* ===============================
       Conversation Management
    =============================== */

  createConversation = (id = uuid()) => {
    this._reload();

    if (!this.data[id]) {
      this.data[id] = {
        id,
        rootMessageId: null,
        activeLeafId: null,
        messages: {},
        createdAt: Date.now(),
      };

      this._save();
    }

    return id;
  };

  deleteConversation = (id) => {
    this._reload();
    delete this.data[id];
    this._save();
  };

  getConversation = (id) => {
    this._reload();
    return this.data[id] || null;
  };

  resetConversation = (id) => {
    this._reload();

    if (!this.data[id]) return;

    this.data[id] = {
      id,
      rootMessageId: null,
      activeLeafId: null,
      messages: {},
      createdAt: Date.now(),
    };

    this._save();
  };

  /* ===============================
       Message Management
    =============================== */

  addMessage = (conversationId, role, content, parentId = null) => {
    this._reload();

    const conv = this.data[conversationId];
    if (!conv) throw new Error('Conversation not found');

    const messageId = uuid();

    conv.messages[messageId] = {
      id: messageId,
      role,
      content,
      parentId,
      childrenIds: [],
      createdAt: Date.now(),
    };

    if (parentId && conv.messages[parentId]) {
      conv.messages[parentId].childrenIds.push(messageId);
    } else if (!parentId) {
      conv.rootMessageId = messageId;
    }

    conv.activeLeafId = messageId;
    conv.updatedAt = Date.now();

    this._save();

    return messageId;
  };

  editMessage = (conversationId, messageId, newContent) => {
    this._reload();

    const conv = this.data[conversationId];
    if (!conv) throw new Error('Conversation not found');

    const oldMessage = conv.messages[messageId];
    if (!oldMessage) throw new Error('Message not found');

    return this.addMessage(
      conversationId,
      oldMessage.role,
      newContent,
      oldMessage.parentId,
    );
  };

  getActiveBranch = (conversationId) => {
    this._reload();

    const conv = this.data[conversationId];
    if (!conv || !conv.activeLeafId) return [];

    let current = conv.activeLeafId;
    const branch = [];

    while (current) {
      const msg = conv.messages[current];
      if (!msg) break;

      branch.unshift(msg);
      current = msg.parentId;
    }

    return branch;
  };

  setActiveLeaf = (conversationId, messageId) => {
    this._reload();

    const conv = this.data[conversationId];
    if (!conv) return;

    if (conv.messages[messageId]) {
      conv.activeLeafId = messageId;
      conv.updatedAt = Date.now();
      this._save();
    }
  };

  getChildren = (conversationId, messageId) => {
    this._reload();

    const conv = this.data[conversationId];
    if (!conv) return [];

    const msg = conv.messages[messageId];
    if (!msg) return [];

    return msg.childrenIds.map((id) => conv.messages[id]);
  };

  getFormattedBranch = (conversationId) => {
    const branch = this.getActiveBranch(conversationId);

    return branch.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  };
}
