import { ShellPublic } from "@/components/layout/shell-public";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <ShellPublic>
      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Informe de Inspección
        </h1>
        <p className="text-sm text-gray-500 mb-4">Reporte: {slug}</p>
        <p className="text-gray-400">
          El reporte público se implementará en Phase 3
        </p>
      </div>
    </ShellPublic>
  );
}
