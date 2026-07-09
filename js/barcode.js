/*
=========================================
 Jannersten Barcode Scanner
 barcode.js
 Version : 1.0
=========================================
*/

let lastBars = [];
let lastPattern = "";

//--------------------------------------
// ROI'de dikey siyah yoğunluğu hesapla
//--------------------------------------

function verticalProjection(imageData, roi) {

    const projection = [];

    const data = imageData.data;
    const width = imageData.width;

    for (let x = roi.x; x < roi.x + roi.width; x++) {

        let count = 0;

        for (let y = roi.y; y < roi.y + roi.height; y++) {

            const i = (y * width + x) * 4;

            if (data[i] === 0) {
                count++;
            }

        }

        projection.push(count);

    }

    return projection;

}

//--------------------------------------
// Siyah kolonları bul
//--------------------------------------

function detectBars(projection, minHeight = 5) {

    const bars = [];

    let inside = false;
    let start = 0;

    for (let i = 0; i < projection.length; i++) {

        if (!inside && projection[i] >= minHeight) {

            inside = true;
            start = i;

        }

        if (inside && projection[i] < minHeight) {

            inside = false;

            const end = i - 1;

            bars.push({

                start: start,
                end: end,
                width: end - start + 1,
                center: Math.round((start + end) / 2)

            });

        }

    }

    // Görüntünün sonunda biten çubuk
    if (inside) {

        const end = projection.length - 1;

        bars.push({

            start: start,
            end: end,
            width: end - start + 1,
            center: Math.round((start + end) / 2)

        });

    }

    return bars;

}

//--------------------------------------
// Genişliklerden kaba pattern üret
//--------------------------------------

function createPattern(bars) {

    if (bars.length === 0)
        return "";

    const avg =
        bars.reduce((s, b) => s + b.width, 0) / bars.length;

    let pattern = "";

    for (const bar of bars) {

        pattern += (bar.width > avg) ? "1" : "0";

    }

    return pattern;

}

//--------------------------------------
// Çizgileri ekrana çiz
//--------------------------------------

function drawBars(ctx, roi, bars) {

    ctx.save();

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;

    for (const bar of bars) {

        const x = roi.x + bar.center;

        ctx.beginPath();
        ctx.moveTo(x, roi.y);
        ctx.lineTo(x, roi.y + roi.height);
        ctx.stroke();

    }

    ctx.restore();

}

//--------------------------------------
// Debug panelini güncelle
//--------------------------------------

function updateDebug(bars, pattern) {

    document.getElementById("bars").textContent = bars.length;

    document.getElementById("pattern").textContent =
        pattern || "------";

}

//--------------------------------------
// Çubuk genişliklerini döndür
//--------------------------------------

function getBarWidths(bars) {

    return bars.map(bar => bar.width);

}

//--------------------------------------
// Ana barkod analizi
//--------------------------------------

function analyzeBarcode(ctx, imageData) {

    const roi = getTopROI(imageData);

    drawROI(ctx, roi);

    const projection =
        verticalProjection(imageData, roi);

    const bars =
        detectBars(projection);

    drawBars(ctx, roi, bars);

    const pattern =
        createPattern(bars);

    updateDebug(bars, pattern);

    lastBars = bars;
    lastPattern = pattern;

    return {

        roi: roi,

        bars: bars,

        widths: getBarWidths(bars),

        pattern: pattern

    };

}

//--------------------------------------
// Son sonucu döndür
//--------------------------------------

function getLastBarcode() {

    return {

        bars: lastBars,

        pattern: lastPattern

    };

}
