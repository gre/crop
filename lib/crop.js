/*
 * Crop client side
 *
 */

(function (crop, doc) {

    var version="0.0.1",
        canvaimage,
        canvaselection,
        contextimage,
        contextselection,
        image,
        filereader,
        file,
        container,
        element,
        cls = "image-cropper",
        imageloaded = false,
        uiloaded = false,
        selection = false,
        width = 200,
        height = 200,
        onImageLoaded = null;

    function bind() {
        doc.addEventListener("dragenter", prevent, false);
        doc.addEventListener("dragover", onDocDragOver, false);
        doc.addEventListener("drop", prevent, false);

        element.addEventListener("dragenter", prevent, false);
        element.addEventListener("dragover", onElementDragOver, false);
        element.addEventListener("drop", onElementImageDrop, false);
    }

    function prevent(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    function onElementDragOver(evt) { prevent(evt); }

    function onElementImageDrop(evt) {
        prevent(evt);
        start(evt.dataTransfer.files[0]);
    }

    function start(f) {
        file = f;
        filereader = new FileReader();
        filereader.onload = onFileReaderLoad;
        filereader.onerror = onFileReaderError;
        filereader.readAsDataURL(file);
    }

    function onDocDragOver(evt) { prevent(evt); }

    function onImageLoad(evt) {
        canvaimage.setAttribute("width", image.naturalWidth + "px");
        canvaimage.setAttribute("height", image.naturalHeight + "px");
        canvaselection.setAttribute("width", image.naturalWidth + "px");
        canvaselection.setAttribute("height", image.naturalHeight + "px");
        imageloaded = true;
        showUI();
        contextimage.drawImage(image, 0, 0);
        onImageLoaded.call(this);
    }

    function isImage() {
        if (file.type && file.type.match(/^image\/.*/g)) {
            return true;
        }
        return false;
    }

    function displayError(msg) {
        canvaimage.setAttribute("width", width + "px");
        canvaimage.setAttribute("height", height + "px");
        canvaselection.setAttribute("width", width + "px");
        canvaselection.setAttribute("height", height + "px");

        contextimage.textAlign = "center";
        contextimage.textBaseline = "top";
        contextimage.font = "32pt Arial";
        contextimage.strokeStyle = "black";
        contextimage.strokeText(msg, width/2, height/2);
    }

    function onFileReaderLoad(evt) {
        if (isImage()) {
            image = new Image();
            image.onload = onImageLoad;
            image.src = evt.target.result;
        }
        else {
            imageloaded = false;
            if (uiloaded) { hideUI(); }
            displayError("File is not an image");
        }
    }

    function onFileReaderError() {
        imageloaded = false;
        if (uiloaded) { hideUI(); }
        displayError("Error while reading file");
    }

    function initNewSelection(x, y) {
        selection = {
            x:x,
            y:y, 
            l:0, 
            h:0, 
            create:true,
            move:false,
            resize:false,
            resizeX:false,
            resizeY:false,
            moveCenter: {
                x:0, 
                y:0
            },
            resizeStart : {
                x:0,
                y:0
            }
        };
    }

    function selectionExists() { return !!selection; }

    function insideSquare(x, y, i, j, d) {
        return x >= i-d/2 && x <= i+d/2 && y >= j-d/2 && y <= j+d/2;
    }

    function insideSelectionEdge(x,y) {
        var s = selection;

        if (insideSquare(x, y, s.x    , s.y    , 10)) { return {x:s.x, y:s.y}; }
        if (insideSquare(x, y, s.x+s.l, s.y    , 10)) { return {x:s.x+s.l, y:s.y}; }
        if (insideSquare(x, y, s.x+s.l, s.y+s.h, 10)) { return {x:s.x+s.l, y:s.y+s.h}; }
        if (insideSquare(x, y, s.x    , s.y+s.h, 10)) { return {x:s.x, y:s.y+s.h}; }

        return false;
    }

    function insideSelectionBorderX(x,y) {
        var s = selection;
        if (insideSquare(x, y, s.x+s.l/2, s.y    , 10)) { return {x:s.x, y:s.y}; }
        if (insideSquare(x, y, s.x+s.l/2, s.y+s.h, 10)) { return {x:s.x, y:s.y+s.h}; }
        return false;
    }

    function insideSelectionBorderY(x,y) {
        var s = selection;
        if (insideSquare(x, y, s.x    , s.y+s.h/2, 10)) { return {x:s.x, y:s.y}; }
        if (insideSquare(x, y, s.x+s.l, s.y+s.h/2, 10)) { return {x:s.x+s.l, y:s.y}; }
        return false;
    }

    function insideSelection(x,y) {
        var s = selection;
        return (x >= s.x && x <= (s.x + s.l)) && (y >= s.y && y <= (s.y + s.h));
    }

    function initResize(x, y) {
        var s = selection;
        s.create = s.move = s.resizeX = s.resizeY = false;
        s.resize = true;
        s.resizeStart.x = x;
        s.resizeStart.y = y;
        if (x == s.x) {s.x = x+s.l; s.l = -s.l;}
        if (y == s.y) {s.y = y+s.h; s.h = -s.h;} 
    }

    function initResizeX(x, y) {
        var s = selection;
        s.create = s.move = s.resize = s.resizeY = false;
        s.resizeX = true;
        s.resizeStart.x = x;
        s.resizeStart.y = y;
    }

    function initResizeY(x, y) {
        var s = selection;
        s.create = s.move = s.resize = s.resizeX = false;
        s.resizeY = true;
        s.resizeStart.x = x;
        s.resizeStart.y = y;
    }

    function initMove(x, y) {
        var s = selection;
        s.create = s.resize = s.resizeX = s.resizeY = false;
        s.move = true;
        s.moveCenter.x = x;
        s.moveCenter.y = y;
    }

    function onMouseDown(evt) {
        var x = evt.layerX,
            y = evt.layerY;
        prevent(evt);
        if(selectionExists()) {
            if(insideSelectionEdge(x, y)) {
                var c = insideSelectionEdge(x, y);
                initResize(c.x, c.y);
            }
            else if (insideSelectionBorderX(x, y)) {
                var d = insideSelectionBorderX(x, y);
                initResizeX(d.x, d.y);
            }
            else if (insideSelectionBorderY(x, y)) {
                var e = insideSelectionBorderY(x, y);
                initResizeY(e.x, e.y);
            }
            else if (insideSelection(x, y)) {
                initMove(x, y);
            }
            else {
                resetSelection();
                initNewSelection(x, y);
            }
        }
        else {
            initNewSelection(x, y);
        }
        canvaselection.addEventListener("mouseup", onMouseUp, false);
        canvaselection.addEventListener("mousemove", onMouseMove, false);
    }

    function getSelectionMode() {
        var s = selection;
        if (s) {
            if (s.create) { return "create"; }
            if (s.move) { return "move"; }
            if (s.resize) { return "resize"; }
            if (s.resizeX) { return "resizeX"; }
            if (s.resizeY) { return "resizeY"; }
            return false;
        }
        return false;
    }

    function updateCreateSelection(x,y) {
        var s = selection;
        s.l = x - s.x;
        s.h = y - s.y;
    }

    function updateMoveSelection(x,y) {
        var s = selection;
        s.x += x - s.moveCenter.x;
        s.y += y - s.moveCenter.y;
        s.moveCenter.x = x;
        s.moveCenter.y = y;
    }

    function updateResizeSelection(x, y) {
        var s = selection;
        s.l += x-s.resizeStart.x;
        s.h += y-s.resizeStart.y;
        s.resizeStart.x = x;
        s.resizeStart.y = y;
    }

    function updateResizeXSelection(x, y) {
        var s = selection;
        if(s.resizeStart.y == s.y+s.h) {
            s.h += y - s.resizeStart.y;
        }
        else {
            s.y += y - s.resizeStart.y;
            s.h -=  y - s.resizeStart.y;
        }
        s.resizeStart.y = y;
    }

    function updateResizeYSelection(x, y) {
        var s = selection;
        if(s.resizeStart.x == s.x+s.l) {
            s.l += x - s.resizeStart.x;
        }
        else {
            s.x += x - s.resizeStart.x;
            s.l -=  x - s.resizeStart.x;
        }    
        s.resizeStart.x = x;
    }

    function onMouseMove(evt) {
        var mode = getSelectionMode(),
            x = evt.layerX,
            y = evt.layerY;

        if (mode) {
            switch (mode) {
                case "create":
                    updateCreateSelection(x, y);
                    break;
                case "move":
                    updateMoveSelection(x, y);
                    break;
                case "resize":
                    updateResizeSelection(x, y);
                    break;
                case "resizeX":
                    updateResizeXSelection(x, y);
                    break;
                case "resizeY":
                    updateResizeYSelection(x, y);
                    break;
            }
            drawSelection(x,y);
        }
    }

    function cleanSelection() {
        var s = selection;
        s.move = s.resize = s.resizeX = s.resizeY = false;
        s.moveCenter.x = s.moveCenter.y = s.resizeStart.x = s.resizeStart.y = 0;
    }

    function onMouseUp(evt) {
        prevent(evt);
        canvaselection.removeEventListener("mouseup", onMouseUp, false);
        canvaselection.removeEventListener("mousemove", onMouseMove, false);
        drawSelection(0,0);
        if (selection) { cleanSelection(); }
        normalizeSelection();
    }

    function drawSize(x, y, w, h) {
        if (x !== 0 && y !== 0 && !selection.move) {
            contextselection.textAlign = "left";
            contextselection.textBaseline = "top";
            contextselection.font = "bold 8pt";
            contextselection.strokeStyle = "rgba(255,255,255,1)";
            contextselection.strokeText(Math.abs(w) + "x" + Math.abs(h), x+7, y+7);
        }
    }

    function normalizeSelection() {
        var s = selection;
        if(s.l < 0) { 
            s.x += s.l;
            s.l = Math.abs(s.l);
        }
        if(s.h < 0) { 
            s.y += s.h;
            s.h = Math.abs(s.h);
        }
    }

    function drawSelection(curX, curY) {
        var cs = contextselection,
            w = cs.canvas.width,
            h = cs.canvas.height,
            s = selection;

        cs.clearRect(0, 0, w, h);
        cs.fillStyle = "rgba(0,0,0, 0.4)";
        cs.fillRect(0, 0, w, h);
        cs.fillStyle = "rgba(0,0,0, 0.4)";
        cs.clearRect(s.x, s.y, s.l, s.h);
        cs.fillStyle = "rgba(247,176,12, 0.9)";
        cs.fillRect(s.x - 5, s.y - 5, 10, 10);
        cs.fillRect(s.x - 5 + s.l, s.y - 5 + s.h, 10, 10);
        cs.fillRect(s.x - 5, s.y - 5 + s.h, 10, 10);
        cs.fillRect(s.x - 5 + s.l, s.y - 5, 10, 10);
        cs.fillRect(s.x - 5 + s.l/2, s.y - 5, 10, 10);
        cs.fillRect(s.x - 5 , s.y - 5 + s.h/2, 10, 10);
        cs.fillRect(s.x - 5 + s.l, s.y - 5 + s.h/2, 10, 10);
        cs.fillRect(s.x - 5 + s.l/2, s.y - 5 + s.h, 10, 10);
        drawSize(curX, curY, s.l, s.h);
    }

    function resetSelection() {
        var cs = contextselection;
        cleanSelection();
        cs.clearRect(0, 0, cs.canvas.width, cs.canvas.height);
    }

    function internalCrop() {
        var imageData,
            s = selection;

        imageData = contextimage.getImageData(s.x, s.y, s.l, s.h);

        canvaimage.setAttribute("width", s.l + "px");
        canvaimage.setAttribute("height", s.h + "px");
        canvaselection.setAttribute("width", s.l + "px");
        canvaselection.setAttribute("height", s.h + "px");

        contextimage.putImageData(imageData, 0, 0);
    }

    function showUI() {
        uiloaded = true;
        canvaselection.addEventListener("mousedown", onMouseDown, false);
    }

    function hideUI() {
        uiloaded = false;
        canvaselection.removeEventListener("mousedown", onMouseDown, false);
    }

    /*\
     * Crop.init
     [ method ]
     **
     * Init the cropper.
     **
     # <strong>Arguments</strong>
     **
     - config (object) like:
     **
     | { 
     |     cls:"a-css-class",
     |     height:300,
     |     width:300,
     |     load: function () { alert("Image Loaded!");}
     | }
    \*/     
    crop.init = function (config) {

        cls = config.cls || cls;
        height = config.height || height;
        width = config.width || width;
        onImageLoaded = config.load || function () {};

        element = doc.createElement('div');
        element.style.cssText += "overflow: auto;";
        element.style.cssText += "position:relative;";
        element.style.cssText += "width:" + width + "px;";
        element.style.cssText += "height:" + height + "px;";
        element.style.cssText += "border: 1px solid rgba(0,0,0,0.4);";
        element.style.cssText += "text-align:center;";
        element.style.cssText += "vertical-align:sub;";

        canvaimage =  doc.createElement("canvas");
        canvaimage.style.cssText += "position:absolute;";
        canvaimage.style.cssText += "left: 0;";
        canvaimage.style.cssText += "z-index: 2;";
        canvaimage.setAttribute("width", width + "px");
        canvaimage.setAttribute("height", height + "px");

        canvaselection =  doc.createElement("canvas");
        canvaselection.style.cssText += "position:absolute;";
        canvaselection.style.cssText += "left: 0;";
        canvaselection.style.cssText += "z-index: 3;";
        canvaselection.setAttribute("width", width + "px");
        canvaselection.setAttribute("height", height + "px");

        contextimage = canvaimage.getContext("2d");
        contextselection = canvaselection.getContext("2d");
        
        try {
            container = doc.getElementsByClassName(cls)[0];
        }
        catch(err) {
            throw "CropInitError";
        }

        bind();
        element.appendChild(canvaimage);
        element.appendChild(canvaselection);
        container.appendChild(element);
    };

    /*\
     * Crop.destroy
     [ method ]
     **
     * Remove drag/drop event listeners.
     **
    \*/    
    crop.destroy = function () {
        doc.removeEventListener("dragenter", prevent, false);
        doc.removeEventListener("dragover", onDocDragOver, false);
        doc.removeEventListener("drop", prevent, false);

        element.removeEventListener("dragenter", prevent, false);
        element.removeEventListener("dragover", onDragOver, false);
        element.removeEventListener("drop", onDrop, false);
    };

    /*\
     * Crop.crop
     [ method ]
     **
     * Crop the image according to the current selection.
     **
    \*/   
    crop.crop = function () {
        if (imageloaded && uiloaded && selection.l && selection.h) {
            internalCrop();
        }
    };

    /*\
     * Crop.getImage
     [ method ]
     **
     * Return the cropped image.
     **
     = image (object) like:
     |   {
     |       data:"imagedata...",
     |       mimeType:"image/png"
     |   }
    \*/
    crop.getImage = function() {
        if (imageloaded && uiloaded) {
            if (selection.l === 0 && selection.h === 0) {
                return {
                        data:canvaimage.toDataURL("image/png"),
                        mimeType:"image/png"
                    };
            }
        }
    };

    /*\
     * Crop.addImage
     [ method ]
     **
     * Enforce a new Image input.
     **
     # <strong>Arguments</strong>
     **
     - File or Image (object)
     **
    \*/
    crop.addImage = function (f) {
        if (f instanceof File) {
            start(f);
        }
        if (f instanceof Image) {
            image = f;
            onImageLoad();
        }
    };

    /*\
     * Crop.isPossible
     [ method ]
     **
     * Check if the FileReader object is available
     **
     = (boolean)
    \*/
    crop.isPossible = function () {
        return !!window.FileReader;
    };

    /*\
     * Crop.version
     [ property (string) ]
     **
     * The current crop version.
     **
    \*/
    crop.version = version;

}(window.Crop = window.Crop || {}, window.document));
