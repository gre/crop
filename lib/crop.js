/*
 * Crop client side
 *
 */

(function (crop, doc) {

    var canvaimage,
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
        selection = {
            x:0,
            y:0, 
            l:0, 
            h:0, 
            move:false,
            enlargeXY:false,
            enlargeX:false,
            enlargeY:false,
            moveCenter: {
                x:0, 
                y:0
            },
            x0 : {
                x:0,
                y:0
            }
        },
        width = 200,
        height = 200,
        onImageLoaded = null;

    /**
     * initial Crop events bindings
     * @private
     */
    function bind() {
        doc.addEventListener("dragenter", prevent, false);
        doc.addEventListener("dragover", onDocDragOver, false);
        doc.addEventListener("drop", prevent, false);

        element.addEventListener("dragenter", prevent, false);
        element.addEventListener("dragover", onElementDragOver, false);
        element.addEventListener("drop", onElementImageDrop, false);
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
    function onElementDragOver(evt) {
        prevent(evt);
    }

    /**
     * Handling the File Drop user Action
     * @private
     */
    function onElementImageDrop(evt) {
        prevent(evt);
        start(evt.dataTransfer.files[0]);
    }

    /**
     * Start with a new file
     * @private
     */
    function start(f) {
        file = f;
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
        canvaimage.setAttribute("width", image.naturalWidth + "px");
        canvaimage.setAttribute("height", image.naturalHeight + "px");
        canvaselection.setAttribute("width", image.naturalWidth + "px");
        canvaselection.setAttribute("height", image.naturalHeight + "px");
        imageloaded = true;
        showUI();
        contextimage.drawImage(image, 0, 0);
        onImageLoaded.call(this);
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
            // the mouse clicks a corner
            else if(cursorInsideEdge(evt.layerX, evt.layerY)) {
                selection.move = false;
                selection.enlargeXY = true;
                selection.x0.x = evt.layerX;
                selection.x0.y = evt.layerY;
            }
            // the mouse clicks a middle side square along X axis
            else if (cursorMiddleSideX(evt.layerX, evt.layerY)) {
                selection.move = false;
                selection.enlargeY = cursorMiddleSideX(evt.layerX, evt.layerY);
                selection.x0.x = evt.layerX;
                selection.x0.y = evt.layerY;
            } 
            // the mouse clicks a middle side square along Y axis
            else if (cursorMiddleSideY(evt.layerX, evt.layerY)) {
                selection.move = false;
                selection.enlargeX = cursorMiddleSideY(evt.layerX, evt.layerY);
                selection.x0.x = evt.layerX;
                selection.x0.y = evt.layerY;
            }
            // not in the selection
            else {
                // selection is no more in move mode
                selection.move = false;
                canvaselection.style.cssText += "cursor: crosshair;";
                selection.moveCenter.x = selection.moveCenter.y = 0;
                selection.x = evt.layerX;
                selection.y = evt.layerY;
                selection.h = selection.l = 0;
                resetSelection();
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
        var s = selection;
        var inside_x = x >= s.x && x <= (s.x + s.l),
            inside_y = y >= s.y && y <= (s.y + s.h);

        return inside_x && inside_y;
    }

    function cursorInsideEdge(x, y) {
        var s = selection;
        var inside11 = x >= s.x-5 && x <= s.x && y >= s.y-5 && y <= s.y+5;
        var inside12 = y >= s.y-5 && y <= s.y+5 && x >= s.x-5 && x <= s.x+5;
        var inside21 = x >= s.x+s.l && x <= s.x+5+s.l && y >= s.y-5+s.h && y <= s.y+5+s.h;
        var inside22 = y >= s.y+s.h && y <= s.y+s.h+5 && x >= s.x-5+s.l && x <= s.x+5+s.l;
        var inside31 = x >= s.x-5 && x <= s.x && y >= s.y-5+s.h && y <= s.y+5+s.h;
        var inside32 = y >= s.y+s.h && y <= s.y+5+s.h && x >= s.x-5 && x <= s.x+5;
        var inside41 = x >= s.x+s.l && x <= s.x+s.l+5 && y >= s.y-5 && y <= s.y+5;
        var inside42 = y >= s.y-5 && y <= s.y+5 && x >= s.x-5+s.l && x <= s.x+5+s.l;
        
        if (inside11 || inside12) { return true; }
        if (inside21 || inside22) { return true; }
        if (inside31 || inside32) { return true; }
        if (inside41 || inside42) { return true; }

        return false;
    }

    function cursorMiddleSideX(x, y) {
        var s = selection;
        var inside1 = x >= s.x-5+s.l/2 && x <= s.x+5+s.l/2 && y >= s.y-5 && y <= s.y,
            inside2 = x >= s.x-5+s.l/2 && x <= s.x+5+s.l/2 && y >= s.y+s.h && y <= s.y+5+s.h;

        if (inside1) {
            return -1;
        }
        else if (inside2) {
            return 1;
        }
        else {
            return 0;
        }
    }

    function cursorMiddleSideY(x, y) {
        var s = selection;
        var inside1 = y >= s.y-5+s.h/2 && y <= s.y+5+s.h/2 && x >= s.x-5 && x <= s.x,
            inside2 = y >= s.y-5+s.h/2 && y <= s.y+5+s.h/2 && x >= s.x+s.l && x <= s.x+5+s.l;
        if (inside1) {
            return -1;
        }
        else if (inside2) {
            return 1;
        }
        else {
            return 0;
        }
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
        else if(selection.enlargeXY) {
            var isSecondAnchor = (selection.x0.x >= selection.x - 5 && selection.x0.x <= selection.x);
            var isThirdAnchor = (selection.x0.y >= selection.y - 5 && selection.x0.y <= selection.y);
            var isFirstAnchor = isSecondAnchor && isThirdAnchor;

            if (isFirstAnchor) {
                selection.l -= evt.layerX - selection.x0.x;
                selection.h -= evt.layerY - selection.x0.y;
                selection.x = evt.layerX;
                selection.y = evt.layerY;
            }
            else if(isSecondAnchor) {
                selection.l += selection.x - evt.layerX;
                selection.h += evt.layerY - selection.x0.y;
                selection.x = evt.layerX;
            } 
            else if (isThirdAnchor) {
                selection.h += selection.y - evt.layerY;
                selection.l += evt.layerX - selection.x0.x;
                selection.y = evt.layerY;
            }
            else {
                selection.l += (evt.layerX - selection.x0.x);
                selection.h += (evt.layerY - selection.x0.y);
            }
            selection.x0.x = evt.layerX;
            selection.x0.y = evt.layerY;
        }
        else if (selection.enlargeX == -1) {
            selection.l -= evt.layerX - selection.x0.x;
            selection.x0.x = evt.layerX;
            selection.x0.y = evt.layerY;
            selection.x = evt.layerX;
        }
        else if (selection.enlargeX == 1) {
            selection.l += evt.layerX - selection.x0.x;
            selection.x0.x = evt.layerX;
            selection.x0.y = evt.layerY;
        }
        else if (selection.enlargeY == -1) {
            selection.h -= (evt.layerY - selection.x0.y);
            selection.x0.x = evt.layerX;
            selection.x0.y = evt.layerY;
            selection.y = evt.layerY;
        }
        else if (selection.enlargeY == 1) {
            selection.h += (evt.layerY - selection.x0.y);
            selection.x0.x = evt.layerX;
            selection.x0.y = evt.layerY;
        }
        else {
            selection.l = evt.layerX - selection.x;
            selection.h = evt.layerY - selection.y;
        }
        drawSelection(evt.layerX, evt.layerY);
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

        if (Math.abs(selection.l) < 2 || Math.abs(selection.h) < 2) {
            resetSelection();
        }
        else {
            drawSelection(0,0);
        }

        selection.move = (selection.l !== 0 && selection.h !== 0) ? true : false;
        selection.enlargeXY = selection.enlargeX = selection.enlargeY = false;
        if (selection.x0) {selection.x0.x = 0; selection.x0.y = 0;}

        if (selection.l < 0) { selection.x += selection.l; selection.l = Math.abs(selection.l);}
        if (selection.h < 0) { selection.y += selection.h; selection.h = Math.abs(selection.h);}

        normalizeSelection();
        logSelection();
    }

    function logSelection () {
        console.log("Current selection");
        console.log("x: ", selection.x);
        console.log("y: ", selection.y);
        console.log("l: ", selection.l);
        console.log("h: ", selection.h);
    }

    function normalizeSelection() {
        var s = selection;
        if(s.l < 0) { 
            s.x += s.l;
            s.l = Math.abs(s.l);
        } 
        if(s.l < 0) { 
            s.y += s.h;
            s.h = Math.abs(s.h);
        }
    }

    /**
     * Draw the selection
     * @private
     */
    function drawSelection(curX, curY) {
        var cs = contextselection,
            w = cs.canvas.width,
            h = cs.canvas.height,
            s = selection;

        cs.clearRect(0, 0, w, h);
        cs.fillStyle = "rgba(0,0,0, 0.4)";
        cs.fillRect(0, 0, w, h);

        // corners
        cs.fillStyle = "rgba(247,176,12, 0.9)";
        cs.fillRect(s.x - 5, s.y - 5, 10, 10); // 1
        cs.fillRect(s.x - 5 + s.l, s.y - 5 + s.h, 10, 10); // 2
        cs.fillRect(s.x - 5, s.y - 5 + s.h, 10, 10);  // 3
        cs.fillRect(s.x - 5 + s.l, s.y - 5, 10, 10);  // 4
        // middle side
        cs.fillRect(s.x - 5 + s.l/2, s.y - 5, 10, 10);
        cs.fillRect(s.x - 5 , s.y - 5 + s.h/2, 10, 10);
        cs.fillRect(s.x - 5 + s.l, s.y - 5 + s.h/2, 10, 10);
        cs.fillRect(s.x - 5 + s.l/2, s.y - 5 + s.h, 10, 10);

        // selection rectangle
        cs.fillStyle = "rgba(0,0,0, 0.4)";
        cs.clearRect(s.x, s.y, s.l, s.h);

        drawSize(curX, curY, s.l, s.h);
    }

    /**
     * Reset the selection
     * @private
     */
    function resetSelection() {
        var cs = contextselection;
        cs.clearRect(0, 0, cs.canvas.width, cs.canvas.height);
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

        contextimage.putImageData(imageData, 0, 0);

        selection = {
            x:0,
            y:0, 
            l:0, 
            h:0, 
            move:false,
            enlargeXY:false,
            enlargeX:false,
            enlargeY:false,
            moveCenter: {
                x:0, 
                y:0
            },
            x0 : {
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
        uiloaded = true;
        canvaselection.addEventListener("mousedown", onMouseDown, false);
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
        element.innerHTML = "Drop Files Here!";

        canvaimage =  doc.createElement("canvas");
        canvaimage.className = "cropcrop-image";
        canvaimage.setAttribute("width", width + "px");
        canvaimage.setAttribute("height", height + "px");

        canvaselection =  doc.createElement("canvas");
        canvaselection.className = "cropcrop-selection";
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

    /**
     * Destroy Crop
     * @public
     */    
    crop.destroy = function () {
        doc.removeEventListener("dragenter", prevent, false);
        doc.removeEventListener("dragover", onDocDragOver, false);
        doc.removeEventListener("drop", prevent, false);

        element.removeEventListener("dragenter", prevent, false);
        element.removeEventListener("dragover", onDragOver, false);
        element.removeEventListener("drop", onDrop, false);
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

}(window.Crop = window.Crop || {}, window.document));
