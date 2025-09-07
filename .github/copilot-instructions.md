# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a "Batch & Vote" MVP application - a photo voting web app where users can upload photos, share a link for others to vote, and see live ranked results.

## Tech Stack

-   **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind CSS (mobile-first)
-   **Backend**: Next.js API routes (serverless)
-   **Database**: Supabase (PostgreSQL + RLS + Realtime)
-   **Auth**: Supabase Auth (magic links for creators only)
-   **Images**: Cloudinary (direct uploads, transformations)
-   **Rate Limiting**: Upstash Redis
-   **Deployment**: Vercel

## Key Features

1. **Creator Flow**: Upload photos → create batch → get shareable link → view live results
2. **Voter Flow**: Open link (no login) → vote keep/cut → see progress
3. **Realtime Updates**: Live ranking updates using Supabase channels
4. **Security**: RLS policies, rate limiting, secure tokens

## Database Schema

-   `batches`: Contains batch info, owner, token, settings
-   `items`: Photos with Cloudinary URLs and metadata
-   `votes`: Keep/cut votes with voter anonymization

## Coding Guidelines

1. Use TypeScript for all new files
2. Follow mobile-first responsive design
3. Implement proper error handling and loading states
4. Use Server Components where possible, Client Components for interactivity
5. Follow Next.js App Router conventions
6. Implement proper security (RLS, rate limiting, input validation)
7. Use Tailwind CSS for styling with consistent design system
8. Handle edge cases (expired batches, rate limits, network errors)

## File Structure

-   `/src/app/` - Next.js App Router pages and layouts
-   `/src/app/api/` - API routes
-   `/src/components/` - Reusable React components
-   `/src/lib/` - Utility functions, database clients, schemas
-   `/src/types/` - TypeScript type definitions

## Important Notes

-   Voting is anonymous (no user accounts for voters)
-   Use Wilson score for ranking algorithm
-   All uploads go through Cloudinary with preset restrictions
-   Rate limiting prevents abuse
-   Mobile-first design is critical
