const CACHE_NAME = "kara-commission-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./admin.html",
  "./register.html",
  "./style.css",
  "./manifest.json"
];

self.addEventListener("install", event => {
  
  event.waitUntil(
    
    caches.open(CACHE_NAME)
    .then(cache => {
      
      return cache.addAll(APP_SHELL);
      
    })
    
  );
  
  self.skipWaiting();
  
});


self.addEventListener("activate", event => {
  
  event.waitUntil(
    
    caches.keys()
    .then(keys => {
      
      return Promise.all(
        
        keys
        .filter(key =>
          key !== CACHE_NAME
        )
        .map(key =>
          caches.delete(key)
        )
        
      );
      
    })
    
  );
  
  self.clients.claim();
  
});


self.addEventListener("fetch", event => {
  
  if (
    event.request.method !== "GET"
  ) {
    return;
  }
  
  event.respondWith(
    
    fetch(event.request)
    
    .then(response => {
      
      const cloned =
        response.clone();
      
      caches.open(CACHE_NAME)
        .then(cache => {
          
          cache.put(
            event.request,
            cloned
          );
          
        });
      
      return response;
      
    })
    
    .catch(() => {
      
      return caches.match(
        event.request
      );
      
    })
    
  );
  
});
self.addEventListener(
  "message",
  event => {
    
    if (
      event.data?.type ===
      "SKIP_WAITING"
    ) {
      
      self.skipWaiting();
      
    }
    
  }
);