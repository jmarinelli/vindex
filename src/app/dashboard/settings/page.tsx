import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNodeById } from "@/lib/services/node";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.nodeId) {
    redirect("/login");
  }

  const node = await getNodeById(session.user.nodeId);
  if (!node) {
    redirect("/dashboard");
  }

  return (
    <ShellDashboard title="Configuración">
      <SettingsForm node={node} />
    </ShellDashboard>
  );
}
