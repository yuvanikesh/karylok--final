"""
Self-contained test script that starts server, tests API, then stops.
"""
import subprocess
import sys
import os
import time

# Set environment variables for the subprocess
env = os.environ.copy()
env['REQUESTS_CA_BUNDLE'] = ''
env['SSL_CERT_FILE'] = ''

# Start the server in a subprocess
print('Starting server...')
server = subprocess.Popen(
    [sys.executable, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'],
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

# Wait for the server to start (check for startup message)
print('Waiting for model to load (this may take ~15 seconds)...')
time.sleep(15)

# Check if server started
print('Checking server status...')

import urllib.request
import json

try:
    response = urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=10)
    data = json.loads(response.read().decode())
    print(f'Health check: {data}')
    
    if data.get('model_loaded'):
        # Now test with generated audio
        import numpy as np
        import soundfile as sf
        import base64
        import io
        
        # Generate a test tone
        sample_rate = 16000
        duration = 2.0
        frequency = 440.0
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Save to bytes
        buffer = io.BytesIO()
        sf.write(buffer, audio, sample_rate, format='WAV')
        buffer.seek(0)
        audio_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        
        print(f'Generated test audio, Base64 length: {len(audio_base64)}')
        
        # Test the detection endpoint
        req = urllib.request.Request(
            'http://127.0.0.1:8000/detect',
            data=json.dumps({'audio_base64': audio_base64}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        print('Sending audio to /detect endpoint...')
        response = urllib.request.urlopen(req, timeout=60)
        result = json.loads(response.read().decode())
        
        print()
        print('=' * 50)
        print('API TEST RESULT:')
        print('=' * 50)
        print(f"Prediction: {result['prediction']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print(f"Inference Time: {result['inference_time_ms']:.2f} ms")
        print(f"Model: {result['model_name']}")
        print('=' * 50)
        print()
        print('✅ API test completed successfully!')
    else:
        print('❌ Model not loaded yet!')
        
except Exception as e:
    print(f'❌ Error: {e}')

# Kill the server
print('Stopping server...')
server.terminate()
server.wait()
print('Done.')
