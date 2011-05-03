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
        }, false);

        $("crop-button").addEventListener("selectstart", function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
        }, false);

        $("classic-file-input").addEventListener("change", function (evt) {
            var newfile = evt.target.files[0];
            Crop.addImage(newfile);
        }, false);
        
        var selections = $('selections').childNodes
        for(var s=0; s<selections.length; ++s) {
          var selection = selections[s];
          if(selection.className==='selection') {
            (function(selection){
              selection.addEventListener('click', function(e){
                e.preventDefault();
                Crop.select(parseInt(selection.attributes['data-sx'].value), 
                            parseInt(selection.attributes['data-sy'].value),
                            selection.attributes['data-keepRatio'] && selection.attributes['data-keepRatio'].value=='true');
              }, false);
            })(selection);
          }
        }
    }
    else {
        alert("No Crop!!!");
    }
}

document.addEventListener("DOMContentLoaded", onReady, false);
