import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateBatchToken } from "@/lib/utils";
import { CreateBatchRequest, CreateBatchResponse } from "@/types";

export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const body: CreateBatchRequest = await request.json();

        // For MVP, we'll create batches without strict auth requirements
        // Don't set owner_id for anonymous users

        // Generate unique token
        const batchToken = generateBatchToken();

        // Create batch
        const { data, error } = await supabaseAdmin
            .from("batches")
            .insert({
                title: body.title || null,
                token: batchToken,
            })
            .select("id, token")
            .single();

        if (error) {
            console.error("Database error:", error);
            return NextResponse.json(
                { error: "Failed to create batch" },
                { status: 500 }
            );
        }

        const response: CreateBatchResponse = {
            id: data.id,
            token: data.token,
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
