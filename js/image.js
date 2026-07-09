/*
=========================================
 Jannersten Barcode Scanner
 image.js
 Version : 1.0
=========================================
*/

//--------------------------------------
// Gri tonlama
//--------------------------------------

function toGray(imageData) {

    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {

        const gray =
            0.299 * data[i] +
            0.587 * data[i + 1] +
            0.114 * data[i + 2];

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    return imageData;
}

//--------------------------------------
// Ortalama parlaklık
//--------------------------------------

function averageBrightness(imageData) {

    const d = imageData.data;

    let total = 0;

    for (let i = 0; i < d.length; i += 4) {

        total += d[i];

    }

    return total / (d.length / 4);

}

//--------------------------------------
// Kontrast arttır
//--------------------------------------

function increaseContrast(imageData, factor = 1.4) {

    const d = imageData.data;

    const avg = averageBrightness(imageData);

    for (let i = 0; i < d.length; i += 4) {

        let value = (d[i] - avg) * factor + avg;

        value = Math.max(0, Math.min(255, value));

        d[i] = value;
        d[i + 1] = value;
        d[i + 2] = value;

    }

    return imageData;

}

//--------------------------------------
// Otomatik Threshold
//--------------------------------------

function autoThreshold(imageData) {

    const d = imageData.data;

    const t = averageBrightness(imageData);

    for (let i = 0; i < d.length; i += 4) {

        const c = d[i] > t ? 255 : 0;

        d[i] = c;
        d[i + 1] = c;
        d[i + 2] = c;

    }

    return imageData;

}

//--------------------------------------
// Basit Blur
//--------------------------------------

function blur(imageData) {

    const w = imageData.width;
    const h = imageData.height;

    const src = new Uint8ClampedArray(imageData.data);
    const dst = imageData.data;

    for (let y = 1; y < h - 1; y++) {

        for (let x = 1; x < w - 1; x++) {

            let sum = 0;

            for (let ky = -1; ky <= 1; ky++) {

                for (let kx = -1; kx <= 1; kx++) {

                    const p =
                        ((y + ky) * w + (x + kx)) * 4;

                    sum += src[p];

                }

            }

            const avg = sum / 9;

            const i = (y * w + x) * 4;

            dst[i] = avg;
            dst[i + 1] = avg;
            dst[i + 2] = avg;

        }

    }

    return imageData;

}

//--------------------------------------
// ROI
//--------------------------------------

function getTopROI(imageData) {

    const w = imageData.width;
    const h = imageData.height;

    const roiHeight = Math.floor(h * 0.20);

    return {

        x: 0,

        y: 0,

        width: w,

        height: roiHeight

    };

}

//--------------------------------------
// Siyah piksel say
//--------------------------------------

function blackPixelCount(imageData, roi) {

    const d = imageData.data;

    let count = 0;

    for (let y = roi.y; y < roi.y + roi.height; y++) {

        for (let x = roi.x; x < roi.x + roi.width; x++) {

            const i = (y * imageData.width + x) * 4;

            if (d[i] === 0) {

                count++;

            }

        }

    }

    return count;

}

//--------------------------------------
// Histogram
//--------------------------------------

function createHistogram(imageData) {

    const hist = new Array(256).fill(0);

    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {

        hist[d[i]]++;

    }

    return hist;

}

//--------------------------------------
// ROI çiz
//--------------------------------------

function drawROI(ctx, roi) {

    ctx.strokeStyle = "red";

    ctx.lineWidth = 2;

    ctx.strokeRect(

        roi.x,

        roi.y,

        roi.width,

        roi.height

    );

}

//--------------------------------------
// Histogram yazdır
//--------------------------------------

function printHistogram(hist) {

    console.log("Histogram");

    for (let i = 0; i < hist.length; i++) {

        if (hist[i] > 0) {

            console.log(i, hist[i]);

        }

    }

}

//--------------------------------------
// Ana görüntü işleme
//--------------------------------------

function processImage(imageData) {

    imageData = toGray(imageData);

    imageData = increaseContrast(imageData);

    imageData = blur(imageData);

    imageData = autoThreshold(imageData);

    return imageData;

}
