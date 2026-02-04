export interface DetectionResponse {
    status: string;
    language: string;
    classification: "AI_GENERATED" | "HUMAN";
    confidenceScore: number;
    explanation: string;
}

export async function detectAudio(audioBase64: string, language: string = "English"): Promise<DetectionResponse> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    const response = await fetch(`${apiUrl}/api/voice-detection`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": "scamguard-secure-key-123", // In prod, use env var
        },
        body: JSON.stringify({
            audioBase64: audioBase64,
            language: language,
            audioFormat: "wav"
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to analyze audio");
    }

    return response.json();
}

export async function checkHealth(): Promise<boolean> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${apiUrl}/health`); // Health endpoint remains same
        const data = await response.json();
        return data.status === "healthy" && data.model_loaded;
    } catch (error) {
        console.error("Health check failed:", error);
        return false;
    }
}
