"use client";

import { useState, useCallback, useRef } from "react";
import { getProgressMessage } from "@/lib/squatch";

interface AnalysisResult {
  aiAnalysis: {
    environment?: string;
    blurry?: number;
    humanoid?: boolean;
    humanoidSquatchLike?: boolean;
    wearingClothes?: boolean;
    hairyOrFurry?: boolean;
    knownPrimate?: boolean;
    primateType?: string;
    animal?: boolean;
    animalType?: string;
    lighting?: string;
    objectsDetected?: string[];
    creatureConfidence?: number;
    description?: string;
    dadProfileMatch?: boolean;
  };
  score: number;
  conclusion: string;
  easterEgg?: string;
  dadSquatch?: boolean;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRemoveImage = useCallback(() => {
    abortControllerRef.current?.abort();
    setImage(null);
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p);
      return null;
    });
    setResult(null);
    setError(null);
    setAnalyzing(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setResult(null);
      setError(null);
      if (file && file.type.startsWith("image/")) {
        setImage(file);
        setPreview(URL.createObjectURL(file));
      } else if (file) {
        setError("Please select an image file (JPEG, PNG, GIF, WebP)");
        setImage(null);
        setPreview(null);
      }
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);
    abortControllerRef.current = new AbortController();

    const progressInterval = setInterval(() => {
      setProgressIndex((i) => i + 1);
    }, 800);

    try {
      const formData = new FormData();
      formData.append("image", image);

      console.log("[SquatchScan] Sending image to /api/analyze...", {
        name: image.name,
        size: image.size,
        type: image.type,
      });
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current?.signal,
      });

      const contentType = res.headers.get("content-type");
      const text = await res.text();
      console.log("[SquatchScan] Response:", {
        status: res.status,
        contentType,
        textLength: text.length,
        textPreview: text.slice(0, 200),
      });

      let data: unknown;
      try {
        data = contentType?.includes("application/json")
          ? JSON.parse(text)
          : { error: `Server error (${res.status}). Response was not JSON.` };
      } catch {
        const msg = res.ok
          ? "Invalid response from server"
          : `Server error (${res.status}). Try a smaller image or check your API key. Check the terminal for details.`;
        console.error("[SquatchScan] Parse error. Raw response:", text.slice(0, 500));
        setError(msg);
        return;
      }

      if (!res.ok) {
        const errData = data as { error?: string; details?: unknown };
        console.error("[SquatchScan] API error:", errData);
        throw new Error(errData.error || "Analysis failed");
      }

      setResult(data as AnalysisResult);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[SquatchScan] Request error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      clearInterval(progressInterval);
      setAnalyzing(false);
      setProgressIndex(0);
    }
  }, [image]);

  const hasResult = result && !analyzing;

  return (
    <div className="relative min-h-screen h-screen overflow-hidden flex flex-col">
      <div
        className="fixed inset-0 bg-cover bg-left bg-no-repeat"
        style={{ backgroundImage: "url(/Patterson_Gimlin_Bigfoot.jpg)" }}
      />
      <div
        className="fixed inset-0 bg-emerald-900/60"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-2xl flex-1 flex flex-col min-h-0 px-4 py-4 sm:px-6 sm:py-6">
        <header className={`text-center flex-shrink-0 ${hasResult ? "mb-2" : "mb-6"}`}>
          <h1 className={`font-serif font-bold tracking-tight text-stone-100 ${hasResult ? "text-2xl" : "text-4xl sm:text-5xl"}`}>
            SquatchScan
          </h1>
          <p className={`font-medium text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${hasResult ? "text-sm mt-0.5" : "text-lg mt-2"}`}>
            Scientific image analysis for the discerning cryptozoologist
          </p>
        </header>

        <div className={`flex-1 flex min-h-0 flex-col gap-4 overflow-hidden`}>
          {/* Upload */}
          <section className={`rounded-2xl border border-stone-700/50 bg-stone-900/40 shadow-lg backdrop-blur-sm flex-shrink-0 p-4 max-w-md mx-auto w-full`}>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={analyzing}
            />
            {preview ? (
              <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-stone-600/60 bg-stone-800/30 py-8 gap-4">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full max-h-48 rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -right-3 -top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-stone-800/90 text-xl text-white transition hover:bg-stone-700"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-stone-600/60 bg-stone-800/30 py-12 transition-colors hover:border-emerald-700/80 hover:bg-stone-800/50"
              >
                <span className="text-white">Upload</span>
              </label>
            )}
          </section>

          {/* Analyze - hide when results shown */}
          {!hasResult && (
          <div className="flex justify-center flex-shrink-0">
            <button
              onClick={handleAnalyze}
              disabled={!image || analyzing}
              className="cursor-pointer rounded-full border border-stone-700/50 bg-stone-900/40 px-8 py-3 font-semibold text-stone-100 shadow-md backdrop-blur-sm transition hover:bg-stone-800/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? "Scanning…" : "Scan for Squatch"}
            </button>
          </div>
          )}

          {/* Progress */}
          {analyzing && (
            <div className="animate-pulse rounded-2xl border border-stone-600/50 bg-stone-800/40 p-4 text-center flex-shrink-0">
              <p className="font-mono text-sm text-stone-400">
                {getProgressMessage(progressIndex)}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-red-300">
              {error}
            </div>
          )}

          {/* Result */}
          {result && !analyzing && (
            <section className="flex-1 flex flex-col min-h-0 rounded-2xl border border-stone-700/50 bg-stone-900/40 p-4 shadow-lg backdrop-blur-sm overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {result.dadSquatch ? (
                <div className="rounded-xl bg-stone-800/50 p-4 text-center flex-shrink-0">
                  <p className="text-xs uppercase tracking-wider text-stone-400">
                    Squatch Probability
                  </p>
                  <p className="font-serif text-4xl font-bold text-emerald-400">
                    100%
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-300">
                    Definitely a squatch, no explanation needed.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 gap-3 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <h2 className="font-serif text-xl font-bold text-stone-100 flex-shrink-0">
                    Scientific Report
                  </h2>

                  {/* Score */}
                  <div className="rounded-xl bg-stone-800/50 p-4 text-center flex-shrink-0">
                    <p className="text-xs uppercase tracking-wider text-stone-400">
                      Squatch Probability
                    </p>
                    <p className="font-serif text-4xl font-bold text-emerald-400">
                      {result.score}%
                    </p>
                    <p className="mt-1 text-sm font-medium text-stone-300">
                      {result.conclusion}
                    </p>
                    {result.easterEgg && (
                      <p className="mt-1 text-xs italic text-stone-500">
                        {result.easterEgg}
                      </p>
                    )}
                  </div>

                  {/* Report sections */}
                  <div className="grid gap-2 sm:grid-cols-2 flex-shrink-0">
                <div className="rounded-lg border border-stone-700/40 bg-stone-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    🌲 Environment Suitability
                  </p>
                  <p className="mt-1 font-medium text-stone-300">
                    {result.aiAnalysis.environment
                      ? result.aiAnalysis.environment.charAt(0).toUpperCase() +
                        result.aiAnalysis.environment.slice(1).toLowerCase()
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-stone-700/40 bg-stone-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    📷 Blur Index
                  </p>
                  <p className="mt-1 font-medium text-stone-300">
                    {result.aiAnalysis.blurry !== undefined
                      ? `${result.aiAnalysis.blurry}/10`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-stone-700/40 bg-stone-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    🦣 Humanoid Squatch Detection
                  </p>
                  <p className="mt-1 font-medium text-stone-300">
                    {(() => {
                      const val =
                        result.aiAnalysis.humanoidSquatchLike !== undefined
                          ? result.aiAnalysis.humanoidSquatchLike
                            ? "Squatch-like detected"
                            : "Not squatch-like"
                          : result.aiAnalysis.humanoid !== undefined
                            ? result.aiAnalysis.humanoid
                              ? "Humanoid only"
                              : "Not detected"
                            : null;
                      return val ? val.charAt(0).toUpperCase() + val.slice(1) : "—";
                    })()}
                  </p>
                </div>
                <div className="rounded-lg border border-stone-700/40 bg-stone-800/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    👕 Clothing Detected
                  </p>
                  <p className="mt-1 font-medium text-stone-300">
                    {result.aiAnalysis.wearingClothes !== undefined
                      ? (result.aiAnalysis.wearingClothes
                          ? "Yes (not squatch)"
                          : "No"
                        ).replace(/^./, (c) => c.toUpperCase())
                      : "—"}
                  </p>
                </div>
              </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
