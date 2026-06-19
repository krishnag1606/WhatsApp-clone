# Flux

**Community chat with a Cozy 16-Bit RPG aesthetic.**

Flux is a group/community chat application styled after warm SNES and Stardew Valley game menus. Users create **communities** containing **channels**, assign **roles** with granular permissions, post **announcements**, run **polls**, and moderate with a full audit trail. All message content is **encrypted at rest** using AES-256-GCM.

> **Portfolio / learning project.** Prioritizes working features and visual polish over production-scale infrastructure.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Monorepo Structure](#monorepo-structure)
- [Authentication Flow](#authentication-flow)
- [Database Schema](#database-schema)
- [Permissions & Role Hierarchy](#permissions--role-hierarchy)
- [Encryption at Rest (AES-256-GCM)](#encryption-at-rest-aes-256-gcm)
- [Component Design System](#component-design-system)
- [Quickstart](#quickstart)
- [Commands Reference](#commands-reference)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Tech Stack](#tech-stack)

---

## Architecture Overview

Flux runs as **three independently started services** plus a shared library, orchestrated by **Microsoft Rush + pnpm**:

```
                        Port 3000              Port 8000               Port 9000
                     +--------------+       +--------------+       +---------------+
                     |   React      | REST  |   Express    | imports| Socket.IO     |
   Browser <-------> |   Frontend   |------>|   REST API   |<-------|   Server      |
                     |   (CRA)      | HTTP  |   Server     | models |               |
                     +--------------+       +------+-------+       +-------+-------+
                                                   |                       |
                                                   |    MongoDB Atlas      |
                                                   +-----------+-----------+
                                                               |
                                                        +------+------+
                                                        |   MongoDB   |
                                                        |   Atlas     |
                                                        +-------------+
```

| Service | Directory | Port | Runtime | Role |
|---------|-----------|------|---------|------|
| Frontend | `apps/client-ui` | 3000 | CRA (react-scripts) | SPA with React Router v6, Zustand store |
| REST API | `server` | 8000 | Node.js + Express | Auth, CRUD, permissions, rate limiting |
| Socket Server | `socket` | 9000 | Node.js + Socket.IO | Real-time channel rooms, live events |
| Shared Library | `libs/shared` | -- | tsdx | `Api` base class, shared types |

> The socket server **reuses the REST server's models and utilities** via relative import (`../server/model/*`, `../server/util/*`). It has no separate `.env` -- `socket/loadEnv.js` loads `server/.env` at boot so secrets stay in one place.

---

## Monorepo Structure

```
flux/
+-- rush.json                        # Rush config (pnpm, Node >=18.20 || >=20.14)
|
+-- apps/
|   +-- client-ui/                   # React frontend (CRA)
|       +-- public/                  #   Static assets, inline pixel-art favicon
|       +-- src/
|           +-- components/          #   Feature components
|           |   +-- login/           #     JRPG title-screen landing page
|           |   +-- app-shell/       #     AppShell layout (rail + sidebar + main)
|           |   +-- community-rail/  #     Vertical community list
|           |   +-- channel-sidebar/ #     Channel list, roles/members/audit tools
|           |   +-- channel-view/    #     Message list + input + polls
|           +-- services/            #   REST client (apiClient.ts) + service modules
|           +-- store/               #   Zustand store (IStore.ts + store.ts)
|           +-- styles/              #   _tokens.scss, index.css (design tokens)
|           +-- ui/                  #   Reusable component library (see Design System)
|           +-- constants/           #   permissions.ts (client-side mirror)
|
+-- server/
|   +-- index.js                     # Express entry point (:8000)
|   +-- controller/                  #   Route handlers
|   |   +-- auth-controller.js       #     Google OAuth + Flux JWT issuance
|   |   +-- community-controller.js  #     Community CRUD + invite-code join
|   |   +-- channel-controller.js    #     Channel CRUD + slowmode
|   |   +-- message-controller.js    #     Encrypted message send/list
|   |   +-- poll-controller.js       #     Poll create/vote/list
|   |   +-- role-controller.js       #     Role CRUD with escalation guards
|   |   +-- member-controller.js     #     Member listing + role assignment
|   |   +-- moderation-controller.js #     Kick/ban/mute/unban/unmute
|   +-- middleware/                   #   requireAuth, requireMembership, requirePermission, rateLimit
|   +-- model/                       #   Mongoose schemas
|   +-- util/                        #   crypto.js, jwt.js, google.js, permissions.js, audit.js
|   +-- constants/                   #   permissions.js (authoritative bitfield)
|   +-- database/                    #   db.js (Atlas connection + DNS resolver fix)
|   +-- scripts/                     #   audit-secrets.mjs
|
+-- socket/
|   +-- index.js                     # Socket.IO entry point (:9000)
|   +-- loadEnv.js                   # Loads server/.env for shared secrets
|   +-- rateLimit.js                 # Per-connection event rate limiter
|
+-- libs/
    +-- shared/                      # tsdx library (@common/shared)
        +-- src/
            +-- services/api.ts      #   Generic Api base class (typed fetch wrapper)
```

---

## Authentication Flow

```
  Browser                      REST Server (:8000)             Socket Server (:9000)
  -------                      -----------------               ------------------
     |                                |                               |
     |  1. Google Sign-In (GSI)       |                               |
     |     returns credential JWT     |                               |
     |                                |                               |
     |  2. POST /api/auth/google      |                               |
     |     { credential }             |                               |
     |------------------------------->|                               |
     |                                |                               |
     |         3. google-auth-library |                               |
     |            verifyIdToken()     |                               |
     |            Upsert User by sub  |                               |
     |            Sign Flux JWT       |                               |
     |            (jsonwebtoken)      |                               |
     |                                |                               |
     |  4. { token, user }            |                               |
     |<-------------------------------|                               |
     |                                |                               |
     |  5. localStorage.flux_token    |                               |
     |     = token                    |                               |
     |                                |                               |
     |  6. REST calls with header:    |                               |
     |     Authorization: Bearer <jwt>|                               |
     |------------------------------->|                               |
     |                                |                               |
     |  7. Socket.IO connect          |                               |
     |     { auth: { token: <jwt> } } |                               |
     |--------------------------------------------------------------->|
     |                                                                |
     |                                8. io.use() middleware          |
     |                                   verifies Flux JWT            |
     |                                   socket.data.userId = sub     |
     |                                                                |
     |  9. emit joinChannel(channelId)                                |
     |--------------------------------------------------------------->|
     |                                   Verify membership            |
     |                                   Join room channel:<id>       |
     |                                                                |
     |  10. receive: newMessage / pollUpdated / messageDeleted        |
     |<---------------------------------------------------------------|
```

**Key invariant:** The server derives `userId` from the verified JWT on every request. Identity is never accepted from client-supplied fields.

---

## Database Schema

### Models

| Model | Key Fields | Description |
|-------|-----------|-------------|
| **User** | `_id` (Google sub), `name`, `email`, `picture` | Canonical identity keyed by Google's stable `sub` claim |
| **Community** | `name`, `icon`, `ownerId`, `inviteCode` | A group space containing channels; join via unique invite code |
| **Channel** | `communityId`, `name`, `type` (text / announcement), `position`, `slowmodeSeconds` | Ordered chat rooms within a community; slowmode enforced server-side |
| **Membership** | `communityId`, `userId`, `roleIds[]`, `nickname`, `mutedUntil`, `banned` | Join table between users and communities; carries per-community state |
| **Role** | `communityId`, `name`, `color`, `permissions` (bitfield), `position` | Defines a permission set; higher `position` = more authority |
| **Message** | `channelId`, `authorId`, `content` `{ciphertext, iv, tag}`, `type`, `pinned`, `deletedAt` | Encrypted at rest; soft-delete via `deletedAt` |
| **Poll** | `channelId`, `authorId`, `question`, `options[]` `{text, voters[]}`, `allowMultiple`, `expiresAt` | Channel polls with live voting; options carry voter arrays |
| **AuditLog** | `communityId`, `actorId`, `targetId`, `action`, `reason` | Immutable moderation audit trail |

### Entity Relationships

```
  User (Google sub)
    |
    +--- 1:N ---> Membership ---> N:1 ---> Community
    |                 |                        |
    |                 +--- N:M ---> Role ------+   (scoped to community)
    |                                          |
    |                                          +--- 1:N ---> Channel
    |                                                          |
    +--- 1:N ---> Message (encrypted) <--- N:1 ----------------+
    |                                                          |
    +--- 1:N ---> Poll <--- N:1 -------------------------------+
    |
    +--- 1:N ---> AuditLog (as actor or target)
```

---

## Permissions & Role Hierarchy

Permissions are stored as a **single integer bitfield** on each `Role`. A member's effective permissions are the **OR** of all their assigned roles' bitfields. The community **owner** implicitly has all permissions.

### Bitfield Flags

| Flag | Bit | Value | Description |
|------|-----|-------|-------------|
| `VIEW_CHANNELS` | 0 | 1 | See channels and read messages |
| `SEND_MESSAGES` | 1 | 2 | Send messages in text channels |
| `CREATE_POLLS` | 2 | 4 | Create polls in channels |
| `POST_ANNOUNCEMENTS` | 3 | 8 | Post in announcement-type channels |
| `MANAGE_MESSAGES` | 4 | 16 | Delete/pin any message |
| `KICK` | 5 | 32 | Remove members from the community |
| `BAN` | 6 | 64 | Ban/unban members |
| `MUTE` | 7 | 128 | Temporarily mute members |
| `MANAGE_CHANNELS` | 8 | 256 | Create/rename/delete channels, set slowmode |
| `MANAGE_ROLES` | 9 | 512 | Create/edit/delete roles, assign to members |
| `MANAGE_COMMUNITY` | 10 | 1024 | Community-level settings |

### Default Roles (seeded on community creation)

| Role | Permissions | Bitfield | Position |
|------|------------|----------|----------|
| **Owner** | All 11 flags | `2047` | 3 (highest) |
| **Moderator** | VIEW + SEND + CREATE_POLLS + MANAGE_MESSAGES + KICK + MUTE | `183` | 2 |
| **Member** | VIEW + SEND + CREATE_POLLS | `7` | 1 (lowest) |

### Enforcement Model

Permissions are enforced in **two layers**:

```
  Client Request
       |
       v
  +--------------------+
  | UI Gating          |   Hide/disable controls the user can't use
  | (client-side)      |   NEVER relied upon for security
  +--------------------+
       |
       v
  +--------------------+
  | requirePermission  |   REST: Express middleware checks bitfield
  | (server-side)      |   Socket: inline check before every event
  +--------------------+
       |
       v
  +--------------------+
  | Escalation Guards  |   Can't grant/assign bits you don't hold
  | canModerate()      |   Can only moderate targets with fewer perms
  | Owner protection   |   Owner role undeletable, owner unrestricted
  +--------------------+
```

---

## Encryption at Rest (AES-256-GCM)

All message content is encrypted before writing to MongoDB and decrypted on read. This protects against database theft -- it is **not** end-to-end encryption (the server holds the key).

### Write Path

```
  Plaintext              server/util/crypto.js              MongoDB
  "Hello world"               encrypt()                   Document
       |                         |                           |
       +--- 1. Generate --------+                           |
       |      random IV          |                           |
       |      (96-bit)           |                           |
       |                         |                           |
       +--- 2. AES-256-GCM ----+                           |
       |      encrypt with       |                           |
       |      MESSAGE_           |                           |
       |      ENCRYPTION_KEY     |                           |
       |                         |                           |
       +--- 3. Extract ---------+                           |
              auth tag            |                           |
              (128-bit)           |                           |
                                  +--- store as: ----------->|
                                       content: {            |
                                         ciphertext (b64),   |
                                         iv (b64),           |
                                         tag (b64)           |
                                       }                     |
```

### Read Path

```
  MongoDB                server/util/crypto.js              Client
  Document                    decrypt()                    Response
       |                         |                           |
       +--- 1. Validate --------+                           |
       |      envelope shape     |                           |
       |      IV = 12 bytes      |                           |
       |      tag = 16 bytes     |                           |
       |      ciphertext != ""   |                           |
       |                         |                           |
       +--- 2. AES-256-GCM ----+                           |
       |      decrypt            |                           |
       |                         |                           |
       +--- 3. Verify ----------+                           |
              GCM auth tag       +--- return plaintext ----->|
              (tamper detection) |    "Hello world"          |
```

**Key details:**
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **IV:** Fresh 96-bit random nonce per message -- never reused
- **Auth tag:** 128-bit GCM tag validated on decrypt (tamper detection)
- **Key format:** 32-byte key via `MESSAGE_ENCRYPTION_KEY` env var (64-char hex or 44-char base64)
- **Storage:** `Message.content` is always `{ ciphertext, iv, tag }` (base64 strings), never plaintext

---

## Component Design System

### Cozy 16-Bit RPG Aesthetic

The UI is styled after warm SNES / Stardew Valley game menus -- **parchment backgrounds, wooden frames, RPG dialog boxes, and pixel fonts**. No neon, no glows, no scanlines.

### Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `$color-bg-primary` (wood) | `#3e2723` | App frame, headers, ledges |
| `$color-bg-secondary` (parchment) | `#f4ecd8` | Sidebar, inputs, quest log |
| `$color-bg-chat` (dialog blue) | `#0000a8` | Chat pane, message area |
| `$color-primary` (crimson) | `#b71c1c` | Brand, important actions |
| `$color-secondary` (forest green) | `#2e7d32` | Confirm, own messages, HP bars |
| `$color-accent` (gold) | `#ffd700` | Focus rings, highlights, active cursor |
| `$color-warning` (amber) | `#e09f3e` | Caution states |
| `$color-danger` (blood red) | `#8b0000` | Destructive actions |
| `$color-text-primary` (warm white) | `#fff8e7` | Text on dark/blue backgrounds |
| `$color-text-dark` (espresso) | `#1e0b04` | Text on parchment backgrounds |

**Fonts:** **Press Start 2P** (display/headers) and **VT323** (body, 20px base size)

### Reusable Components (`src/ui/`)

| Component | Visual Metaphor | Variants / Key Props |
|-----------|----------------|---------------------|
| **PixelButton** | Wooden inventory-slot button with raised bevel, press-down on `:active` | `variant`: primary, cyan, lime, yellow, ghost, danger, icon / `size`: sm, md, lg |
| **PixelCard** | Classic RPG dialog box with cream inner frame and espresso outer outline | `variant`: primary, cyan, yellow / optional `title` bar |
| **PixelInput** | Naming-screen text box with parchment field and recessed bevel | Gold focus ring / optional `icon` prop |
| **PixelModal** | RPG dialog box with carved-wood title bar and gold lettering | `[---][][][X]` control chips / Escape-to-close / optional `footer` |
| **PixelIcon** | Pixel art icon wrapper | `name` mapped to `pixelarticons` SVGs via typed name map |

### Framing System

All borders use an **RPG double-border** pattern (no glows):

```
  +==============================+   <-- $frame-outer-dark (espresso outline)
  | +==========================+ |   <-- $frame-inner-light (cream border)
  | |                          | |
  | |   Component content      | |   <-- Dialog blue / parchment fill
  | |                          | |
  | +==========================+ |
  +==============================+
        |
        +-- $shadow-chunky: 4px 4px 0 rgba(0,0,0,0.45)
            (hard brown offset, no blur)
```

### Layout Mapping

```
+-----+-------------------------------+-----------------------------+
|     |          SIDEBAR              |         MAIN PANE           |
|  R  | +---------------------------+| +-------------------------+ |
|  A  | |  Community Name           || | Channel Header          | |
|  I  | +---------------------------+| +-------------------------+ |
|  L  | |  Invite People            || |                         | |
|     | +---------------------------+| |   Message List           | |
| [*] | |  # general           (*)  || |   (scrolling dialog     | |
| [ ] | |  # announcements          || |    box, dialog-blue)    | |
| [ ] | |  # random                 || |                         | |
| [ ] | |                           || |   Messages = mini       | |
|     | |                           || |   dialog boxes          | |
|     | +---------------------------+| |                         | |
|     | | Roles | Party | Log       || |   Polls = HP/MP bars    | |
|     | +---------------------------+| +-------------------------+ |
|     | | User Footer               || | Message Input           | |
|     | +---------------------------+| +-------------------------+ |
+-----+-------------------------------+-----------------------------+
  ^           ^                               ^
  |           |                               |
  Inventory   Parchment Quest Log            Scrolling Dialog Box
  Shelf       (espresso text)                (cream text on blue)
```

---

## Quickstart

### Prerequisites

- **Node.js** >= 18.20.3 (< 19) or >= 20.14.0 (< 21) -- **Node 24 blocks `rush update`**
- **MongoDB Atlas** cluster (or local MongoDB)
- **Google OAuth Client ID** with `http://localhost:3000` and `http://localhost` in **Authorized JavaScript Origins**

### 1. Clone & Install

```bash
git clone <repo-url> flux
cd flux

# Install Rush globally (if not already)
npm install -g @microsoft/rush

# Install all dependencies (requires Node 18 or 20)
rush update
```

### 2. Configure Environment

Create **`server/.env`**:

```env
DB_USERNAME=your_atlas_username
DB_PASSWORD=your_atlas_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
JWT_SECRET=your_random_secret_string
MESSAGE_ENCRYPTION_KEY=your_32_byte_hex_key
```

> Generate the encryption key: `openssl rand -hex 32`

Create **`apps/client-ui/.env`**:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:9000
```

> `GOOGLE_CLIENT_ID` must be the **same value** in both files. The server reads it unprefixed; CRA requires the `REACT_APP_` prefix.

### 3. Build Shared Library

```bash
cd libs/shared
npm run build
cd ../..
```

### 4. Start All Three Services

Open **three terminals**:

```bash
# Terminal 1 -- REST API
cd server
npm start                       # nodemon on :8000

# Terminal 2 -- Socket Server
cd socket
node index.js                   # plain node on :9000

# Terminal 3 -- Frontend
cd apps/client-ui
npm start                       # CRA dev server on :3000
```

Open **http://localhost:3000** and sign in with Google.

---

## Commands Reference

### Monorepo (Rush)

| Command | Description |
|---------|-------------|
| `rush update` | Install / refresh all dependencies (Node 18 or 20 required) |
| `rush install` | Install from existing lockfile |
| `rush build` | Build all projects in dependency order |

### Frontend (`apps/client-ui`)

| Command | Description |
|---------|-------------|
| `npm start` | Dev server on `:3000` |
| `npm test` | Run tests (Jest via react-scripts) |
| `npm run build` | Production build + type/compile check |

### REST Server (`server`)

| Command | Description |
|---------|-------------|
| `npm start` | nodemon dev server on `:8000` |
| `npm run audit:secrets` | Scan git history for leaked secrets |

### Socket Server (`socket`)

| Command | Description |
|---------|-------------|
| `node index.js` | Start on `:9000` (no package scripts defined) |

### Shared Library (`libs/shared`)

| Command | Description |
|---------|-------------|
| `npm run build` | tsdx build to `dist/` |
| `npm run lint` | tsdx lint (also runs as pre-commit hook) |

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USERNAME` | Yes | MongoDB Atlas username |
| `DB_PASSWORD` | Yes | MongoDB Atlas password |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID (**no** `REACT_APP_` prefix) |
| `JWT_SECRET` | Yes | Secret for signing Flux session JWTs |
| `MESSAGE_ENCRYPTION_KEY` | Yes | 32-byte AES-256-GCM key (hex or base64) |
| `MONGODB_URI` | No | Full connection string override (bypasses SRV lookup) |
| `DNS_SERVERS` | No | Custom DNS resolvers, comma-separated (default: `8.8.8.8,1.1.1.1`) |
| `TRUST_PROXY` | No | Express `trust proxy` setting for rate limiting behind a reverse proxy |

### Frontend (`apps/client-ui/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_GOOGLE_CLIENT_ID` | Yes | Same Google client ID as the server |
| `REACT_APP_API_BASE_URL` | Yes | REST server URL (`http://localhost:8000`) |
| `REACT_APP_SOCKET_URL` | Yes | Socket server URL (`http://localhost:9000`) |

> The socket server has **no separate `.env`** -- it loads `server/.env` via `socket/loadEnv.js`.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `querySrv ECONNREFUSED` on server start | DNS can't resolve Atlas SRV records (VPN/ISP) | Set `DNS_SERVERS=8.8.8.8` in `server/.env`, or use `MONGODB_URI` with a non-SRV `mongodb://` string |
| `The given origin is not allowed` on Google sign-in | OAuth client missing localhost origin | Add `http://localhost:3000` and `http://localhost` (no path, no trailing slash) to **Authorized JavaScript Origins** in Google Cloud Console |
| `401 Google token verification failed` | Wrong env var name in `server/.env` | Use `GOOGLE_CLIENT_ID` (not `REACT_APP_GOOGLE_CLIENT_ID`) in `server/.env` |
| Frontend can't resolve `@common/shared` | Shared lib not built | Run `npm run build` in `libs/shared/` |
| `rush update` fails with Node error | Node version too high | Use Node 18 or 20 (`nvm use 20`) -- Node 24 is blocked by `rush.json` |
| Real-time messages not appearing | Socket server not running or wrong URL | Ensure `socket/` is running on `:9000` and `REACT_APP_SOCKET_URL` is set |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, React Router v6, Zustand, SCSS Modules, `@react-oauth/google` |
| **Backend** | Node.js, Express, Mongoose, `google-auth-library`, `jsonwebtoken`, Zod, `express-rate-limit` |
| **Real-time** | Socket.IO (channel rooms, live polls, moderation events) |
| **Database** | MongoDB Atlas |
| **Encryption** | AES-256-GCM via Node.js `crypto` (at-rest, not E2E) |
| **Validation** | Zod (shared schemas for REST + socket) |
| **Monorepo** | Microsoft Rush + pnpm |
| **Fonts** | Press Start 2P, VT323 (Google Fonts) |
| **Icons** | pixelarticons (SVG, `fill="currentColor"`) |

---

## License

This project is for portfolio and educational purposes.
