/**
 * app.js
 */

function onReady() {

    function $(id) { return document.getElementById(id);}

    if (Crop.isPossible()) {
        Crop.init({ 
            cls: "image-cropper",
            height:400,
            width:600,
            debug:true 
        });

        $("crop-button").addEventListener("click", function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                Crop.crop();
                //console.log(Crop.getImage());
        }, false);

        $("crop-button").addEventListener("selectstart", function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
        }, false);
    }
    else {
        alert("No Crop!!!");
    }
}

document.addEventListener("DOMContentLoaded", onReady, false);
