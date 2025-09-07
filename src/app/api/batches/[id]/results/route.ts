import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { rankItems } from "@/lib/utils";
import { ItemWithVotes, ResultsData } from "@/types";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const { id: batchId } = await params;

        // Get batch info
        const { data: batch, error: batchError } = await supabaseAdmin
            .from("batches")
            .select("*")
            .eq("id", batchId)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        // Get items with vote counts
        const { data: items, error: itemsError } = await supabaseAdmin
            .from("items")
            .select(
                `
        *,
        votes (
          choice
        )
      `
            )
            .eq("batch_id", batchId)
            .order("created_at");

        if (itemsError) {
            console.error("Database error:", itemsError);
            return NextResponse.json(
                { error: "Failed to fetch items" },
                { status: 500 }
            );
        }

        // Calculate vote statistics
        const itemsWithVotes: ItemWithVotes[] = items.map((item) => {
            const votes = item.votes || [];
            const keep = votes.filter(
                (v: { choice: string }) => v.choice === "keep"
            ).length;
            const cut = votes.filter(
                (v: { choice: string }) => v.choice === "cut"
            ).length;
            const total = keep + cut;
            const keepRate = total > 0 ? keep / total : 0;

            return {
                id: item.id,
                batch_id: item.batch_id,
                type: item.type,
                media_url: item.media_url,
                thumb_url: item.thumb_url,
                text_content: item.text_content,
                meta: item.meta,
                created_at: item.created_at,
                votes: votes,
                keep,
                cut,
                total,
                keepRate,
                wilsonLower: 0, // Will be calculated in rankItems
            };
        });

        // Rank items using Wilson score
        const rankedItems = rankItems(itemsWithVotes);

        const response: ResultsData = {
            batch,
            items: rankedItems,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
