import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashSync } from "bcryptjs";
import * as schema from "./schema";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  console.log("🌱 Seeding database...");

  // 1. Admin user
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: "admin@vindex.app",
      passwordHash: hashSync("admin123", 10),
      displayName: "Admin VinDex",
      role: "platform_admin",
    })
    .returning();
  console.log("  ✓ Admin user created:", adminUser.email);

  // 2. Inspector node
  const [node] = await db
    .insert(schema.nodes)
    .values({
      type: "inspector",
      slug: "inspector-demo",
      displayName: "Inspector Demo",
      contactEmail: "demo@vindex.app",
      contactPhone: "+54 11 1234-5678",
      address: "Av. Corrientes 1234, CABA, Argentina",
      bio: "Inspector demo para desarrollo. Inspecciones detalladas para vehículos nacionales e importados.",
      status: "active",
      verifiedAt: new Date(),
    })
    .returning();
  console.log("  ✓ Inspector node created:", node.displayName);

  // 3. Inspector user
  const [inspectorUser] = await db
    .insert(schema.users)
    .values({
      email: "inspector@vindex.app",
      passwordHash: hashSync("inspector123", 10),
      displayName: "Carlos Inspector",
      role: "user",
    })
    .returning();
  console.log("  ✓ Inspector user created:", inspectorUser.email);

  // 4. Link user to node
  await db.insert(schema.nodeMembers).values({
    nodeId: node.id,
    userId: inspectorUser.id,
    role: "member",
    status: "active",
  });
  console.log("  ✓ Node member linked");

  // 5. Starter inspection template (9 sections from PRD §9.9)
  const starterSections = {
    sections: [
      {
        id: crypto.randomUUID(),
        name: "Exterior",
        order: 1,
        items: [
          { id: crypto.randomUUID(), name: "Estado de carrocería y pintura", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Vidrios y espejos", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Luces y ópticas", order: 3, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Neumáticos y llantas", order: 4, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Compartimiento del Motor",
        order: 2,
        items: [
          { id: crypto.randomUUID(), name: "Nivel y estado de aceite", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Refrigerante y mangueras", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Correas y tensores", order: 3, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Batería", order: 4, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Pérdidas visibles", order: 5, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Interior",
        order: 3,
        items: [
          { id: crypto.randomUUID(), name: "Asientos y tapizado", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Tablero y controles", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Climatización (A/C y calefacción)", order: 3, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Electrónica interior", order: 4, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Odómetro", order: 5, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Tren Inferior",
        order: 4,
        items: [
          { id: crypto.randomUUID(), name: "Chasis y estructura", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Suspensión", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Escape", order: 3, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Transmisión y diferencial", order: 4, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Pérdidas de fluidos", order: 5, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Prueba Mecánica",
        order: 5,
        items: [
          { id: crypto.randomUUID(), name: "Arranque y ralentí", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Transmisión (cambios)", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Frenos", order: 3, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Dirección", order: 4, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Ruidos anormales", order: 5, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Prueba de Ruta",
        order: 6,
        items: [
          { id: crypto.randomUUID(), name: "Aceleración", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Frenado", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Respuesta de dirección", order: 3, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Suspensión en ruta", order: 4, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Alineación", order: 5, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Eléctrica / Electrónica",
        order: 7,
        items: [
          { id: crypto.randomUUID(), name: "Escaneo OBD", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Luces de advertencia", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Sensores y actuadores", order: 3, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Documentación",
        order: 8,
        items: [
          { id: crypto.randomUUID(), name: "Verificación de título", order: 1, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Historial de service", order: 2, type: "checklist_item" },
          { id: crypto.randomUUID(), name: "Coincidencia de VIN", order: 3, type: "checklist_item" },
        ],
      },
      {
        id: crypto.randomUUID(),
        name: "Conclusión",
        order: 9,
        items: [
          { id: crypto.randomUUID(), name: "Observaciones generales y recomendación", order: 1, type: "free_text" },
        ],
      },
    ],
  };

  await db.insert(schema.inspectionTemplates).values({
    nodeId: node.id,
    name: "Verificación Pre-Compra Completa",
    sections: starterSections,
  });
  console.log("  ✓ Starter template created (9 sections)");

  console.log("\n✅ Seed complete!");
  console.log("   Admin login: admin@vindex.app / admin123");
  console.log("   Inspector login: inspector@vindex.app / inspector123");

  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
