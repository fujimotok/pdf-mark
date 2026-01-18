const CACHE_NAME = 'pdf-mark-cache-v5';

const urlsToCache = [
  '/pdf-mark/',
  '/pdf-mark/index.html',
  '/pdf-mark/index.js',
  '/pdf-mark/styles.css',
  '/pdf-mark/manifest.json',
  '/pdf-mark/icon-192x192.png',
  '/pdf-mark/icon-512x512.png',
  '/pdf-mark/service-worker.js',
  '/pdf-mark/pdfjs-5.0.375-dist/web/viewer.html',
  '/pdf-mark/pdfjs-5.0.375-dist/web/viewer.css',
  '/pdf-mark/pdfjs-5.0.375-dist/web/viewer.mjs',
  '/pdf-mark/pdfjs-5.0.375-dist/build/pdf.mjs',
  '/pdf-mark/pdfjs-5.0.375-dist/build/pdf.worker.mjs',
  '/pdf-mark/pdfjs-5.0.375-dist/build/pdf.sandbox.mjs',
  'https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css',
  'https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core content');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // For viewer.html requests, ignore the query parameters and search the cache.
  const requestUrl = new URL(event.request.url);
  let matchOptions = {};
  if (requestUrl.pathname === '/pdf-mark/pdfjs-5.0.375-dist/web/viewer.html') {
    matchOptions = { ignoreSearch: true };
  }

  event.respondWith(
    caches.match(event.request, matchOptions)
      .then((response) => {
        // Cache hit -> return response
        if (response) {
          console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
          return response;
        }

        // Cache miss -> fetch from network
        console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
        return fetch(event.request).then(
          (response) => {
            // Check if you received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const path = requestUrl.pathname;
            const hostname = requestUrl.hostname;

            // Dynamically cache resources that match specific patterns
            let shouldCacheDynamically = false;

            // PDF.js related assets (other than the core files added above)
            if (path.startsWith('/pdf-mark/pdfjs-5.0.375-dist/')) {
              shouldCacheDynamically = true;
            }
            // CDN's SimpleMDE and Font Awesome related assets
            else if (hostname === 'cdn.jsdelivr.net') {
              if (path.includes('/simplemde/') || path.includes('/font-awesome/')) {
                shouldCacheDynamically = true;
              }
            }

            if (shouldCacheDynamically) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log(`[Service Worker] Dynamically caching: ${event.request.url}`);
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          }
        ).catch((error) => {
          console.error(`[Service Worker] Fetch failed for ${event.request.url}:`, error);
          return new Response(null, { status: 503, statusText: 'Service Unavailable (Offline)' });
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Instantly update clients controlled by service workers
  return self.clients.claim();
});
