import math
import random

# A-weighting IIR filter coefficients for Fs = 32000 Hz
# Replicating the biquad stages defined in audio_processor.cpp
COEFFS = [
    # Stage 0
    {"b0": 0.3547, "b1": -0.7094, "b2": 0.3547, "a1": -1.6145, "a2": 0.6558},
    # Stage 1
    {"b0": 1.0000, "b1":  2.0000, "b2": 1.0000, "a1": -1.8251, "a2": 0.8315},
    # Stage 2
    {"b0": 1.0000, "b1":  0.0000, "b2": -1.0000, "a1": -0.1983, "a2": 0.0984}
]

class BiquadState:
    def __init__(self):
        self.x1 = 0.0
        self.x2 = 0.0
        self.y1 = 0.0
        self.y2 = 0.0

def filter_sample(sample, states):
    x = sample
    for i in range(3):
        c = COEFFS[i]
        s = states[i]
        
        # Direct Form I IIR difference equation
        y = (c["b0"] * x) + (c["b1"] * s.x1) + (c["b2"] * s.x2) - (c["a1"] * s.y1) - (c["a2"] * s.y2)
        
        # Update shift registers
        s.x2 = s.x1
        s.x1 = x
        s.y2 = s.y1
        s.y1 = y
        
        x = y
    return x

def calculate_db(rms, calibration_offset=120.0):
    if rms < 1e-6:
        rms = 1e-6
    db_fs = 20 * math.log10(rms)
    return db_fs + calibration_offset

def generate_sine_wave(frequency, sample_rate, duration_sec, amplitude=0.5):
    num_samples = int(sample_rate * duration_sec)
    wave = []
    for i in range(num_samples):
        t = i / sample_rate
        val = amplitude * math.sin(2 * math.pi * frequency * t)
        wave.append(val)
    return wave

def test_frequency_damping(frequency, expected_attenuation, tolerance=1.5):
    """
    Simulates a sine wave of a given frequency, filters it,
    and checks if the A-weighting damping matches standard values.
    """
    fs = 32000
    duration = 0.5
    amplitude = 0.5 # -6 dBFS peak input
    
    # 1. Generate clean input sine wave
    input_samples = generate_sine_wave(frequency, fs, duration, amplitude)
    
    # Calculate input RMS
    input_sq_sum = sum(x**2 for x in input_samples)
    input_rms = math.sqrt(input_sq_sum / len(input_samples))
    input_db = calculate_db(input_rms, calibration_offset=0.0) # Relative dBFS

    # 2. Filter input samples
    states = [BiquadState() for _ in range(3)]
    filtered_samples = []
    
    # Run through filter, skipping the first 1000 samples to let filter settle (settling time)
    for sample in input_samples:
        filtered = filter_sample(sample, states)
        filtered_samples.append(filtered)
        
    settled_filtered = filtered_samples[1000:]
    filtered_sq_sum = sum(x**2 for x in settled_filtered)
    filtered_rms = math.sqrt(filtered_sq_sum / len(settled_filtered))
    filtered_db = calculate_db(filtered_rms, calibration_offset=0.0)

    # 3. Calculate actual attenuation (dB change)
    actual_attenuation = filtered_db - input_db
    error = abs(actual_attenuation - expected_attenuation)
    
    print(f"[{frequency} Hz] Input: {input_db:.1f} dBFS | Output: {filtered_db:.1f} dBFS | Attenuation: {actual_attenuation:.1f} dB (Expected: {expected_attenuation:.1f} dB) | Error: {error:.2f} dB")
    
    assert error <= tolerance, f"Error for {frequency}Hz exceeded tolerance: {error:.2f} dB"

if __name__ == "__main__":
    print("==================================================")
    print("Running Acoustic A-Weighting DSP Filter Validation")
    print("==================================================")
    
    # Standard IEC 61672-1 A-weighting attenuations:
    # - 1000 Hz: 0.0 dB (Reference point)
    # - 100 Hz: -19.1 dB (Heavy low-frequency cut)
    # - 10000 Hz: -2.5 dB (High-frequency roll-off)
    try:
        test_frequency_damping(1000, 0.0, tolerance=0.5)
        test_frequency_damping(100, -19.1, tolerance=1.0)
        test_frequency_damping(10000, -2.5, tolerance=1.0)
        
        print("\nSUCCESS: All acoustic A-weighting checks passed successfully!")
    except AssertionError as e:
        print(f"\nFAILURE: DSP math assertion error: {str(e)}")
