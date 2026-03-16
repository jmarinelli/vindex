import { SyncProvider } from "@/offline/sync-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SyncProvider>{children}</SyncProvider>;
}
