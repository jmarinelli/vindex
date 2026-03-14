import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTemplate } from "@/lib/services/template";
import { ShellDashboard } from "@/components/layout/shell-dashboard";
import { TemplateEditorWrapper } from "./template-editor-wrapper";
import { TemplateNotFound } from "./template-not-found";
import { TemplateSkeleton } from "./template-skeleton";
import { Suspense } from "react";

export default async function TemplatePage() {
  const session = await auth();

  if (!session?.user?.nodeId) {
    redirect("/login");
  }

  return (
    <ShellDashboard title="Editor de Template">
      <Suspense fallback={<TemplateSkeleton />}>
        <TemplateLoader nodeId={session.user.nodeId} />
      </Suspense>
    </ShellDashboard>
  );
}

async function TemplateLoader({ nodeId }: { nodeId: string }) {
  const template = await getTemplate(nodeId);

  if (!template) {
    return <TemplateNotFound />;
  }

  return (
    <TemplateEditorWrapper
      templateId={template.id}
      initialName={template.name}
      initialSections={template.sections}
    />
  );
}
