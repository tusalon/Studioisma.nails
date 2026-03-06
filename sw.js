// sw.js - Service Worker para PWA
// Versión: 1.0.0 - Studioisma.nails

const CACHE_NAME = 'studioisma-nails-v1';

const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './admin-login.html',
  './setup-wizard.html',
  './editar-negocio.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

// ============================================
// INSTALACIÓN
// ============================================
self.addEventListener('install', event => {
  console.log('📦 Service Worker instalando para Studioisma.nails...');
  
  self.skipWaiting(); // Activar inmediatamente
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache creado, guardando archivos...');
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('✅ Todos los archivos cacheados correctamente');
          })
          .catch(error => {
            console.error('❌ Error al cachear archivos:', error);
            // Intentar cachear uno por uno
            return Promise.all(
              urlsToCache.map(url => {
                return cache.add(url).catch(err => {
                  console.error(`❌ No se pudo cachear: ${url}`, err);
                });
              })
            );
          });
      })
      .catch(error => {
        console.error('❌ Error al abrir el cache:', error);
      })
  );
});

// ============================================
// ACTIVACIÓN
// ============================================
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activado, limpiando caches antiguos...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado y listo');
      return self.clients.claim(); // Tomar control inmediato
    })
  );
});

// ============================================
// ESTRATEGIA DE CACHÉ: Network First, luego cache
// ============================================
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignorar peticiones que no sean HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return;
  
  // Ignorar peticiones a APIs externas
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('ntfy.sh')) return;
  if (event.request.url.includes('unsplash.com')) return;
  
  // Ignorar peticiones a CDNs externos
  if (event.request.url.includes('cdn.') || 
      event.request.url.includes('unpkg.com') || 
      event.request.url.includes('trickle.so') ||
      event.request.url.includes('tailwindcss.com')) {
    return;
  }

  // Para archivos HTML: Network First
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cachear la nueva versión
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, buscar en cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('📦 Sirviendo HTML desde cache:', url.pathname);
              return cachedResponse;
            }
            // Si no hay cache, mostrar index.html como fallback
            return caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Para assets (JS, CSS, imágenes): Cache First
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Si está en cache, devolverlo y actualizar en segundo plano
        console.log('📦 Sirviendo desde cache:', url.pathname);
        
        // Actualizar cache en segundo plano
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse);
              console.log('✅ Cache actualizado:', url.pathname);
            });
          }
        }).catch(() => {});
        
        return cachedResponse;
      }

      // Si no está en cache, buscar en red
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
            console.log('✅ Nuevo archivo cacheado:', url.pathname);
          });
        }
        return networkResponse;
      }).catch(error => {
        console.error('❌ Error fetching:', url.pathname, error);
        // Para imágenes, devolver una imagen por defecto
        if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
          return caches.match('./icons/icon-192x192.png');
        }
        return new Response('Error de red', { status: 408 });
      });
    })
  );
});

// ============================================
// MANEJO DE MENSAJES
// ============================================
self.addEventListener('message', event => {
  console.log('📨 Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Saltando waiting...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🧹 Limpiando todo el cache...');
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('🗑️ Cache eliminado:', cacheName);
      });
    });
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: '1.0.0',
      cacheName: CACHE_NAME,
      urlsCached: urlsToCache.length
    });
  }
});

// ============================================
// MANEJO DE ERRORES
// ============================================
self.addEventListener('error', event => {
  console.error('❌ Error en Service Worker:', event.error);
});

console.log('✅ Service Worker configurado para Studioisma.nails');
console.log('📦 Cache:', CACHE_NAME);
console.log('📄 Archivos a cachear:', urlsToCache.length);