import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ToastState, ToastAction } from '@/types';

interface ToastProps extends ToastState {
  onDismiss: () => void;
  action?: ToastAction | null;
}

const Toast = ({ message, type = 'success', visible, onDismiss, action }: ToastProps) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setExiting(false);

    const startTimer = () => {
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(onDismiss, 200);
      }, 3000);
    };

    startTimer();

    const handleVisChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
      } else {
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisChange);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, [visible, message, onDismiss]);

  if (!visible) return null;

  const accentColor = type === 'success' ? 'var(--priority-low)' : 'var(--priority-high)';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[360px] px-4" role="alert" aria-live="polite">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${exiting ? 'toast-exit' : 'toast-enter'}`}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-elevated)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            width: 3,
            height: 24,
            borderRadius: 2,
            background: accentColor,
            flexShrink: 0,
          }}
        />
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
          {message}
        </span>
        {action && (
          <button
            onClick={action.onClick}
            className="pressable text-sm font-bold px-2 py-1 rounded-lg"
            style={{ color: 'var(--accent)' }}
          >
            {action.label}
          </button>
        )}
        <button
          onClick={() => { setExiting(true); setTimeout(onDismiss, 200); }}
          className="pressable p-1"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
