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

  const handleFileSelect = async (audioBase64: string, filename: string) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await detectAudio(audioBase64);
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
              <span className="text-xl font-bold tracking-tight text-white">DeepGuard</span>
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

              {result && !loading && (
                <div className={cn(
                  "mt-6 overflow-hidden rounded-xl border p-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md",
                  result.prediction === "Real"
                    ? "border-green-500/30 bg-green-500/10"
                    : "border-red-500/30 bg-red-500/10"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg",
                      result.prediction === "Real" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {result.prediction === "Real" ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>

                    <div className="flex-1 text-left">
                      <h4 className={cn(
                        "text-lg font-bold",
                        result.prediction === "Real" ? "text-green-400" : "text-red-400"
                      )}>
                        {result.prediction === "Real" ? "Authentic Audio Detected" : "AI-Generated / Deepfake"}
                      </h4>

                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-slate-400">Confidence</span>
                          <span className="font-semibold text-white">{(result.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="flex flex-col">
                          <span className="text-slate-400">Processing Time</span>
                          <span className="font-semibold text-white">{result.inference_time_ms.toFixed(0)} ms</span>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="flex flex-col">
                          <span className="text-slate-400">Model</span>
                          <span className="font-semibold text-white truncate max-w-[120px]" title={result.model_name}>Wav2Vec2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
