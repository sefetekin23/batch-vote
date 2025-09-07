"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ResultsData, ItemWithVotes } from "@/types";
import Image from "next/image";

export default function ResultsPage() {
    const params = useParams();
    const batchId = params.id as string;

    const [data, setData] = useState<ResultsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTopOnly, setShowTopOnly] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const loadResults = async () => {
            try {
                const response = await fetch(`/api/batches/${batchId}/results`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setError("Batch not found");
                    } else {
                        setError("Failed to load results");
                    }
                    return;
                }

                const resultsData: ResultsData = await response.json();
                setData(resultsData);
                setError(null);
            } catch {
                setError("Failed to load results");
            } finally {
                setIsLoading(false);
            }
        };

        loadResults();
        // Set up polling for live updates
        const interval = setInterval(loadResults, 5000);
        return () => clearInterval(interval);
    }, [batchId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow p-6 text-center max-w-md w-full">
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Error
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

    const { batch, items } = data;
    const displayItems = showTopOnly ? items.slice(0, batch.max_select) : items;
    const shareUrl = `${window.location.origin}/v/${batch.token}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            // Reset the copied state after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {batch.title || "Batch Results"}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Live voting results • Updates automatically
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className={`px-4 py-2 rounded text-sm whitespace-nowrap transition-colors ${
                                        isCopied
                                            ? "bg-blue-700 text-white"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                >
                                    {isCopied ? (
                                        <span className="flex items-center gap-1">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                            Copied!
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                            Copy Link
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-3xl font-bold text-blue-600">
                            {items.length}
                        </div>
                        <div className="text-gray-600">Total Photos</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-3xl font-bold text-green-600">
                            {items.reduce((sum, item) => sum + item.total, 0)}
                        </div>
                        <div className="text-gray-600">Total Votes</div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-3xl font-bold text-purple-600">
                            {batch.max_select}
                        </div>
                        <div className="text-gray-600">Max Selections</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={showTopOnly}
                                    onChange={(e) =>
                                        setShowTopOnly(e.target.checked)
                                    }
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">
                                    Show only top {batch.max_select}
                                </span>
                            </label>
                        </div>

                        <div className="text-sm text-gray-500">
                            Last updated: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayItems.map((item, index) => (
                        <ResultCard
                            key={item.id}
                            item={item}
                            rank={index + 1}
                        />
                    ))}
                </div>

                {items.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg
                                className="mx-auto h-12 w-12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No photos yet
                        </h3>
                        <p className="text-gray-600">
                            Upload photos to start collecting votes
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ResultCard({ item, rank }: { item: ItemWithVotes; rank: number }) {
    const keepPercentage =
        item.total > 0 ? Math.round((item.keep / item.total) * 100) : 0;

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            {/* Rank Badge */}
            <div className="relative">
                <div className="absolute top-2 left-2 z-10">
                    <span className="bg-gray-900 text-white text-sm font-bold px-2 py-1 rounded">
                        #{rank}
                    </span>
                </div>

                {/* Image */}
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                    <Image
                        src={item.thumb_url || item.media_url || ""}
                        alt={`Photo ${rank}`}
                        fill
                        className="object-cover"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-green-600">
                        {keepPercentage}% Keep
                    </span>
                    <span className="text-sm text-gray-500">
                        {item.total} votes
                    </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${keepPercentage}%` }}
                    />
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                    <span>Keep: {item.keep}</span>
                    <span>Cut: {item.cut}</span>
                </div>

                {item.total >= 3 && (
                    <div className="mt-2 text-xs text-gray-500">
                        Wilson Score: {item.wilsonLower.toFixed(3)}
                    </div>
                )}
            </div>
        </div>
    );
}
