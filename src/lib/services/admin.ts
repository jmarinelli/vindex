import { eq, sql, count, and } from "drizzle-orm";
import { db } from "@/db";
import {
  nodes,
  users,
  events,
  reviews,
  nodeMembers,
} from "@/db/schema";
import type { Node, User } from "@/db/schema";
import { hashSync } from "bcryptjs";
import { createStarterTemplate } from "@/lib/services/template";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlatformMetrics {
  totalNodes: number;
  totalUsers: number;
  totalInspections: number;
  signedInspections: number;
  totalReviews: number;
  matchRate: number | null;
}

export interface NodeWithStats extends Node {
  memberCount: number;
  inspectionCount: number;
}

export interface UserWithNode extends User {
  nodeName: string | null;
  nodeId: string | null;
}

// ─── Metrics ────────────────────────────────────────────────────────────────

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const [nodesCount, usersCount, inspectionsCount, signedCount, reviewsCount, yesCount] =
    await Promise.all([
      db.select({ count: count() }).from(nodes),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(events),
      db
        .select({ count: count() })
        .from(events)
        .where(eq(events.status, "signed")),
      db.select({ count: count() }).from(reviews),
      db
        .select({ count: count() })
        .from(reviews)
        .where(eq(reviews.matchRating, "yes")),
    ]);

  const totalReviews = reviewsCount[0]?.count ?? 0;
  const matchRate =
    totalReviews > 0
      ? Math.round(((yesCount[0]?.count ?? 0) / totalReviews) * 100)
      : null;

  return {
    totalNodes: nodesCount[0]?.count ?? 0,
    totalUsers: usersCount[0]?.count ?? 0,
    totalInspections: inspectionsCount[0]?.count ?? 0,
    signedInspections: signedCount[0]?.count ?? 0,
    totalReviews,
    matchRate,
  };
}

// ─── Node CRUD ──────────────────────────────────────────────────────────────

function generateNodeSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export async function listNodes(): Promise<NodeWithStats[]> {
  const allNodes = await db.select().from(nodes);

  if (allNodes.length === 0) return [];

  const nodeIds = allNodes.map((n) => n.id);

  // Count members per node
  const memberCounts = await db
    .select({
      nodeId: nodeMembers.nodeId,
      count: count(),
    })
    .from(nodeMembers)
    .where(eq(nodeMembers.status, "active"))
    .groupBy(nodeMembers.nodeId);

  // Count inspections per node
  const inspectionCounts = await db
    .select({
      nodeId: events.nodeId,
      count: count(),
    })
    .from(events)
    .groupBy(events.nodeId);

  const memberMap = new Map(memberCounts.map((m) => [m.nodeId, m.count]));
  const inspectionMap = new Map(inspectionCounts.map((i) => [i.nodeId, i.count]));

  const result: NodeWithStats[] = allNodes
    .map((node) => ({
      ...node,
      memberCount: memberMap.get(node.id) ?? 0,
      inspectionCount: inspectionMap.get(node.id) ?? 0,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return result;
}

export async function createNode(data: {
  displayName: string;
  type?: "inspector";
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  bio?: string | null;
  brandColor?: string | null;
  logoUrl?: string | null;
}): Promise<Node> {
  let slug = generateNodeSlug(data.displayName);

  // Ensure slug uniqueness
  const [existing] = await db
    .select({ slug: nodes.slug })
    .from(nodes)
    .where(eq(nodes.slug, slug))
    .limit(1);

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const [node] = await db
    .insert(nodes)
    .values({
      slug,
      displayName: data.displayName,
      type: data.type ?? "inspector",
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      address: data.address || null,
      bio: data.bio || null,
      brandColor: data.brandColor || null,
      logoUrl: data.logoUrl || null,
      status: "active",
      verifiedAt: new Date(),
    })
    .returning();

  // Auto-create starter inspection template for the new node
  await createStarterTemplate(node.id);

  return node;
}

export async function updateNode(
  nodeId: string,
  data: {
    displayName?: string;
    contactEmail?: string;
    contactPhone?: string | null;
    address?: string | null;
    bio?: string | null;
    brandColor?: string | null;
    logoUrl?: string | null;
    status?: "active" | "suspended";
  }
): Promise<Node> {
  const updates: Record<string, unknown> = {};

  if (data.displayName !== undefined) updates.displayName = data.displayName;
  if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined)
    updates.contactPhone = data.contactPhone || null;
  if (data.address !== undefined) updates.address = data.address || null;
  if (data.bio !== undefined) updates.bio = data.bio || null;
  if (data.brandColor !== undefined)
    updates.brandColor = data.brandColor || null;
  if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl || null;
  if (data.status !== undefined) updates.status = data.status;

  if (Object.keys(updates).length === 0) {
    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.id, nodeId))
      .limit(1);
    if (!node) throw new Error("Nodo no encontrado.");
    return node;
  }

  const [node] = await db
    .update(nodes)
    .set(updates)
    .where(eq(nodes.id, nodeId))
    .returning();

  if (!node) throw new Error("Nodo no encontrado.");
  return node;
}

export async function getNode(nodeId: string): Promise<Node | null> {
  const [node] = await db
    .select()
    .from(nodes)
    .where(eq(nodes.id, nodeId))
    .limit(1);
  return node ?? null;
}

// ─── User CRUD ──────────────────────────────────────────────────────────────

export async function listUsers(): Promise<UserWithNode[]> {
  const allUsers = await db.select().from(users);

  if (allUsers.length === 0) return [];

  // Get active memberships with node names
  const memberships = await db
    .select({
      userId: nodeMembers.userId,
      nodeId: nodeMembers.nodeId,
      nodeName: nodes.displayName,
    })
    .from(nodeMembers)
    .innerJoin(nodes, eq(nodes.id, nodeMembers.nodeId))
    .where(eq(nodeMembers.status, "active"));

  const membershipMap = new Map(
    memberships.map((m) => [m.userId, { nodeName: m.nodeName, nodeId: m.nodeId }])
  );

  return allUsers
    .map((user) => {
      const membership = membershipMap.get(user.id);
      return {
        ...user,
        nodeName: membership?.nodeName ?? null,
        nodeId: membership?.nodeId ?? null,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function createUser(data: {
  displayName: string;
  email: string;
  password: string;
  role: "user" | "platform_admin";
  nodeId?: string | null;
}): Promise<User> {
  // Check email uniqueness
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existing) {
    throw new Error("Ya existe un usuario con este email.");
  }

  const passwordHash = hashSync(data.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      displayName: data.displayName,
      passwordHash,
      role: data.role,
    })
    .returning();

  // Create node membership if nodeId provided
  if (data.nodeId) {
    await db.insert(nodeMembers).values({
      nodeId: data.nodeId,
      userId: user.id,
      role: "member",
      status: "active",
    });
  }

  return user;
}

export async function updateUser(
  userId: string,
  data: {
    displayName?: string;
    email?: string;
    role?: "user" | "platform_admin";
    nodeId?: string | null;
  }
): Promise<User> {
  // Check email uniqueness if changing email
  if (data.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing && existing.id !== userId) {
      throw new Error("Ya existe un usuario con este email.");
    }
  }

  const updates: Record<string, unknown> = {};
  if (data.displayName !== undefined) updates.displayName = data.displayName;
  if (data.email !== undefined) updates.email = data.email;
  if (data.role !== undefined) updates.role = data.role;

  let user: User;
  if (Object.keys(updates).length > 0) {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new Error("Usuario no encontrado.");
    user = updated;
  } else {
    const [found] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!found) throw new Error("Usuario no encontrado.");
    user = found;
  }

  // Handle node assignment changes
  if (data.nodeId !== undefined) {
    // Deactivate any existing active memberships
    const activeMemberships = await db
      .select()
      .from(nodeMembers)
      .where(
        and(eq(nodeMembers.userId, userId), eq(nodeMembers.status, "active"))
      );

    for (const m of activeMemberships) {
      await db
        .update(nodeMembers)
        .set({ status: "inactive" })
        .where(eq(nodeMembers.id, m.id));
    }

    // Create new membership if nodeId is provided
    if (data.nodeId) {
      // Check if there's an existing inactive membership for this node
      const [existingMembership] = await db
        .select()
        .from(nodeMembers)
        .where(
          and(
            eq(nodeMembers.userId, userId),
            eq(nodeMembers.nodeId, data.nodeId)
          )
        )
        .limit(1);

      if (existingMembership) {
        await db
          .update(nodeMembers)
          .set({ status: "active" })
          .where(eq(nodeMembers.id, existingMembership.id));
      } else {
        await db.insert(nodeMembers).values({
          nodeId: data.nodeId,
          userId: userId,
          role: "member",
          status: "active",
        });
      }
    }
  }

  return user;
}

export async function getUser(userId: string): Promise<UserWithNode | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [membership] = await db
    .select({
      nodeId: nodeMembers.nodeId,
      nodeName: nodes.displayName,
    })
    .from(nodeMembers)
    .innerJoin(nodes, eq(nodes.id, nodeMembers.nodeId))
    .where(
      and(eq(nodeMembers.userId, userId), eq(nodeMembers.status, "active"))
    )
    .limit(1);

  return {
    ...user,
    nodeName: membership?.nodeName ?? null,
    nodeId: membership?.nodeId ?? null,
  };
}
