"use client";

import dynamic from "next/dynamic";
import { TemplateSkeleton } from "./template-skeleton";
import type { TemplateSection } from "@/lib/validators";

const TemplateEditor = dynamic(
  () => import("./template-editor").then((m) => m.TemplateEditor),
  { ssr: false, loading: () => <TemplateSkeleton /> }
);

interface TemplateEditorWrapperProps {
  templateId: string;
  initialName: string;
  initialSections: TemplateSection[];
}

export function TemplateEditorWrapper(props: TemplateEditorWrapperProps) {
  return <TemplateEditor {...props} />;
}
