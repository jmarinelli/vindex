import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      nodeId: string | null;
      nodeSlug: string | null;
      logoUrl: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    nodeId: string | null;
    nodeSlug: string | null;
    logoUrl: string | null;
  }
}
