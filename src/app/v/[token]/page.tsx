"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Batch, Item, VoteRequest } from "@/types";
import { shuffleWithSeed, generateVoterKey } from "@/lib/utils";
import Image from "next/image";

export default function VotingPage() {
    const params = useParams();
    const token = params.token as string;

    const [batch, setBatch] = useState<Batch | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [voterKey, setVoterKey] = useState<string>("");
    const [votes, setVotes] = useState<Record<string, "keep" | "cut">>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!supabase) {
                    setError("Database not configured");
                    return;
                }

                setIsLoading(true);

                // Get batch by token
                const { data: batchData, error: batchError } = await supabase
                    .from("batches")
                    .select("*")
                    .eq("token", token)
                    .single();

                if (batchError || !batchData) {
                    setError("Batch not found");
                    return;
                }

                setBatch(batchData);

                // Get items
                const { data: itemsData, error: itemsError } = await supabase
                    .from("items")
                    .select("*")
                    .eq("batch_id", batchData.id)
                    .order("created_at");

                if (itemsError) {
                    setError("Failed to load photos");
                    return;
                }

                setItems(itemsData || []);
            } catch {
                setError("Failed to load voting data");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
        initializeVoterKey();
    }, [token]);

    const initializeVoterKey = () => {
        // Check localStorage first
        let key = localStorage.getItem("voter_key");
        if (!key) {
            key = generateVoterKey();
            localStorage.setItem("voter_key", key);
        }
        setVoterKey(key);
    };

    const vote = async (choice: "keep" | "cut") => {
        if (isVoting || currentIndex >= items.length) return;

        setIsVoting(true);

        try {
            const currentItem = shuffledItems[currentIndex];

            const voteRequest: VoteRequest = {
                token,
                itemId: currentItem.id,
                choice,
            };

            const response = await fetch("/api/vote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(voteRequest),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to vote");
            }

            // Update local state
            setVotes((prev) => ({ ...prev, [currentItem.id]: choice }));

            // Move to next item
            setCurrentIndex((prev) => prev + 1);
        } catch (err) {
            console.error("Vote error:", err);
            alert("Failed to record vote. Please try again.");
        } finally {
            setIsVoting(false);
        }
    };

    // Shuffle items deterministically based on voter key
    const shuffledItems =
        items.length > 0 && voterKey
            ? shuffleWithSeed(items, voterKey + (batch?.id || ""))
            : items;

    const progress = {
        voted: Object.keys(votes).length,
        total: items.length,
    };

    const isComplete = currentIndex >= items.length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading photos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow p-6 text-center max-w-md w-full">
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Oops!
                    </h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow p-6 text-center max-w-md w-full">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                        Thanks for voting! 🎉
                    </h1>
                    <p className="text-gray-600 mb-6">
                        You&apos;ve voted on all {progress.total} photos.
                    </p>
                    <div className="text-sm text-gray-500">
                        Results are updated in real-time for the batch creator.
                    </div>
                </div>
            </div>
        );
    }

    const currentItem = shuffledItems[currentIndex];

    return (
        <div className="min-h-screen bg-black text-white relative">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 z-10">
                <div className="bg-gray-800 h-1">
                    <div
                        className="bg-blue-500 h-1 transition-all duration-300"
                        style={{
                            width: `${(currentIndex / items.length) * 100}%`,
                        }}
                    />
                </div>
                <div className="p-4 text-center">
                    <span className="text-sm text-gray-300">
                        {currentIndex + 1} of {items.length}
                    </span>
                </div>
            </div>

            {/* Main Photo */}
            <div className="flex items-center justify-center min-h-screen p-4 pt-20">
                {currentItem && (
                    <div className="relative max-w-4xl w-full">
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <Image
                                src={
                                    currentItem.thumb_url ||
                                    currentItem.media_url ||
                                    ""
                                }
                                alt="Photo to vote on"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Vote Buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex gap-4 max-w-md mx-auto">
                    <button
                        onClick={() => vote("cut")}
                        disabled={isVoting}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
                    >
                        ✗ Cut
                    </button>
                    <button
                        onClick={() => vote("keep")}
                        disabled={isVoting}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
                    >
                        ✓ Keep
                    </button>
                </div>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-400">
                        Swipe left to cut • Swipe right to keep
                    </p>
                </div>
            </div>

            {/* Batch Title */}
            {batch?.title && (
                <div className="absolute top-16 left-4 right-4 text-center">
                    <h1 className="text-lg font-medium text-white">
                        {batch.title}
                    </h1>
                </div>
            )}
        </div>
    );
}
