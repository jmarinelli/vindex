import { WifiOff } from "lucide-react";

interface OfflineBannerProps {
  message: string;
}

export function OfflineBanner({ message }: OfflineBannerProps) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 bg-amber-50 border-b border-amber-200 h-8 w-full"
      role="alert"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
      <span className="text-xs text-amber-600">{message}</span>
    </div>
  );
}
