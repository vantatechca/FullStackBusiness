'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  CheckCircle2, Clock, AlertTriangle, Eye, MessageSquare,
  ChevronDown, ChevronUp, Search, Filter, Sparkles, XCircle,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { DailyCheckin } from '@/lib/types';

interface CheckInWithUser extends DailyCheckin {
  full_name: string;
  email: string;
  user_role: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  pending:       { label: 'Pending',      icon: <Clock size={13} />,          cls: 'bg-gray-100 text-gray-600'    },
  submitted:     { label: 'Submitted',    icon: <Sparkles size={13} />,       cls: 'bg-blue-50 text-blue-600'     },
  ai_processed:  { label: 'AI Processed', icon: <CheckCircle2 size={13} />,   cls: 'bg-amber-50 text-amber-600'   },
  reviewed:      { label: 'Reviewed',     icon: <CheckCircle2 size={13} />,   cls: 'bg-emerald-50 text-emerald-600'},
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const cls = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-500';
  return <span className={`text-xs font-medium ${cls}`}>{pct}%</span>;
}

export default function CheckInHistoryView() {
  const { profile, isManager } = useAuth();
  const [checkins, setCheckins] = useState<CheckInWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Review state
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchCheckins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set('date', dateFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/checkins?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCheckins(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { fetchCheckins(); }, [fetchCheckins]);

  const filtered = useMemo(() => {
    let list = checkins;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.raw_response?.toLowerCase().includes(q) ||
        c.ai_summary?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(c => c.status === statusFilter);
    }
    return list;
  }, [checkins, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: checkins.length,
    submitted: checkins.filter(c => c.status !== 'pending').length,
    aiProcessed: checkins.filter(c => c.status === 'ai_processed' || c.status === 'reviewed').length,
    reviewed: checkins.filter(c => c.status === 'reviewed').length,
    flagged: checkins.filter(c => {
      const flags = Array.isArray(c.ai_flags) ? c.ai_flags : [];
      return flags.some((f: any) => f.severity === 'high' || f.severity === 'medium');
    }).length,
  }), [checkins]);

  const handleReview = async (checkinId: string) => {
    if (!reviewNotes.trim()) { toast.error('Please add review notes'); return; }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/checkins/${checkinId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_notes: reviewNotes.trim() }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      toast.success('Review submitted');
      setReviewingId(null);
      setReviewNotes('');
      fetchCheckins();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header + Stats */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Daily Check-Ins</h2>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {[
            { label: 'Total',     count: stats.total,       cls: 'bg-gray-50 border-gray-200 text-gray-700' },
            { label: 'Submitted', count: stats.submitted,   cls: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'Reviewed',  count: stats.reviewed,    cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
            { label: 'Flagged',   count: stats.flagged,     cls: 'bg-rose-50 border-rose-100 text-rose-600' },
          ].map(s => (
            <div key={s.label} className={`px-3 py-2 rounded-xl border ${s.cls}`}>
              <p className="text-lg font-bold leading-none">{s.count}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#3b82f6] outline-none"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or content..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#3b82f6] outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#3b82f6] outline-none bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="ai_processed">AI Processed</option>
          <option value="reviewed">Reviewed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Check-in List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <XCircle size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No check-ins found for this date.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(checkin => {
            const isExpanded = expandedId === checkin.id;
            const flags = Array.isArray(checkin.ai_flags) ? checkin.ai_flags : [];
            const metrics = Array.isArray(checkin.ai_extracted_metrics) ? checkin.ai_extracted_metrics : [];
            const hasFlaggedIssues = flags.some((f: any) => f.severity === 'high' || f.severity === 'medium');

            return (
              <div key={checkin.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${hasFlaggedIssues ? 'border-amber-200' : 'border-gray-200'}`}>
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : checkin.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{checkin.full_name || 'Unknown'}</p>
                      <span className="text-xs text-gray-400">{checkin.user_role}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {checkin.ai_summary || checkin.raw_response?.slice(0, 100) || 'No response'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasFlaggedIssues && <AlertTriangle size={14} className="text-amber-500" />}
                    <StatusBadge status={checkin.status} />
                    {checkin.ai_confidence_score > 0 && (
                      <ConfidenceBadge score={Number(checkin.ai_confidence_score)} />
                    )}
                    {checkin.submitted_at && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(checkin.submitted_at), 'h:mm a')}
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
                    {/* Raw response */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Response</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{checkin.raw_response || '—'}</p>
                    </div>

                    {/* AI Summary */}
                    {checkin.ai_summary && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Summary</p>
                        <p className="text-sm text-blue-800 bg-blue-50 rounded-lg p-3">{checkin.ai_summary}</p>
                      </div>
                    )}

                    {/* Extracted Metrics */}
                    {metrics.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Extracted Metrics</p>
                        <div className="space-y-1">
                          {metrics.map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">{m.metric_name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold tabular-nums">{m.new_value}</span>
                                <span className={`text-xs font-medium ${m.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {m.delta >= 0 ? '+' : ''}{m.delta}
                                </span>
                                <ConfidenceBadge score={m.confidence || 0} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flags */}
                    {flags.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Flags</p>
                        <div className="space-y-1">
                          {flags.map((f: any, i: number) => (
                            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                              f.severity === 'high' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                              f.severity === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              'bg-gray-50 border-gray-200 text-gray-600'
                            }`}>
                              <AlertTriangle size={12} />
                              {f.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviewer Notes */}
                    {checkin.reviewer_notes && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Review Notes</p>
                        <p className="text-sm text-gray-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">{checkin.reviewer_notes}</p>
                      </div>
                    )}

                    {/* Review action (manager+) */}
                    {isManager && checkin.status !== 'reviewed' && checkin.status !== 'pending' && (
                      <div>
                        {reviewingId === checkin.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={reviewNotes}
                              onChange={e => setReviewNotes(e.target.value)}
                              placeholder="Add your review notes..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReview(checkin.id)}
                                disabled={submittingReview}
                                className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                              </button>
                              <button
                                onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                                className="px-4 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewingId(checkin.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3b82f6] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <MessageSquare size={13} /> Review this check-in
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
