self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('restaurant').then(function(cache) {
        return cache.addAll(
            [
                '/',  //
                '/img/1.jpg',
                '/img/2.jpg',
                '/img/3.jpg',
                '/img/4.jpg',
                '/img/5.jpg',
                '/img/6.jpg',
                '/img/7.jpg',
                '/img/8.jpg',
                '/img/9.jpg',
                '/img/10.jpg',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/regsw.js',
                '/js/restaurant_info.js',
                '/index.html',
                '/restaurant.html',
                '/css/styles.css',
                '/css/styles-medium.css',
                '/css/styles-large.css',
                '/favicon.ico',
                '/sw.js'
            ]
        );
      })
    );
  });

  self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    if (requestUrl.pathname.startsWith('/restaurant.html')) {
        event.respondWith(restaurantCheck(event.request));
        return;
      }
    
    event.respondWith(
        caches.match(event.request).then(function (response) {
        return response || fetch(event.request);
    }));

});

function restaurantCheck(request) {
    var storageUrl = '/restaurant.html';
  
    return caches.open('restaurant').then(function(cache) {
      return cache.match(storageUrl).then(function(response) {
        if (response) return response;
  
        return fetch(request).then(function(networkResponse) {
          cache.put(storageUrl, networkResponse.clone());
          return networkResponse;
        });
      });
    });
  }