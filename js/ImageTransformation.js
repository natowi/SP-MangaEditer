
function flipHorizontally() {
	var activeObject = canvas.getActiveObject();
	if (activeObject && activeObject.type === 'image') {
		activeObject.set('flipX', !activeObject.flipX);
		canvas.renderAll();
	}
}

function flipVertically() {
	var activeObject = canvas.getActiveObject();
	if (activeObject && activeObject.type === 'image') {
		activeObject.set('flipY', !activeObject.flipY);
		canvas.renderAll();
	}
}

var cropFrame;
var cropActiveObject;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('crop').style.display = 'none';
});

document.getElementById('crop').addEventListener('click', function(event) {
    document.getElementById('crop').style.display = 'none';

    var left = cropFrame.left - cropActiveObject.left;
    var top = cropFrame.top - cropActiveObject.top;

    left *= 1;
    top *= 1;

    var width = cropFrame.width * 1;
    var height = cropFrame.height * 1;

    cropImage(cropActiveObject, cropFrame.left, cropFrame.top, parseInt(cropFrame.scaleY * height), parseInt(width * cropFrame.scaleX));
    if (cropFrame) {
			canvas.remove(cropFrame);
			cropFrame = null;
		}
});

document.getElementById('cropMode').addEventListener('click', function() {
    document.getElementById('crop').style.display = 'inline';
    if (canvas.getActiveObject()) {
			
        if (['sprite', 'rect', 'circle', 'triangle', 'polygon', 'group', 'textbox', 'text'].includes(canvas.getActiveObject().type)) {
            createToast("Select Image!", canvas.getActiveObject().type);
						document.getElementById('crop').style.display = 'none';
            return;
        }else{
					console.log( "canvas.getActiveObject().type", canvas.getActiveObject().type );
				}

        cropActiveObject = canvas.getActiveObject();

        cropFrame = new fabric.Rect({
            fill: 'rgba(0,0,0,0)',
            originX: 'left',
            originY: 'top',
            stroke: 'rgba(0,0,0,0)',
            strokeWidth: 0,
            width: 1,
            height: 1,
            borderColor: '#36fd00',
            cornerColor: 'green',
            hasRotatingPoint: false,
            selectable: true
        });

        cropFrame.left = canvas.getActiveObject().left;
        cropFrame.top = canvas.getActiveObject().top;
        cropFrame.width = canvas.getActiveObject().width * canvas.getActiveObject().scaleX;
        cropFrame.height = canvas.getActiveObject().height * canvas.getActiveObject().scaleY;

        canvas.add(cropFrame);
        canvas.setActiveObject(cropFrame);
        canvas.renderAll();
    } else {
        createToast("Select Image!", "");
				document.getElementById('crop').style.display = 'none';
    }
});

canvas.on('selection:cleared', function() {
    if (cropFrame) {
        canvas.remove(cropFrame);
        cropFrame = null;
				document.getElementById('crop').style.display = 'none';
    }
});
canvas.on('selection:updated', function() {
	if (cropFrame && canvas.getActiveObject() !== cropFrame) {
		canvas.remove(cropFrame);
		cropFrame = null;
		document.getElementById('crop').style.display = 'none';
	}
});

function cropImage(png, left, top, height, width) {
    if (top < png.top) {
        height = height - (png.top - top);
        top = png.top;
    }
    if (left < png.left) {
        width = width - (png.left - left);
        left = png.left;
    }
    if (top + height > png.top + png.height * png.scaleY)
        height = png.top + png.height * png.scaleY - top;
    if (left + width > png.left + png.width * png.scaleX)
        width = png.left + png.width * png.scaleX - left;

    var tempCanvas = new fabric.Canvas(document.createElement('canvas'));
    tempCanvas.setWidth(png.width * png.scaleX);
    tempCanvas.setHeight(png.height * png.scaleY);

    var clonedObject = fabric.util.object.clone(png);
    clonedObject.set({ left: 0, top: 0 });

    if (clonedObject.clipPath) {
        clonedObject.clipPath = clonedObject.clipPath.clone();
    }

    tempCanvas.add(clonedObject);
    tempCanvas.renderAll();

    fabric.Image.fromURL(tempCanvas.toDataURL({ format: 'png', multiplier: 4 }), function(img) {
        var scaledLeft = (left - png.left) * 4;
        var scaledTop = (top - png.top) * 4;
        var scaledWidth = width * 4;
        var scaledHeight = height * 4;

        img.set('left', -scaledLeft);
        img.set('top', -scaledTop);
        var canvas_crop = new fabric.Canvas('canvas_crop');
        canvas_crop.setHeight(scaledHeight);
        canvas_crop.setWidth(scaledWidth);
        canvas_crop.add(img);
        canvas_crop.renderAll();

        fabric.Image.fromURL(canvas_crop.toDataURL({ format: 'png', multiplier: 1 }), function(croppedImg) {
            croppedImg.set({
                left: left,
                top: top,
                scaleX: 0.25,
                scaleY: 0.25
            });

            if (png.clipPath) {
                var clonedClipPath = fabric.util.object.clone(png.clipPath);
                if (clonedClipPath) {
                    croppedImg.clipPath = clonedClipPath;
                }
            }

            canvas.add(croppedImg).renderAll();

            canvas.remove(cropActiveObject);
            canvas.setActiveObject(croppedImg);
            canvas.renderAll();
        });
    });
}

function getObjLeft(objWidth) {
    return canvas.getWidth() / 2 - objWidth / 2;
}

function getObjTop(objHeight) {
    return canvas.getHeight() / 2 - objHeight / 2;
}
