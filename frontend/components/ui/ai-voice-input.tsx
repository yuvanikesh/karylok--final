"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
    onStart?: () => void;
    onStop?: (duration: number) => void;
    visualizerBars?: number;
    demoMode?: boolean;
    demoInterval?: number;
    className?: string;
    isRecording?: boolean; // Added control prop
}

export function AIVoiceInput({
    onStart,
    onStop,
    visualizerBars = 48,
    demoMode = false,
    demoInterval = 3000,
    className,
    isRecording: externalIsRecording,
}: AIVoiceInputProps) {
    const [internalSubmitted, setInternalSubmitted] = useState(false);
    const [time, setTime] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [isDemo, setIsDemo] = useState(demoMode);

    // Use external state if provided, otherwise local state
    const submitted = externalIsRecording !== undefined ? externalIsRecording : internalSubmitted;

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (submitted) {
            if (internalSubmitted) onStart?.(); // Only call onStart if simplified toggle is used, or handle in parent
            intervalId = setInterval(() => {
                setTime((t) => t + 1);
            }, 1000);
        } else {
            setTime(0);
        }

        return () => clearInterval(intervalId);
    }, [submitted, internalSubmitted, onStart]);

    useEffect(() => {
        if (!isDemo) return;

        let timeoutId: NodeJS.Timeout;
        const runAnimation = () => {
            setInternalSubmitted(true);
            timeoutId = setTimeout(() => {
                setInternalSubmitted(false);
                timeoutId = setTimeout(runAnimation, 1000);
            }, demoInterval);
        };

        const initialTimeout = setTimeout(runAnimation, 100);
        return () => {
            clearTimeout(timeoutId);
            clearTimeout(initialTimeout);
        };
    }, [isDemo, demoInterval]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleClick = () => {
        if (isDemo) {
            setIsDemo(false);
            setInternalSubmitted(false);
        } else {
            if (submitted) {
                onStop?.(time); // Call onStop when stopping
            } else {
                onStart?.();
            }
            if (externalIsRecording === undefined) {
                setInternalSubmitted((prev) => !prev);
            }
        }
    };

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
                <button
                    className={cn(
                        "group w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md",
                        submitted
                            ? "bg-red-50 hover:bg-red-100 ring-2 ring-red-500/20"
                            : "bg-white hover:bg-gray-50 border border-gray-200"
                    )}
                    type="button"
                    onClick={handleClick}
                >
                    {submitted ? (
                        <div
                            className="relative w-6 h-6 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-red-500 rounded-sm animate-ping opacity-25"></div>
                            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        </div>
                    ) : (
                        <Mic className="w-6 h-6 text-gray-700" />
                    )}
                </button>

                <span
                    className={cn(
                        "font-mono text-sm transition-opacity duration-300",
                        submitted
                            ? "text-red-600 font-medium"
                            : "text-gray-400"
                    )}
                >
                    {formatTime(time)}
                </span>

                <div className="h-4 w-64 flex items-center justify-center gap-0.5">
                    {[...Array(visualizerBars)].map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-0.5 rounded-full transition-all duration-300",
                                submitted
                                    ? "bg-blue-500 animate-pulse"
                                    : "bg-gray-200 h-1"
                            )}
                            style={
                                submitted && isClient
                                    ? {
                                        height: `${20 + Math.random() * 80}%`, // Simplified random visualizer
                                        animationDelay: `${i * 0.05}s`,
                                    }
                                    : undefined
                            }
                        />
                    ))}
                </div>

                <p className="h-4 text-xs font-medium text-gray-500">
                    {submitted ? "Listening..." : "Click to speak"}
                </p>
            </div>
        </div>
    );
}
