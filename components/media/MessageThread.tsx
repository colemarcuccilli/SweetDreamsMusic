'use client';

// components/media/MessageThread.tsx
//
// Round 8b: chat thread per media booking. Drop into the buyer order page,
// the admin MediaOrders panel, or the engineer's session view. The
// component fetches via /api/media/bookings/[id]/messages, infers the
// viewer's role from the response, and styles itself accordingly.
//
// No realtime sub yet — messages refresh on send + on window focus +
// every 30s while open. Good enough for this traffic profile; we can
// swap to Supabase realtime later by replacing the polling effect.
//
// Attachments are URL-paste only (Google Drive links etc.) — no Supabase
// Storage uploads, per Cole's spec.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Paperclip, X, Loader2, ExternalLink } from 'lucide-react';

interface Attachment {
  label: string;
  url: string;
  kind: 'image' | 'video' | 'file' | 'link';
}

interface Message {
  id: string;
  author_user_id: string | null;
  author_name: string;
  author_role: 'admin' | 'buyer' | 'engineer' | 'system';
  body: string;
  attachments: Attachment[];
  created_at: string;
}

interface ThreadResponse {
  role: 'admin' | 'buyer' | 'engineer';
  messages: Message[];
}

interface Props {
  bookingId: string;
  className?: string;
  /** When false, renders read-only (no input bar). Default true. */
  canPost?: boolean;
}

const POLL_INTERVAL_MS = 30_000;

export default function MessageThread({ bookingId, className, canPost = true }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerRole, setViewerRole] = useState<ThreadResponse['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [attachLabel, setAttachLabel] = useState('');
  const [attachUrl, setAttachUrl] = useState('');
  const [attachKind, setAttachKind] = useState<Attachment['kind']>('link');
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/media/bookings/${bookingId}/messages`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 404) setError('Conversation not available for this order.');
        else setError('Could not load messages.');
        setLoading(false);
        return;
      }
      const data = (await res.json()) as ThreadResponse;
      setMessages(data.messages);
      setViewerRole(data.role);
      setError(null);
    } catch {
      setError('Network error loading messages.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Initial load + poll while open + on focus
  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async () => {
    if (sending) return;
    if (!body.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/media/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), attachments }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not send message.');
      } else {
        // Optimistic-ish: append the returned message + clear input.
        setMessages((m) => [...m, data.message]);
        setBody('');
        setAttachments([]);
        setShowAttachForm(false);
        setError(null);
      }
    } catch {
      setError('Network error sending message.');
    } finally {
      setSending(false);
    }
  };

  const addAttachment = () => {
    const url = attachUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      setError('Attachment URL must start with http:// or https://');
      return;
    }
    if (attachments.length >= 10) {
      setError('Max 10 attachments per message');
      return;
    }
    setAttachments((a) => [
      ...a,
      { label: attachLabel.trim() || url, url, kind: attachKind },
    ]);
    setAttachLabel('');
    setAttachUrl('');
    setAttachKind('link');
    setError(null);
  };

  const removeAttachment = (i: number) => {
    setAttachments((a) => a.filter((_, idx) => idx !== i));
  };

  if (loading) {
    return (
      <div className={`border-2 border-black/10 p-6 text-center ${className ?? ''}`}>
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-black/40" />
        <p className="font-mono text-xs text-black/40 mt-2">Loading conversation…</p>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className={`border-2 border-red-300 bg-red-50 p-4 ${className ?? ''}`}>
        <p className="font-mono text-xs text-red-900">{error}</p>
      </div>
    );
  }

  return (
    <div className={`border-2 border-black/10 ${className ?? ''}`}>
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider font-bold">
          Conversation
        </p>
        {viewerRole && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
            you are: {viewerRole}
          </span>
        )}
      </div>

      <div
        ref={listRef}
        className="bg-white max-h-96 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <p className="font-mono text-xs text-black/50 text-center py-8">
            No messages yet. {canPost && 'Start the conversation below.'}
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} viewerRole={viewerRole} />
        ))}
      </div>

      {canPost && viewerRole && (
        <div className="border-t-2 border-black/10 bg-black/[0.02] p-3 space-y-2">
          {error && (
            <p className="font-mono text-[11px] text-red-700">{error}</p>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-black text-white font-mono text-[11px]"
                >
                  <Paperclip className="w-3 h-3" />
                  {a.label.slice(0, 40)}
                  <button onClick={() => removeAttachment(i)} className="hover:text-accent">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {showAttachForm && (
            <div className="border-2 border-black/20 bg-white p-2 space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Label (optional)"
                  value={attachLabel}
                  onChange={(e) => setAttachLabel(e.target.value)}
                  className="flex-1 border border-black/20 px-2 py-1 font-mono text-xs"
                />
                <select
                  value={attachKind}
                  onChange={(e) => setAttachKind(e.target.value as Attachment['kind'])}
                  className="border border-black/20 px-2 py-1 font-mono text-xs"
                >
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="file">File</option>
                </select>
              </div>
              <input
                type="url"
                placeholder="https://drive.google.com/…"
                value={attachUrl}
                onChange={(e) => setAttachUrl(e.target.value)}
                className="w-full border border-black/20 px-2 py-1 font-mono text-xs"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={addAttachment}
                  className="bg-black text-white font-mono text-[11px] uppercase tracking-wider px-3 py-1 hover:bg-accent hover:text-black transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAttachForm(false)}
                  className="font-mono text-[11px] text-black/60 hover:text-black px-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
              }}
              placeholder="Type a message… (Ctrl+Enter to send)"
              rows={2}
              className="flex-1 border-2 border-black/10 px-2 py-1.5 font-mono text-sm resize-none"
              disabled={sending}
            />
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setShowAttachForm((v) => !v)}
                title="Attach a link"
                className="border-2 border-black/10 hover:border-black p-2 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={send}
                disabled={sending || (!body.trim() && attachments.length === 0)}
                className="bg-black text-white p-2 hover:bg-accent hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────
function MessageBubble({
  message,
  viewerRole,
}: {
  message: Message;
  viewerRole: 'admin' | 'buyer' | 'engineer' | null;
}) {
  // Author's own messages right-align; others left-align. Visually mirrors
  // most chat apps so the viewer can scan.
  const isOwn = (() => {
    if (!viewerRole) return false;
    if (viewerRole === 'admin') return message.author_role === 'admin';
    if (viewerRole === 'buyer') return message.author_role === 'buyer';
    if (viewerRole === 'engineer') return message.author_role === 'engineer';
    return false;
  })();
  const isSystem = message.author_role === 'system';
  const date = new Date(message.created_at);
  const timeStr = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isSystem) {
    return (
      <div className="text-center">
        <p className="font-mono text-[11px] text-black/50 italic">
          {message.body} · {timeStr}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-mono text-[11px] font-bold text-black/85">
            {message.author_name}
          </span>
          <span
            className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${
              message.author_role === 'admin'
                ? 'bg-purple-100 text-purple-900'
                : message.author_role === 'engineer'
                ? 'bg-blue-100 text-blue-900'
                : 'bg-black/10 text-black/70'
            }`}
          >
            {message.author_role}
          </span>
          <span className="font-mono text-[10px] text-black/40">{timeStr}</span>
        </div>
        <div
          className={`px-3 py-2 ${
            isOwn ? 'bg-black text-white' : 'bg-black/[0.04] text-black'
          }`}
        >
          {message.body && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.body}</p>
          )}
          {message.attachments.length > 0 && (
            <ul className={`${message.body ? 'mt-2 pt-2 border-t' : ''} ${
              isOwn ? 'border-white/20' : 'border-black/15'
            } space-y-1`}>
              {message.attachments.map((a, i) => (
                <li key={i}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`font-mono text-xs inline-flex items-center gap-1 hover:underline ${
                      isOwn ? 'text-accent' : 'text-black'
                    }`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {a.label}
                    <span className="text-[9px] uppercase tracking-wider opacity-60">
                      ({a.kind})
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
