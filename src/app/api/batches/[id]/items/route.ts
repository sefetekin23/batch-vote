import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { AddItemsRequest } from "@/types";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const { id: batchId } = await params;
        const body: AddItemsRequest = await request.json();

        // Verify batch exists
        const { data: batch, error: batchError } = await supabaseAdmin
            .from("batches")
            .select("id")
            .eq("id", batchId)
            .single();

        if (batchError || !batch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        // Insert items
        const itemsToInsert = body.items.map((item) => ({
            batch_id: batchId,
            type: item.type,
            media_url: item.mediaUrl,
            thumb_url: item.thumbUrl,
            meta: item.meta || {},
        }));

        const { data, error } = await supabaseAdmin
            .from("items")
            .insert(itemsToInsert)
            .select("id");

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Failed to create items" },
                { status: 500 }
            );
        }

        return NextResponse.json({ inserted: data.length });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
