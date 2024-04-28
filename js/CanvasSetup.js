var canvas = new fabric.Canvas("mangaImageCanvas");
canvas.on("selection:created", handleSelection);
canvas.on("selection:updated", handleSelection);

function loadSVG(svgUrl) {
  fabric.loadSVGFromURL(svgUrl, function (objects, options) {
    var canvasUsableHeight = canvas.height - svgPagging;
    var overallScaleX = canvas.width / options.width;
    var overallScaleY = canvasUsableHeight / options.height;
    var scaleToFit = Math.min(overallScaleX, overallScaleY);
    var offsetX = (canvas.width - options.width * scaleToFit) / 2;
    var offsetY = (svgPagging / 2) + (canvasUsableHeight - options.height * scaleToFit) / 2;

		clipAreaCoords.left = offsetX;
		clipAreaCoords.top = offsetY;
		clipAreaCoords.width = options.width * scaleToFit;
		clipAreaCoords.height = options.height * scaleToFit;
    canvas.backgroundColor = 'white';

    objects.forEach(function (obj) {
      obj.scaleX = scaleToFit;
      obj.scaleY = scaleToFit;
      obj.top = obj.top * scaleToFit + offsetY;
      obj.left = obj.left * scaleToFit + offsetX;
      obj.setCoords();

      obj.selectable = false;
      obj.hasControls = false;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.lockRotation = true;
      obj.lockScalingX = true;
      obj.lockScalingY = true;
      obj.excludeFromLayerPanel = true;
      canvas.add(obj);
    });

    canvas.renderAll();
    saveState();
  });
}






window.onload = function() {
	console.log("window.onload");
	const fileInput = document.getElementById('file-input');
	const mangaPanelsImagePath = 'mangaPanelsImage';

	fileInput.setAttribute('nwworkingdir', mangaPanelsImagePath);
	const previewArea = document.getElementById("svg-preview-area");
	previewArea.innerHTML = "";

	fetch(mangaPanelsImagePath)
			.then(response => response.text())
			.then(data => {
				  console.log("fetch(mangaPanelsImagePath)");
					const parser = new DOMParser();
					const htmlDoc = parser.parseFromString(data, 'text/html');
					const fileLinks = htmlDoc.querySelectorAll('a');

					fileLinks.forEach(link => {
							const fileName = link.textContent;
							if (fileName.endsWith('.svg')) {
									const filePath = `${mangaPanelsImagePath}/${fileName}`;
									const img = document.createElement("img");
									img.src = filePath;
									img.classList.add("svg-preview");
									img.addEventListener("click", function() {
											if (confirm("new Image?")) {
													loadSVG(filePath);
											}
									});
									previewArea.appendChild(img);
							}
					});
			})
			.catch(error => {
					console.error('Error fetching directory listing:', error);
			});

	fileInput.addEventListener("change", function(event) {
			const files = event.target.files;
			previewArea.innerHTML = "";

			for (let i = 0; i < files.length; i++) {
					if (files[i].type === "image/svg+xml") {
							const reader = new FileReader();
							reader.onload = function(e) {
									const img = document.createElement("img");
									img.src = e.target.result;
									img.classList.add("svg-preview");
									img.addEventListener("click", function() {
											if (confirm("new Image?")) {
													loadSVG(e.target.result);
											}
									});
									previewArea.appendChild(img);
							};
							reader.readAsDataURL(files[i]);
					}
			}
	});
};



document.getElementById("canvas-container").addEventListener(
  "dragover",
  function (e) {
    e.preventDefault();
  },
  false
);

function handleSelection(e) {
  var selectedObject = e.target;
  var layers = canvas.getObjects();
  var activeIndex = layers.indexOf(selectedObject);
  highlightActiveLayer(activeIndex);
  updateControls(selectedObject);
}

document.getElementById("canvas-container").addEventListener(
  "drop",
  function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    var canvasElement = canvas.getElement();
    var rect = canvasElement.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    var reader = new FileReader();
    reader.onload = function (f) {
      var data = f.target.result;
      fabric.Image.fromURL(data, function (img) {
        var canvasWidth = canvasElement.width;
        var canvasHeight = canvasElement.height;
        
        img.set({
          left: x,
          top: y,
        });
        canvas.add(img);
        canvas.setActiveObject(img);

        var targetFrameIndex = findTargetFrame(x, y);
        if (targetFrameIndex !== -1) {
          var targetFrame = canvas.item(targetFrameIndex);
          var frameCenterX = targetFrame.left + (targetFrame.width * targetFrame.scaleX) / 2;
          var frameCenterY = targetFrame.top + (targetFrame.height * targetFrame.scaleY) / 2;
          var scaleToFitX = (targetFrame.width * targetFrame.scaleX) / img.width;
          var scaleToFitY = (targetFrame.height * targetFrame.scaleY) / img.height;
          var scaleToFit = Math.max(scaleToFitX, scaleToFitY);

          var clipPath = new fabric.Path(targetFrame.path);
          img.set({
            left: frameCenterX - (img.width * scaleToFit) / 2,
            top: frameCenterY - (img.height * scaleToFit) / 2,
            scaleX: scaleToFit,
            scaleY: scaleToFit,
          });

          clipPath.set({
            left: targetFrame.left + 1,
            top: targetFrame.top + 1,
            scaleX: targetFrame.scaleX * 0.998,
            scaleY: targetFrame.scaleY * 0.998,
            absolutePositioned: true,
          });
          img.clipPath = clipPath;
        } else {
          var scaleToCanvasWidth = 0.8 * canvasWidth / img.width;
          var scaleToCanvasHeight = 0.8 * canvasHeight / img.height;
          var scaleToCanvas = Math.min(scaleToCanvasWidth, scaleToCanvasHeight);

          img.set({
            left: (canvasWidth - img.width * scaleToCanvas) / 2,
            top: (canvasHeight - img.height * scaleToCanvas) / 2,
            scaleX: scaleToCanvas,
            scaleY: scaleToCanvas,
          });
        }
        canvas.renderAll();
        updateLayerPanel();
        saveState();
      });
    };

    reader.readAsDataURL(file);
  },
  false
);


function findTargetFrame(x, y) {
  let objects = canvas.getObjects();
  for (let i = 0; i < objects.length; i++) {
    if (objects[i].type === "path" || objects[i].type === "rect") {
      let frameBounds = objects[i].getBoundingRect(true);
      if (
        x >= frameBounds.left &&
        x <= frameBounds.left + frameBounds.width &&
        y >= frameBounds.top &&
        y <= frameBounds.top + frameBounds.height
      ) {
        return i;
      }
    }
  }
  return -1;
}

function isWithin(image, frame) {
  let frameBounds = frame.getBoundingRect(true);
  let imageBounds = image.getBoundingRect(true);

  let within =
    imageBounds.left >= frameBounds.left &&
    imageBounds.top >= frameBounds.top &&
    imageBounds.left + imageBounds.width * image.scaleX <=
      frameBounds.left + frameBounds.width &&
    imageBounds.top + imageBounds.height * image.scaleY <=
      frameBounds.top + frameBounds.height;
  return within;
}

function adjustImageToFitFrame(image, frame) {
  let frameBounds = frame.getBoundingRect();
  let scale = Math.min(
    frameBounds.width / image.getScaledWidth(),
    frameBounds.height / image.getScaledHeight()
  );
  image.set({
    left: frameBounds.left + (frameBounds.width - image.width * scale) / 2,
    top: frameBounds.top + (frameBounds.height - image.height * scale) / 2,
    scaleX: scale,
    scaleY: scale,
  });
}
