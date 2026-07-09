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

    updateStatus("Kamera Açılıyor...");

    const ok = await startCamera();

    if(!ok){

        updateStatus("Kamera Başlatılamadı");

        return;

    }

    video.addEventListener("loadedmetadata",()=>{

        canvas.width = video.videoWidth;

        canvas.height = video.videoHeight;

        updateStatus("Hazır");

        requestAnimationFrame(loop);

    });

}

/*
=========================================
 app.js
 Version 2.0
 Bölüm 2
=========================================
*/

//------------------------------------
// Ana Döngü
//------------------------------------

function loop(){

    if(isCameraReady()){

        const image = captureFrame(canvas);

        if(image){

            ctx.putImageData(image,0,0);

            const processed = processImage(image);

            const result = analyzeBarcode(ctx,processed);

            if(result){

                updateConfidence(result.confidence);

                if(collectingFrames){

                    collectCalibrationFrame(result);

                }

            }else{

                updateConfidence(0);

            }

        }

    }

    updateFPS();

    requestAnimationFrame(loop);

}

//------------------------------------
// Kalibrasyon Başlat
//------------------------------------

function startCalibrationCapture(){

    calibrationFrames=[];

    collectingFrames=true;

    updateStatus("30 Kare Toplanıyor...");

}

//------------------------------------
// Kare Topla
//------------------------------------

function collectCalibrationFrame(result){

    if(!result)
        return;

    calibrationFrames.push({

        bars:[...result.bars],

        normalized:[...result.normalized],

        confidence:result.confidence

    });

    updateStatus(

        calibrationFrames.length +

        " / " +

        targetFrameCount +

        " Kare"

    );

    if(calibrationFrames.length>=targetFrameCount){

        collectingFrames=false;

        updateStatus("30 Kare Tamamlandı");

        buildCalibrationAverage();

    }

}

//------------------------------------
// Ortalama Hesapla
//------------------------------------

let calibrationAverage=null;

function buildCalibrationAverage(){

    if(calibrationFrames.length===0)
        return;

    const bars=[];

    const normalized=[];

    for(const frame of calibrationFrames){

        bars.push(frame.bars);

        normalized.push(frame.normalized);

    }

    calibrationAverage={

        bars:averageArray(bars),

        normalized:averageArray(normalized),

        confidence:Math.round(

            calibrationFrames.reduce(

                (a,b)=>a+b.confidence,

                0

            )

            /

            calibrationFrames.length

        )

    };

    console.log(

        "Calibration Average",

        calibrationAverage

    );

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

window.addEventListener(

    "load",

    ()=>{

        connectButtons();

        initialize();

    }

);
