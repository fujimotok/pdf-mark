// -----------------------------------------------------------------------------
// def var
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// init element 
// -----------------------------------------------------------------------------
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

// カスタムツールバーに select を埋め込む
var toolbarElement = document.querySelector(".editor-toolbar");
var customSelect = document.createElement("select");
customSelect.id = "smde-select";
customSelect.innerHTML = `
    <option value="bold">Bold</option>
    <option value="italic">Italic</option>
    <option value="link">Link</option>
    <option value="image">Image</option>
    <option value="quort">Quort</option>
    <option value="code">Code</option>
    <option value="table">Table</option>
    <option value="rule">Rule</option>
    <option value="">Cancel</option>
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
});
toolbarElement.appendChild(customSelect);

const viewer = document.getElementById('pdf-viewer');
viewer.src = `pdfjs-5.0.375-dist/web/viewer.html?file=`;


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
