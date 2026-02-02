import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderReturn {
    isRecording: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<string>;
    error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        setError(null);
        chunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please allow permissions.");
        }
    }, []);

    const stopRecording = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            const mediaRecorder = mediaRecorderRef.current;
            if (!mediaRecorder || mediaRecorder.state === "inactive") {
                reject(new Error("No active recording"));
                return;
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/wav" });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(",")[1];
                    resolve(base64String);
                };
                reader.onerror = () => {
                    reject(new Error("Failed to convert audio to Base64"));
                };

                // Stop all tracks to release microphone
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            };

            mediaRecorder.stop();
        });
    }, []);

    return { isRecording, startRecording, stopRecording, error };
}
