import Link from "next/link";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Batch & Vote
                    </h1>
                    <p className="text-gray-600">
                        Upload photos, share a link, and let others vote on
                        their favorites
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center text-sm text-gray-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold">
                                1
                            </span>
                        </div>
                        <span>Upload your photos</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold">
                                2
                            </span>
                        </div>
                        <span>Share the voting link</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold">
                                3
                            </span>
                        </div>
                        <span>See live results</span>
                    </div>
                </div>

                <Link
                    href="/create"
                    className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-block"
                >
                    Create Batch
                </Link>

                <p className="text-xs text-gray-500 mt-4">
                    No account needed for voters • Results update in real-time
                </p>
            </div>
        </div>
    );
}
