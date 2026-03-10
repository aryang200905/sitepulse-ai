# SitePulse AI — Instant SEO & AEO Intelligence

SitePulse AI is a Next.js web application that analyzes any URL and automatically generates prioritized, copy-ready recommendations to help web pages rank higher in traditional search (SEO) and get cited by AI engines (AEO).

## Features

- **SEO Audit**: Automated analysis of standard on-page SEO factors with exact copy-paste fixes for metadata.
- **AEO Pack (Answer Engine Optimization)**: Generates highly readable and structured AI-centric content modules (like FAQ schemas, direct answers, and terminology definitions) optimized for LLM ingestion.
- **Top 10 Fixes**: A curated, prioritized list of the highest-impact changes.
- **Draft / Blueprint**: See an instant preview of what the fully optimized page could look like, along with a rollout plan.
- **Export**: Export recommendations to a portable styled HTML report.
- **Authentication**: Secure Google and Email/Password sign-in powered by Firebase Authentication.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: Custom CSS with modern glassmorphism UI
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v20 or newer recommended)
- npm, yarn, or pnpm
- A Firebase project (for authentication)
- (Optional but recommended) An OpenAI API key or similar LLM provider API key to power the AI analysis.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd sitepulse-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Rename `.env.example` to `.env.local` or create a new `.env.local` file and add your configuration details.

   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # LLM provider (OpenAI-compatible)
   LLM_API_URL=https://api.openai.com/v1/chat/completions
   LLM_API_KEY=sk-your-key-here
   LLM_MODEL=gpt-4o
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is built with Next.js, making [Vercel](https://vercel.com/) the easiest and most optimized platform for deployment.

1. Create a free account on Vercel.
2. Link your GitHub repository.
3. Add your Environment Variables (`NEXT_PUBLIC_FIREBASE_*`, `LLM_*`) in the Vercel project settings.
4. Deploy!

Alternative deployment options include **Netlify**, **Render**, or using **Docker** on any standard cloud provider (AWS, DigitalOcean, Google Cloud).
