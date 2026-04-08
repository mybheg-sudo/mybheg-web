'use client';
import { useState, useEffect, useCallback } from 'react';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import ContactProfile from '@/components/chat/ContactProfile';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Fetch conversations
  const fetchConversations = useCallback(async (loadMore = false) => {
    try {
      const p = loadMore ? page + 1 : 1;
      const params = new URLSearchParams({ filter, page: p.toString() });
      if (search) params.set('search', search);
      const res = await fetch(`/api/conversations?${params}`);
      const data = await res.json();
      if (data.success) {
        if (loadMore) {
          setConversations(prev => [...prev, ...data.data]);
        } else {
          setConversations(data.data);
        }
        setHasMore(data.hasMore || false);
        setTotal(data.total || 0);
        setPage(p);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Fetch chat detail
  const selectConversation = async (contactId) => {
    setSelectedId(contactId);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/conversations/${contactId}`);
      const data = await res.json();
      if (data.success) setChatData(data.data);
    } catch (err) {
      console.error('Failed to fetch chat:', err);
    } finally {
      setChatLoading(false);
    }
  };

  // Send message
  const sendMessage = async (message) => {
    if (!selectedId || !message.trim()) return;
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: selectedId, message }),
      });
      const data = await res.json();
      if (data.success && chatData) {
        setChatData(prev => ({
          ...prev,
          messages: [...prev.messages, data.data],
        }));
        // Update conversation list
        fetchConversations();
      }
      return data;
    } catch (err) {
      console.error('Failed to send message:', err);
      return { success: false, error: err.message };
    }
  };

  // Refresh chat periodically when a conversation is selected
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/conversations/${selectedId}`);
        const data = await res.json();
        if (data.success) setChatData(data.data);
      } catch (err) { /* silent */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedId]);

  return (
    <div className="chat-layout">
      <ConversationList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={selectConversation}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        loading={loading}
        hasMore={hasMore}
        total={total}
        onLoadMore={() => fetchConversations(true)}
      />

      {selectedId && chatData ? (
        <ChatWindow
          contact={chatData.contact}
          messages={chatData.messages}
          onSendMessage={sendMessage}
          loading={chatLoading}
          onToggleProfile={() => setShowProfile(!showProfile)}
        />
      ) : (
        <div className="chat-panel">
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <div className="chat-empty-text">Sohbet Seçin</div>
            <div className="chat-empty-hint">Bir sohbet seçerek mesajları görüntüleyin</div>
          </div>
        </div>
      )}

      {showProfile && chatData && (
        <ContactProfile
          contact={chatData.contact}
          orders={chatData.orders}
          notes={chatData.notes}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
