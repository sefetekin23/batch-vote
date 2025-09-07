import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkVoteRateLimit, checkMemoryRateLimit } from "@/lib/redis";
import { VoteRequest } from "@/types";
import { isBatchExpired } from "@/lib/utils";

export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const body: VoteRequest = await request.json();
        const { token, itemId, choice } = body;

        if (!token || !itemId || !choice) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!["keep", "cut"].includes(choice)) {
            return NextResponse.json(
                { error: "Invalid choice" },
                { status: 400 }
            );
        }

        // Get voter key from cookie
        const cookieStore = request.headers.get("cookie") || "";
        let voterKey = "";

        const vkMatch = cookieStore.match(/vk=([^;]+)/);
        if (vkMatch) {
            voterKey = vkMatch[1];
        } else {
            // Generate new voter key
            voterKey = crypto.randomUUID();
        }

        // Get client IP for rate limiting
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";

        // Check rate limits
        const rateLimit = await checkVoteRateLimit(token, ip, voterKey);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
        }

        // Fallback memory rate limit
        if (!checkMemoryRateLimit(`vote:${ip}`, 5, 1000)) {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
        }

        // Get batch by token
        const { data: batch, error: batchError } = await supabaseAdmin
            .from("batches")
            .select("id, expires_at")
            .eq("token", token)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        // Check if batch is expired
        if (isBatchExpired(batch.expires_at)) {
            return NextResponse.json(
                { error: "Batch has expired" },
                { status: 403 }
            );
        }

        // Verify item exists in this batch
        const { data: item, error: itemError } = await supabaseAdmin
            .from("items")
            .select("id")
            .eq("id", itemId)
            .eq("batch_id", batch.id)
            .single();

        if (itemError || !item) {
            return NextResponse.json(
                { error: "Item not found" },
                { status: 404 }
            );
        }

        // Upsert vote
        const { error: voteError } = await supabaseAdmin.from("votes").upsert(
            {
                batch_id: batch.id,
                item_id: itemId,
                voter_key: voterKey,
                choice,
            },
            {
                onConflict: "item_id,voter_key",
            }
        );

        if (voteError) {
            console.error("Vote error:", voteError);
            return NextResponse.json(
                { error: "Failed to record vote" },
                { status: 500 }
            );
        }

        // Publish realtime update
        try {
            await supabaseAdmin.channel(`batch-${batch.id}`).send({
                type: "broadcast",
                event: "vote",
                payload: {
                    itemId,
                    delta: choice === "keep" ? "+1 keep" : "+1 cut",
                },
            });
        } catch (realtimeError) {
            console.error("Realtime error:", realtimeError);
            // Don't fail the vote if realtime fails
        }

        const response = NextResponse.json({ ok: true });

        // Set voter key cookie if not already set
        if (!vkMatch) {
            response.cookies.set("vk", voterKey, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });
        }

        return response;
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
