export interface Batch {
    id: string;
    owner_id: string;
    title: string | null;
    max_select: number;
    visibility: "link";
    token: string;
    expires_at: string | null;
    created_at: string;
}

export interface Item {
    id: string;
    batch_id: string;
    type: "photo" | "caption";
    media_url: string | null;
    thumb_url: string | null;
    text_content: string | null;
    meta: Record<string, unknown>;
    created_at: string;
}

export interface Vote {
    id: number;
    batch_id: string;
    item_id: string;
    voter_key: string;
    choice: "keep" | "cut" | null;
    score: number | null;
    created_at: string;
}

export interface BatchWithItems extends Batch {
    items: Item[];
}

export interface ItemWithVotes extends Item {
    votes: Vote[];
    keep: number;
    cut: number;
    total: number;
    keepRate: number;
    wilsonLower: number;
}

export interface VoteRequest {
    token: string;
    itemId: string;
    choice: "keep" | "cut";
}

export interface CreateBatchRequest {
    title?: string;
    maxSelect?: number;
}

export interface CreateBatchResponse {
    id: string;
    token: string;
}

export interface AddItemsRequest {
    items: Array<{
        type: "photo";
        mediaUrl: string;
        thumbUrl: string;
        meta?: Record<string, unknown>;
    }>;
}

export interface VotingPageData {
    batch: Batch;
    items: Item[];
    currentIndex: number;
    progress: {
        voted: number;
        total: number;
    };
}

export interface ResultsData {
    batch: Batch;
    items: ItemWithVotes[];
}
