# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A WhatsApp web clone with three independently-run services:

| Service | Directory | Port | Runtime |
|---------|-----------|------|---------|
| React frontend | `apps/client-ui` | 3000 | CRA (react-scripts) |
| REST API server | `server` | 8000 | Node.js + Express |
| Socket.IO server | `socket` | 9000 | Node.js |

The monorepo is managed by **Microsoft Rush + pnpm**. The shared library (`libs/shared`) is referenced as `@common/shared` inside the client.

## Commands

### Monorepo (Rush)
```bash
rush install          # install all dependencies
rush build            # build all projects
```

### Frontend (`apps/client-ui`)
```bash
cd apps/client-ui
npm start             # dev server on :3000
npm test              # run tests (Jest via react-scripts)
npm run build         # production build
```

### REST Server (`server`)
```bash
cd server
npm start             # nodemon index.js on :8000
```

### Socket Server (`socket`)
```bash
cd socket
node index.js         # plain node, no package scripts defined
```

### Shared Library (`libs/shared`)
```bash
cd libs/shared
npm run build         # tsdx build → dist/
npm run lint          # tsdx lint (also runs as pre-commit hook)
```

> **All three services must be running simultaneously** for the app to work.

## Environment

The REST server reads MongoDB credentials from a `.env` file in `server/`:
```
DB_USERNAME=<mongo atlas username>
DB_PASSWORD=<mongo atlas password>
```

## Architecture

### Authentication flow
Google OAuth (`@react-oauth/google`) returns a credential JWT. The client decodes it with `jwt-decode` and stores the resulting `ICredentials` object in Zustand. The Google `sub` field is used as the canonical user ID everywhere (MongoDB, socket registry, conversation members).

On login the user is also `POST /add`'d to MongoDB so other users can find them.

### State management
Single Zustand store defined in `apps/client-ui/src/store/store.ts`. The store shape is typed in `IStore.ts` and exported from `store/index.ts`. Key slices:
- `credentials` – logged-in user (null = show login page)
- `selectedChat` – the peer the user clicked on
- `conversation` – `{ senderId, receiverId, conversationId }` for the active chat
- `messages` – array of `IMessage` for the active conversation
- `socket` – the Socket.IO client ref (stored as a React ref, not a plain value)
- `activeUsers` – online users broadcast by the socket server

### Real-time messaging
`ChatWrapper` opens a Socket.IO connection to `ws://localhost:9000` on mount and stores the ref in Zustand. When sending a message, `ChatInputSection` does three things in order:
1. Optimistic update: pushes to `messages` in Zustand immediately
2. Socket emit: `sendMessage` event to the socket server, which routes to the receiver's socket
3. REST persist: `POST /message/add` to save to MongoDB

Incoming messages arrive via the `getMessage` socket event.

### API layer
`libs/shared/src/services/api.ts` provides a generic `Api` base class with typed `get/post/put/delete` helpers using the native `fetch` API. `ConversationService` in the client extends it (though it also has direct `fetch` calls for some endpoints). All REST calls target `http://localhost:8000`.

### Component tree
```
App (GoogleOAuthProvider)
└── ChatWrapper          ← auth gate + socket init
    ├── LoginPage         (when credentials == null)
    └── ChatContainer     (when authenticated)
        ├── ToolBar
        ├── ChatList      ← lists all users; clicking sets selectedChat + loads conversation
        └── ChatPage
            ├── Header
            ├── Messages  ← renders message list
            ├── Message   ← individual message bubble
            └── ChatInputSection
```

### Styling
Each component has a co-located `.module.scss` file. The project uses SCSS modules — class names are imported as objects and applied via `styles.className`.

### Shared library
`libs/shared` is a `tsdx`-built library. It exports the `Api` base class and a `Header` component. It must be built (`npm run build` in `libs/shared`) before `client-ui` can resolve `@common/shared`. Rush handles this ordering via `workspace:*` dependency resolution.
