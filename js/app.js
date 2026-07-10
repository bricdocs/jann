/*
=========================================
 Jannersten Barcode Scanner
 app.js
 Version : 2.0
 Bölüm 1
=========================================
*/

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let fps = 0;
let frameCounter = 0;
let lastTime = performance.now();

let calibrationFrames = [];
let calibrationDatabase = [];

let collectingFrames = false;
let targetFrameCount = 30;

//------------------------------------
// FPS
//------------------------------------

function updateFPS(){

    frameCounter++;

    const now = performance.now();

    if(now - lastTime >= 1000){

        fps = frameCounter;

        frameCounter = 0;

        lastTime = now;

        document.getElementById("fps").textContent = fps;

    }

}

//------------------------------------
// UI
//------------------------------------

function updateStatus(text){

    document.getElementById("status").textContent = text;

}

function updateConfidence(value){

    document.getElementById("confidence").textContent = value + "%";

}

function updateRecordCount(){

    document.getElementById("recordCount").textContent =
        calibrationDatabase.length;

}

//------------------------------------
// Ortalama
//------------------------------------

function averageArray(arrays){

    if(arrays.length===0)
        return [];

    const len=arrays[0].length;

    let out=[];

    for(let i=0;i<len;i++){

        let sum=0;

        for(const a of arrays){

            sum+=a[i];

        }

        out.push(

            Number(

                (sum/arrays.length).toFixed(2)

            )

        );

    }

    return out;

}

//------------------------------------
// Kamera Başlat
//------------------------------------

async function initialize(){

    console.log("initialize başladı");

    updateStatus("Kamera Açılıyor...");

    await startCamera();

    // Kamera gerçekten hazır olana kadar bekle
    let retry = 0;

    while (!isCameraReady() && retry < 50) {

        await new Promise(r => setTimeout(r, 100));

        retry++;

    }

    console.log("cameraReady =", isCameraReady());

    if (!isCameraReady()) {

        updateStatus("Kamera Başlatılamadı");

        return;

    }

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    updateStatus("Hazır");

    console.log("LOOP BAŞLADI");

    requestAnimationFrame(loop);

}

/*
=========================================
 app.js
 Version 2.0
 Bölüm 2 (Güncel)
=========================================
*/

//------------------------------------
// Ana Döngü
//------------------------------------

//------------------------------------
// Ana Döngü
//------------------------------------

function loop() {

    if (isCameraReady()) {

        const image = captureFrame(canvas);
console.log("Frame alındı =", image);
        if (image) {

            // Orijinal görüntüyü canvas'a çiz
            ctx.putImageData(image, 0, 0);

            // Görüntüyü işle
            const processed = processImage(image);
console.log("processImage OK");
            // Barkodu analiz et
            const result = analyzeBarcode(ctx, processed);
console.log("analyzeBarcode sonucu =", result);
            if (result) {

                // Paneli güncelle
                updateLiveResult(result);

                // ===== YENİ KISIM =====
                const decoded = decodeBarcode();

                if (decoded) {

                    document.getElementById("card").textContent =
                        decoded.card.name;

                    document.getElementById("confidence").textContent =
                        decoded.confidence + "%";

                } else {

                    document.getElementById("card").textContent =
                        "Unknown";

                }
                // ======================

                // Kalibrasyon açıksa kareyi kaydet
                if (collectingFrames) {

                    collectCalibrationFrame(result);

                }

            } else {

                updateConfidence(0);

                document.getElementById("bars").textContent = "0";
                document.getElementById("pattern").textContent = "------";
                document.getElementById("card").textContent = "Unknown";

            }

        }

    }

    updateFPS();

    requestAnimationFrame(loop);

}

//------------------------------------
// Kalibrasyon Başlat
//------------------------------------

function startCalibrationCapture() {

    calibrationFrames = [];

    calibrationAverage = null;

    collectingFrames = true;

    updateStatus("30 Kare Toplanıyor...");

}

//------------------------------------
// Kare Topla
//------------------------------------

function collectCalibrationFrame(result) {

    if (!result)
        return;

    calibrationFrames.push({

        bars: [...result.bars],

        normalized: [...result.normalized],

        confidence: result.confidence

    });

    updateStatus(

        calibrationFrames.length +
        " / " +
        targetFrameCount +
        " Kare"

    );

    if (calibrationFrames.length >= targetFrameCount) {

        collectingFrames = false;

        updateStatus("30 Kare Tamamlandı");

        buildCalibrationAverage();

    }

}

//------------------------------------
// Ortalama Hesapla
//------------------------------------

let calibrationAverage = null;

function buildCalibrationAverage() {

    if (calibrationFrames.length === 0)
        return;

    const bars = [];
    const normalized = [];

    for (const frame of calibrationFrames) {

        bars.push(frame.bars);

        normalized.push(frame.normalized);

    }

    let confidence = 0;

    for (const frame of calibrationFrames) {

        confidence += frame.confidence;

    }

    confidence = Math.round(

        confidence / calibrationFrames.length

    );

    calibrationAverage = {

        bars: averageArray(bars),

        normalized: averageArray(normalized),

        confidence: confidence,

        frames: calibrationFrames.length

    };

    console.log("Calibration Average");

    console.log(calibrationAverage);

}

/*
=========================================
 app.js
 Version 2.0
 Bölüm 3
=========================================
*/

//------------------------------------
// Kartı Kaydet
//------------------------------------

function saveCurrentCalibration(){

    if(calibrationAverage==null){

        alert("Önce 30 kare toplayın.");

        return;

    }

    const card=document
        .getElementById("cardSelect")
        .value;

    // Aynı kart varsa güncelle
    const index=calibrationDatabase.findIndex(
        item=>item.card===card
    );

    const record={

        card:card,

        bars:[...calibrationAverage.bars],

        normalized:[...calibrationAverage.normalized],

        confidence:calibrationAverage.confidence,

        created:new Date().toISOString()

    };

    if(index>=0){

        calibrationDatabase[index]=record;

    }else{

        calibrationDatabase.push(record);

    }

    updateRecordCount();

    updateStatus(card+" kaydedildi.");

    console.log(record);

}

//------------------------------------
// JSON İndir
//------------------------------------

function downloadCalibrationDatabase(){

    if(calibrationDatabase.length===0){

        alert("Henüz kayıt yok.");

        return;

    }

    const blob=new Blob(

        [

            JSON.stringify(

                calibrationDatabase,

                null,

                4

            )

        ],

        {

            type:"application/json"

        }

    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="calibration.json";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

}

//------------------------------------
// Butonlar
//------------------------------------

function connectButtons(){

    const capture=document.getElementById(
        "captureButton"
    );

    if(capture){

        capture.onclick=startCalibrationCapture;

    }

    const save=document.getElementById(
        "saveCalibration"
    );

    if(save){

        save.onclick=saveCurrentCalibration;

    }

    const download=document.getElementById(
        "downloadCalibration"
    );

    if(download){

        download.onclick=downloadCalibrationDatabase;

    }

}

//------------------------------------
// Sonuç Paneli
//------------------------------------

function updateLiveResult(result){

    if(!result)
        return;

    document.getElementById("bars").textContent=
        result.barCount;

    document.getElementById("pattern").textContent=
        result.normalized.join(" ");

    document.getElementById("confidence").textContent=
        result.confidence+"%";

}

//------------------------------------
// Başlat
//------------------------------------

window.addEventListener("load", () => {

    console.log("APP START");

    connectButtons();

    initialize();

});
