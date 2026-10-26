const CACHE='muzamil-3d-v1';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./style.css','./game.js','./manifest.webmanifest']))));
self.addEventListener('fetch',e=>{if(e.request.url.startsWith(self.location.origin))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
