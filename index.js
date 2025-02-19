let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.0,
    canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');

document.getElementById('pdf-viewer').appendChild(canvas);
document.getElementById('page-num').textContent = 0;
document.getElementById('page-count').textContent = 0;

// SimpleMDEの設定
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

// ファイルが選択されたときの処理
document.getElementById('file-input').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = function(e) {
      const uint8Array = new Uint8Array(e.target.result);

      // PDF.jsを使ってPDFを表示
      pdfjsLib.getDocument(uint8Array).promise.then(pdf => {
        pdfDoc = pdf;
        document.getElementById('page-count').textContent = pdfDoc.numPages;
        renderPage(pageNum);
      });
    };
    reader.readAsArrayBuffer(file);
  }
});

// ページを表示する関数
function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

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

// ページ送りボタンのイベントリスナー
document.getElementById('prev-page').addEventListener('click', function() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  renderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', function() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  renderPage(pageNum);
});

