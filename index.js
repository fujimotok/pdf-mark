let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 4.0,
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
    canvas.style.height = (viewport.height / scale) + "px";
    canvas.style.width = (viewport.width / scale) + "px";

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

  // And pass it to panzoom
  const element = document.getElementById('pdf-viewer')
  var instance = panzoom(element, {
    maxZoom: 10, 		/* 拡大時の上限 */
    minZoom: 1, 		/* 縮小時の下限 */
    initialX: 0, 		/* コンテンツ表示の初期横位置 */
    initialY: 0, 		/* コンテンツ表示の初期縦位置 */
    initialZoom: 1, 	/* コンテンツ表示時の初期倍率 */
    bounds: true, 		/* 表示領域外へ出ないようにする場合はtrue */
    boundsPadding: 0.05 	/* bounds: true の時の表示余白 */
  });

  document.getElementById('reset').addEventListener('click', function(event) {
    event.preventDefault();
    instance.zoomAbs(0,0,1);
    instance.moveTo(0, 0);
  });
}

// ページ送りボタンのイベントリスナー
document.getElementById('prev-page').addEventListener('click', function(event) {
  event.preventDefault();
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  renderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', function(event) {
  event.preventDefault();
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


// オーバーレイ要素の選択
const overlayElement = document.getElementById('bottom-sheet');

function eventHandler(event) {
  event.stopPropagation();
}

// オーバーレイ要素でのイベントを無効にする
const events = ['wheel', 'keydown', 'mousedown', 'dblclick', 'touchstart', 'touchmove', 'touchend']
events.map(eventType => {
  overlayElement.addEventListener(eventType, eventHandler);
});
