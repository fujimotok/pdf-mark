const CACHE_NAME = 'pdf-mark-cache-v1';
const urlsToCache = [
  '/pdf-mark/',
  '/pdf-mark/index.html',
  '/pdf-mark/index.js',
  '/pdf-mark/styles.css',
  'https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit -> return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            // Check if you received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Important: Clone the response. The response is a stream and can only be consumed once.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
