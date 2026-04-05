'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  X, Send, Loader2, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
  Pencil, Trash2, Plus, Sparkles, Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/* eslint-disable @next/next/no-img-element */

interface Assignment {
  asset_id: string;
  role_in_metric: string;
  category: string;
  metric: string;
  value: number;
  previous_value: number;
  direction: 'up_good' | 'down_good';
  tracking: 'total' | 'daily';
  department_id: string | null;
}

interface ExtractedMetric {
  asset_id: string;
  metric_name: string;
  new_value: number;
  delta: number;
  confidence: number;
  notes?: string;
}

interface AIFlag {
  description: string;
  severity: 'low' | 'medium' | 'high';
}

type Step = 'context' | 'writing' | 'processing' | 'review' | 'done';

export default function CheckInModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('context');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkinId, setCheckinId] = useState<string | null>(null);

  // AI results
  const [aiSummary, setAiSummary] = useState('');
  const [extractedMetrics, setExtractedMetrics] = useState<ExtractedMetric[]>([]);
  const [aiFlags, setAiFlags] = useState<AIFlag[]>([]);
  const [aiConfidence, setAiConfidence] = useState(0);

  // Editing extracted metrics
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDelta, setEditDelta] = useState('');

  // Context collapse
  const [contextExpanded, setContextExpanded] = useState(true);

  // Fetch assignments on open
  useEffect(() => {
    if (!open) return;
    setStep('context');
    setResponse('');
    setCheckinId(null);
    setExtractedMetrics([]);
    setAiFlags([]);
    setAiSummary('');
    setLoading(true);

    fetch('/api/checkins/today')
      .then(r => r.json())
      .then(data => {
        setAssignments(data.assignments || []);
        if (data.hasCheckedIn) {
          // Already checked in — show done state
          setStep('done');
        }
      })
      .catch(() => toast.error('Failed to load check-in data'))
      .finally(() => setLoading(false));
  }, [open]);

  // Submit check-in text
  const handleSubmit = useCallback(async () => {
    if (!response.trim()) {
      toast.error('Please write your check-in before submitting');
      return;
    }
    setSubmitting(true);
    try {
      // Step 1: Submit the raw response
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_response: response.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit check-in');
      }
      const checkin = await res.json();
      setCheckinId(checkin.id);
      setStep('processing');

      // Step 2: Send to AI for parsing
      const parseRes = await fetch('/api/checkins/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin_id: checkin.id, raw_response: response.trim() }),
      });
      const parseData = await parseRes.json();

      setAiSummary(parseData.ai_summary || '');
      setExtractedMetrics(parseData.ai_extracted_metrics || []);
      setAiFlags(parseData.ai_flags || []);
      setAiConfidence(parseData.ai_confidence_score || 0);
      setStep('review');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process check-in');
      setStep('writing');
    } finally {
      setSubmitting(false);
    }
  }, [response]);

  // Confirm metrics
  const handleConfirm = useCallback(async () => {
    if (!checkinId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/checkins/${checkinId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: extractedMetrics.map(m => ({
            asset_id: m.asset_id,
            new_value: m.new_value,
            delta: m.delta,
            notes: m.notes || '',
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to confirm metrics');
      setStep('done');
      toast.success('Check-in complete! Metrics updated.');
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm metrics');
    } finally {
      setSubmitting(false);
    }
  }, [checkinId, extractedMetrics, onComplete]);

  // Skip metrics (confirm with empty array)
  const handleSkipMetrics = useCallback(async () => {
    if (!checkinId) return;
    setSubmitting(true);
    try {
      await fetch(`/api/checkins/${checkinId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: [] }),
      });
      setStep('done');
      toast.success('Check-in submitted without metric updates');
      onComplete();
    } catch {
      toast.error('Failed to complete check-in');
    } finally {
      setSubmitting(false);
    }
  }, [checkinId, onComplete]);

  // Defer check-in
  const handleDefer = useCallback(async () => {
    try {
      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_response: '', deferred: true }),
      });
      toast('Check-in deferred. You can complete it later today.', { icon: '⏰' });
      onClose();
    } catch {
      toast.error('Failed to defer check-in');
    }
  }, [onClose]);

  // Edit a metric
  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(String(extractedMetrics[idx].new_value));
    setEditDelta(String(extractedMetrics[idx].delta));
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    setExtractedMetrics(prev => prev.map((m, i) =>
      i === editingIdx ? { ...m, new_value: Number(editValue), delta: Number(editDelta) } : m
    ));
    setEditingIdx(null);
  };

  const removeMetric = (idx: number) => {
    setExtractedMetrics(prev => prev.filter((_, i) => i !== idx));
  };

  // Manual metric add
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualAssetId, setManualAssetId] = useState('');
  const [manualValue, setManualValue] = useState('');
  const [manualDelta, setManualDelta] = useState('');

  const addManualMetric = () => {
    const asset = assignments.find(a => a.asset_id === manualAssetId);
    if (!asset || !manualValue) return;
    setExtractedMetrics(prev => [...prev, {
      asset_id: manualAssetId,
      metric_name: asset.metric,
      new_value: Number(manualValue),
      delta: Number(manualDelta) || 0,
      confidence: 1.0,
      notes: 'Manually added',
    }]);
    setShowManualAdd(false);
    setManualAssetId('');
    setManualValue('');
    setManualDelta('');
  };

  if (!open) return null;

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3b82f6] flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Daily Check-In</h2>
              <p className="text-xs text-gray-500">
                {step === 'context' && 'Review your assignments'}
                {step === 'writing' && 'Tell us what you accomplished'}
                {step === 'processing' && 'AI is analyzing your report...'}
                {step === 'review' && 'Review extracted metrics'}
                {step === 'done' && 'All done for today!'}
              </p>
            </div>
          </div>
          {step !== 'processing' && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#3b82f6]" />
            </div>
          )}

          {/* Already done */}
          {step === 'done' && !loading && (
            <div className="text-center py-10">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Check-in complete!</h3>
              <p className="text-sm text-gray-500">Great work, {profile?.full_name?.split(' ')[0]}. See you tomorrow.</p>
            </div>
          )}

          {/* Step 1: Context — show assignments */}
          {step === 'context' && !loading && (
            <>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-2">You have no metric assignments yet.</p>
                  <p className="text-xs text-gray-400">You can still submit a check-in about your work today.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Assigned Metrics</h3>
                  <div className="space-y-2">
                    {assignments.map(a => {
                      const delta = Number(a.value) - Number(a.previous_value);
                      const improving = a.direction === 'up_good' ? delta > 0 : delta < 0;
                      return (
                        <div key={a.asset_id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{a.metric}</p>
                            <p className="text-xs text-gray-400">{a.category} &middot; {a.role_in_metric}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900 tabular-nums">{Number(a.value).toLocaleString()}</p>
                            {delta !== 0 && (
                              <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${improving ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {improving ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                                {delta > 0 ? '+' : ''}{delta}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('writing')}
                className="w-full py-3 bg-[#3b82f6] text-white text-sm font-semibold rounded-xl hover:bg-[#2563eb] transition-colors shadow-sm"
              >
                Start Check-In
              </button>
            </>
          )}

          {/* Step 2: Writing */}
          {step === 'writing' && (
            <>
              {/* Collapsible context */}
              {assignments.length > 0 && (
                <div>
                  <button
                    onClick={() => setContextExpanded(!contextExpanded)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700 transition-colors"
                  >
                    Your Metrics
                    {contextExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {contextExpanded && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {assignments.map(a => (
                        <div key={a.asset_id} className="px-2.5 py-2 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs font-medium text-gray-700 truncate">{a.metric}</p>
                          <p className="text-sm font-bold text-gray-900 tabular-nums">{Number(a.value).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  What did you accomplish today?
                </label>
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder={assignments.length > 0
                    ? `Describe your progress on your assigned metrics. For example:\n"Created 5 GMC accounts today, submitted 3 for review. 1 got approved, 2 still pending."`
                    : "Describe what you worked on today..."
                  }
                  rows={6}
                  className={`${inputCls} resize-none`}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Be specific about numbers and metrics. The AI will extract updates automatically.
                </p>
              </div>
            </>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6]/20" />
                <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6] border-t-transparent animate-spin" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-[#3b82f6]" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Analyzing your report</h3>
              <p className="text-sm text-gray-500">AI is extracting metric updates from your check-in...</p>
            </div>
          )}

          {/* Step 4: Review AI results */}
          {step === 'review' && (
            <>
              {/* AI Summary */}
              {aiSummary && (
                <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">AI Summary</p>
                  <p className="text-sm text-blue-900">{aiSummary}</p>
                  {aiConfidence > 0 && (
                    <p className="text-xs text-blue-500 mt-1">
                      Confidence: {Math.round(aiConfidence * 100)}%
                    </p>
                  )}
                </div>
              )}

              {/* Flags */}
              {aiFlags.length > 0 && (
                <div className="space-y-2">
                  {aiFlags.map((flag, i) => (
                    <div key={i} className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${
                      flag.severity === 'high' ? 'bg-rose-50 border-rose-200' :
                      flag.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${
                        flag.severity === 'high' ? 'text-rose-500' :
                        flag.severity === 'medium' ? 'text-amber-500' :
                        'text-gray-400'
                      }`} />
                      <p className="text-xs text-gray-700">{flag.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted Metrics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Extracted Metric Updates</h3>
                  <button
                    onClick={() => setShowManualAdd(true)}
                    className="flex items-center gap-1 text-xs font-medium text-[#3b82f6] hover:text-[#2563eb] transition-colors"
                  >
                    <Plus size={12} /> Add Manually
                  </button>
                </div>

                {extractedMetrics.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500">No metric updates were extracted.</p>
                    <p className="text-xs text-gray-400 mt-1">You can add them manually or skip.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extractedMetrics.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl">
                        {editingIdx === idx ? (
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">{m.metric_name}</p>
                              <div className="flex gap-2">
                                <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="New value" className="w-24 px-2 py-1 border rounded text-sm" />
                                <input type="number" value={editDelta} onChange={e => setEditDelta(e.target.value)} placeholder="Delta" className="w-20 px-2 py-1 border rounded text-sm" />
                              </div>
                            </div>
                            <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                              <CheckCircle2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{m.metric_name}</p>
                              <p className="text-xs text-gray-400">
                                Confidence: {Math.round(m.confidence * 100)}%
                              </p>
                            </div>
                            <div className="text-right shrink-0 mr-2">
                              <p className="text-sm font-bold text-gray-900 tabular-nums">{m.new_value.toLocaleString()}</p>
                              <p className={`text-xs font-medium ${m.delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {m.delta >= 0 ? '+' : ''}{m.delta}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => startEdit(idx)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => removeMetric(idx)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual add form */}
                {showManualAdd && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <select
                      value={manualAssetId}
                      onChange={e => setManualAssetId(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-sm"
                    >
                      <option value="">Select metric...</option>
                      {assignments
                        .filter(a => !extractedMetrics.some(m => m.asset_id === a.asset_id))
                        .map(a => (
                          <option key={a.asset_id} value={a.asset_id}>{a.metric} (current: {Number(a.value)})</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                      <input type="number" value={manualValue} onChange={e => setManualValue(e.target.value)} placeholder="New value" className="flex-1 px-2 py-1.5 border rounded-lg text-sm" />
                      <input type="number" value={manualDelta} onChange={e => setManualDelta(e.target.value)} placeholder="Change (+/-)" className="w-28 px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addManualMetric} disabled={!manualAssetId || !manualValue} className="px-3 py-1.5 bg-[#3b82f6] text-white text-xs font-medium rounded-lg hover:bg-[#2563eb] disabled:opacity-50">Add</button>
                      <button onClick={() => setShowManualAdd(false)} className="px-3 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && step !== 'done' && step !== 'processing' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {step === 'context' && (
              <>
                <button onClick={handleDefer} className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <Clock size={13} /> Defer (1x/day)
                </button>
                <div />
              </>
            )}

            {step === 'writing' && (
              <>
                <button onClick={() => setStep('context')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !response.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Check-In
                </button>
              </>
            )}

            {step === 'review' && (
              <>
                <button onClick={handleSkipMetrics} disabled={submitting} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Skip Metrics
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Confirm & Update Metrics
                </button>
              </>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="flex items-center justify-center px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
