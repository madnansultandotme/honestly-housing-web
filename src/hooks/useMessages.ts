import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export function useMessages(projectId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchMessages();
    }
  }, [projectId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMessages(projectId) as any;
      setMessages(response.messages || response || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData: {
    senderId: string;
    content: string;
    attachments?: string[];
  }) => {
    try {
      const response = await apiClient.sendMessage({
        projectId,
        ...messageData,
      });
      await fetchMessages(); // Refresh list
      return response;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    refresh: fetchMessages,
  };
}
