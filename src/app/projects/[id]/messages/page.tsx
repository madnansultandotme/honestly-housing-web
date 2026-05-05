'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import { LoadingOverlay, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';

interface Message {
  id: string;
  projectId?: string;
  senderId: string;
  senderName: string;
  senderRole: 'builder' | 'client';
  text: string;
  attachments?: Array<{
    type: 'image' | 'document';
    url: string;
    name: string;
  }>;
  readBy: string[];
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  address: string;
  clientEmail?: string;
}

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadProject();
    loadMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [user, projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProject = async () => {
    try {
      const data = await apiClient.get<Project>(`/projects/${projectId}`);
      setProject(data);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await apiClient.get<{ messages: Message[] }>(
        `/messages?projectId=${projectId}`
      );
      
      // Filter to ensure only messages for this project
      const projectMessages = (data.messages || []).filter(
        msg => msg.projectId === projectId || !msg.projectId
      );
      
      setMessages(projectMessages);
      
      // Mark unread messages as read
      if (user) {
        const unreadMessages = projectMessages.filter(
          msg => msg.senderId !== user.uid && !msg.readBy.includes(user.uid)
        );
        
        for (const msg of unreadMessages) {
          await apiClient.patch(`/messages/${msg.id}?projectId=${projectId}`, {
            userId: user.uid,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !profile) return;

    setSending(true);
    try {
      const messageData = {
        projectId,
        senderId: user.uid,
        senderName: profile.displayName || user.email || 'Unknown',
        senderRole: profile.role,
        text: newMessage.trim(),
        attachments: [],
      };

      const data = await apiClient.post<{ message: Message }>('/messages', messageData);
      setMessages(prev => [data.message, ...prev]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  if (!profile) {
    return <LoadingOverlay fullScreen message="Loading..." />;
  }

  const Header = (profile.role === 'builder' || profile.role === 'designer' || profile.role === 'admin') ? BuilderHeader : ClientHeader;

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header
        title={project ? `Messages - ${project.name}` : 'Messages'}
        subtitle={project?.address}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-card shadow-sm border border-neutral-200 h-[calc(100vh-250px)] flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <svg className="w-16 h-16 mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium text-neutral-700">No messages yet</p>
                <p className="text-sm text-neutral-500">Start a conversation below</p>
              </div>
            ) : (
              <>
                {[...messages].reverse().map((message) => {
                  const isOwnMessage = message.senderId === user?.uid;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          isOwnMessage
                            ? 'bg-brass-600 text-white'
                            : 'bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`text-xs font-semibold ${
                            isOwnMessage ? 'text-brass-100' : 'text-neutral-700'
                          }`}>
                            {message.senderName || 'Unknown User'}
                          </span>
                          <span
                            className={`text-xs ${
                              isOwnMessage ? 'text-brass-200' : 'text-neutral-500'
                            }`}
                          >
                            {formatTimestamp(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.text}
                        </p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-xs underline ${
                                  isOwnMessage ? 'text-brass-100 hover:text-white' : 'text-brass-600 hover:text-brass-700'
                                }`}
                              >
                                {attachment.type === 'image' ? (
                                  <ImageIcon className="w-3 h-3" />
                                ) : (
                                  <Paperclip className="w-3 h-3" />
                                )}
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-neutral-200 p-4 bg-taupe-50">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-neutral-300 rounded-button focus:ring-2 focus:ring-brass-500 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-400"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-brass-600 text-white rounded-button hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
              >
                {sending ? (
                  <LoadingSpinner size="sm" className="border-t-white" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
