/*
=========================================
 Jannersten Barcode Scanner
 camera.js
 Version : 1.0
=========================================
*/

const video = document.getElementById("video");

let cameraStream = null;
let currentFacingMode = "environment";
let cameraReady = false;

// --------------------------------------
// Status yaz
// --------------------------------------

function setStatus(text) {
    const el = document.getElementById("status");
    if (el) {
        el.textContent = text;
    }
}

// --------------------------------------
// Kamera desteği kontrolü
// --------------------------------------

function isCameraSupported() {

    return (
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
    );

}

// --------------------------------------
// Eski stream'i kapat
// --------------------------------------

function stopCamera() {

    if (!cameraStream) return;

    cameraStream
        .getTracks()
        .forEach(track => track.stop());

    cameraStream = null;
    cameraReady = false;

}

// --------------------------------------
// Kamerayı aç
// --------------------------------------

async function startCamera(facing = "environment") {

    if (!isCameraSupported()) {

        setStatus("Tarayıcı kamerayı desteklemiyor.");

        return false;

    }

    stopCamera();

    currentFacingMode = facing;

    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                audio: false,

                video: {

                    facingMode: {
                        ideal: facing
                    },

                    width: {
                        ideal: 1920
                    },

                    height: {
                        ideal: 1080
                    }

                }

            });

        video.srcObject = cameraStream;

        await video.play();

        cameraReady = true;

        setStatus("Kamera Hazır");

        console.log("Camera started");

        return true;

    }
    catch (err) {

        console.error(err);

        setStatus("Kamera Açılamadı");

        return false;

    }

}

// --------------------------------------
// Ön / Arka kamera değiştir
// --------------------------------------

async function switchCamera() {

    if (currentFacingMode === "environment") {

        await startCamera("user");

    }
    else {

        await startCamera("environment");

    }

}

// --------------------------------------
// Kamera çözünürlüğü
// --------------------------------------

function getCameraResolution() {

    return {

        width: video.videoWidth,

        height: video.videoHeight

    };

}

// --------------------------------------
// Kamera hazır mı?
// --------------------------------------

function isCameraReady() {

    return cameraReady &&
        video.videoWidth > 0 &&
        video.videoHeight > 0;

}

// --------------------------------------
// Canvas'a frame çiz
// --------------------------------------

function captureFrame(canvas) {

    if (!isCameraReady())
        return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(

        video,

        0,
        0,

        canvas.width,
        canvas.height

    );

    return ctx.getImageData(

        0,
        0,

        canvas.width,
        canvas.height

    );

}

// --------------------------------------
// Kamera bilgileri
// --------------------------------------

function getCameraInfo() {

    if (!cameraStream)
        return null;

    const track = cameraStream
        .getVideoTracks()[0];

    return track.getSettings();

}

// --------------------------------------
// Sayfa kapanırken kamerayı kapat
// --------------------------------------

window.addEventListener(

    "beforeunload",

    () => {

        stopCamera();

    }

);

// --------------------------------------
// Sayfa görünürlüğü
// --------------------------------------

document.addEventListener(

    "visibilitychange",

    () => {

        if (document.hidden) {

            stopCamera();

        }
        else {

            startCamera(currentFacingMode);

        }

    }

);
