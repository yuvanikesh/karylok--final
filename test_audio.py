"""
Audio Testing Utility for Deepfake Detection API
=================================================
This script provides utilities to:
1. Convert audio files to Base64
2. Test the /detect endpoint
3. Generate sample test audio
"""

import base64
import json
import sys
import os

def audio_to_base64(file_path: str) -> str:
    """
    Convert an audio file to Base64 string.
    
    Args:
        file_path: Path to the audio file (WAV format recommended)
        
    Returns:
        Base64 encoded string
    """
    with open(file_path, "rb") as audio_file:
        audio_bytes = audio_file.read()
        base64_string = base64.b64encode(audio_bytes).decode("utf-8")
    return base64_string


def base64_to_audio(base64_string: str, output_path: str):
    """
    Convert Base64 string back to audio file.
    
    Args:
        base64_string: Base64 encoded audio
        output_path: Path to save the audio file
    """
    audio_bytes = base64.b64decode(base64_string)
    with open(output_path, "wb") as audio_file:
        audio_file.write(audio_bytes)
    print(f"Audio saved to: {output_path}")


def test_api(audio_base64: str, api_url: str = "http://127.0.0.1:8000/detect", timeout: int = 60):
    """
    Test the detection API with Base64 audio.
    
    Args:
        audio_base64: Base64 encoded audio
        api_url: API endpoint URL
        timeout: Request timeout in seconds
        
    Returns:
        dict: API response or None if failed
    """
    try:
        import requests
    except ImportError:
        print("Please install requests: pip install requests")
        return None
    
    payload = {"audio_base64": audio_base64}
    
    print(f"\nSending request to: {api_url}")
    print(f"Audio Base64 length: {len(audio_base64)} characters")
    
    try:
        response = requests.post(api_url, json=payload, timeout=timeout)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ API Response:")
            print(f"   Prediction: {result['prediction']}")
            print(f"   Confidence: {result['confidence']:.2%}")
            print(f"   Inference Time: {result['inference_time_ms']:.2f} ms")
            print(f"   Model: {result['model_name']}")
            return result
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"   Detail: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Make sure the API server is running!")
        print("   Run: uvicorn main:app --reload")
        return None
    except requests.exceptions.Timeout:
        print(f"\n❌ Timeout Error: Request took longer than {timeout}s")
        return None


def generate_test_tone(output_path: str = "test_tone.wav", duration: float = 2.0, frequency: float = 440.0) -> str | None:
    """
    Generate a simple test tone audio file.
    
    Args:
        output_path: Path to save the test audio
        duration: Duration in seconds (0.1 to 300)
        frequency: Frequency of the tone in Hz
        
    Returns:
        str: Path to the generated file, or None if failed
    """
    try:
        import numpy as np
        import soundfile as sf
    except ImportError:
        print("Please install numpy and soundfile: pip install numpy soundfile")
        return None
    
    # Validate duration
    if duration < 0.1 or duration > 300:
        print(f"Duration must be between 0.1 and 300 seconds, got {duration}")
        return None
    
    sample_rate = 16000
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = 0.3 * np.sin(2 * np.pi * frequency * t)
    
    try:
        sf.write(output_path, tone.astype(np.float32), sample_rate)
        print(f"Test tone saved to: {output_path}")
        return output_path
    except Exception as e:
        print(f"Failed to save audio: {e}")
        return None


def main():
    """Main function to demonstrate usage."""
    print("=" * 60)
    print("Deepfake Audio Detection - Test Utility")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python test_audio.py <audio_file.wav>    - Test an audio file")
        print("  python test_audio.py --generate          - Generate test tone")
        print("  python test_audio.py --convert <file>    - Convert file to Base64")
        print("\nExample:")
        print("  python test_audio.py my_voice.wav")
        print("  python test_audio.py --generate")
        return
    
    command = sys.argv[1]
    
    if command == "--generate":
        # Generate test tone
        test_file = generate_test_tone()
        if test_file:
            base64_audio = audio_to_base64(test_file)
            print(f"\nBase64 (first 100 chars): {base64_audio[:100]}...")
            print("\nTesting API with generated tone...")
            test_api(base64_audio)
            
    elif command == "--convert":
        if len(sys.argv) < 3:
            print("Please provide a file path: python test_audio.py --convert <file.wav>")
            return
        file_path = sys.argv[2]
        if os.path.exists(file_path):
            base64_audio = audio_to_base64(file_path)
            print(f"\nBase64 encoded audio ({len(base64_audio)} characters):")
            print("-" * 60)
            print(base64_audio)
            print("-" * 60)
            
            # Save to file
            output_file = file_path.rsplit(".", 1)[0] + "_base64.txt"
            with open(output_file, "w") as f:
                f.write(base64_audio)
            print(f"\nBase64 saved to: {output_file}")
        else:
            print(f"File not found: {file_path}")
            
    else:
        # Test with provided audio file
        file_path = command
        if os.path.exists(file_path):
            print(f"\nConverting audio file: {file_path}")
            base64_audio = audio_to_base64(file_path)
            print(f"Base64 length: {len(base64_audio)} characters")
            test_api(base64_audio)
        else:
            print(f"File not found: {file_path}")


if __name__ == "__main__":
    main()
