"""
Deepfake Audio Detection API
============================
A FastAPI-based REST API for detecting AI-generated/deepfake audio.
Uses the mo-thecreator/Deepfake-audio-detection model (Wav2Vec2-based).
"""

import base64
import io
import time
import logging
from typing import Optional
from contextlib import asynccontextmanager

import torch
import soundfile as sf
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===========================
# Model Configuration
# ===========================
MODEL_NAME = "mo-thecreator/Deepfake-audio-detection"
TARGET_SAMPLE_RATE = 16000  # Wav2Vec2 models typically expect 16kHz

# Global model and extractor (loaded once at startup)
# Type hints for IDE support
feature_extractor: Optional[AutoFeatureExtractor] = None
model: Optional[AutoModelForAudioClassification] = None


# ===========================
# Application Lifespan
# ===========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    global feature_extractor, model
    
    logger.info(f"Loading model: {MODEL_NAME}")
    try:
        # Try loading from cache first (local_files_only), fallback to download
        try:
            feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME, local_files_only=True)
            model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME, local_files_only=True)
        except Exception:
            logger.info("Model not in cache, downloading...")
            feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
            model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)
        model.eval()  # Set to evaluation mode
        logger.info("Model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise RuntimeError(f"Failed to load model: {e}")
    
    yield
    
    # Cleanup on shutdown
    logger.info("Application shutting down...")


# ===========================
# FastAPI App Initialization
# ===========================
app = FastAPI(
    title="Scam Guard API",
    description="Detect AI-generated/deepfake audio using Wav2Vec2-based classifier",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================
# Request/Response Schemas
# ===========================
class AudioRequest(BaseModel):
    """Request schema for audio detection endpoint."""
    audio_base64: str = Field(
        ...,
        description="Base64 encoded audio data (WAV format recommended)",
        example="UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
    )


class DetectionResponse(BaseModel):
    """Response schema for audio detection endpoint."""
    model_config = {"protected_namespaces": ()}
    
    prediction: str = Field(..., description="Prediction label: 'AI-generated' or 'Real'")
    confidence: float = Field(..., description="Confidence score (0.0 to 1.0)")
    inference_time_ms: float = Field(..., description="Inference time in milliseconds")
    model_name: str = Field(..., description="Name of the model used")


class HealthResponse(BaseModel):
    """Response schema for health check endpoint."""
    model_config = {"protected_namespaces": ()}
    
    status: str
    model_loaded: bool
    model_name: str


# ===========================
# Audio Processing Functions
# ===========================
def decode_base64_audio(audio_base64: str) -> tuple[np.ndarray, int]:
    """
    Decode Base64 encoded audio string to numpy array.
    
    Args:
        audio_base64: Base64 encoded audio data
        
    Returns:
        Tuple of (audio_array, sample_rate)
        
    Raises:
        ValueError: If audio cannot be decoded
    """
    try:
        # Decode Base64 to bytes
        audio_bytes = base64.b64decode(audio_base64)
        
        # Create in-memory buffer
        audio_buffer = io.BytesIO(audio_bytes)
        
        # Read audio using soundfile
        audio_array, sample_rate = sf.read(audio_buffer)
        
        # Convert stereo to mono if needed
        if len(audio_array.shape) > 1:
            audio_array = np.mean(audio_array, axis=1)
        
        # Ensure float32
        audio_array = audio_array.astype(np.float32)
        
        return audio_array, sample_rate
        
    except Exception as e:
        raise ValueError(f"Failed to decode audio: {str(e)}")


def resample_audio(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    """
    Resample audio to target sample rate using linear interpolation.
    
    Args:
        audio: Audio array
        orig_sr: Original sample rate
        target_sr: Target sample rate
        
    Returns:
        Resampled audio array
    """
    if orig_sr == target_sr:
        return audio
    
    # Calculate the ratio
    ratio = target_sr / orig_sr
    new_length = int(len(audio) * ratio)
    
    # Use numpy interpolation for resampling
    indices = np.linspace(0, len(audio) - 1, new_length)
    resampled = np.interp(indices, np.arange(len(audio)), audio)
    
    return resampled.astype(np.float32)


def normalize_label(raw_label: str) -> str:
    """
    Normalize model output label to standard format.
    
    Args:
        raw_label: Raw label from model
        
    Returns:
        Normalized label: 'AI-generated' or 'Real'
    """
    label_lower = raw_label.lower()
    
    # Map fake/spoof/deepfake labels to AI-generated
    if any(keyword in label_lower for keyword in ["fake", "spoof", "deepfake", "synthetic", "ai"]):
        return "AI-generated"
    
    return "Real"


def predict_audio(audio: np.ndarray, sample_rate: int) -> tuple[str, float, float]:
    """
    Run inference on audio to detect if it's AI-generated.
    
    Args:
        audio: Audio array
        sample_rate: Sample rate of the audio
        
    Returns:
        Tuple of (prediction_label, confidence, inference_time_ms)
    """
    global feature_extractor, model
    
    # Resample to target sample rate if needed
    if sample_rate != TARGET_SAMPLE_RATE:
        audio = resample_audio(audio, sample_rate, TARGET_SAMPLE_RATE)
    
    start_time = time.time()
    
    # Process audio through feature extractor
    inputs = feature_extractor(
        audio,
        sampling_rate=TARGET_SAMPLE_RATE,
        return_tensors="pt",
        padding=True
    )
    
    # Run inference
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        
        # Apply softmax to get probabilities
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        
        # Get predicted class
        predicted_class_id = torch.argmax(probabilities, dim=-1).item()
        confidence = probabilities[0][predicted_class_id].item()
    
    inference_time = (time.time() - start_time) * 1000  # Convert to ms
    
    # Get label from model config
    raw_label = model.config.id2label.get(predicted_class_id, "unknown")
    normalized_label = normalize_label(raw_label)
    
    logger.info(f"Raw label: {raw_label}, Normalized: {normalized_label}, Confidence: {confidence:.4f}")
    
    return normalized_label, round(confidence, 4), round(inference_time, 2)


# ===========================
# API Endpoints
# ===========================
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Deepfake Audio Detection API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint to verify API and model status."""
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        model_loaded=model is not None,
        model_name=MODEL_NAME
    )


@app.post("/detect", response_model=DetectionResponse, tags=["Detection"])
def detect_deepfake(request: AudioRequest):
    """
    Detect if the provided audio is AI-generated/deepfake.
    
    - **audio_base64**: Base64 encoded audio data (WAV format recommended)
    
    Returns prediction label ('AI-generated' or 'Real') with confidence score.
    """
    # Check if model is loaded
    if model is None or feature_extractor is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please try again later."
        )
    
    try:
        # Decode audio from Base64
        audio_array, sample_rate = decode_base64_audio(request.audio_base64)
        
        # Validate audio
        if len(audio_array) == 0:
            raise HTTPException(
                status_code=400,
                detail="Audio is empty or invalid."
            )
        
        # Validate audio duration (at least 0.1 seconds, max 5 minutes)
        audio_duration = len(audio_array) / sample_rate
        if audio_duration < 0.1:
            raise HTTPException(
                status_code=400,
                detail=f"Audio too short: {audio_duration:.2f}s (minimum 0.1s required)"
            )
        if audio_duration > 300:  # 5 minutes
            raise HTTPException(
                status_code=400,
                detail=f"Audio too long: {audio_duration:.2f}s (maximum 300s allowed)"
            )
        
        # Run prediction
        prediction, confidence, inference_time = predict_audio(audio_array, sample_rate)
        
        return DetectionResponse(
            prediction=prediction,
            confidence=confidence,
            inference_time_ms=inference_time,
            model_name=MODEL_NAME
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid audio input: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# ===========================
# Run Server (if executed directly)
# ===========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
