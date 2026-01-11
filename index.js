// -----------------------------------------------------------------------------
// Registering a service worker
// -----------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/pdf-mark/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}

// -----------------------------------------------------------------------------
// def var
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// init element 
// -----------------------------------------------------------------------------

// SimpleMDE -------------------------------------------------------------------
const simplemde = new SimpleMDE({
  element: document.getElementById("markdown-editor"),
  toolbar: [
    {
      name: "open",
      action: open,
      className: "fa fa-folder",
      title: "open pdf",
    },
    "|",
    {
      name: "download",
      action: download,
      className: "fa fa-download",
      title: "download markdown",
    },
    {
      name: "clear",
      action: clear,
      className: "fa fa-trash",
      title: "clear markdown",
    },
    {
      name: "copy",
      action: copy,
      className: "fa fa-clipboard",
      title: "copy markdown",
    },
    "|",
    {
      name: "undo",
      action: (e) => { e.codemirror.execCommand("undo"); },
      className: "fa fa-rotate-left",
      title: "undo",
    },
    {
      name: "redo",
      action: (e) => { e.codemirror.execCommand("redo"); },
      className: "fa fa-rotate-right",
      title: "redo",
    },
    "|", "heading", "unordered-list", "ordered-list",
  ],
  autosave: {
    enabled: true,
    uniqueId: "PDF-Mark",
    delay: 1000,
  },
  placeholder: "Note",
  spellChecker: false,
  status: false
});
// SimpleMDE -------------------------------------------------------------------

// SimpleMDE toolbar -----------------------------------------------------------
var toolbarElement = document.querySelector(".editor-toolbar");
var customSelect = document.createElement("select");
customSelect.id = "smde-select";
customSelect.innerHTML = `
    <option value="">format</option>
    <option value="bold">Bold</option>
    <option value="italic">Italic</option>
    <option value="link">Link</option>
    <option value="image">Image</option>
    <option value="quort">Quort</option>
    <option value="code">Code</option>
    <option value="table">Table</option>
    <option value="rule">Rule</option>
`;
customSelect.addEventListener("change", function () {
  switch (this.value) {
  case "bold":
    simplemde.toggleBold();
    break;
  case "italic":
    simplemde.toggleItalic();
    break;
  case "link":
    simplemde.drawLink();
    break;
  case "image":
    simplemde.drawImage();
    break;
  case "quort":
    simplemde.toggleBlockquote();
    break;
  case "code":
    simplemde.toggleCodeBlock();
    break;
  case "table":
    simplemde.drawTable();
    break;
  case "rule":
    simplemde.drawHorizontalRule();
    break;
  }

  this.value = "";
});
toolbarElement.appendChild(customSelect);
// SimpleMDE toolbar -----------------------------------------------------------

// PDF.js viewer.html ----------------------------------------------------------
const viewer = document.getElementById('pdf-viewer');
viewer.src = `pdfjs-5.0.375-dist/web/viewer.html?file=`;

viewer.onload = function() {
  const iframeWindow = viewer.contentWindow;
  const iframeDocument = viewer.contentDocument;

  if (!iframeWindow || !iframeDocument) {
    console.error("iframe content not accessible.");
    return;
  }

  // Wait for PDF.js application to initialize
  const checkPdfjsReady = setInterval(() => {
    if (iframeWindow.PDFViewerApplication && iframeWindow.PDFViewerApplication.pdfViewer) {
      clearInterval(checkPdfjsReady);
      injectCustomScript(iframeWindow, iframeDocument);
    }
  }, 100);
};
// PDF.js viewer.html ----------------------------------------------------------

// -----------------------------------------------------------------------------
// def func
// -----------------------------------------------------------------------------
function open(editor) {
  // Generate a file-open link and launch it
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf";

  input.onchange = function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file);
      const viewer = document.getElementById('pdf-viewer');
      viewer.src = `pdfjs-5.0.375-dist/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;
    }
  };

  input.click();
}

function download(editor) {
  // Get the contents of the editor and convert it to a Blob
  const copntent = editor.value();
  const blob = new Blob([content], { type: "text/plain" });
  
  // Generate a download link and launch it
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pdf-mark.md";
  link.click();
}

function clear(editor) {
  editor.value("");
  editor.codemirror.save();
}

function copy(editor) {
  editor.codemirror.save();
  const text = editor.value();
  navigator.clipboard.writeText(text);
}

// -----------------------------------------------------------------------------
// add event
// -----------------------------------------------------------------------------
document.getElementById('knob').addEventListener('click', function() {
  const element = document.getElementById('toggle-element');
  if (element.classList.contains('hidden')) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
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

// -----------------------------------------------------------------------------
// def iframe injection
// -----------------------------------------------------------------------------
function injectCustomScript(iframeWindow, iframeDocument) {
  const script = iframeDocument.createElement('script');
  script.textContent = `
    (function() {
      const pdfViewer = window.PDFViewerApplication.pdfViewer;
      let lastTapTime = 0;
      const DOUBLE_TAP_DELAY = 300; // Time interval recognized as double tap (ms)

      // Event listeners need to be reapplied every time the page is rendered
      window.PDFViewerApplication.eventBus.on('pagerendered', function(evt) {
        const pageNumber = evt.pageNumber;
        const pageView = pdfViewer.getPageView(pageNumber - 1);

        if (pageView && pageView.textLayer && pageView.textLayer.div) {
          const textLayerDiv = pageView.textLayer.div;
          
          textLayerDiv.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;

            if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
              // handle double tap
              e.preventDefault();
              e.stopPropagation();

              const targetElement = e.target;
              if (targetElement.nodeType === Node.TEXT_NODE) {
                selectLine(targetElement.parentNode, document); 
              } else if (targetElement.tagName === 'SPAN' && targetElement.closest('.textLayer')) {
                selectLine(targetElement, document);
              }
              lastTapTime = 0; // Reset after double tap processing
            } else {
              lastTapTime = currentTime;
            }
          }, true); // Capture events in the capture phase
        }
      });

      function selectLine(element, doc) {
        if (!element || !element.closest('.textLayer')) {
          return;
        }

        const selection = window.getSelection();
        selection.removeAllRanges(); // Clear existing selection

        const range = doc.createRange();
        const targetRect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        const writingMode = computedStyle.writingMode;
        const transform = computedStyle.transform;

        // Determine whether it is vertical writing
        // 1. If "writing-mode" starts with "vertical"
        // 2. If "transform" includes "rotate(90deg)" or "rotate(-270deg)" (visually written vertically)
        const isVerticalLayout = writingMode.startsWith('vertical') || 
                                 transform.includes('rotate(90deg)') || 
                                 transform.includes('rotate(-270deg)');

        let startNode = element;
        let endNode = element;

        // Search the text backwards and decide the "startNode"
        let prev = element.previousElementSibling;
        while (prev) {
          const prevRect = prev.getBoundingClientRect();
          let isOnSameLine = false;

          if (isVerticalLayout) {
            // For vertical layout: Compare X coordinates
            // Determine whether center lines overlap or significantly overlap
            const targetCenterX = targetRect.x + targetRect.width / 2;
            const prevCenterX = prevRect.x + prevRect.width / 2;
            const overlapThreshold = Math.min(targetRect.width, prevRect.width) * 0.5; // Allow half the width

            isOnSameLine = Math.abs(targetCenterX - prevCenterX) < overlapThreshold ||
                           (prevRect.right > targetRect.x && prevRect.x < targetRect.right);
          } else {
            // For horizontal layout: Compare Y coordinates
            // Determine whether center lines overlap or significantly overlap
            const targetCenterY = targetRect.y + targetRect.height / 2;
            const prevCenterY = prevRect.y + prevRect.height / 2;
            const overlapThreshold = Math.min(targetRect.height, prevRect.height) * 0.5; // Allow half the height

            isOnSameLine = Math.abs(targetCenterY - prevCenterY) < overlapThreshold ||
                           (prevRect.bottom > targetRect.y && prevRect.y < targetRect.bottom);
          }

          if (isOnSameLine) {
            startNode = prev;
            prev = prev.previousElementSibling;
          } else {
            break;
          }
        }

        // Search the text forwards and decide the "endNode"
        let next = element.nextElementSibling;
        while (next) {
          const nextRect = next.getBoundingClientRect();
          let isOnSameLine = false;

          if (isVerticalLayout) {
            // For vertical layout: Compare X coordinates
            // Determine whether center lines overlap or significantly overlap
            const targetCenterX = targetRect.x + targetRect.width / 2;
            const nextCenterX = nextRect.x + nextRect.width / 2;
            const overlapThreshold = Math.min(targetRect.width, nextRect.width) * 0.5; // Allow half the width

            isOnSameLine = Math.abs(targetCenterX - nextCenterX) < overlapThreshold ||
                           (nextRect.right > targetRect.x && nextRect.x < targetRect.right);
          } else {
            // For horizontal layout: Compare Y coordinates
            // Determine whether center lines overlap or significantly overlap
            const targetCenterY = targetRect.y + targetRect.height / 2;
            const nextCenterY = nextRect.y + nextRect.height / 2;
            const overlapThreshold = Math.min(targetRect.height, nextRect.height) * 0.5; // Allow half the height

            isOnSameLine = Math.abs(targetCenterY - nextCenterY) < overlapThreshold ||
                           (nextRect.bottom > targetRect.y && nextRect.y < targetRect.bottom);
          }

          if (isOnSameLine) {
            endNode = next;
            next = next.nextElementSibling;
          } else {
            break;
          }
        }
        
        // Set selection range
        range.setStart(startNode, 0);
        range.setEnd(endNode, endNode.childNodes.length);
        selection.addRange(range);
      }
    })();
  `;
  iframeDocument.head.appendChild(script);
}
