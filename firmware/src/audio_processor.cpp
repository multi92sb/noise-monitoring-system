#include "audio_processor.h"
#include <math.h>

AudioProcessor::AudioProcessor(float calibrationOffset) 
    : _calibrationOffset(calibrationOffset) {
    init();
}

void AudioProcessor::init() {
    // Zero out biquad history states
    for (int i = 0; i < STAGES; i++) {
        _states[i].x1 = 0.0f;
        _states[i].x2 = 0.0f;
        _states[i].y1 = 0.0f;
        _states[i].y2 = 0.0f;
    }

    // A-weighting IIR filter coefficients for Fs = 32000 Hz
    // Bilinear transform approximation of IEC 61672-1 A-weighting curves
    
    // Biquad Stage 0 (High pass poles / zeros at zero)
    _coeffs[0].b0 = 0.3547f;
    _coeffs[0].b1 = -0.7094f;
    _coeffs[0].b2 = 0.3547f;
    _coeffs[0].a1 = -1.6145f;
    _coeffs[0].a2 = 0.6558f;

    // Biquad Stage 1 (Bandpass poles)
    _coeffs[1].b0 = 1.0f;
    _coeffs[1].b1 = 2.0f;
    _coeffs[1].b2 = 1.0f;
    _coeffs[1].a1 = -1.8251f;
    _coeffs[1].a2 = 0.8315f;

    // Biquad Stage 2 (Low pass poles)
    _coeffs[2].b0 = 1.0f;
    _coeffs[2].b1 = 0.0f;
    _coeffs[2].b2 = -1.0f;
    _coeffs[2].a1 = -0.1983f;
    _coeffs[2].a2 = 0.0984f;
}

void AudioProcessor::setCalibrationOffset(float offset) {
    _calibrationOffset = offset;
}

float AudioProcessor::filterSample(float sample) {
    float x = sample;
    
    for (int i = 0; i < STAGES; i++) {
        // Direct Form I IIR filter difference equation
        float y = (_coeffs[i].b0 * x) + 
                  (_coeffs[i].b1 * _states[i].x1) + 
                  (_coeffs[i].b2 * _states[i].x2) - 
                  (_coeffs[i].a1 * _states[i].y1) - 
                  (_coeffs[i].a2 * _states[i].y2);

        // Shift register update
        _states[i].x2 = _states[i].x1;
        _states[i].x1 = x;
        _states[i].y2 = _states[i].y1;
        _states[i].y1 = y;

        // Current output becomes input for next stage
        x = y;
    }
    
    return x;
}

float AudioProcessor::processBlock(const int16_t* samples, size_t count) {
    if (count == 0) return 0.0f;

    double sumSq = 0.0;
    
    for (size_t i = 0; i < count; i++) {
        // Convert to normalized floating-point amplitude (-1.0 to 1.0)
        float normalized = (float)samples[i] / 32768.0f;
        
        // Pass through A-weighting filter
        float filtered = filterSample(normalized);
        
        // Sum squared values
        sumSq += (double)(filtered * filtered);
    }

    // Return the Root Mean Square (RMS) of this block
    return (float)sqrt(sumSq / (double)count);
}

float AudioProcessor::convertToDb(float rms) {
    // Minimum check to avoid log10(0) resulting in -infinity
    if (rms < 1e-6f) {
        rms = 1e-6f;
    }
    
    // Convert amplitude to decibels (relative to full scale) + calibration offset
    // 20 * log10(rms) is negative. We add the calibration offset to get positive dBA.
    float dbFS = 20.0f * log10f(rms);
    
    return dbFS + _calibrationOffset;
}
