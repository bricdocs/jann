/*
=====================================================
 Jannersten Barcode Scanner
 barcode.js
 Version 2.0
 Bölüm 1
=====================================================
*/

const BarcodeEngine = {

    config: {

        roiTop: 0.02,
        roiHeight: 0.30,

        projectionThreshold: 0.20,

        scanLines: 50,

        minBarWidth: 2,

        maxBarWidth: 60

    },

    lastResult: null

};

//------------------------------------------
// ROI
//------------------------------------------

function getBarcodeROI(imageData){

    const w=imageData.width;
    const h=imageData.height;

    return{

        x:0,

        y:Math.floor(h*BarcodeEngine.config.roiTop),

        width:w,

        height:Math.floor(h*BarcodeEngine.config.roiHeight)

    };

}

//------------------------------------------
// Projection
//------------------------------------------

function buildProjection(imageData,roi){

    const projection=[];

    const data=imageData.data;
    const width=imageData.width;

    for(let x=roi.x;x<roi.x+roi.width;x++){

        let black=0;

        for(let y=roi.y;y<roi.y+roi.height;y++){

            const i=(y*width+x)*4;

if (
    data[i] < 80 &&
    data[i + 1] < 80 &&
    data[i + 2] < 80
){

    black++;

}

        }

        projection.push(black);

    }

    return projection;

}

//------------------------------------------
// Maximum
//------------------------------------------

function projectionMaximum(p){

    let m=0;

    for(const v of p){

        if(v>m)
            m=v;

    }

    return m;

}

//------------------------------------------
// Projection Threshold
//------------------------------------------

function projectionLimit(p){

    return projectionMaximum(p)
    *
    BarcodeEngine.config.projectionThreshold;

}

//------------------------------------------
// Barcode Region
//------------------------------------------

function locateProjectionRegion(projection){

    const limit=projectionLimit(projection);

    let left=-1;
    let right=-1;

    for(let i=0;i<projection.length;i++){

        if(left==-1){

            if(projection[i]>limit){

                left=i;

            }

        }

        else{

            if(projection[i]<limit){

                right=i;

                break;

            }

        }

    }

    if(left==-1)
        return null;

    if(right==-1)
        right=projection.length-1;

    return{

        left,

        right,

        width:right-left

    };

}

//------------------------------------------
// Draw ROI
//------------------------------------------

function drawROI(ctx,roi){

    ctx.save();

    ctx.strokeStyle="red";

    ctx.lineWidth=2;

    ctx.strokeRect(

        roi.x,

        roi.y,

        roi.width,

        roi.height

    );

    ctx.restore();

}

//------------------------------------------
// Draw Projection Region
//------------------------------------------

function drawProjectionRegion(ctx,roi,region){

    if(region==null)
        return;

    ctx.save();

    ctx.strokeStyle="yellow";

    ctx.lineWidth=3;

    ctx.strokeRect(

        roi.x+region.left,

        roi.y,

        region.width,

        roi.height

    );

    ctx.restore();

}

//------------------------------------------
// Horizontal Scan
//------------------------------------------

function scanHorizontal(imageData,y,region,roi){

    const result=[];

    const width=imageData.width;

    const data=imageData.data;

    for(

        let x=roi.x+region.left;

        x<roi.x+region.right;

        x++

    ){

        const i=(y*width+x)*4;

const isBlack =

    data[i] < 80 &&
    data[i + 1] < 80 &&
    data[i + 2] < 80;

result.push(

    isBlack ? 1 : 0

);

    }

    return result;

}

//------------------------------------------
// Multi Scan
//------------------------------------------

function buildScanLines(imageData,roi,region){

    const scans=[];

    const count=BarcodeEngine.config.scanLines;

    const step=Math.max(

        1,

        Math.floor(roi.height/count)

    );

    for(

        let y=roi.y;

        y<roi.y+roi.height;

        y+=step

    ){

        scans.push(

            scanHorizontal(

                imageData,

                y,

                region,

                roi

            )

        );

    }

    return scans;

}

/*
=====================================================
 barcode.js
 Version 2.0
 Bölüm 2
=====================================================
*/

//------------------------------------------
// Run Length
//------------------------------------------

function runLengthEncode(scan){

    const runs=[];

    if(scan.length===0)
        return runs;

    let color=scan[0];
    let length=1;

    for(let i=1;i<scan.length;i++){

        if(scan[i]===color){

            length++;

        }else{

            runs.push({

                color:color,
                length:length

            });

            color=scan[i];
            length=1;

        }

    }

    runs.push({

        color:color,
        length:length

    });

    return runs;

}

//------------------------------------------
// Siyah çubukları al
//------------------------------------------

function extractBlackBars(runs){

    const bars=[];

    for(const run of runs){

        if(run.color===1){

            if(
                run.length>=BarcodeEngine.config.minBarWidth &&
                run.length<=BarcodeEngine.config.maxBarWidth
            ){

                bars.push(run.length);

            }

        }

    }

    return bars;

}

//------------------------------------------
// Ortalama
//------------------------------------------

function average(values){

    if(values.length===0)
        return 0;

    let total=0;

    for(const v of values){

        total+=v;

    }

    return total/values.length;

}

//------------------------------------------
// Normalize
//------------------------------------------

function normalizeBars(bars){

    if(bars.length===0)
        return [];

    const avg=average(bars);

    return bars.map(v=>Number((v/avg).toFixed(2)));

}

//------------------------------------------
// Scan satırını işle
//------------------------------------------

function analyzeScan(scan){

    const runs=runLengthEncode(scan);

    const bars=extractBlackBars(runs);

    return{

        runs:runs,

        bars:bars,

        normalized:normalizeBars(bars)

    };

}

//------------------------------------------
// Bütün scan'leri işle
//------------------------------------------

function analyzeScanLines(scans){

    const results=[];

    for(const scan of scans){

        results.push(

            analyzeScan(scan)

        );

    }

    return results;

}

//------------------------------------------
// En uzun ortak bar sayısını bul
//------------------------------------------

function mostCommonBarCount(results){

    const map={};

    for(const r of results){

        const n=r.bars.length;

        map[n]=(map[n]||0)+1;

    }

    let bestCount=0;
    let bestValue=0;

    for(const key in map){

        if(map[key]>bestCount){

            bestCount=map[key];
            bestValue=parseInt(key);

        }

    }

    return bestValue;

}

//------------------------------------------
// Aynı uzunluktaki scan'leri filtrele
//------------------------------------------

function filterScans(results,barCount){

    return results.filter(r=>r.bars.length===barCount);

}

//------------------------------------------
// Ortalama bar genişlikleri
//------------------------------------------

function averageBars(results){

    if(results.length===0)
        return [];

    const count=results[0].bars.length;

    const output=[];

    for(let i=0;i<count;i++){

        let total=0;

        let used=0;

        for(const r of results){

            if(i<r.bars.length){

                total+=r.bars[i];
                used++;

            }

        }

        output.push(

            Number((total/used).toFixed(2))

        );

    }

    return output;

}

//------------------------------------------
// Ortalama normalize değerleri
//------------------------------------------

function averageNormalized(results){

    if(results.length===0)
        return [];

    const count=results[0].normalized.length;

    const output=[];

    for(let i=0;i<count;i++){

        let total=0;
        let used=0;

        for(const r of results){

            if(i<r.normalized.length){

                total+=r.normalized[i];
                used++;

            }

        }

        output.push(

            Number((total/used).toFixed(2))

        );

    }

    return output;

}

/*
=====================================================
 barcode.js
 Version 2.0
 Bölüm 3
=====================================================
*/

//------------------------------------------
// Güven Skoru
//------------------------------------------

function calculateConfidence(results, expectedBarCount){

    if(results.length===0)
        return 0;

    let valid=0;

    for(const r of results){

        if(r.bars.length===expectedBarCount){

            valid++;

        }

    }

    return Math.round((valid/results.length)*100);

}

//------------------------------------------
// JSON Sonucu Oluştur
//------------------------------------------

function buildBarcodeResult(roi, region, results){

    if(results.length===0){

        return null;

    }

    const barCount = mostCommonBarCount(results);

    const filtered = filterScans(results, barCount);

    const confidence = calculateConfidence(results, barCount);

    const bars = averageBars(filtered);

    const normalized = averageNormalized(filtered);

    return{

        x: roi.x + region.left,

        y: roi.y,

        width: region.width,

        height: roi.height,

        barCount: barCount,

        confidence: confidence,

        bars: bars,

        normalized: normalized,

        scans: filtered.length,

        timestamp: Date.now()

    };

}

//------------------------------------------
// Debug Yazdır
//------------------------------------------

function printBarcode(result){

    if(result==null){

        console.log("Barcode bulunamadı.");

        return;

    }

    console.clear();

    console.log("==============");

    console.log("JANNERSTEN");

    console.log("==============");

    console.log("Confidence :", result.confidence,"%");

    console.log("Bars       :", result.barCount);

    console.log("Widths     :", result.bars);

    console.log("Normalized :", result.normalized);

    console.log("Scans      :", result.scans);

    console.log("==============");

}

//------------------------------------------
// Debug Paneli
//------------------------------------------

function updateDebugPanel(result){

    if(result==null){

        document.getElementById("bars").textContent="0";

        document.getElementById("pattern").textContent="------";

        return;

    }

    document.getElementById("bars").textContent=result.barCount;

    document.getElementById("pattern").textContent=

        result.normalized.join(" ");

}

//------------------------------------------
// Sonucu Hafızaya Al
//------------------------------------------

function saveLastBarcode(result){

    BarcodeEngine.lastResult=result;

}

//------------------------------------------
// Son Sonucu Ver
//------------------------------------------

function getLastBarcode(){

    return BarcodeEngine.lastResult;

}

//------------------------------------------
// JSON Export
//------------------------------------------

function exportBarcodeJSON(){

    if(BarcodeEngine.lastResult==null)
        return "{}";

    return JSON.stringify(

        BarcodeEngine.lastResult,

        null,

        4

    );

}

//------------------------------------------
// Barkod Var mı?
//------------------------------------------

function hasBarcode(){

    return BarcodeEngine.lastResult!=null;

}

//------------------------------------------
// Barkodu Temizle
//------------------------------------------

function clearBarcode(){

    BarcodeEngine.lastResult=null;

}

//------------------------------------------
// Overlay Çiz
//------------------------------------------

function drawOverlay(ctx,result){

    if(result==null)
        return;

    ctx.save();

    ctx.strokeStyle="#00ff00";

    ctx.lineWidth=3;

    ctx.strokeRect(

        result.x,

        result.y,

        result.width,

        result.height

    );

    ctx.fillStyle="#00ff00";

    ctx.font="18px Arial";

    ctx.fillText(

        "Confidence : "+result.confidence+"%",

        result.x,

        result.y-8

    );

    ctx.restore();

}

/*
=====================================================
 barcode.js
 Version 2.0
 Bölüm 4
=====================================================
*/

//------------------------------------------
// Ana Barkod Analizi
//------------------------------------------

function analyzeBarcode(ctx, imageData) {

    clearBarcode();

    if (!imageData)
        return null;

    // 1 - Barkod ROI
    const roi = getBarcodeROI(imageData);

    // 2 - ROI çiz
    drawROI(ctx, roi);

    // 3 - Projection
    const projection = buildProjection(imageData, roi);

    // 4 - Barkod bölgesi
    const region = locateProjectionRegion(projection);

    if (region == null)
        return null;

    drawProjectionRegion(ctx, roi, region);

    // 5 - Çoklu tarama
    const scans = buildScanLines(

        imageData,
        roi,
        region

    );

    if (scans.length === 0)
        return null;

    // 6 - Run Length
    const results = analyzeScanLines(scans);

    // 7 - Sonuç
    const barcode = buildBarcodeResult(

        roi,
        region,
        results

    );

    if (barcode == null)
        return null;

    saveLastBarcode(barcode);

    updateDebugPanel(barcode);

    drawOverlay(ctx, barcode);

    printBarcode(barcode);

    return barcode;

}

//------------------------------------------
// Barkod Hazır mı
//------------------------------------------

function barcodeReady() {

    return BarcodeEngine.lastResult != null;

}

//------------------------------------------
// Ortalama Bar Genişliği
//------------------------------------------

function averageBarWidth() {

    if (!barcodeReady())
        return 0;

    return average(

        BarcodeEngine.lastResult.bars

    );

}

//------------------------------------------
// En Dar Bar
//------------------------------------------

function minimumBarWidth() {

    if (!barcodeReady())
        return 0;

    return Math.min(

        ...BarcodeEngine.lastResult.bars

    );

}

//------------------------------------------
// En Geniş Bar
//------------------------------------------

function maximumBarWidth() {

    if (!barcodeReady())
        return 0;

    return Math.max(

        ...BarcodeEngine.lastResult.bars

    );

}

//------------------------------------------
// Normalize edilmiş Pattern
//------------------------------------------

function normalizedPattern() {

    if (!barcodeReady())
        return [];

    return BarcodeEngine.lastResult.normalized;

}

//------------------------------------------
// Debug Bilgisi
//------------------------------------------

function debugBarcode() {

    if (!barcodeReady()) {

        console.log("Henüz barkod yok.");

        return;

    }

    console.table({

        Confidence: BarcodeEngine.lastResult.confidence,

        Bars: BarcodeEngine.lastResult.barCount,

        AvgWidth: averageBarWidth(),

        MinWidth: minimumBarWidth(),

        MaxWidth: maximumBarWidth()

    });

}

//------------------------------------------
// Download JSON
//------------------------------------------

function downloadBarcodeJSON() {

    if (!barcodeReady())
        return;

    const json = exportBarcodeJSON();

    const blob = new Blob(

        [json],

        {

            type: "application/json"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =

        "barcode.json";

    a.click();

    URL.revokeObjectURL(url);

}

//------------------------------------------
// İstatistik
//------------------------------------------

function barcodeStatistics() {

    if (!barcodeReady())
        return null;

    return {

        bars:

            BarcodeEngine.lastResult.barCount,

        confidence:

            BarcodeEngine.lastResult.confidence,

        average:

            averageBarWidth(),

        minimum:

            minimumBarWidth(),

        maximum:

            maximumBarWidth(),

        scans:

            BarcodeEngine.lastResult.scans

    };

}

//------------------------------------------
// Decoder için Veri
//------------------------------------------

function getDecoderInput() {

    if (!barcodeReady())
        return null;

    return {

        bars:

            BarcodeEngine.lastResult.bars,

        normalized:

            BarcodeEngine.lastResult.normalized,

        confidence:

            BarcodeEngine.lastResult.confidence

    };

}

console.log(
    "barcode.js Version 2.0 hazır."
);
