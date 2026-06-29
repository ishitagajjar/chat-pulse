# ChatPulse

A real-time team messaging application — Slack-like chat with channels, DMs, typing indicators, presence, reactions, and more.

![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)

## Screenshots

> Add screenshots of the sidebar, chat area, typing indicators, and reactions here.

## Features

- User registration and JWT authentication with refresh tokens
- Workspaces with public/private channels and direct messages
- Real-time messaging via Socket.io
- Typing indicators and online/offline presence
- Emoji reactions on messages
- Message edit and delete
- File/image upload support (Cloudinary)
- Unread message counts and badges
- Full-text message search
- Infinite scroll with cursor-based pagination
- Responsive 3-column layout (mobile-friendly)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript, Socket.io |
| Database | PostgreSQL, Prisma ORM |
| Cache | Redis (Upstash) — optional, with in-memory fallback |
| File Storage | Cloudinary |
| Auth | JWT + httpOnly refresh token cookies |
| Deploy | Vercel (frontend) + Railway (backend) |

## Architecture

```
┌──────────┐     WebSocket      ┌──────────────┐
│  Browser │ ◄────────────────► │  Socket.io   │
│  (React) │                    │   Server     │
└────┬─────┘                    └──────┬───────┘
     │ REST API                        │
     ▼                                 ▼
┌──────────────┐              ┌───────────────┐
│   Express    │─────────────►│  PostgreSQL   │
│   REST API   │              │   (Prisma)    │
└──────┬───────┘              └───────────────┘
       │
       ▼
┌──────────────┐
│    Redis     │  presence, typing indicators
│  (optional)  │
└──────────────┘
```

## Socket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `message:send` | `{ channelId, content, type?, fileUrl? }` |
| Client → Server | `message:edit` | `{ messageId, content }` |
| Client → Server | `message:delete` | `{ messageId }` |
| Client → Server | `typing:start` | `{ channelId }` |
| Client → Server | `typing:stop` | `{ channelId }` |
| Client → Server | `reaction:add` | `{ messageId, emoji }` |
| Client → Server | `reaction:remove` | `{ messageId, emoji }` |
| Client → Server | `channel:join` | `{ channelId }` |
| Client → Server | `channel:leave` | `{ channelId }` |
| Server → Client | `message:new` | Message object with user info |
| Server → Client | `message:updated` | `{ messageId, content, isEdited }` |
| Server → Client | `message:deleted` | `{ messageId, channelId }` |
| Server → Client | `typing:update` | `{ channelId, users: string[] }` |
| Server → Client | `reaction:updated` | `{ messageId, reactions[] }` |
| Server → Client | `presence:update` | `{ userId, status }` |
| Server → Client | `unread:update` | `{ channelId, count }` |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis (optional — app works without it)

### Setup

```bash
# Install all dependencies
npm run setup

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and secrets

# Run database migrations
cd backend && npx prisma migrate dev

# Seed demo data (optional)
cd backend && npm run seed

# Start development servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

### Demo Accounts

After seeding:

| Email | Password |
|-------|----------|
| alice@demo.com | Demo@123 |
| bob@demo.com | Demo@123 |
| charlie@demo.com | Demo@123 |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (optional) |
| `ACCESS_TOKEN_SECRET` | JWT access token secret |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret |
| `PORT` | Server port (default: 3000) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `CLOUDINARY_*` | Cloudinary credentials for file uploads |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (default: `/api` via proxy) |
| `VITE_WS_URL` | WebSocket URL (default: `http://localhost:3000`) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run backend` | Start backend only |
| `npm run frontend` | Start frontend only |
| `npm run setup` | Install all dependencies |

## Deployment

- **Frontend**: Deploy to Vercel. Set `VITE_API_URL` and `VITE_WS_URL` to your Railway backend URL.
- **Backend**: Deploy to Railway. Set all environment variables from `.env.example`. Run `npx prisma migrate deploy` on deploy.

## License

MIT
