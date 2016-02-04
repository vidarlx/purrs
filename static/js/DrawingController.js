/* global fabric */

var DrawingController = function () {
    var canvas = null;
    var drawingMode = false;

    var initDrawingContext = function () {      
        var $ = function (id) {
            return document.getElementById(id);
        };

        if (!canvas) {
            console.log('Creating drawing context');
            canvas = new fabric.Canvas('c', {});
        }
         
        canvas.isDrawingMode = DrawingController.drawingModeEnabled();

        fabric.Object.prototype.transparentCorners = false;

        var drawingColorEl = $('drawing-color'),
            drawingShadowColorEl = $('drawing-shadow-color'),
            drawingLineWidthEl = 10,
            drawingShadowWidth = 0,
            drawingShadowOffset = 0,
            clearEl = $('clear-canvas');

        clearEl.onclick = function () {
            canvas.clear();
        };

        canvas.freeDrawingBrush = new fabric['PencilBrush'](canvas);

        drawingColorEl.onchange = function () {
            canvas.freeDrawingBrush.color = this.value;
        };

        if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = drawingColorEl.value;
            canvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
            canvas.freeDrawingBrush.shadowBlur = 0;
        }
    };

    var getCurrentImage = function () {
        return canvas;
    };

    var drawingModeEnabled = function () {
        return drawingMode;
    };

    var enableDrawingMode = function () {
        drawingMode = true;
        // reload context with tools for drawing
        initDrawingContext();
    };

    var disableDrawingMode = function () {
        drawingMode = false;
    };

    return {
        initDrawingContext: initDrawingContext,
        getCurrentImage: getCurrentImage,
        drawingModeEnabled: drawingModeEnabled,
        enableDrawingMode: enableDrawingMode
    };

}();
