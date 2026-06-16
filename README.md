# Flux

A full-stack real-time chat app built with React, Node.js, Socket.IO, and MongoDB — styled with a Y2K/retro aesthetic.

## Features

- Real-time messaging with Socket.IO
- Google OAuth authentication
- User and conversation management
- Y2K retro design with neon colors and pixel fonts
- SCSS modules with a central design tokens file

## Tech Stack

### Frontend
- React 18 with TypeScript
- Zustand for state management
- Socket.IO client for real-time communication
- Google OAuth for authentication
- SCSS modules + design tokens (`src/styles/_tokens.scss`)
- Press Start 2P & VT323 fonts (Google Fonts)
- React Icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- CORS enabled

### Build System
- Rush.js monorepo management
- PNPM package manager

## Prerequisites

- Node.js (>=18.20.3)
- PNPM
- MongoDB Atlas account
- Google OAuth credentials

## Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd flux
```

### 2. Install Rush globally
```bash
npm install -g @microsoft/rush
```

### 3. Install dependencies
```bash
rush update
```

### 4. Set up environment variables

#### Frontend (.env in apps/client-ui/)
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_SOCKET_URL=ws://localhost:9000
```

#### Backend (.env in server/)
```
DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password
PORT=8000
FRONTEND_URL=http://localhost:3000
```

### 5. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create or select a project
3. Enable the Google+ API
4. Create an OAuth 2.0 Client ID credential
5. Add `http://localhost:3000` to authorized origins
6. Copy the Client ID to your `.env` file

### 6. Set up MongoDB Atlas
1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and database user
3. Get the connection string and update `.env`
4. Whitelist your IP address

## Running the Application

Start all three services simultaneously:

```bash
# Terminal 1 — Frontend
cd apps/client-ui && npm start

# Terminal 2 — REST API
cd server && npm start

# Terminal 3 — Socket server
cd socket && node index.js
```

- Frontend: http://localhost:3000
- REST API: http://localhost:8000
- Socket server: ws://localhost:9000

## Project Structure

```
flux/
├── apps/
│   └── client-ui/              # React frontend
│       └── src/
│           └── styles/
│               └── _tokens.scss  # Y2K design tokens
├── libs/
│   └── shared/                 # Shared utilities and components
├── server/                     # Express.js backend
├── socket/                     # Socket.IO server
└── rush.json                   # Rush monorepo config
```

## Design Tokens

All theme values live in `apps/client-ui/src/styles/_tokens.scss`. Import it at the top of any SCSS module:

```scss
@use '../../styles/tokens' as *;

.button {
  font-family: $font-display;
  background: $color-primary;
  border: $border-thick;
  box-shadow: $shadow-chunky;
}
```

## Troubleshooting

1. **Rush version mismatch** — run `rush update --full`
2. **MongoDB connection issues** — check Atlas credentials and IP whitelist
3. **Google OAuth issues** — verify Client ID and authorized origins
4. **Socket connection issues** — ensure socket server is running on port 9000 and check CORS settings

## License

MIT
