# Entity: User

A single account representing a human in the system. In Phase 1, users are node members (inspectors) or platform administrators.

## Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default `crypto.randomUUID()` |
| email | VARCHAR(255) | UNIQUE, NOT NULL — authentication identifier |
| password_hash | VARCHAR(255) | NOT NULL — bcrypt hash |
| display_name | VARCHAR(255) | NOT NULL |
| role | ENUM(`user`, `platform_admin`) | NOT NULL, default `user` |
| created_at | TIMESTAMP | default `now()`, NOT NULL |

## Behavior

- **Created by platform admin** during inspector onboarding. No self-registration in Phase 1.
- **Email is the login identifier.** Must be unique across the system.
- **Password is hashed with bcrypt** before storage. Never stored or logged in plaintext.
- **Two platform roles:**
  - `user` — default role. Can act as an inspector if linked to a node via NodeMember.
  - `platform_admin` — can create/manage nodes, users, and view admin dashboard.
- **A user is not an inspector by default.** A user becomes an inspector by being linked to a node via NodeMember. The user entity itself has no inspector-specific data.
- **Future extension:** the user entity supports adding an `owner` role when vehicle claims and owner dashboards are built. A user may hold multiple roles (e.g., a mechanic who is both an inspector and a vehicle owner).

## API

- No public-facing user endpoints.
- Admin endpoints for user creation (part of onboarding flow).
- Auth endpoints handled by Auth.js (login, session).

## Example Data

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "email": "carlos@tallermartinez.com",
  "password_hash": "$2b$10$...",
  "display_name": "Carlos Martínez",
  "role": "user",
  "created_at": "2026-03-10T10:05:00Z"
}
```

## Dependencies

- **Requires:** nothing
- **Required by:** NodeMember, Event (signed_by_user_id)

## Acceptance Criteria

- [ ] Email uniqueness enforced at DB level
- [ ] Password stored as bcrypt hash, never plaintext
- [ ] Auth.js Credentials provider validates email + password
- [ ] JWT session includes user id, email, role
- [ ] platform_admin role grants access to /admin routes
- [ ] user role without node membership has no inspector capabilities
