import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

export const useSocket = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { addMessage, updateMessage, setOnlineStatus, setTypingStatus, fetchConversations, activeConversationId } = useChatStore();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const newSocket = io('http://localhost:5005', {
      withCredentials: true
    });

    setSocket(newSocket);

    newSocket.on('receive_message', (message) => {
      addMessage(message);
      fetchConversations();
    });

    newSocket.on('message_edited', (message) => {
      updateMessage(message);
    });

    newSocket.on('message_deleted', (message) => {
      updateMessage(message);
    });

    newSocket.on('user_status', ({ userId, status }) => {
      setOnlineStatus(userId, status === 'online');
    });

    newSocket.on('typing_start', ({ sender_id }) => {
      setTypingStatus(sender_id, true);
    });

    newSocket.on('typing_stop', ({ sender_id }) => {
      setTypingStatus(sender_id, false);
    });

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit('join_conversation', { conversation_id: activeConversationId });
    }
  }, [socket, activeConversationId]);

  return socket;
};
