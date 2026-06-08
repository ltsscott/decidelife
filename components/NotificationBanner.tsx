"use client";

import { X } from "lucide-react";

interface NotificationBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function NotificationBanner({ message, onDismiss }: NotificationBannerProps) {
  if (!message) return null;

  return (
    <div className="mb-4 flex animate-rise items-center justify-between gap-4 rounded-xl border border-mint/40 bg-gradient-to-r from-mint/12 to-cyan/10 px-4 py-3 text-sm text-mint shadow-glow backdrop-blur-xl">
      <p>{message}</p>
      <button type="button" className="dl-button grid h-7 w-7 place-items-center rounded-md hover:bg-white/10" onClick={onDismiss}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
