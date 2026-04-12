'use client';

import { useState, useEffect, useMemo } from 'react';
import { Send, Clock, Search, X, ChevronDown, Mail, Users, Mic, Music, CheckCircle } from 'lucide-react';

// ── Email Templates ──────────────────────────────────────────────────
interface EmailTemplate {
  key: string;
  name: string;
  subject: string;
  body: string;
  icon: string;
  color: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    key: 'disregard',
    name: 'Disregard',
    subject: 'Please Disregard — Previous Email Sent in Error',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">PLEASE DISREGARD</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">Hey there, we apologize for the confusion!</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">You may have received an email from us recently that was sent in error. <strong>Please disregard it — no action is needed on your part.</strong></p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We\'re sorry for any inconvenience. If you have any questions, feel free to reach out.</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'X',
    color: 'bg-red-50 border-red-200 text-red-700',
  },
  {
    key: 'studio_update',
    name: 'Studio Update',
    subject: 'Studio Update — ',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">STUDIO UPDATE</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">Hey there!</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We wanted to let you know about some exciting changes at Sweet Dreams Music.</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">[Your update here]</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'Studio',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    key: 'new_service',
    name: 'New Service',
    subject: 'Now Available — ',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">NOW AVAILABLE</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We\'re excited to announce a new service at Sweet Dreams Music!</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">[Describe the new service]</p>\n<a href="https://sweetdreamsmusic.com" style="display:inline-block;background:#F4C430;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:13px;padding:14px 28px;text-decoration:none;margin-top:16px">CHECK IT OUT</a>\n<br/><br/>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'New',
    color: 'bg-green-50 border-green-200 text-green-700',
  },
  {
    key: 'holiday_hours',
    name: 'Holiday Hours',
    subject: 'Holiday Hours — ',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">HOLIDAY HOURS</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">Just a heads up about our upcoming holiday schedule:</p>\n<table style="margin:20px 0;border-collapse:collapse"><tr><td style="padding:6px 16px 6px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">DATES</td><td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600">[dates here]</td></tr><tr><td style="padding:6px 16px 6px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">HOURS</td><td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600">[hours here]</td></tr></table>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">Regular hours resume [date]. Book your sessions now before slots fill up!</p>\n<a href="https://sweetdreamsmusic.com/book" style="display:inline-block;background:#F4C430;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:13px;padding:14px 28px;text-decoration:none;margin-top:16px">BOOK A SESSION</a>\n<br/><br/>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'Holiday',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    key: 'promotion',
    name: 'Promotion',
    subject: 'Special Offer — ',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">SPECIAL OFFER</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We\'ve got something special for you!</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">[Describe the promotion/offer]</p>\n<a href="https://sweetdreamsmusic.com/book" style="display:inline-block;background:#F4C430;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:13px;padding:14px 28px;text-decoration:none;margin-top:16px">BOOK NOW</a>\n<br/><br/>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'Promo',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
  {
    key: 'thank_you',
    name: 'Thank You',
    subject: 'Thank You — ',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">THANK YOU</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We just wanted to take a moment to say thank you.</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">[Your message here]</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We appreciate your support and look forward to seeing you again!</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'Thanks',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
  },
  {
    key: 'policy_update',
    name: 'Policy Update',
    subject: 'Important Update — ',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">IMPORTANT UPDATE</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We\'re writing to let you know about an update to our policies.</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">[Describe the policy change]</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">These changes take effect [date]. If you have any questions, don\'t hesitate to reach out.</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'Policy',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
  },
  {
    key: 'custom',
    name: 'Custom',
    subject: '',
    body: '<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">[TITLE]</h1>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">[Your message here]</p>\n<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p>',
    icon: 'Custom',
    color: 'bg-black/5 border-black/20 text-black/70',
  },
];

// ── Types ────────────────────────────────────────────────────────────
interface Recipient {
  email: string;
  name: string;
  role: string;
}

interface Broadcast {
  id: string;
  subject: string;
  body_html: string;
  template_key: string | null;
  recipient_count: number;
  recipient_emails: string[];
  sent_by: string | null;
  created_at: string;
}

type SubView = 'compose' | 'history';

// ── Component ────────────────────────────────────────────────────────
export default function Notifications() {
  const [subView, setSubView] = useState<SubView>('compose');

  // Compose state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [manualEmails, setManualEmails] = useState('');
  const [recipientMode, setRecipientMode] = useState<'groups' | 'individual' | 'manual'>('groups');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sentCount: number; failedCount: number; total: number } | null>(null);

  // Recipients data
  const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  // History
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [expandedBroadcast, setExpandedBroadcast] = useState<string | null>(null);

  // Load recipients + history on mount
  useEffect(() => {
    loadRecipients();
    loadHistory();
  }, []);

  async function loadRecipients() {
    setLoadingRecipients(true);
    try {
      const res = await fetch('/api/admin/library/clients');
      const data = await res.json();
      const clients = (data.clients || []).map((c: { email: string; display_name: string; role: string; is_producer: boolean }) => ({
        email: c.email,
        name: c.display_name || c.email,
        role: c.is_producer ? 'producer' : c.role || 'user',
      })).filter((c: Recipient) => c.email);
      setAllRecipients(clients);
    } catch { /* */ }
    setLoadingRecipients(false);
  }

  async function loadHistory() {
    try {
      const res = await fetch('/api/admin/broadcasts');
      const data = await res.json();
      setBroadcasts(data.broadcasts || []);
    } catch { /* */ }
  }

  // Filtered recipients for search
  const filteredRecipients = useMemo(() => {
    if (!searchQuery) return allRecipients;
    const q = searchQuery.toLowerCase();
    return allRecipients.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [allRecipients, searchQuery]);

  // Group helpers
  const clientEmails = useMemo(() => allRecipients.filter(r => r.role === 'user').map(r => r.email), [allRecipients]);
  const engineerEmails = useMemo(() => allRecipients.filter(r => r.role === 'engineer').map(r => r.email), [allRecipients]);
  const producerEmails = useMemo(() => allRecipients.filter(r => r.role === 'producer').map(r => r.email), [allRecipients]);
  const allEmails = useMemo(() => allRecipients.map(r => r.email), [allRecipients]);

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBodyHtml(template.body);
    setSendResult(null);
  }

  function selectGroup(emails: string[]) {
    setSelectedEmails(new Set(emails));
  }

  function toggleEmail(email: string) {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  // Compute final recipient list
  function getFinalRecipients(): string[] {
    if (recipientMode === 'manual') {
      return manualEmails.split(/[,;\n]/).map(e => e.trim()).filter(e => e.includes('@'));
    }
    return [...selectedEmails];
  }

  async function handleSend() {
    const recipients = getFinalRecipients();
    if (recipients.length === 0) { alert('No recipients selected'); return; }
    if (!subject) { alert('Subject is required'); return; }
    if (!bodyHtml) { alert('Email body is required'); return; }

    if (!confirm(`Send this email to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}?`)) return;

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          bodyHtml,
          templateKey: selectedTemplate?.key || 'custom',
          recipientEmails: recipients,
        }),
      });
      const data = await res.json();
      setSendResult(data);
      loadHistory();
    } catch {
      alert('Failed to send');
    }
    setSending(false);
  }

  function resetCompose() {
    setSelectedTemplate(null);
    setSubject('');
    setBodyHtml('');
    setSelectedEmails(new Set());
    setManualEmails('');
    setSendResult(null);
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* Sub-navigation */}
      <div className="flex gap-1 mb-6">
        {([
          { key: 'compose' as SubView, label: 'Compose', icon: Send },
          { key: 'history' as SubView, label: 'History', icon: Clock },
        ]).map(v => (
          <button
            key={v.key}
            onClick={() => setSubView(v.key)}
            className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors inline-flex items-center gap-1.5 ${
              subView === v.key ? 'bg-black text-white' : 'bg-black/5 text-black/70 hover:bg-black/10'
            }`}
          >
            <v.icon className="w-3 h-3" />
            {v.label}
          </button>
        ))}
      </div>

      {/* ════════════ COMPOSE ════════════ */}
      {subView === 'compose' && (
        <div className="space-y-6">
          {/* Send result */}
          {sendResult && (
            <div className={`border-2 p-4 ${sendResult.failedCount === 0 ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${sendResult.failedCount === 0 ? 'text-green-600' : 'text-amber-600'}`} />
                <p className="font-mono text-sm font-bold">
                  {sendResult.sentCount} of {sendResult.total} email{sendResult.total > 1 ? 's' : ''} sent successfully
                  {sendResult.failedCount > 0 && ` (${sendResult.failedCount} failed)`}
                </p>
              </div>
              <button onClick={resetCompose} className="font-mono text-xs text-accent hover:underline mt-2">
                Compose another
              </button>
            </div>
          )}

          {/* Step 1: Pick template */}
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black/60 mb-3">1. Choose a Template</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.key}
                  onClick={() => selectTemplate(t)}
                  className={`border-2 p-3 text-left transition-all ${
                    selectedTemplate?.key === t.key
                      ? 'border-accent bg-accent/10'
                      : `${t.color} hover:border-black/30`
                  }`}
                >
                  <p className="font-mono text-xs font-bold uppercase tracking-wider">{t.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Subject + Body */}
          {selectedTemplate && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black/60">2. Customize Email</h3>
              <div>
                <label className="font-mono text-[10px] text-black/60 uppercase tracking-wider block mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
                  placeholder="Email subject..."
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-black/60 uppercase tracking-wider block mb-1">
                  Body (HTML — edit text between tags, keep styling)
                </label>
                <textarea
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  rows={10}
                  className="w-full border-2 border-black px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none resize-y"
                />
              </div>
              {/* Preview */}
              <div>
                <p className="font-mono text-[10px] text-black/60 uppercase tracking-wider mb-1">Preview</p>
                <div className="border border-black/10 bg-black p-6 overflow-auto max-h-80">
                  <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {selectedTemplate && subject && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black/60">3. Select Recipients</h3>

              {/* Mode tabs */}
              <div className="flex gap-1">
                {([
                  { key: 'groups' as const, label: 'Quick Groups' },
                  { key: 'individual' as const, label: 'Individual' },
                  { key: 'manual' as const, label: 'Manual Entry' },
                ]).map(m => (
                  <button
                    key={m.key}
                    onClick={() => setRecipientMode(m.key)}
                    className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 ${
                      recipientMode === m.key ? 'bg-accent text-black' : 'bg-black/5 text-black/70 hover:bg-black/10'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Groups */}
              {recipientMode === 'groups' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button onClick={() => selectGroup(allEmails)} className="border-2 border-black/10 p-3 hover:border-accent text-left">
                    <Users className="w-4 h-4 text-black/40 mb-1" />
                    <p className="font-mono text-xs font-bold">Everyone</p>
                    <p className="font-mono text-[10px] text-black/60">{allEmails.length} people</p>
                  </button>
                  <button onClick={() => selectGroup(clientEmails)} className="border-2 border-black/10 p-3 hover:border-accent text-left">
                    <Users className="w-4 h-4 text-black/40 mb-1" />
                    <p className="font-mono text-xs font-bold">All Clients</p>
                    <p className="font-mono text-[10px] text-black/60">{clientEmails.length} people</p>
                  </button>
                  <button onClick={() => selectGroup(engineerEmails)} className="border-2 border-black/10 p-3 hover:border-accent text-left">
                    <Mic className="w-4 h-4 text-black/40 mb-1" />
                    <p className="font-mono text-xs font-bold">Engineers</p>
                    <p className="font-mono text-[10px] text-black/60">{engineerEmails.length} people</p>
                  </button>
                  <button onClick={() => selectGroup(producerEmails)} className="border-2 border-black/10 p-3 hover:border-accent text-left">
                    <Music className="w-4 h-4 text-black/40 mb-1" />
                    <p className="font-mono text-xs font-bold">Producers</p>
                    <p className="font-mono text-[10px] text-black/60">{producerEmails.length} people</p>
                  </button>
                </div>
              )}

              {/* Individual selection */}
              {recipientMode === 'individual' && (
                <div>
                  <div className="relative mb-2">
                    <Search className="w-4 h-4 text-black/30 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full border border-black/20 pl-9 pr-3 py-2 font-mono text-xs focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="border border-black/10 max-h-60 overflow-y-auto">
                    {loadingRecipients ? (
                      <p className="font-mono text-xs text-black/60 p-3">Loading...</p>
                    ) : filteredRecipients.length === 0 ? (
                      <p className="font-mono text-xs text-black/60 p-3">No matching users</p>
                    ) : (
                      filteredRecipients.map(r => (
                        <label key={r.email} className="flex items-center gap-3 px-3 py-2 hover:bg-black/[0.02] cursor-pointer border-b border-black/5 last:border-0">
                          <input
                            type="checkbox"
                            checked={selectedEmails.has(r.email)}
                            onChange={() => toggleEmail(r.email)}
                            className="accent-amber-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-xs font-bold">{r.name}</span>
                            <span className="font-mono text-[10px] text-black/60 ml-2">{r.email}</span>
                          </div>
                          <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                            r.role === 'engineer' ? 'bg-blue-100 text-blue-700' :
                            r.role === 'producer' ? 'bg-purple-100 text-purple-700' :
                            r.role === 'admin' ? 'bg-red-100 text-red-700' :
                            'bg-black/5 text-black/60'
                          }`}>
                            {r.role}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Manual entry */}
              {recipientMode === 'manual' && (
                <textarea
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  rows={4}
                  placeholder="Enter email addresses separated by commas or new lines..."
                  className="w-full border-2 border-black px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none resize-y"
                />
              )}

              {/* Selected count */}
              {recipientMode !== 'manual' && selectedEmails.size > 0 && (
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-accent font-bold">{selectedEmails.size} recipient{selectedEmails.size > 1 ? 's' : ''} selected</p>
                  <button onClick={() => setSelectedEmails(new Set())} className="font-mono text-[10px] text-black/60 hover:text-black">
                    <X className="w-3 h-3 inline" /> Clear
                  </button>
                </div>
              )}
              {recipientMode === 'manual' && manualEmails.trim() && (
                <p className="font-mono text-xs text-accent font-bold">
                  {manualEmails.split(/[,;\n]/).filter(e => e.trim().includes('@')).length} recipient(s)
                </p>
              )}
            </div>
          )}

          {/* Step 4: Send */}
          {selectedTemplate && subject && getFinalRecipients().length > 0 && !sendResult && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-accent text-black font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 hover:bg-accent/90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {sending ? 'Sending...' : `Send to ${getFinalRecipients().length} Recipient${getFinalRecipients().length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {/* ════════════ HISTORY ════════════ */}
      {subView === 'history' && (
        <div className="space-y-3">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black/60 mb-3">Broadcast History</h3>
          {broadcasts.length === 0 ? (
            <p className="font-mono text-sm text-black/60 py-8 text-center">No broadcasts sent yet</p>
          ) : (
            broadcasts.map(b => (
              <div key={b.id} className="border border-black/10">
                <button
                  onClick={() => setExpandedBroadcast(expandedBroadcast === b.id ? null : b.id)}
                  className="w-full p-4 text-left flex items-center gap-4 hover:bg-black/[0.02]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold truncate">{b.subject}</p>
                    <p className="font-mono text-[10px] text-black/60">
                      {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {' · '}{b.recipient_count} recipient{b.recipient_count !== 1 ? 's' : ''}
                      {b.sent_by && ` · by ${b.sent_by}`}
                      {b.template_key && ` · ${b.template_key}`}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-black/30 transition-transform ${expandedBroadcast === b.id ? 'rotate-180' : ''}`} />
                </button>
                {expandedBroadcast === b.id && (
                  <div className="border-t border-black/10 p-4 space-y-3">
                    <div>
                      <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider mb-1">Recipients</p>
                      <p className="font-mono text-xs text-black/70">{b.recipient_emails.join(', ')}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider mb-1">Email Preview</p>
                      <div className="border border-black/10 bg-black p-4 overflow-auto max-h-60">
                        <div dangerouslySetInnerHTML={{ __html: b.body_html }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
