"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { AddItemsRequest } from "@/types";

interface PhotoUploaderProps {
    batchId: string;
    onUploadComplete: () => void;
}

interface UploadedFile {
    file: File;
    preview: string;
    status: "pending" | "uploading" | "uploaded" | "error";
    cloudinaryUrl?: string;
    error?: string;
}

export default function PhotoUploader({
    batchId,
    onUploadComplete,
}: PhotoUploaderProps) {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            status: "pending" as const,
        }));

        setFiles((prev) => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".webp"],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: true,
    });

    const uploadToCloudinary = async (
        file: File
    ): Promise<{ mediaUrl: string; thumbUrl: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
            "upload_preset",
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
        );
        formData.append("folder", `batches/${batchId}`);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error("Failed to upload to Cloudinary");
        }

        const data = await response.json();
        const mediaUrl = data.secure_url;
        const thumbUrl = mediaUrl.replace(
            "/upload/",
            "/upload/q_auto,f_auto,w_600/"
        );

        return { mediaUrl, thumbUrl };
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsUploading(true);

        try {
            // Upload all files to Cloudinary
            const uploadPromises = files.map(async (fileItem, index) => {
                setFiles((prev) =>
                    prev.map((f, i) =>
                        i === index ? { ...f, status: "uploading" } : f
                    )
                );

                try {
                    const { mediaUrl, thumbUrl } = await uploadToCloudinary(
                        fileItem.file
                    );

                    setFiles((prev) =>
                        prev.map((f, i) =>
                            i === index
                                ? {
                                      ...f,
                                      status: "uploaded",
                                      cloudinaryUrl: mediaUrl,
                                  }
                                : f
                        )
                    );

                    return {
                        type: "photo" as const,
                        mediaUrl,
                        thumbUrl,
                        meta: {
                            originalName: fileItem.file.name,
                            size: fileItem.file.size,
                        },
                    };
                } catch (error) {
                    setFiles((prev) =>
                        prev.map((f, i) =>
                            i === index
                                ? {
                                      ...f,
                                      status: "error",
                                      error:
                                          error instanceof Error
                                              ? error.message
                                              : "Upload failed",
                                  }
                                : f
                        )
                    );
                    throw error;
                }
            });

            const uploadedItems = await Promise.all(uploadPromises);

            // Save to database
            const request: AddItemsRequest = {
                items: uploadedItems,
            };

            const response = await fetch(`/api/batches/${batchId}/items`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error("Failed to save items");
            }

            onUploadComplete();
        } catch (error) {
            console.error("Upload error:", error);
            alert("Some uploads failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    return (
        <div className="space-y-6">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
            >
                <input {...getInputProps()} />
                <div className="space-y-2">
                    <div className="text-gray-400">
                        <svg
                            className="mx-auto h-12 w-12"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-900">
                            {isDragActive
                                ? "Drop your photos here"
                                : "Drag & drop photos"}
                        </p>
                        <p className="text-sm text-gray-500">
                            or click to browse
                        </p>
                    </div>
                    <p className="text-xs text-gray-400">
                        JPG, PNG, WebP up to 10MB each
                    </p>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                        Selected Photos ({files.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((fileItem, index) => (
                            <div key={index} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                                    <Image
                                        src={fileItem.preview}
                                        alt={`Preview ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* Status Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                    {fileItem.status === "pending" && (
                                        <span className="text-white text-sm">
                                            Ready
                                        </span>
                                    )}
                                    {fileItem.status === "uploading" && (
                                        <div className="text-white text-sm">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                                            Uploading...
                                        </div>
                                    )}
                                    {fileItem.status === "uploaded" && (
                                        <span className="text-green-400 text-sm">
                                            ✓ Uploaded
                                        </span>
                                    )}
                                    {fileItem.status === "error" && (
                                        <span className="text-red-400 text-sm">
                                            ✗ Error
                                        </span>
                                    )}
                                </div>

                                {/* Remove Button */}
                                {fileItem.status === "pending" && (
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={
                            isUploading ||
                            files.every((f) => f.status !== "pending")
                        }
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? "Uploading..." : "Upload Photos"}
                    </button>
                </div>
            )}
        </div>
    );
}
