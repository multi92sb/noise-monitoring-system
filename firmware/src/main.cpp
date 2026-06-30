#include <Arduino.h>
#include <WiFi.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <Preferences.h>
#include <driver/i2s.h>
#include "audio_processor.h"

// Define to 1 to simulate sound input instead of reading hardware I2S mic
#define SIMULATE_AUDIO 0

// Hardware Configuration for SPH0645LM4H Microphone
#define I2S_PORT       I2S_NUM_0
#define PIN_I2S_SCK    14
#define PIN_I2S_WS     15
#define PIN_I2S_SD     16

#define SAMPLE_RATE    32000
#define BLOCK_SIZE     512    // 16ms of audio per block
#define CALIBRATION_OFFSET 120.0f 

// Captive Portal DNS Port
#define DNS_PORT 53

// Global Objects
Preferences preferences;
DNSServer dnsServer;
WebServer server(80);
QueueHandle_t audioQueue;
AudioProcessor processor(CALIBRATION_OFFSET);

// Device Metadata & State
String deviceId;
String wifiSSID;
String wifiPassword;
bool apModeActive = false;

// Function Declarations
void loadConfiguration();
void saveConfiguration(const String& ssid, const String& password);
void setupCaptivePortal();
void handlePortalSubmit();
void handlePortalRoot();
void handleNotFound();
void audioCaptureTask(void* parameter);
void audioProcessingTask(void* parameter);

void setup() {
    Serial.begin(115200);
    // Allow serial port to settle
    delay(500);

    Serial.println("\n========================================");
    Serial.println("Noise Monitoring System - MVP Sentinel v1.0");
    Serial.println("========================================");

    // 1. Generate unique Device ID from MAC Address
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char devIdBuf[18];
    snprintf(devIdBuf, sizeof(devIdBuf), "sn-%02x%02x%02x%02x%02x%02x", 
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    deviceId = String(devIdBuf);
    Serial.printf("Device ID: %s\n", deviceId.c_str());

    // 2. Load stored Wi-Fi credentials from Non-Volatile Storage (NVS)
    loadConfiguration();

    // 3. Try connecting to Wi-Fi if credentials exist
    if (wifiSSID.length() > 0) {
        Serial.printf("Connecting to Wi-Fi: %s...\n", wifiSSID.c_str());
        WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());
        
        // Timeout after 15 seconds
        int attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 30) {
            delay(500);
            Serial.print(".");
            attempts++;
        }
        Serial.println();

        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("Connected! IP Address: %s\n", WiFi.localIP().toString().c_str());
        } else {
            Serial.println("Wi-Fi Connection Failed. Launching Captive Portal...");
            setupCaptivePortal();
        }
    } else {
        Serial.println("No Wi-Fi credentials found. Launching Captive Portal...");
        setupCaptivePortal();
    }

    // 4. Create queue for passing audio blocks between tasks (capacity: 4 blocks)
    audioQueue = xQueueCreate(4, sizeof(int16_t) * BLOCK_SIZE);
    if (audioQueue == NULL) {
        Serial.println("Error: Failed to create audio queue");
        while(1);
    }

#if !SIMULATE_AUDIO
    // Configure ESP32 I2S driver for SPH0645LM4H microphone
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT, // SPH0645 uses 32-bit slot width
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 4,
        .dma_buf_len = BLOCK_SIZE,
        .use_apll = false,
        .tx_desc_auto_clear = false,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = PIN_I2S_SCK,
        .ws_io_num = PIN_I2S_WS,
        .data_out_num = I2S_PIN_NO_CHANGE,
        .data_in_num = PIN_I2S_SD
    };

    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("Error: Failed to install I2S driver: %d\n", err);
        while(1);
    }

    err = i2s_set_pin(I2S_PORT, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("Error: Failed to set I2S pins: %d\n", err);
        while(1);
    }
    Serial.println("SPH0645LM4H Microphone I2S Initialized.");
#else
    Serial.println("WARNING: Running in AUDIO SIMULATION Mode.");
#endif

    // 5. Launch FreeRTOS Tasks
    // Audio Capture runs on Core 0 (high priority)
    xTaskCreatePinnedToCore(
        audioCaptureTask,
        "AudioCapture",
        4096,
        NULL,
        5, // High priority
        NULL,
        0  // Core 0
    );

    // Audio DSP Processing runs on Core 1 (medium priority)
    xTaskCreatePinnedToCore(
        audioProcessingTask,
        "AudioProcessing",
        4096,
        NULL,
        3, // Medium priority
        NULL,
        1  // Core 1
    );
}

void loop() {
    if (apModeActive) {
        dnsServer.processNextRequest();
        server.handleClient();
    }
    vTaskDelay(pdMS_TO_TICKS(10));
}

// ----------------------------------------------------
// Local Configuration & Captive Portal
// ----------------------------------------------------

void loadConfiguration() {
    preferences.begin("noise-mvp", true); // Open NVS in read-only mode
    wifiSSID = preferences.getString("ssid", "");
    wifiPassword = preferences.getString("password", "");
    preferences.end();
}

void saveConfiguration(const String& ssid, const String& password) {
    preferences.begin("noise-mvp", false); // Open NVS in write mode
    preferences.putString("ssid", ssid);
    preferences.putString("password", password);
    preferences.putString("device_id", deviceId);
    preferences.putString("api_endpoint", "https://api.noisesentinel.com/v1");
    preferences.putInt("config_version", 1);
    preferences.end();
    Serial.println("Configuration successfully written to NVS.");
}

void setupCaptivePortal() {
    apModeActive = true;
    
    // Create AP name: NoiseSensor-XXXX (last 4 chars of Device ID)
    String apName = "NoiseSensor-" + deviceId.substring(deviceId.length() - 4);
    Serial.printf("Launching Access Point: %s\n", apName.c_str());

    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1), IPAddress(255, 255, 255, 0));
    WiFi.softAP(apName.c_str());

    // Redirect all DNS requests to the ESP32 portal page
    dnsServer.start(DNS_PORT, "*", IPAddress(192, 168, 4, 1));

    // Register WebServer routes
    server.on("/", HTTP_GET, handlePortalRoot);
    server.on("/submit", HTTP_POST, handlePortalSubmit);
    server.onNotFound(handleNotFound);
    server.begin();
    
    Serial.println("Captive Portal Web Server started.");
}

void handlePortalRoot() {
    String html = "<!DOCTYPE html><html><head>";
    html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
    html += "<style>";
    html += "body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }";
    html += ".card { background: #1e293b; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); width: 100%; max-width: 320px; text-align: center; }";
    html += "h2 { margin-top: 0; color: #38bdf8; }";
    html += "input { width: 100%; padding: 10px; margin: 12px 0; border: 1px solid #475569; border-radius: 6px; background: #334155; color: #fff; box-sizing: border-box; }";
    html += "button { width: 100%; padding: 12px; background: #0284c7; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; transition: background 0.2s; }";
    html += "button:hover { background: #0369a1; }";
    html += ".footer { font-size: 11px; color: #64748b; margin-top: 16px; }";
    html += "</style></head><body>";
    
    html += "<div class='card'>";
    html += "<h2>Noise Sentinel</h2>";
    html += "<p>Wi-Fi Onboarding</p>";
    html += "<form action='/submit' method='POST'>";
    html += "<input type='text' name='ssid' placeholder='Wi-Fi Name (SSID)' required>";
    html += "<input type='password' name='password' placeholder='Wi-Fi Password'>";
    html += "<button type='submit'>Save & Connect</button>";
    html += "</form>";
    html += "<div class='footer'>Device ID: " + deviceId + "</div>";
    html += "</div>";
    
    html += "</body></html>";
    server.send(200, "text/html", html);
}

void handlePortalSubmit() {
    String ssid = server.arg("ssid");
    String password = server.arg("password");

    if (ssid.length() > 0) {
        String successHtml = "<!DOCTYPE html><html><head>";
        successHtml += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
        successHtml += "<style>body { font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding-top: 50px; }</style>";
        successHtml += "</head><body>";
        successHtml += "<h2>Setup Completed!</h2><p>Device is rebooting and connecting to '" + ssid + "'.</p>";
        successHtml += "<p>You can close this page now.</p>";
        successHtml += "</body></html>";

        server.send(200, "text/html", successHtml);
        delay(1000); // Give client time to receive response

        // Write configuration and trigger device restart
        saveConfiguration(ssid, password);
        ESP.restart();
    } else {
        server.send(400, "text/plain", "Error: SSID cannot be empty.");
    }
}

void handleNotFound() {
    // Redirect all stray HTTP queries back to the root page of the captive portal
    server.sendHeader("Location", "http://192.168.4.1/", true);
    server.send(302, "text/plain", "");
}

// ----------------------------------------------------
// Real-time Audio Streaming & DSP Tasks
// ----------------------------------------------------

void audioCaptureTask(void* parameter) {
    int16_t samples[BLOCK_SIZE];
#if !SIMULATE_AUDIO
    // 32-bit DMA buffer for reading SPH0645 (which sends 24-bit aligned samples)
    int32_t dmaBuffer[BLOCK_SIZE];
    size_t bytesRead = 0;
#endif

    while (true) {
#if !SIMULATE_AUDIO
        // Read raw 32-bit samples from I2S
        esp_err_t result = i2s_read(I2S_PORT, &dmaBuffer, sizeof(dmaBuffer), &bytesRead, portMAX_DELAY);
        if (result == ESP_OK && bytesRead > 0) {
            size_t sampleCount = bytesRead / sizeof(int32_t);
            for (size_t i = 0; i < sampleCount; i++) {
                // SPH0645LM4H outputs 24-bit MSB-justified PCM.
                // Shift right by 16 to keep the top 16-bits as standard signed 16-bit PCM.
                samples[i] = (int16_t)(dmaBuffer[i] >> 16);
            }
            xQueueSend(audioQueue, &samples, portMAX_DELAY);
        }
#else
        // Simulate real-time audio block (16ms duration)
        static float phase = 0.0f;
        bool partyNoise = (millis() % 20000 > 15000); // Trigger party peak every 20 seconds
        
        for (int i = 0; i < BLOCK_SIZE; i++) {
            float signal = 0.0f;
            if (partyNoise) {
                signal += 0.4f * sinf(phase);
                phase += 0.05f;
                signal += 0.2f * ((float)rand() / (float)RAND_MAX - 0.5f);
            } else {
                signal += 0.01f * ((float)rand() / (float)RAND_MAX - 0.5f);
            }
            samples[i] = (int16_t)(signal * 32767.0f);
        }
        
        xQueueSend(audioQueue, &samples, portMAX_DELAY);
        vTaskDelay(pdMS_TO_TICKS(16));
#endif
    }
}

void audioProcessingTask(void* parameter) {
    int16_t blockSamples[BLOCK_SIZE];
    float maxDb = 0.0f;
    float sumDb = 0.0f;
    int secondCounter = 0;
    
    const int blocksPerSecond = SAMPLE_RATE / BLOCK_SIZE; // 62.5 blocks/sec

    while (true) {
        if (xQueueReceive(audioQueue, &blockSamples, portMAX_DELAY) == pdTRUE) {
            float rms = processor.processBlock(blockSamples, BLOCK_SIZE);
            float dba = processor.convertToDb(rms);

            if (dba > maxDb) {
                maxDb = dba;
            }
            sumDb += dba;
            secondCounter++;

            if (secondCounter >= blocksPerSecond) {
                float avgDb = sumDb / (float)secondCounter;
                Serial.printf("[SENTINEL] Live dBA - Average: %.1f dB | Peak: %.1f dB\n", avgDb, maxDb);

                maxDb = 0.0f;
                sumDb = 0.0f;
                secondCounter = 0;
            }
        }
    }
}
