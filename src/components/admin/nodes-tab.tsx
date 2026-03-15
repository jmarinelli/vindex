"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listNodesAction,
  createNodeAction,
  updateNodeAction,
  getNodeAction,
} from "@/lib/actions/admin";
import type { NodeWithStats } from "@/lib/services/admin";
import type { Node } from "@/db/schema";

// ─── Node Card ──────────────────────────────────────────────────────────────

function NodeCard({
  node,
  onEdit,
}: {
  node: NodeWithStats;
  onEdit: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onEdit(node.id)}
      className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex gap-3 text-left hover:border-gray-300 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center shrink-0">
        {node.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={node.logoUrl}
            alt={node.displayName}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <span className="text-white text-lg font-bold">
            {node.displayName[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800 truncate">
            {node.displayName}
          </span>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
              node.status === "active"
                ? "bg-status-good-bg text-status-good"
                : "bg-status-critical-bg text-status-critical"
            }`}
          >
            {node.status === "active" ? "ACTIVO" : "SUSPENDIDO"}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-mono">{node.slug}</p>
        <p className="text-xs text-gray-500">{node.contactEmail}</p>
        <p className="text-xs text-gray-500">
          {node.memberCount} miembro{node.memberCount !== 1 ? "s" : ""} ·{" "}
          {node.inspectionCount} inspecciones
        </p>
      </div>
    </button>
  );
}

// ─── Node Form ──────────────────────────────────────────────────────────────

function NodeForm({
  node,
  onBack,
  onSaved,
}: {
  node: Node | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!node;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: node?.displayName ?? "",
    contactEmail: node?.contactEmail ?? "",
    contactPhone: node?.contactPhone ?? "",
    address: node?.address ?? "",
    bio: node?.bio ?? "",
    brandColor: node?.brandColor ?? "",
    status: node?.status ?? "active",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const action = isEdit
      ? updateNodeAction({ nodeId: node!.id, ...form })
      : createNodeAction(form);

    const result = await action;
    setSaving(false);

    if (result.success) {
      toast.success(
        isEdit ? "Cambios guardados." : "Nodo creado exitosamente."
      );
      onSaved();
      if (!isEdit) onBack();
    } else {
      toast.error(result.error ?? "Error al guardar.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="text-sm font-medium text-brand-accent hover:underline self-start"
      >
        ← Volver a nodos
      </button>
      <h2 className="text-xl font-bold text-gray-800">
        {isEdit ? "Editar nodo" : "Crear nodo"}
      </h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col gap-4"
      >
        <FormField label="Nombre *">
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
            placeholder="Nombre del nodo..."
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            required
            maxLength={255}
            disabled={saving}
          />
        </FormField>

        <FormField label="Tipo">
          <select
            disabled
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm bg-gray-50 text-gray-800"
          >
            <option value="inspector">Inspector</option>
          </select>
        </FormField>

        <FormField label="Email de contacto *">
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => updateField("contactEmail", e.target.value)}
            placeholder="email@ejemplo.com"
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            required
            disabled={saving}
          />
        </FormField>

        <FormField label="Teléfono">
          <input
            type="text"
            value={form.contactPhone}
            onChange={(e) => updateField("contactPhone", e.target.value)}
            placeholder="+54 11 ..."
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            maxLength={50}
            disabled={saving}
          />
        </FormField>

        <FormField label="Dirección">
          <input
            type="text"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Dirección..."
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            maxLength={500}
            disabled={saving}
          />
        </FormField>

        <FormField label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Descripción profesional..."
            className="w-full h-20 rounded-md border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            maxLength={1000}
            disabled={saving}
          />
        </FormField>

        <FormField label="Color de marca">
          <input
            type="text"
            value={form.brandColor}
            onChange={(e) => updateField("brandColor", e.target.value)}
            placeholder="#3B82F6"
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            disabled={saving}
          />
        </FormField>

        {isEdit && (
          <>
            <FormField label="Estado">
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
                disabled={saving}
              >
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </FormField>

            <div>
              <span className="text-sm text-gray-500">
                Slug: <span className="font-mono">{node?.slug}</span>
              </span>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full h-11 bg-brand-primary text-white rounded-md text-base font-medium hover:bg-brand-primary-hover disabled:opacity-50 transition-colors"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

// ─── Nodes Tab ──────────────────────────────────────────────────────────────

export function NodesTab() {
  const [nodes, setNodes] = useState<NodeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editNode, setEditNode] = useState<Node | null>(null);

  async function loadNodes() {
    setLoading(true);
    setError(null);
    const result = await listNodesAction();
    if (result.success && result.data) {
      setNodes(result.data);
    } else {
      setError(result.error ?? "Error al cargar los nodos.");
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadNodes is also used as onClick handler
    loadNodes();
  }, []);

  async function handleEdit(nodeId: string) {
    const result = await getNodeAction(nodeId);
    if (result.success && result.data) {
      setEditNode(result.data);
      setView("edit");
    }
  }

  if (view === "create") {
    return (
      <NodeForm
        node={null}
        onBack={() => setView("list")}
        onSaved={loadNodes}
      />
    );
  }

  if (view === "edit" && editNode) {
    return (
      <NodeForm
        node={editNode}
        onBack={() => {
          setView("list");
          setEditNode(null);
        }}
        onSaved={loadNodes}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 h-24 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-700 mb-3">Error al cargar datos.</p>
        <button
          onClick={loadNodes}
          className="text-sm text-brand-accent hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          Nodos ({nodes.length})
        </h2>
        <button
          onClick={() => setView("create")}
          className="h-9 px-3 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-primary-hover transition-colors flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Crear nodo</span>
        </button>
      </div>

      {nodes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-3">No hay nodos registrados.</p>
          <button
            onClick={() => setView("create")}
            className="text-sm font-medium text-brand-accent hover:underline"
          >
            + Crear nodo
          </button>
        </div>
      ) : (
        nodes.map((node) => (
          <NodeCard key={node.id} node={node} onEdit={handleEdit} />
        ))
      )}
    </div>
  );
}
