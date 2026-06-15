# WhatsApp Clone

A full-stack WhatsApp clone built with React, Node.js, Socket.IO, and MongoDB.

## 🚀 Features

- Real-time messaging with Socket.IO
- Google OAuth authentication
- User management
- Conversation management
- Responsive design
- Modern UI with SCSS

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Zustand for state management
- Socket.IO client for real-time communication
- Google OAuth for authentication
- SCSS for styling
- React Icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.IO for real-time communication
- CORS enabled

### Build System
- Rush.js monorepo management
- PNPM package manager

## 📋 Prerequisites

- Node.js (>=18.20.3)
- PNPM
- MongoDB Atlas account
- Google OAuth credentials

## 🔧 Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd WhatsApp-clone
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
```bash
cp apps/client-ui/.env.example apps/client-ui/.env
```
Edit the `.env` file and add your Google Client ID:
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_SOCKET_URL=ws://localhost:9000
```

#### Backend (.env in server/)
```bash
cp server/.env.example server/.env
```
Edit the `.env` file and add your MongoDB credentials:
```
DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password
PORT=8000
FRONTEND_URL=http://localhost:3000
```

### 5. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create credentials (OAuth 2.0 Client ID)
5. Add `http://localhost:3000` to authorized origins
6. Copy the Client ID to your `.env` file

### 6. Set up MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get connection string and update `.env` file
5. Whitelist your IP address

## 🚀 Running the Application

### Start all services (recommended)

#### Terminal 1 - Frontend
```bash
cd apps/client-ui
npm start
```

#### Terminal 2 - Backend API
```bash
cd server
npm start
```

#### Terminal 3 - Socket Server
```bash
cd socket
npm start
```

### Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Socket Server: ws://localhost:9000

## 📁 Project Structure

```
WhatsApp-clone/
├── apps/
│   └── client-ui/          # React frontend
├── libs/
│   └── shared/             # Shared utilities and components
├── server/                 # Express.js backend
├── socket/                 # Socket.IO server
├── common/                 # Rush configuration
└── rush.json              # Rush configuration
```

## 🔑 Key Configuration Files

- `rush.json` - Rush monorepo configuration
- `apps/client-ui/.env` - Frontend environment variables
- `server/.env` - Backend environment variables
- `common/config/rush/pnpm-config.json` - PNPM configuration

## 🐛 Troubleshooting

### Common Issues

1. **Rush version mismatch**
   ```bash
   rush update --full
   ```

2. **MongoDB connection issues**
   - Check your MongoDB Atlas credentials
   - Ensure IP address is whitelisted
   - Verify network access settings

3. **Google OAuth issues**
   - Verify Client ID is correct
   - Check authorized origins in Google Console
   - Ensure domain is added to OAuth settings

4. **Socket connection issues**
   - Check if socket server is running on port 9000
   - Verify CORS settings
   - Check browser console for errors

### Development Tips

1. **Check all services are running**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000/users (should return JSON)
   - Socket: Check browser network tab for WebSocket connection

2. **Monitor logs**
   - Backend logs show database connection status
   - Socket logs show connection/disconnection events
   - Frontend console shows authentication and API call status

## 📝 TODO

- [ ] Add message encryption
- [ ] Implement file sharing
- [ ] Add group chat functionality
- [ ] Implement message status (sent, delivered, read)
- [ ] Add push notifications
- [ ] Implement message search
- [ ] Add dark/light theme toggle

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
