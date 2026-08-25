import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { useChatStore } from '../store/chatStore';
import { useSocket } from '../hooks/useSocket';

export default function Chat() {
  const { fetchConversations } = useChatStore();
  const socket = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Mobile sidebar toggle button is handled inside ChatArea header */}
      
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
        transition-transform duration-300 ease-in-out
        fixed md:relative z-20 h-full
        w-72 border-r border-border-custom bg-bg-secondary
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-bg-primary relative z-10 w-full">
        <ChatArea toggleSidebar={() => setSidebarOpen(!sidebarOpen)} socket={socket} />
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
