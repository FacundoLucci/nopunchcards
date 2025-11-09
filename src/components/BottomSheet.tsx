import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center backdrop-blur-sm bg-black/40 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full md:w-auto md:min-w-[480px] md:max-w-2xl",
          "bg-card rounded-t-xl md:rounded-xl border-t md:border border-border",
          "p-6 animate-in slide-in-from-bottom md:zoom-in-95 duration-300",
          "max-h-[85vh] md:max-h-[80vh] overflow-y-auto"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6 md:hidden" />

        {/* Close button (desktop) */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-4 right-4 w-8 h-8 rounded-full bg-muted items-center justify-center hover:bg-muted-foreground/20 transition-colors"
        >
          ✕
        </button>

        {/* Content */}
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

