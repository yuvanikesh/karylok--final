export interface DetectionResponse {
    prediction: string;
    confidence: number;
    inference_time_ms: number;
    model_name: string;
}

export async function detectAudio(audioBase64: string): Promise<DetectionResponse> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${apiUrl}/detect`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio_base64: audioBase64 }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to analyze audio");
    }

    return response.json();
}

export async function checkHealth(): Promise<boolean> {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${apiUrl}/health`);
        const data = await response.json();
        return data.status === "healthy" && data.model_loaded;
    } catch (error) {
        console.error("Health check failed:", error);
        return false;
    }
}
