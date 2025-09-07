# Batch & Vote

A web application for photo voting where users can upload photos, share a link for others to vote, and see live ranked results.

🚀 **Now deployed on Vercel!**

## Features

-   **Creator Flow**: Upload photos → create batch → get shareable link → view live results
-   **Voter Flow**: Open link (no login) → vote keep/cut → see progress
-   **Realtime Updates**: Live ranking updates using Supabase channels
-   **Mobile-First**: Optimized for mobile voting experience
-   **Anonymous Voting**: No accounts needed for voters
-   **Smart Ranking**: Wilson score algorithm for robust ranking

## Tech Stack

-   **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind CSS
-   **Backend**: Next.js API routes (serverless)
-   **Database**: Supabase (PostgreSQL + RLS + Realtime)
-   **Images**: Cloudinary (direct uploads, transformations)
-   **Rate Limiting**: Upstash Redis (optional)
-   **Deployment**: Vercel

## Getting Started

### Prerequisites

1. Node.js 18+ and npm
2. Supabase account and project
3. Cloudinary account
4. Upstash Redis account (optional for rate limiting)

### Environment Setup

1. Copy the environment variables:

    ```bash
    cp .env.example .env.local
    ```

2. Fill in your environment variables in `.env.local`:
    - Supabase: URL, anon key, and service role key
    - Cloudinary: cloud name and upload preset
    - Upstash Redis: URL and token (optional)

### Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Create tables
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text,
  max_select int not null default 20,
  visibility text not null default 'link',
  token text unique not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  type text not null check (type in ('photo','caption')),
  media_url text,
  thumb_url text,
  text_content text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.votes (
  id bigserial primary key,
  batch_id uuid not null references public.batches(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  voter_key text not null,
  choice text,
  score int,
  created_at timestamptz not null default now(),
  unique (item_id, voter_key)
);

-- Create indexes
create index on public.items (batch_id);
create index on public.votes (batch_id);
create index on public.votes (voter_key);

-- Enable RLS
alter table public.batches enable row level security;
alter table public.items enable row level security;
alter table public.votes enable row level security;

-- RLS Policies (simplified for MVP)
create policy "Enable read access for all users" on public.batches for select using (true);
create policy "Enable insert for all users" on public.batches for insert with check (true);

create policy "Enable read access for all users" on public.items for select using (true);
create policy "Enable insert for all users" on public.items for insert with check (true);

create policy "Enable read access for all users" on public.votes for select using (true);
create policy "Enable insert for all users" on public.votes for insert with check (true);
create policy "Enable update for all users" on public.votes for update using (true);
```

### Cloudinary Setup

1. Create a Cloudinary account
2. Create an unsigned upload preset:
    - Go to Settings → Upload → Upload presets
    - Create new preset with these settings:
        - Signing Mode: Unsigned
        - Folder: `batches`
        - Allowed formats: jpg, jpeg, png, webp
        - Max file size: 10MB
3. Copy your cloud name and preset name to `.env.local`

### Installation

1. Install dependencies:

    ```bash
    npm install
    ```

2. Run the development server:

    ```bash
    npm run dev
    ```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

## Usage

### Creating a Batch

1. Go to `/create`
2. Enter a title and maximum selections
3. Upload photos (drag & drop or click to browse)
4. Get your shareable voting link

### Voting

1. Open the voting link (format: `/v/{token}`)
2. Vote "Keep" or "Cut" on each photo
3. See progress as you vote
4. Complete all photos to finish

### Viewing Results

1. Go to `/b/{batch-id}` (batch creator only)
2. See live ranking with vote statistics
3. Toggle between all photos and top selections
4. Copy voting link to share with more voters

## API Routes

-   `POST /api/batches` - Create new batch
-   `POST /api/batches/[id]/items` - Add photos to batch
-   `GET /api/batches/[id]/results` - Get ranked results
-   `POST /api/vote` - Submit vote

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── create/            # Create batch page
│   ├── v/[token]/         # Voting page
│   └── b/[id]/            # Results page
├── components/            # React components
├── lib/                   # Utilities and clients
└── types/                 # TypeScript definitions
```

### Key Features

-   **Wilson Score Ranking**: Robust statistical ranking that handles small sample sizes
-   **Rate Limiting**: Prevents vote spam and abuse
-   **Anonymous Voting**: No authentication required for voters
-   **Realtime Updates**: Live results using Supabase channels
-   **Mobile Optimized**: Touch-friendly voting interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
