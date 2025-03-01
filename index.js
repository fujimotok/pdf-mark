// -----------------------------------------------------------------------------
// def var
// -----------------------------------------------------------------------------
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null; // Page number during drawing
let canvas = document.createElement('canvas');

// -----------------------------------------------------------------------------
// init element 
// -----------------------------------------------------------------------------
document.getElementById('pdf-viewer').appendChild(canvas);
document.getElementById('page-num').textContent = 0;
document.getElementById('page-count').textContent = 0;

const panZoom = panzoom(
  document.getElementById('pdf-viewer'),
  {
    maxZoom: 10,
    minZoom: 0.5,
    initialZoom: 1,
    initialX: 0,
    initialY: 0,
    bounds: true,
    boundsPadding: 0.05
  });

const simplemde = new SimpleMDE({
  element: document.getElementById("markdown-editor"),
  autosave: {
    enabled: true,
    uniqueId: "PDF-Mark",
    delay: 1000,
  },
  placeholder: "Memo",
  spellChecker: false,
  status: false
});


// -----------------------------------------------------------------------------
// def func
// -----------------------------------------------------------------------------
function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    const scale = 4.0;
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.height = (viewport.height / scale) + "px";
    canvas.style.width = (viewport.width / scale) + "px";

    const ctx = canvas.getContext('2d');
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    const renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  document.getElementById('page-num').textContent = num;
}


// -----------------------------------------------------------------------------
// add event
// -----------------------------------------------------------------------------
document.getElementById('file-input').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const uint8Array = new Uint8Array(e.target.result);

      pdfjsLib.getDocument(uint8Array).promise.then(pdf => {
        pdfDoc = pdf;
        document.getElementById('page-count').textContent = pdfDoc.numPages;
        renderPage(pageNum);
      });
    };
    reader.readAsArrayBuffer(file);
  }
});

document.getElementById('prev-page').addEventListener('click', function(event) {
  event.preventDefault();
  simplemde.codemirror.focus();

  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  renderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', function(event) {
  event.preventDefault();
  simplemde.codemirror.focus();

  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  renderPage(pageNum);
});

document.getElementById('menu').addEventListener('click', function() {
  var element = document.getElementById('toggle-element');
  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
});

document.getElementById('reset').addEventListener('click', function(event) {
  event.preventDefault();
  simplemde.codemirror.focus();

  panZoom.zoomAbs(0,0,1);
  panZoom.moveTo(0, 0);
});

// Stop event propagation with overlay elements
(function () {
  const overlayElement = document.getElementById('bottom-sheet');
  const events = ['wheel', 'keydown', 'mousedown', 'dblclick',
                  'touchstart', 'touchmove', 'touchend']

  events.map(eventType => {
    overlayElement.addEventListener(eventType, function(event) {
      event.stopPropagation();
    });
  });
})();
