const C='swarm-ide-v1';const U=['/','/im','/workspace','/settings','/manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(U))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(cached=>{const f=fetch(e.request).then(r=>{if(r.ok){const c2=r.clone();caches.open(C).then(c=>c.put(e.request,c2))}return r}).catch(()=>cached);return cached||f})));
