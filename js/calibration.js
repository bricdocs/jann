/*
==================================
Calibration Tool
==================================
*/

const records=[];

async function startCalibration(){

    await startCamera();

    requestAnimationFrame(loop);

}

function loop(){

    if(isCameraReady()){

        const image=captureFrame(canvas);

        if(image){

            const processed=processImage(image);

            const result=analyzeBarcode(

                canvas.getContext("2d"),

                processed

            );

            if(result){

                document.getElementById(

                    "confidence"

                ).textContent=

                result.confidence+"%";

                document.getElementById(

                    "bars"

                ).textContent=

                result.barCount;

            }

        }

    }

    requestAnimationFrame(loop);

}

document

.getElementById(

"saveButton"

)

.onclick=function(){

    if(!barcodeReady()){

        alert(

        "Henüz barkod okunmadı."

        );

        return;

    }

    const card=

    document

    .getElementById(

    "cardSelect"

    )

    .value;

    const data=getLastBarcode();

    records.push({

        card:card,

        barcode:data

    });

    console.log(records);

    downloadRecords();

};

function downloadRecords(){

    const blob=new Blob(

        [

        JSON.stringify(

        records,

        null,

        4

        )

        ],

        {

            type:

            "application/json"

        }

    );

    const a=

    document.createElement(

        "a"

    );

    a.href=

    URL.createObjectURL(blob);

    a.download=

    "calibration.json";

    a.click();

}

window.onload=

startCalibration;
