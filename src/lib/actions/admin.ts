"use server";

import { auth } from "@/lib/auth";
import {
  createNodeSchema,
  updateNodeSchema,
  createUserSchema,
  updateUserSchema,
} from "@/lib/validators";
import * as adminService from "@/lib/services/admin";
import type { Node, User } from "@/db/schema";

type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function requireAdmin(): Promise<
  | { id: string; role: string }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autenticado." };
  }
  if (session.user.role !== "platform_admin") {
    return { error: "No tenés permisos de administrador." };
  }
  return { id: session.user.id, role: session.user.role };
}

// ─── Metrics ────────────────────────────────────────────────────────────────

export async function getMetricsAction(): Promise<
  ActionResult<adminService.PlatformMetrics>
> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  try {
    const metrics = await adminService.getPlatformMetrics();
    return { success: true, data: metrics };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener las métricas.";
    return { success: false, error: message };
  }
}

// ─── Node Actions ───────────────────────────────────────────────────────────

export async function listNodesAction(): Promise<
  ActionResult<adminService.NodeWithStats[]>
> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  try {
    const nodes = await adminService.listNodes();
    return { success: true, data: nodes };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener los nodos.";
    return { success: false, error: message };
  }
}

export async function createNodeAction(
  input: unknown
): Promise<ActionResult<{ node: Node }>> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  const parsed = createNodeSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const node = await adminService.createNode(parsed.data);
    return { success: true, data: { node } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear el nodo.";
    return { success: false, error: message };
  }
}

export async function updateNodeAction(
  input: unknown
): Promise<ActionResult<{ node: Node }>> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  const parsed = updateNodeSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const { nodeId, ...data } = parsed.data;
    const node = await adminService.updateNode(nodeId, data);
    return { success: true, data: { node } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar el nodo.";
    return { success: false, error: message };
  }
}

export async function getNodeAction(
  nodeId: string
): Promise<ActionResult<Node>> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  try {
    const node = await adminService.getNode(nodeId);
    if (!node) return { success: false, error: "Nodo no encontrado." };
    return { success: true, data: node };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener el nodo.";
    return { success: false, error: message };
  }
}

// ─── User Actions ───────────────────────────────────────────────────────────

export async function listUsersAction(): Promise<
  ActionResult<adminService.UserWithNode[]>
> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  try {
    const users = await adminService.listUsers();
    return { success: true, data: users };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener los usuarios.";
    return { success: false, error: message };
  }
}

export async function createUserAction(
  input: unknown
): Promise<ActionResult<{ user: User }>> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const user = await adminService.createUser(parsed.data);
    return { success: true, data: { user } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al crear el usuario.";
    return { success: false, error: message };
  }
}

export async function updateUserAction(
  input: unknown
): Promise<ActionResult<{ user: User }>> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { success: false, error: firstError };
  }

  try {
    const { userId, ...data } = parsed.data;
    const user = await adminService.updateUser(userId, data);
    return { success: true, data: { user } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar el usuario.";
    return { success: false, error: message };
  }
}

export async function getUserAction(
  userId: string
): Promise<ActionResult<adminService.UserWithNode>> {
  const admin = await requireAdmin();
  if ("error" in admin) return { success: false, error: admin.error };

  try {
    const user = await adminService.getUser(userId);
    if (!user) return { success: false, error: "Usuario no encontrado." };
    return { success: true, data: user };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al obtener el usuario.";
    return { success: false, error: message };
  }
}
