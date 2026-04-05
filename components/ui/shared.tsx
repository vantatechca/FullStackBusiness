'use client';

import { ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────
// Centralized class strings so every component uses the same styles.

export const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all placeholder:text-gray-400';

export const selectCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none transition-all';

export const labelCls =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

export const textareaCls =
  `${inputCls} resize-none`;

export const btnPrimaryCls =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors shadow-sm disabled:opacity-50';

export const btnSecondaryCls =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors';

export const btnDangerCls =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50';

export const btnGhostCls =
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors';

export const cardCls =
  'bg-white border border-gray-200 rounded-2xl shadow-sm';

export const errorBoxCls =
  'px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600 font-medium';

// ─── Modal ────────────────────────────────────────────────────────────────
// A single, consistent modal shell used everywhere in the app.

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeMap[size]} mx-4 max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={
      <>
        <button onClick={onClose} className={btnSecondaryCls} disabled={loading}>Cancel</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={variant === 'danger' ? btnDangerCls : btnPrimaryCls}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {confirmLabel}
        </button>
      </>
    }>
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────
// Consistent label + input wrapper with optional hint text.

interface FormFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, hint, required, children }: FormFieldProps) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
        {hint && <span className="text-gray-300 font-normal normal-case ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto mb-3 text-gray-300">{icon}</div>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  color?: 'default' | 'emerald' | 'rose' | 'amber' | 'blue';
}

const valueColors = {
  default: 'text-gray-900',
  emerald: 'text-emerald-600',
  rose:    'text-rose-600',
  amber:   'text-amber-600',
  blue:    'text-blue-600',
};

export function StatCard({ label, value, detail, color = 'default' }: StatCardProps) {
  return (
    <div className={cardCls + ' p-5'}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${valueColors[color]}`}>{value}</p>
      {detail && <p className="text-xs text-gray-400 mt-1">{detail}</p>}
    </div>
  );
}
