/*
=====================================================
 decoder.js
 Version 1.0
=====================================================
*/

function distance(a,b){

    if(!a || !b) return 999999;

    if(a.length!==b.length)
        return 999999;

    let d=0;

    for(let i=0;i<a.length;i++){

        d+=Math.abs(a[i]-b[i]);

    }

    return d;

}

//--------------------------------------------

function decodeBarcode(){

    if(!barcodeReady())
        return null;

    const input=getDecoderInput();

    if(input==null)
        return null;

    let best=null;

    let bestDistance=999999;

    for(const pattern in jannerstenDatabase){

        const card=jannerstenDatabase[pattern];

        if(!card.pattern)
            continue;

        const d=distance(

            input.normalized,

            card.pattern

        );

        if(d<bestDistance){

            bestDistance=d;

            best=card;

        }

    }

    if(best==null)
        return null;

    return{

        card:best,

        distance:Number(bestDistance.toFixed(2)),

        confidence:Math.max(

            0,

            Math.round(

                100-bestDistance*25

            )

        )

    };

}

//--------------------------------------------

function updateCardPanel(){

    const result=decodeBarcode();

    const card=document.getElementById("card");

    if(result==null){

        card.textContent="Unknown";

        return;

    }

    card.textContent=

        result.card.name+

        " ("+

        result.confidence+

        "%)";

}

//--------------------------------------------

setInterval(

    updateCardPanel,

    200

);

console.log("decoder.js hazır.");
