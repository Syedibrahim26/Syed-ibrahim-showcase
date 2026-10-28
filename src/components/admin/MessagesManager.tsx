import React, { useState } from 'react';
import { Mail, MailOpen, Trash2, Reply, Clock, CheckCircle2, Search, Inbox, AlertCircle } from 'lucide-react';
import { Message } from '../../types';
import { api } from '../../services/api';

interface MessagesManagerProps {
  messages: Message[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const MessagesManager: React.FC<MessagesManagerProps> = ({ messages, onRefresh, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredMessages = messages.filter(
    (m) =>
      m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sender_phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject && m.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleRead = async (m: Message) => {
    try {
      await api.messages.toggleRead(m.id);
      onRefresh();
    } catch (e) {
      // Ignore
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await api.messages.delete(id);
      setFeedback('Message deleted.');
      setTimeout(() => setFeedback(null), 3000);
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      onRefresh();
    } catch (e) {
      setFeedback('Failed to delete message.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Messages & Inquiries</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Messages and collaboration inquiries submitted by recruiters and visitors via your portfolio contact form.
          </p>
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          {messages.filter((m) => !m.is_read).length} unread • {messages.length} total
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          {feedback}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search inquiries by sender, email, or message..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Messages list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages List Column */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-400 text-sm">Loading messages...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-800">Inbox is empty</h3>
              <p className="text-xs text-zinc-500 mt-1">
                When visitors submit notes through your contact section, they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.is_read) handleToggleRead(msg);
                  }}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedMessage?.id === msg.id
                      ? 'bg-zinc-100/90'
                      : msg.is_read
                      ? 'hover:bg-zinc-50'
                      : 'bg-zinc-50/70 hover:bg-zinc-100/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          msg.is_read ? 'bg-transparent' : 'bg-emerald-500'
                        }`}
                      />
                      <span className={`text-sm font-semibold ${msg.is_read ? 'text-zinc-700' : 'text-zinc-900'}`}>
                        {msg.sender_name}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-500 truncate mt-0.5">{msg.sender_email}</div>
                  {msg.sender_phone && <div className="text-xs text-zinc-500 truncate">{msg.sender_phone}</div>}

                  <div className="text-xs text-zinc-800 font-medium mt-1 truncate">
                    {msg.subject || 'No subject'}
                  </div>

                  <p className="text-xs text-zinc-600 line-clamp-1 mt-0.5">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail Column */}
        <div className="lg:col-span-6">
          {selectedMessage ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {selectedMessage.subject || 'Portfolio Inquiry'}
                  </h3>
                  <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-800">{selectedMessage.sender_name}</span>
                    <span>&lt;{selectedMessage.sender_email}&gt;</span>
                  </div>
                  {selectedMessage.sender_phone && (
                    <div className="text-xs text-zinc-500 mt-1">Phone: {selectedMessage.sender_phone}</div>
                  )}
                  <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleRead(selectedMessage)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                    title={selectedMessage.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {selectedMessage.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line bg-zinc-50/70 p-4 rounded-xl border border-zinc-100">
                {selectedMessage.message}
              </div>

              <div className="pt-2">
                <a
                  href={`mailto:${selectedMessage.sender_email}?subject=${encodeURIComponent(
                    'Re: ' + (selectedMessage.subject || 'Portfolio Inquiry')
                  )}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-xs"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Reply to {selectedMessage.sender_name}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-zinc-400 h-full flex flex-col items-center justify-center min-h-[300px]">
              <Mail className="w-8 h-8 stroke-[1.5] mb-2" />
              <p className="text-xs">Select an inquiry from the list to view full details and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
