# Mesh: Real-Time Communication Platform with Full-stack Collaboration

## Overview
**Mesh** is a modern full-stack communication platform, enabling real-time messaging, server-based collaboration, friend interactions, role-based permissions, and voice support. It leverages a monorepo setup for scalable development across multiple apps.
- Mesh App (original link) : https://github.com/chandanSahoo-cs/mesh (hosted on vercel)
- Mesh WSS (original link) : https://github.com/chandanSahoo-cs/mesh-wss (hosted on railway)

![Image1](/public/image1.png)
![Image2](/public/image2.png)
![Image3](/public/image3.png)
![Image4](/public/image4.png)
![Image5](/public/image5.png)
![Image6](/public/image6.png)

## Features
- **Real-time Messaging**: Instant text and image communication across servers (Convex reactivity)
- **Typing Indication**: Real time typing indication with channel and dm scope (Liveblocks)
- **User presence**: A custom websocket server to mark the user presence 
- **Server & Channel Structure**: Create servers with categorized channels (text, voice, etc.)
- **Role-based Access Control**: Manage user permissions granularly with custom roles
- **Threaded Conversations**: Support for message threads within channels and DMs
- **Reactions**: Emoji reactions for both server and friend messages
- **Friend System**: Send, accept, reject, or block friend requests
- **Presence & Status**: Online/offline indicators, typing indicators, and user status
- **Voice Communication**: Integrated global(you don't need to be in specific channel or dm to continue a call) voice room support (Livekit)
- **Modular Convex Backend**: Scalable logic with fine-grained API and real-time database updates


## Technologies Used

### Frontend:
- **Next.js (App Router)**: React framework with SSR, routing, and edge-ready rendering
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Component library based on Radix UI and Lucide icons
- **Quill Editor**: For rich text editing (if used in messages or threads)

### Real-Time & Backend:
- **Convex**: Real-time backend with authentication, data modeling, and reactive queries
- **Liveblocks**: Live presence tracking, room management, typing indicators
- **LiveKit**: Audio rooms for voice channels
- **Custom Websocket server** : For marking user's presence (online/offline)

### Project Structure:
- **Turborepo**: Managed monorepo for scalable multi-app development
  - `apps/mesh-app`: Fullstack application
  - `apps/mesh-wss`: Custom Websocket server

## Usage
```bash
git clone https://github.com/chandanSahoo-cs/mesh-turborepo.git
cd mesh-turborepo
npm install
npm run dev (this will run both the apps in parallel (mesh-app and mesh-wss)
