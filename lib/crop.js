/*
 * Crop
 *
 */

(function (crop, doc) {

    var version="0.0.2",
        canvaimage,
        canvaselection,
        contextimage,
        contextselection,
        canvaexport,
        contextexport,
        ratio,
        image,
        imageWidth,
        imageHeight,
        lastX = 0,
        lastY = 0,
        filereader,
        file,
        container,
        element,
        cls = "image-cropper",
        imageloaded = false,
        selecting = false,
        selection = false,
        width = 200,
        height = 200,
        cWidth,
        cHeight,
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

    function imageFitInContainer () {
        return imageWidth <= width && imageHeight <= height;
    }

    function onImageLoad(evt) {

        imageWidth = image.naturalWidth;
        imageHeight = image.naturalHeight;
        lastX = 0;
        lastY = 0;
        resetSelection();
        ratio = imageWidth/imageHeight;

        if (imageFitInContainer()) {
            cWidth = imageWidth;
            cHeight = imageHeight;
        } 
        else {
            if (imageWidth >= imageHeight) {
                    cWidth = width;
                    cHeight = width / ratio;
            }
            else {
                cHeight = height;
                cWidth = ratio * height;
            }
        }

        canvaimage.setAttribute("width", cWidth + "px");
        canvaimage.setAttribute("height", cHeight + "px");
        canvaselection.setAttribute("width", cWidth + "px");
        canvaselection.setAttribute("height", cHeight + "px");

        imageloaded = true;
        startSelect();

        contextimage.drawImage(image, 0, 0, cWidth, cHeight);
        onImageLoaded.call(this);
    }

    function isImage() {
        return file.type && file.type.match(/^image\/.*/g);
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
            if (selecting) { stopSelect(); }
            displayError("File is not an image");
        }
    }

    function onFileReaderError() {
        imageloaded = false;
        if (selecting) { stopSelect(); }
        displayError("Error while reading file");
    }

    function initNewSelection(x, y) {
        selection = {
            x:x,
            y:y, 
            l:0, 
            h:0,
            mode:"create",
            startPos: {
                x:0, 
                y:0
            }
        };
    }

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

    function changeModeAndStorePos(mode, x, y) {
        selection.mode = mode;
        selection.startPos.x = x;
        selection.startPos.y = y;
    }

    function initResize(x, y) {
        var s = selection;
        changeModeAndStorePos("resize", x, y);
        if (x == s.x) {s.x = x+s.l; s.l = -s.l;}
        if (y == s.y) {s.y = y+s.h; s.h = -s.h;} 
    }

    function onMouseDown(evt) {
        var x = evt.layerX,
            y = evt.layerY;
        prevent(evt);
        if(!!selection) {
            if(insideSelectionEdge(x, y)) {
                var c = insideSelectionEdge(x, y);
                initResize(c.x, c.y);
            }
            else if (insideSelectionBorderX(x, y)) {
                var d = insideSelectionBorderX(x, y);
                changeModeAndStorePos("resizeX", d.x, d.y);
            }
            else if (insideSelectionBorderY(x, y)) {
                var e = insideSelectionBorderY(x, y);
                changeModeAndStorePos("resizeY", e.x, e.y);
            }
            else if (insideSelection(x, y)) {
                changeModeAndStorePos("move", x, y);
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

    function updateCreateSelection(x,y) {
        var s = selection;
        s.l = x - s.x;
        s.h = y - s.y;
    }

    function updateMoveSelection(x,y) {
        var s = selection,
            c = contextimage.canvas,
            tmpx, tmpy;

        tmpx = s.x + x - s.startPos.x;
        tmpy = s.y + y - s.startPos.y;

        if (tmpx <= 0) { tmpx=0; }
        if (tmpy <= 0) { tmpy=0; }

        if (tmpx+s.l >= c.width)  { tmpx= s.x; }
        if (tmpy+s.h >= c.height) { tmpy= s.y; }

        s.startPos.x = x;
        s.startPos.y = y;
        s.x = tmpx;
        s.y = tmpy;
    }

    function updateResizeSelection(x, y) {
        var s = selection;
        s.l += x-s.startPos.x;
        s.h += y-s.startPos.y;
        s.startPos.x = x;
        s.startPos.y = y;
    }

    function updateResizeXSelection(x, y) {
        var s = selection;
        if(s.startPos.y == s.y+s.h) {
            s.h += y - s.startPos.y;
        }
        else {
            s.y += y - s.startPos.y;
            s.h -=  y - s.startPos.y;
        }
        s.startPos.y = y;
    }

    function updateResizeYSelection(x, y) {
        var s = selection;
        if(s.startPos.x == s.x+s.l) {
            s.l += x - s.startPos.x;
        }
        else {
            s.x += x - s.startPos.x;
            s.l -=  x - s.startPos.x;
        }    
        s.startPos.x = x;
    }

    function onMouseMove(evt) {
        var x = evt.layerX,
            y = evt.layerY;

        switch (selection.mode) {
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

    function onMouseUp(evt) {
        prevent(evt);
        canvaselection.removeEventListener("mouseup", onMouseUp, false);
        canvaselection.removeEventListener("mousemove", onMouseMove, false);
        drawSelection();
        if(selection.h === 0 && selection.l === 0) {
            resetSelection();
        }
        normalizeSelection();
    }

    function drawSize(x, y, w, h) {
        if (selection.mode != "move") {
            var cs = contextselection;
            cs.textAlign = "left";
            cs.textBaseline = "top";
            cs.font = "bold 8pt";
            cs.strokeStyle = "rgba(255,255,255,1)";
            cs.strokeText(
                Math.floor(Math.abs(w)*100)/100 + " x " + Math.floor(Math.abs(h)*100)/100,
                x+10,
                y+10
            );
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
        if (s.mode != "move" && curX && curY) { 
            drawSize(
                curX, 
                curY, 
                s.l * imageWidth / cWidth, 
                s.h * imageHeight / cHeight
            ); 
        }
    }

    function resetSelection() {
        var cs = contextselection;
        cs.clearRect(0, 0, cs.canvas.width, cs.canvas.height);
        initNewSelection(0,0);
    }

    function internalCrop() {
        var s = selection,
            newW = s.l * imageWidth / cWidth,
            newH = s.h * imageHeight / cHeight;

        try {
            ratio = newW/newH;
            lastX += s.x * imageWidth / cWidth;
            lastY += s.y * imageHeight / cHeight;

            if ( newW <= width &&  newH <= height) {
                cWidth = newW;
                cHeight = newH;
            }
            else {
                if (newW >= newH) {
                    cWidth = width;
                    cHeight = width / ratio;
                }
                else {
                    cHeight = height;
                    cWidth = ratio * height;
                }
            }

            canvaimage.setAttribute("width", cWidth + "px");
            canvaimage.setAttribute("height", cHeight + "px");
            canvaselection.setAttribute("width", cWidth + "px");
            canvaselection.setAttribute("height", cHeight + "px");

            contextimage.drawImage(
                    image, 
                    lastX, 
                    lastY, 
                    newW, 
                    newH, 
                    0, 
                    0, 
                    cWidth, 
                    cHeight
            );

            imageWidth = newW;
            imageHeight = newH;
        }
        catch(err) {
            resetSelection();
            if (console) { console.log(err); }
        }
        initNewSelection(0,0);
    }

    function startSelect() {
        selecting = true;
        canvaselection.addEventListener("mousedown", onMouseDown, false);
    }

    function stopSelect() {
        selecting = false;
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

        canvaexport =  doc.createElement("canvas");
        contextexport = canvaexport.getContext("2d");

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
        if (imageloaded && selecting && selection.l && selection.h) {
            internalCrop();
        }
    };

    /*\
     * Crop.getImage
     [ method ]
     **
     * Return the cropped image.
     **
     = false (boolean).
     = image (object) if success like:
     |   {
     |       data:"imagedata...",
     |       mimeType:"image/png"
     |   }
    \*/
    crop.getImage = function() {
        if (imageloaded && selecting) {
            if(selection.h !== 0 && selection.l !==0) {
                return false;
            }

            canvaexport.setAttribute("width", imageWidth + "px");
            canvaexport.setAttribute("height", imageHeight + "px");

            contextexport.drawImage(
                image,
                lastX,
                lastY,
                imageWidth,
                imageHeight,
                0,
                0,
                imageWidth,
                imageHeight
            );
            
            return {
                data:canvaexport.toDataURL("image/png"),
                mimeType:"image/png"
            };
        }
        return false;
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
     * Crop.select
     [ method ]
     **
     * Select a selection according to the given width and height
     **
      # <strong>Arguments</strong>
     **
     - w (integer)
     - h (integer)
     **
    \*/
    crop.select = function (w, h) {
        var delta = 10;

        if(imageloaded && selecting) {
            if (delta+w > imageWidth || delta+h > imageHeight) {
                resetSelection();
                throw {name:"SelectError", message:"La selection est trop grande!"};
            }
            else {
                resetSelection();
                initNewSelection(10,10);
                selection.l = w * cWidth/imageWidth;
                selection.h = h * cHeight/imageHeight;
                drawSelection(0,0);
            }
        }
        else {
            throw {name:"SelectError", message:"Il n'existe pas d'image!"};
        }
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
