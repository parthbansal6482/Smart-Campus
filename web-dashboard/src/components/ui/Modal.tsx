import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full bg-surface rounded-2xl border border-line shadow-pop animate-enter',
          size === 'sm' ? 'max-w-sm' : 'max-w-lg'
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="font-serif text-[26px] leading-tight text-ink">{title}</h2>
            {description && <p className="text-[13px] text-ink-3 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-sunken transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-6">{footer}</div>}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  destructive,
  isLoading,
  onConfirm,
  onCancel,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    size="sm"
    footer={
      <>
        <button
          onClick={onCancel}
          className="h-9 px-3.5 rounded-lg text-sm font-medium text-ink-2 hover:bg-sunken transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'h-9 px-3.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50',
            destructive ? 'bg-critical hover:bg-critical-hover' : 'bg-ink hover:bg-ink-hover'
          )}
        >
          {confirmLabel}
        </button>
      </>
    }
  >
    <p className="text-sm text-ink-2 leading-relaxed">{description}</p>
  </Modal>
);
