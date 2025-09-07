"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateBatchRequest, CreateBatchResponse } from "@/types";
import PhotoUploader from "@/components/PhotoUploader";

export default function CreateBatchPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [batchData, setBatchData] = useState<CreateBatchResponse | null>(
        null
    );
    const [isCopied, setIsCopied] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        maxSelect: 20,
    });

    const handleCreateBatch = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const request: CreateBatchRequest = {
                title: formData.title || undefined,
                maxSelect: formData.maxSelect,
            };

            const response = await fetch("/api/batches", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error("Failed to create batch");
            }

            const data: CreateBatchResponse = await response.json();
            setBatchData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotosUploaded = () => {
        if (batchData) {
            router.push(`/b/${batchData.id}`);
        }
    };

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

    const shareUrl = batchData
        ? `${window.location.origin}/v/${batchData.token}`
        : "";

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Create Batch
                    </h1>
                    <p className="text-gray-600">
                        Upload photos and get a shareable voting link
                    </p>
                </div>

                {!batchData ? (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="space-y-6">
                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Batch Title (optional)
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Weekend Trip Photos"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="maxSelect"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Maximum selections
                                </label>
                                <input
                                    type="number"
                                    id="maxSelect"
                                    value={formData.maxSelect}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            maxSelect:
                                                parseInt(e.target.value) || 20,
                                        })
                                    }
                                    min="1"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    How many photos can be selected in the final
                                    results
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-600 text-sm">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleCreateBatch}
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Creating..." : "Create Batch"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Upload Photos
                            </h2>
                            <PhotoUploader
                                batchId={batchData.id}
                                onUploadComplete={handlePhotosUploaded}
                            />
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-2">
                                Batch Created!
                            </h3>
                            <p className="text-green-700 text-sm mb-3">
                                Share this link for others to vote:
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-green-300 rounded bg-white text-sm"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className={`px-4 py-2 rounded text-sm transition-colors ${
                                        isCopied
                                            ? "bg-green-700 text-white"
                                            : "bg-green-600 text-white hover:bg-green-700"
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
                                            Copy
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
