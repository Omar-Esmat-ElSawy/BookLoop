📚 BookLoop - Peer-to-Peer Book Exchange Platform

🌟 Key Features

📖 Book Exchange Management: List your own books, specify their condition, upload cover images, search/filter books by title, author, or genre, and make direct exchange requests.

💬 Real-Time Messaging: Instant peer-to-peer chatting built on Socket.io to coordinate handovers and discuss details.

🌍 Interactive Book Mapping: Search for books based on geographical location. Built with Leaflet maps to easily pinpoint local swaps.

🛡️ Secure Database & Auth: Built-in authentication powered by Supabase with Row Level Security (RLS) policies protecting sensitive data.

🔔 Real-Time Notifications: Automatically receive in-app alerts whenever someone requests your books or sends you a new message (backed by PostgreSQL Triggers).

📊 Admin Dashboard & Analytics: View site statistics, active listings, user sign-ups, and engagement charts powered by Recharts.

🤖 Smart Book Assistant: An interactive companion helping users find recommendations and navigate the application.

🌐 Localization (i18n): Multi-language capabilities out-of-the-box (powered by `i18next` with language detection).

🌙 Premium Styling: Sleek UI featuring custom dark mode styling, glassmorphic elements, and micro-interactions powered by Framer Motion.
---

🛠️ Tech Stack

Frontend
Framework: React 18 & TypeScript (bootstrapped with Vite)
Styling & Components: Tailwind CSS, Shadcn/ui (Radix Primitives), Lucide Icons
State Management & Data Fetching: TanStack React Query (`@tanstack/react-query`)
Routing: React Router DOM v6
Animations: Framer Motion
Maps: Leaflet & React Leaflet (interactive maps)
Charts & Graphs: Recharts
Internationalization: i18next & react-i18next

Backend & Database
Auth & Database: Supabase (PostgreSQL with RLS and Pl/pgSQL triggers)
Real-Time Communication: Node.js Express server + Socket.io (located in `/server` directory)

---

💾 Database Architecture

BookLoop uses PostgreSQL hosted on Supabase. Row-Level Security (RLS) is enabled on all tables to ensure data isolation.

| Table Name | Description | Key Fields |
| :--- | :--- | :--- |
| `users` | User profile details linked to Supabase Auth | `id`, `username`, `email`, `avatar_url` |
| `book_genres` | System genres for classifying books | `id`, `name`, `description` |
| `books` | Book listings uploaded by users | `id`, `title`, `author`, `genre`, `owner_id`, `is_available`, `condition` |
| `exchange_requests` | Swapping requests between users | `id`, `book_id`, `requester_id`, `status` (`pending`/`accepted`/`rejected`), `message` |
| `messages` | Peer-to-peer messages log | `id`, `sender_id`, `receiver_id`, `content`, `is_read` |
| `notifications` | Activity logs triggering alerts | `id`, `user_id`, `type`, `content`, `is_read`, `related_id` |

> [!NOTE]  
> PostgreSQL Triggers are implemented to automatically generate system notifications when an exchange request is created (`on_exchange_request_created`) or when a new message is received (`on_message_created`).

---

📂 Project Structure

```bash
BookLoop/
├── server/                    # Socket.io chat server
│   ├── index.js               # Express application and socket handlers
│   └── package.json
├── src/                       # Frontend application
│   ├── components/            # UI components (shadcn/ui modules, maps, etc.)
│   ├── contexts/              # React contexts (Auth, Books, Messaging, Notifications, i18n)
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Full routing pages (Home, Admin, Books, Messages, Profile...)
│   ├── services/              # API interfaces and external SDK configurations
│   ├── App.tsx                # Routing and main Providers tree
│   ├── index.css              # Tailwind and global styles
│   └── main.tsx
├── supabase/                  # Supabase functions and migrations configuration
├── supabase-sql.sql           # Database schema & RLS policies script
├── tailwind.config.ts         # Tailwind configuration
└── vite.config.ts             # Vite build options
```

---

🚀 Getting Started

Prerequisites
- Node.js (v18+ recommended)
- Bun or npm installed
- A Supabase project initialized

1. Database Setup
Execute the contents of `supabase-sql.sql` inside the SQL Editor of your Supabase console. This will create all tables, indexes, row-level policies, and notification triggers automatically.

2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
VITE_CHAT_SERVER_URL=http://localhost:5000
```

Also, create a `.env` file inside the `server/` directory:
```env
PORT=5000
```

3. Install Dependencies
For Frontend:
```bash
npm install
# or if you prefer bun
bun install
```

For Chat Server:
```bash
cd server
npm install
```

4. Running the Development Servers
Open two terminals or run in parallel:

Start Chat Server:
```bash
cd server
node index.js
```

Start Vite Frontend App:
```bash
npm run dev
# or
bun run dev
```
Open `http://localhost:5173` to see your running instance of BookLoop.

---

🧪 Testing
Unit and integration tests are configured with Vitest.
```bash
npm run test          # Run tests
npm run coverage      # Run tests with coverage reporting
```

📄 License
This project is private and proprietary. All rights reserved.
