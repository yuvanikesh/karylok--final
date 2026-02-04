"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import NeuralBackground from "@/components/ui/flow-field-background";
import { detectAudio, DetectionResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Home() {
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("English");

  const LANGUAGES = ["Tamil", "English", "Hindi", "Malayalam", "Telugu"];

  const handleFileSelect = async (audioBase64: string, filename: string) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await detectAudio(audioBase64, language);
      setResult(response);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze audio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans text-white overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <NeuralBackground
          color="#818cf8"
          speed={0.8}
          trailOpacity={0.15}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Scam Guard</span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
              <a href="#" className="hover:text-indigo-400 transition-colors">Features</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">How it Works</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">API</a>
            </nav>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-16 sm:px-8 flex flex-col justify-center">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300 mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
              AI Audio Detection v1.0
            </div>

            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-xl">
              Detect Deepfake Audio <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Instantly & Accurately</span>
            </h1>

            <p className="mb-10 text-lg text-slate-300 sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Our advanced AI analyzes voice patterns to identify synthetic audio with high precision. Protect yourself from voice scams and misinformation.
            </p>

            {error && (
              <div className="mb-8 rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-red-200 mx-auto max-w-md backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="font-medium text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Analysis Card */}
            <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-semibold text-white">Analyze Audio</h3>
                <p className="text-sm text-slate-400">Upload an audio file to test the engine</p>
              </div>

              <div className="mb-6 flex justify-center">
                <div className="relative inline-flex items-center">
                  <label htmlFor="language-select" className="mr-3 text-sm font-medium text-slate-300">Select Language:</label>
                  <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-40 appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang} className="bg-slate-900 text-white">
                        {lang}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-8 flex justify-center">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  isLoading={loading}
                />
              </div>

              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-slate-400">Analyzing audio patterns...</p>
                </div>
              )}
              {/* Analysis Result */}
              {result && (
                <div className="mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className={cn(
                    "overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all",
                    result.classification === "AI_GENERATED"
                      ? "border-red-500/30 bg-red-950/30 shadow-[0_0_30px_-10px_rgba(239,68,68,0.5)]"
                      : "border-emerald-500/30 bg-emerald-950/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]"
                  )}>
                    <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          result.classification === "AI_GENERATED" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {result.classification === "AI_GENERATED" ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : (
                            <ShieldCheck className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            {result.classification === "AI_GENERATED" ? "Suspected Deepfake" : "Authentic Audio Detected"}
                          </h4>
                          <p className="text-xs text-slate-400">Analysis Completed</p>
                        </div>
                      </div>
                      <div className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                        result.classification === "AI_GENERATED" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                      )}>
                        {result.classification === "AI_GENERATED" ? "FAKE" : "REAL"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-black/20 p-4">
                        <p className="mb-1 text-xs font-medium uppercase text-slate-500">Confidence Score</p>
                        <p className="text-2xl font-bold text-white">{(result.confidenceScore * 100).toFixed(1)}%</p>
                      </div>
                      <div className="rounded-xl bg-black/20 p-4">
                        <p className="mb-1 text-xs font-medium uppercase text-slate-500">Language</p>
                        <p className="text-2xl font-bold text-white">{result.language}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-black/20 p-4">
                      <p className="mb-1 text-xs font-medium uppercase text-slate-500">Explanation</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                    </div>
                  </div>
                </div>
              )}    </div>
          </div>
        </main>
      </div>
    </div>
  );
}
