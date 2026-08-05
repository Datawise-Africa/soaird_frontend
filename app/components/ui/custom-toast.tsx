import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import type { Toast } from 'react-hot-toast';

interface CustomToastProps {
  toast: Toast;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  onDismiss: () => void;
}

export function CustomToast({
  toast,
  title,
  message,
  type,
  onDismiss,
}: Readonly<CustomToastProps>) {
  const config = {
    success: {
      icon: CheckCircle,
      borderColor: 'border-emerald-500/60',
      iconBgColor: 'bg-emerald-500',
      textColor: 'text-emerald-200',
    },
    info: {
      icon: Info,
      borderColor: 'border-primary/60',
      iconBgColor: 'bg-primary',
      textColor: 'text-primary',
    },
    warning: {
      icon: AlertTriangle,
      borderColor: 'border-amber-400/60',
      iconBgColor: 'bg-amber-500',
      textColor: 'text-amber-200',
    },
    error: {
      icon: XCircle,
      borderColor: 'border-destructive/60',
      iconBgColor: 'bg-destructive',
      textColor: 'text-red-200',
    },
  };

  const { icon: Icon, borderColor, iconBgColor, textColor } = config[type];

  return (
    <div
      className={`bg-popover text-popover-foreground ${borderColor} flex min-w-87.5 max-w-md items-start gap-3 rounded-2xl border-2 p-4 shadow-xl ${
        toast.visible ? 'animate-enter' : 'animate-leave'
      }`}
    >
      {/* Icon */}
      <div className={`${iconBgColor} rounded-full p-2 shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <h3 className={`font-bold ${textColor} text-base mb-0.5`}>{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}