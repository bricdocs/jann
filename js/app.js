/*
=========================================
 Jannersten Barcode Scanner
 app.js
 Version : 1.0
=========================================
*/

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let fpsCounter = 0;
let fpsTimer = performance.now();
let fps = 0;

//--------------------------------------
// FPS
//--------------------------------------

function updateFPS() {

    fpsCounter++;

    const now = performance.now();

    if (now - fpsTimer >= 1000) {

        fps = fpsCounter;

        fpsCounter = 0;

        fpsTimer = now;

        document.getElementById("fps").textContent = fps;

    }

}

//--------------------------------------
// Ana Tarama
//--------------------------------------

function scanFrame() {

    if (!isCameraReady()) {

        requestAnimationFrame(scanFrame);

        return;

    }

    const imageData = captureFrame(canvas);

    if (!imageData) {

        requestAnimationFrame(scanFrame);

        return;

    }

    // Orijinal görüntüyü tekrar çiz
    ctx.putImageData(imageData, 0, 0);

    // Görüntü işle
    const processed = processImage(imageData);

    // Barkodu tara
    const result = analyzeBarcode(ctx, processed);

    // Decoder (şimdilik sadece örnek)
    if (typeof decodeBarcode === "function") {

        const card = decodeBarcode(result.pattern);

        if (card) {

            document.getElementById("card").textContent = card;

        }

    }

    updateFPS();

    requestAnimationFrame(scanFrame);

}

//--------------------------------------
// Başlat
//--------------------------------------

async function initialize() {

    setStatus("Kamera Açılıyor...");

    const ok = await startCamera();

    if (!ok) {

        setStatus("Kamera Başlatılamadı");

        return;

    }

    video.addEventListener("loadedmetadata", () => {

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        setStatus("Tarama Başladı");

        requestAnimationFrame(scanFrame);

    });

}

window.addEventListener("load", initialize);
