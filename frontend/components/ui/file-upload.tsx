"use client";

import { Upload, FileAudio, X, AlertCircle } from "lucide-react";
import { useState, useRef, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onFileSelect: (base64: string, filename: string) => void;
    isLoading?: boolean;
    className?: string;
}

export function FileUpload({ onFileSelect, isLoading = false, className }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndProcessFile = (file: File) => {
        setError(null);

        // Check file type
        const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-m4a", "audio/x-wav"];
        // Also check extension as fallback
        const validExtensions = [".wav", ".mp3", ".m4a"];
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

        const isValidType = validTypes.some(type => file.type.includes(type)) ||
            validExtensions.includes(fileExtension);

        if (!isValidType) {
            setError("Please upload a valid audio file (WAV, MP3)");
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        setFileName(file.name);

        // Convert to Base64
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:audio/wav;base64,") to get raw base64
            const base64 = result.split(",")[1];
            onFileSelect(base64, file.name);
        };
        reader.onerror = () => {
            setError("Failed to read file");
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0]);
        }
    };

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFileName(null);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className={cn("w-full max-w-xl mx-auto", className)}>
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-full min-h-[200px] p-6 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out cursor-pointer",
                    dragActive
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-600 bg-gray-900/50 hover:bg-gray-800/50 hover:border-gray-500",
                    isLoading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleButtonClick}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="audio/*,.wav,.mp3,.m4a"
                    onChange={handleChange}
                    disabled={isLoading}
                />

                {fileName ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-indigo-500/20 text-indigo-400">
                            <FileAudio className="w-8 h-8" />
                        </div>
                        <p className="mb-2 text-sm font-medium text-gray-200 break-all text-center max-w-[90%]">
                            {fileName}
                        </p>
                        <button
                            onClick={clearFile}
                            className="px-3 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full transition-colors z-10"
                        >
                            Remove file
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gray-700/50 text-gray-400">
                            <Upload className="w-6 h-6" />
                        </div>
                        <p className="mb-2 text-sm text-gray-300">
                            <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">WAV, MP3 (max 10MB)</p>
                    </div>
                )}

                {error && (
                    <div className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
