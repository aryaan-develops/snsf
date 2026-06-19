"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-slate-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/10">
          <AlertTriangle size={24} className="text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-400">
          {error.message || "An unexpected error occurred. Please check your database connection and try again."}
        </p>
        <button
          onClick={reset}
          className="mt-6 flex items-center gap-2 mx-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
      </div>
    </div>
  );
}
