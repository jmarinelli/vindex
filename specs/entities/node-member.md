# Entity: Node Member

The N:N relationship between users and nodes. A user may belong to multiple nodes, and a node may have multiple members.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| node_id | UUID | FK → nodes(id), NOT NULL |
| user_id | UUID | FK → users(id), NOT NULL |
| role | ENUM(`member`, `node_admin`) | NOT NULL, default `member` |
| status | ENUM(`active`, `inactive`) | NOT NULL, default `active` |
| joined_at | TIMESTAMP | default `now()`, NOT NULL |

**Unique constraint:** (`node_id`, `user_id`) — a user can only have one membership record per node.

## Behavior

- **Created by platform admin** during onboarding. The admin creates the node, creates the user, and links them via NodeMember.
- **Phase 1 simplification:** each inspector node has exactly one member. The N:N structure exists in the data model to avoid refactoring when multi-user nodes are needed.
- **Node-level roles:**
  - `member` — can create and sign events on behalf of the node.
  - `node_admin` — can manage the node's profile and members (deferred UI — the capability exists in the model).
- **Authorization flow:** when a user attempts an inspector action (create inspection, sign event), the system checks: (1) user is authenticated, (2) user has an active NodeMember record for the relevant node, (3) the node is active (not suspended).
- **No management UI in Phase 1.** Node membership is created by the admin via backend/seed. Multi-user management UI is deferred.

## API

- No public endpoints.
- Admin-only creation (part of onboarding flow).
- Used internally for authorization checks on every inspector action.

## Example Data

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "node_id": "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
  "user_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "role": "member",
  "status": "active",
  "joined_at": "2026-03-10T10:10:00Z"
}
```

## Dependencies

- **Requires:** Node, User
- **Required by:** authorization logic in all inspector actions

## Acceptance Criteria

- [ ] Unique constraint on (node_id, user_id) enforced at DB level
- [ ] Inspector actions check active NodeMember + active Node before proceeding
- [ ] Inactive membership blocks inspector actions for that node
- [ ] A user with memberships in multiple nodes can act on behalf of any active one
