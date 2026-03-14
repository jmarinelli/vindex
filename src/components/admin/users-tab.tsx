"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listUsersAction,
  createUserAction,
  updateUserAction,
  getUserAction,
  listNodesAction,
} from "@/lib/actions/admin";
import type { UserWithNode, NodeWithStats } from "@/lib/services/admin";

// ─── User Card ──────────────────────────────────────────────────────────────

function UserCard({
  user,
  onEdit,
}: {
  user: UserWithNode;
  onEdit: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onEdit(user.id)}
      className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-left hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-gray-800 truncate">
          {user.displayName}
        </span>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
            user.role === "platform_admin"
              ? "bg-sky-50 text-brand-accent"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {user.role === "platform_admin" ? "ADMIN" : "USER"}
        </span>
      </div>
      <p className="text-xs text-gray-500">{user.email}</p>
      <p
        className={`text-xs ${
          user.nodeName ? "text-gray-500" : "text-gray-400 italic"
        }`}
      >
        {user.nodeName ? `Nodo: ${user.nodeName}` : "Sin nodo asignado"}
      </p>
    </button>
  );
}

// ─── User Form ──────────────────────────────────────────────────────────────

function UserForm({
  user,
  onBack,
  onSaved,
}: {
  user: UserWithNode | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [saving, setSaving] = useState(false);
  const [nodes, setNodes] = useState<NodeWithStats[]>([]);
  const [form, setForm] = useState({
    displayName: user?.displayName ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "user",
    nodeId: user?.nodeId ?? "",
  });

  useEffect(() => {
    listNodesAction().then((result) => {
      if (result.success && result.data) {
        setNodes(result.data);
      }
    });
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = isEdit
      ? {
          userId: user!.id,
          displayName: form.displayName,
          email: form.email,
          role: form.role as "user" | "platform_admin",
          nodeId: form.nodeId || null,
        }
      : {
          displayName: form.displayName,
          email: form.email,
          password: form.password,
          role: form.role as "user" | "platform_admin",
          nodeId: form.nodeId || null,
        };

    const result = isEdit
      ? await updateUserAction(payload)
      : await createUserAction(payload);

    setSaving(false);

    if (result.success) {
      toast.success(
        isEdit ? "Cambios guardados." : "Usuario creado exitosamente."
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
        ← Volver a usuarios
      </button>
      <h2 className="text-xl font-bold text-gray-800">
        {isEdit ? "Editar usuario" : "Crear usuario"}
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
            placeholder="Nombre del usuario..."
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            required
            maxLength={255}
            disabled={saving}
          />
        </FormField>

        <FormField label="Email *">
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="email@ejemplo.com"
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            required
            disabled={saving}
          />
        </FormField>

        {!isEdit && (
          <FormField label="Contraseña *">
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
              required
              minLength={8}
              disabled={saving}
            />
          </FormField>
        )}

        <FormField label="Rol *">
          <select
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            required
            disabled={saving}
          >
            <option value="user">Usuario</option>
            <option value="platform_admin">Administrador</option>
          </select>
        </FormField>

        <FormField label="Nodo asignado">
          <select
            value={form.nodeId}
            onChange={(e) => updateField("nodeId", e.target.value)}
            className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            disabled={saving}
          >
            <option value="">Sin nodo</option>
            {nodes
              .filter((n) => n.status === "active")
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.displayName}
                </option>
              ))}
          </select>
        </FormField>

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

// ─── Users Tab ──────────────────────────────────────────────────────────────

export function UsersTab() {
  const [users, setUsers] = useState<UserWithNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editUser, setEditUser] = useState<UserWithNode | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const result = await listUsersAction();
    if (result.success && result.data) {
      setUsers(result.data);
    } else {
      setError(result.error ?? "Error al cargar los usuarios.");
    }
    setLoading(false);
  }

  async function handleEdit(userId: string) {
    const result = await getUserAction(userId);
    if (result.success && result.data) {
      setEditUser(result.data);
      setView("edit");
    }
  }

  if (view === "create") {
    return (
      <UserForm
        user={null}
        onBack={() => setView("list")}
        onSaved={loadUsers}
      />
    );
  }

  if (view === "edit" && editUser) {
    return (
      <UserForm
        user={editUser}
        onBack={() => {
          setView("list");
          setEditUser(null);
        }}
        onSaved={loadUsers}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 h-20 animate-pulse"
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
          onClick={loadUsers}
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
          Usuarios ({users.length})
        </h2>
        <button
          onClick={() => setView("create")}
          className="h-9 px-3 bg-brand-primary text-white rounded-md text-sm font-medium hover:bg-brand-primary-hover transition-colors flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Crear usuario</span>
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-3">No hay usuarios registrados.</p>
          <button
            onClick={() => setView("create")}
            className="text-sm font-medium text-brand-accent hover:underline"
          >
            + Crear usuario
          </button>
        </div>
      ) : (
        users.map((user) => (
          <UserCard key={user.id} user={user} onEdit={handleEdit} />
        ))
      )}
    </div>
  );
}
