/*
 * crop.js
 *
 */

(function (crop, doc) {

    /**
     * The Image Canva Element
     * @private 
     */
    var canvaimage,
    /**
     * The Selection Canva Element
     * @private 
     */
        canvaselection,
    /**
     * The Image Canva Context
     * @private 
     */
        contextimage,
    /**
     * The Selection Canva Context
     * @private 
     */
        contextselection,
    /**
     * The current Image Element
     * @private 
     */
        image,
    /**
     * The current FileReader
     * @private 
     */
        filereader,
    /**
     * Debug flag
     * @private 
     */
        debug,
    /**
     * The current file
     * @private 
     */
        file,
    /**
     * The dom container of the Crop
     * @private 
     */
        container,
    /**
     * The css Class of the Image canva
     * @private 
     */
        cls = "image-cropper",
    /**
     * Crop image loaded state
     * @private 
     */
        imageloaded = false,
    /**
     * Crop ui loaded state
     * @private 
     */
        uiloaded = false,
    /**
     * Selection object
     * @private 
     */
        selection = {
            x:0,
            y:0, 
            l:0, 
            h:0, 
            move:false, 
            moveCenter: {
                x:0, 
                y:0
            }
        },
    /**
     * Width of the Crop
     * @private 
     */
        width = 200,
    /**
     * Height of the Crop
     * @private 
     */
        height = 200;

    /**
     * initial Crop events bindings
     * @private
     */
    function bind() {
        doc.addEventListener("dragenter", prevent, false);
        doc.addEventListener("dragover", onDocDragOver, false);
        doc.addEventListener("drop", prevent, false);

        canvaselection.addEventListener("dragenter", prevent, false);
        canvaselection.addEventListener("dragover", onCanvaSelectionDragOver, false);
        canvaselection.addEventListener("drop", onCanvaImageDrop, false);
    }

    /**
     * Log in debug mode
     * @private
     */
    function log(s) {
        if (debug) { console.log(s); }
    }

    /**
     * Shortcut for preventing default event actions
     * @private
     */
    function prevent(evt) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    /**
     * Handling the canva selection drag over
     * @private
     */
    function onCanvaSelectionDragOver(evt) {
        prevent(evt);
    }

    /**
     * Handling the File Drop user Action
     * @private
     */
    function onCanvaImageDrop(evt) {
        log("onCanvaDrop");
        prevent(evt);
        file = evt.dataTransfer.files[0];
        filereader = new FileReader();
        filereader.onload = onFileReaderLoad;
        filereader.onerror = onFileReaderError;
        filereader.readAsDataURL(file);
    }

    /**
     * File Drag Over Handler
     * @private
     */
    function onDocDragOver(evt) {
        prevent(evt);
    }

    /**
     * Called when the Image is loaded
     * @private
     */
    function onImageLoad(evt) {
        log("onImageLoad");
        canvaimage.setAttribute("width", image.naturalWidth + "px");
        canvaimage.setAttribute("height", image.naturalHeight + "px");
        canvaselection.setAttribute("width", image.naturalWidth + "px");
        canvaselection.setAttribute("height", image.naturalHeight + "px");
        imageloaded = true;
        showUI();
        contextimage.drawImage(image, 0, 0);
    }

    /**
     * Is the file an image ?
     * @private
     */
    function isImage() {
        if (file.type && file.type.match(/^image\/.*/g)) {
            return true;
        }
        return false;
    }

    /**
     * Draw error message in the image canva
     * @private
     */
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

    /**
     * Callback on the Load FileReader
     * @private
     */
    function onFileReaderLoad(evt) {
        log("onFileReaderLoad");
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

    /**
     * Display an Error when the FileReader fails
     * @private
     */
    function onFileReaderError() {
        imageloaded = false;
        if (uiloaded) { hideUI(); }
        displayError("Error while reading file");
    }

    /**
     * Handing the Mouse Down Event
     * in the scale selection mode and the move selection mode.
     *
     * @private
     */    
    function onMouseDown(evt) {
        prevent(evt);
        // if a selection allready exists
        if (selection.move) {
            // if the mouse clicks the selection
            if(cursorInsideSelection(evt.layerX, evt.layerY)) {
                canvaselection.style.cssText += "cursor: hand;";
                selection.moveCenter.x = evt.layerX;
                selection.moveCenter.y = evt.layerY;
            }
            // else not in the selection
            else {
                // selection is no more in move mode
                selection.move = false;
                canvaselection.style.cssText += "cursor: crosshair;";
                selection.moveCenter.x = selection.moveCenter.y = 0;
                selection.x = evt.layerX;
                selection.y = evt.layerY;
                selection.h = selection.l = 0;
                drawRectangle();
            }
        }
        // selection does not exists
        else {
            canvaselection.style.cssText += "cursor: crosshair;";
            selection.x = evt.layerX;
            selection.y = evt.layerY;
            selection.h = selection.l = 0;
        }
        canvaselection.addEventListener("mouseup", onMouseUp, false);
        canvaselection.addEventListener("mousemove", onMouseMove, false);
    }

    function cursorInsideSelection(x,y) {
        var insidex_pos = selection.l >= 0.0 && x >= selection.x && x <= (selection.x + selection.l);
        var insidex_neg = selection.l <= 0.0 && x <= selection.x && x >= (selection.x + selection.l);
        var insidey_pos = selection.h >= 0.0 && y >= selection.y && y <= (selection.y + selection.h);
        var insidey_neg = selection.h <= 0.0 && y <= selection.y && y >= (selection.y + selection.h);
        log(" insidex_pos : " + insidex_pos );
        log(" insidey_pos : " + insidey_pos );
        log(" insidex_neg : " + insidex_neg );
        log(" insidey_neg : " + insidey_neg );

        if (insidex_pos || insidex_neg) {
            if (insidey_pos || insidey_neg) {
                log("True");
                return true;
            }
        }
        log("False");
        return false;
    }

    /**
     * Handing the Mouse move Event
     * in the scale selection mode and the move selection mode.
     *
     * @private
     */
    function onMouseMove(evt) {
        prevent(evt);
        if (selection.move) {
            selection.x += evt.layerX - selection.moveCenter.x; 
            selection.y += evt.layerY - selection.moveCenter.y;
            selection.moveCenter.x = evt.layerX;
            selection.moveCenter.y = evt.layerY;
        }
        else {
            selection.l = evt.layerX - selection.x;
            selection.h = evt.layerY - selection.y;
        }
        drawRectangle();
    }

    /**
     * Handing the Mouse Up Event
     * in the scale selection mode and the move selection mode.
     *
     * @private
     */
    function onMouseUp(evt) {
        prevent(evt);
        canvaselection.removeEventListener("mouseup", onMouseUp, false);
        canvaselection.removeEventListener("mousemove", onMouseMove, false);

        selection.move = (selection.l !== 0 && selection.h !== 0) ? true : false;
    }

    /**
     * Draw the selection rectangle
     * @private
     */
    function drawRectangle(sx, sy, ex, ey) {
        var cs = contextselection,
            s = selection;
        cs.fillRect(0, 0, cs.canvas.width, cs.canvas.height);
        cs.clearRect(s.x, s.y, s.l, s.h);
    }

    function internalCrop() {
        var imageData,
            s = selection,
            l = Math.abs(selection.l),
            h = Math.abs(selection.h);

        var x = s.l < 0 ? s.x + s.l : s.x,
            y = s.h < 0 ? s.y + s.h : s.y;

        imageData = contextimage.getImageData(x, y, l, h);

        canvaimage.setAttribute("width", l + "px");
        canvaimage.setAttribute("height", h + "px");
        canvaselection.setAttribute("width", l + "px");
        canvaselection.setAttribute("height", h + "px");

        contextimage.fillRect(0, 0, l, h);
        contextselection.fillRect(0, 0, l, h);
        
        contextimage.putImageData(imageData, 0, 0);

        selection = {
            x:0,
            y:0, 
            l:0, 
            h:0, 
            move:false, 
            moveCenter: {
                x:0, 
                y:0
            }
        };
    }

    /**
     * Show user input
     * @private
     */
    function showUI() {
        var cs = contextselection;
        uiloaded = true;
        canvaselection.addEventListener("mousedown", onMouseDown, false);
        cs.fillRect(0, 0, cs.canvas.width, cs.canvas.height);
    }

    /**
     * Hide the user input
     * @private
     */
    function hideUI() {
        uiloaded = false;
        canvaselection.removeEventListener("mousedown", onMouseDown, false);
    }

    /**
     * Init Crop
     * @public
     */
    crop.init = function (config) {

        cls = config.cls || cls;
        debug = config.debug || false;
        height = config.height || height;
        width = config.width || width;
        
        canvaimage =  doc.createElement("canvas");
        canvaimage.className = "image";
        canvaimage.setAttribute("width", width + "px");
        canvaimage.setAttribute("height", height + "px");

        canvaselection =  doc.createElement("canvas");
        canvaselection.className = "selection";
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
        container.appendChild(canvaimage);
        container.appendChild(canvaselection);
    };

    /**
     * Destroy Crop
     * @public
     */    
    crop.destroy = function () {
        doc.removeEventListener("dragenter", prevent, false);
        doc.removeEventListener("dragover", onDocDragOver, false);
        doc.removeEventListener("drop", prevent, false);

        canvaselection.removeEventListener("dragenter", prevent, false);
        canvaselection.removeEventListener("dragover", onDragOver, false);
        canvaselection.removeEventListener("drop", onDrop, false);
    };

    /**
     * Crop the image if it's possible
     * @public
     */    
    crop.crop = function () {
        if (imageloaded && uiloaded && selection.l && selection.h) {
            internalCrop();
        }
    };

    /**
     * Return the cropped Image
     * @public
     */
    crop.getImage = function() {
        if (imageloaded && uiloaded) {
            if (selection.l === 0 && selection.h === 0) {
                return {
                        data:canvaimage.toDataURL("image/png"),
                        mimeType:"image/png"
                    };
            }
        }
    }

    /** TODO
     * Enforce a new Image input
     * @public
     */
    crop.addImage = function (i) {
    
    };

    /**
     * Check the browser capability
     * @public
     */
    crop.isPossible = function () {
        try {
            new FileReader();
            return true;
        }
        catch(err) {
            return false;
        }
    };

}(window.Crop = window.Crop || {}, window.document));
