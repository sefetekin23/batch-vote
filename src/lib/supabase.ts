import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase client
export const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;

// Server-side Supabase client with service role key (for API routes)
export const supabaseAdmin =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null;

// Database types
export type Database = {
    public: {
        Tables: {
            batches: {
                Row: {
                    id: string;
                    owner_id: string;
                    title: string | null;
                    max_select: number;
                    visibility: string;
                    token: string;
                    expires_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    owner_id: string;
                    title?: string | null;
                    max_select?: number;
                    visibility?: string;
                    token: string;
                    expires_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    owner_id?: string;
                    title?: string | null;
                    max_select?: number;
                    visibility?: string;
                    token?: string;
                    expires_at?: string | null;
                    created_at?: string;
                };
            };
            items: {
                Row: {
                    id: string;
                    batch_id: string;
                    type: string;
                    media_url: string | null;
                    thumb_url: string | null;
                    text_content: string | null;
                    meta: Record<string, unknown>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    batch_id: string;
                    type: string;
                    media_url?: string | null;
                    thumb_url?: string | null;
                    text_content?: string | null;
                    meta?: Record<string, unknown>;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    batch_id?: string;
                    type?: string;
                    media_url?: string | null;
                    thumb_url?: string | null;
                    text_content?: string | null;
                    meta?: Record<string, unknown>;
                    created_at?: string;
                };
            };
            votes: {
                Row: {
                    id: number;
                    batch_id: string;
                    item_id: string;
                    voter_key: string;
                    choice: string | null;
                    score: number | null;
                    created_at: string;
                };
                Insert: {
                    id?: number;
                    batch_id: string;
                    item_id: string;
                    voter_key: string;
                    choice?: string | null;
                    score?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: number;
                    batch_id?: string;
                    item_id?: string;
                    voter_key?: string;
                    choice?: string | null;
                    score?: number | null;
                    created_at?: string;
                };
            };
        };
    };
};
