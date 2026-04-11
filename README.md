# AI Media Assistant

A full-stack AI chat application built with Next.js, Firebase, and OpenAI — featuring real-time chat, news context enrichment, and user authentication.

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Auth & Database**: Firebase (Auth + Firestore)
- **AI**: OpenAI GPT-4o-mini
- **News**: NewsAPI (with mock fallback)
- **Styling**: Tailwind CSS v4

## Features

- ChatGPT-like dark mode interface
- User authentication (Email/Password + Google)
- Persistent chat history per user (Firebase)
- AI responses via OpenAI API
- News context injection for current events queries
- Responsive design (mobile + desktop)
- Collapsible sidebar with chat history
- Typing animation while AI responds
- Markdown rendering with code highlighting
- Copy message to clipboard
- Error handling for API failures

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd ai-media-assistant
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required keys:
- `OPENAI_API_KEY` — from [platform.openai.com](https://platform.openai.com/api-keys)
- `NEXT_PUBLIC_FIREBASE_*` — from Firebase Console (see FIREBASE_SETUP.md)

Optional:
- `NEWS_API_KEY` — from [newsapi.org](https://newsapi.org) (falls back to mock data if not set)

### 3. Set up Firebase

Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
ai-media-assistant/
├── app/
│   ├── api/
│   │   └── chat/route.ts      # AI + News API endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Auth gate → ChatApp
├── components/
│   ├── AuthForm.tsx           # Login/Signup UI
│   ├── ChatApp.tsx            # Main app shell + state
│   ├── ChatView.tsx           # Message list + welcome screen
│   ├── ChatInput.tsx          # Message input box
│   ├── MessageBubble.tsx      # User/AI message bubbles
│   ├── NewsCard.tsx           # Related news articles
│   ├── Sidebar.tsx            # Chat history sidebar
│   └── TypingIndicator.tsx    # Animated loading dots
├── lib/
│   ├── AuthContext.tsx        # Firebase auth context
│   ├── firebase.ts            # Firebase app init
│   ├── firestore.ts           # Firestore CRUD helpers
│   ├── news.ts                # NewsAPI + mock fallback
│   └── openai.ts              # OpenAI client
├── .env.local                 # Your secrets (not committed)
├── .env.example               # Template
├── FIREBASE_SETUP.md          # Firebase setup guide
└── README.md
```

## API Route

`POST /api/chat`

```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "latestMessage": "..."
}
```

Response:
```json
{
  "response": "AI response text",
  "newsArticles": [{ "title": "...", "url": "...", "source": "...", "publishedAt": "..." }]
}
```

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

Add all `.env.local` variables to your Vercel project environment settings.
