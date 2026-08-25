import { create } from 'zustand';
import { api } from './authStore';

const useChatStore = create((set, get) => ({
  conversations: [],
  selectedUser: null,
  activeConversationId: null,
  messages: [],
  hasMoreMessages: true,
  searchResults: [],
  onlineUsers: new Set(),
  typingUsers: new Set(),

  fetchConversations: async () => {
    try {
      const res = await api.get('/conversations');
      set({ conversations: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  searchUsers: async (q) => {
    try {
      const res = await api.get(`/users/search?q=${q}`);
      set({ searchResults: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  selectUser: async (user) => {
    set({ selectedUser: user, messages: [], hasMoreMessages: true, activeConversationId: null });
    if (user) {
      try {
        const convRes = await api.post('/conversations', { contact_id: user.id });
        const conversationId = convRes.data.id;
        set({ activeConversationId: conversationId });
        
        get().fetchMessages(conversationId);
      } catch (err) {
        console.error(err);
      }
    }
  },

  fetchMessages: async (conversationId, cursor = null) => {
    try {
      const res = await api.get(`/messages/${conversationId}${cursor ? `?cursor=${cursor}` : ''}`);
      set((state) => ({
        messages: cursor ? [...res.data.messages, ...state.messages] : res.data.messages,
        hasMoreMessages: !!res.data.nextCursor
      }));
      return res.data.nextCursor;
    } catch (err) {
      console.error(err);
    }
  },

  addMessage: (message) => {
    set((state) => {
      // Avoid duplicates
      if (state.messages.some(m => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  updateMessage: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
    }));
  },

  removeMessageLocally: (messageId) => {
    // For soft deletes, the server will return the deleted message with 'deleted_at'. We'll use updateMessage instead.
  },

  setOnlineStatus: (userId, isOnline) => {
    set((state) => {
      const newOnline = new Set(state.onlineUsers);
      if (isOnline) newOnline.add(userId);
      else newOnline.delete(userId);
      return { onlineUsers: newOnline };
    });
  },

  setTypingStatus: (userId, isTyping) => {
    set((state) => {
      const newTyping = new Set(state.typingUsers);
      if (isTyping) newTyping.add(userId);
      else newTyping.delete(userId);
      return { typingUsers: newTyping };
    });
  },

  setNickname: async (contactId, nickname) => {
    try {
      await api.post('/users/nickname', { contact_user_id: contactId, nickname });
      get().fetchConversations();
      if (get().selectedUser?.id === contactId) {
        set({ selectedUser: { ...get().selectedUser, display_name: nickname || get().selectedUser.actual_username } });
      }
    } catch (err) {
      console.error(err);
    }
  }
}));

export { useChatStore };
