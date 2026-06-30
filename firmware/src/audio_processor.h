#ifndef AUDIO_PROCESSOR_H
#define AUDIO_PROCESSOR_H

#include <Arduino.h>

struct BiquadCoeffs {
    float b0, b1, b2;
    float a1, a2;
};

struct BiquadState {
    float x1, x2; // Delayed input states
    float y1, y2; // Delayed output states
};

class AudioProcessor {
public:
    AudioProcessor(float calibrationOffset = 0.0f);
    
    // Initialize the A-weighting filter state
    void init();
    
    // Set a new calibration offset (in dB)
    void setCalibrationOffset(float offset);

    // Process a block of 16-bit PCM samples, apply A-weighting, and return calculated RMS
    float processBlock(const int16_t* samples, size_t count);

    // Convert an RMS amplitude value to A-weighted Decibels (dBA)
    float convertToDb(float rms);

private:
    float _calibrationOffset;
    
    // A-weighting filter biquads (3 stages cascaded)
    static const int STAGES = 3;
    BiquadCoeffs _coeffs[STAGES];
    BiquadState _states[STAGES];

    // Applies A-weighting filter to a single sample
    float filterSample(float sample);
};

#endif // AUDIO_PROCESSOR_H
