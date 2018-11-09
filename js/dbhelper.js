
var dbPromise = idb.open("restaurant-db", 1, function(upgradeDb) {
  var keyValStore = upgradeDb.createObjectStore("restaurants", {
    keyPath: "id"
  });
  keyValStore.createIndex('by-count', 'id');

  var keyRevStore = upgradeDb.createObjectStore("reviews", {
    keyPath: "id"
  });
  keyRevStore.createIndex('restaurant_id', 'restaurant_id');

  var keyRevSaveStore = upgradeDb.createObjectStore("reviews-in-waiting", { keyPath: "comment_id", autoIncrement : true }, {
    keyPath: "id"
  });
  keyRevSaveStore.createIndex('restaurant_id', 'restaurant_id');
}); 

/**
* Common database helper functions.
*/
class DBHelper {

/**
* Database URL.
* Change this to restaurants.json file location on your server.
*/
static get DATABASE_URL() {
const port = 1337;
return `http://localhost:${port}/restaurants`;
}

static get DATABASE_REVIEWS_URL() {
  const port = 1337;
  return `http://localhost:${port}/reviews/?restaurant_id=`;
  }
  static get DATABASE_REVIEW_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews/`;
    }
/**
* Fetch all restaurants.
*/
static fetchRestaurants(callback) {
var fetchPromise = fetch(DBHelper.DATABASE_URL);
fetchPromise.then(function(response) {

  response.json().then(function(data) {
    callback(null, data);
    /* Lesson 8 part 6*/
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants', 'readwrite');
      var keyValStore = tx.objectStore('restaurants');
      data.forEach(function(element) {
        keyValStore.put(element);
      });
    })

  }).catch(function(error){
    callback(error, null);
  });
}).catch(function(error){
  dbPromise.then(function(db){
      var tx = db.transaction('restaurants', 'readonly');
      var keyValStore = tx.objectStore('restaurants');  
      return keyValStore.getAll();
  }).then(function(data) {
      callback(null, data);
  });


});    
};

/**
* Fetch a restaurant by its ID.
*/

static fetchRestaurantById(id, callback) {
// fetch all restaurants with proper error handling.
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      const restaurant = restaurants.find(r => r.id == id);
      if (restaurant) { // Got the restaurant
        callback(null, restaurant);
      } else { // Restaurant does not exist in the database
        callback('Restaurant does not exist', null);
      }
    }
  });
};   

/**
* Fetch reviews.
*/

static fetchReviews(id, callback) {

    var fetchPromise = fetch(DBHelper.DATABASE_REVIEWS_URL+id);
    fetchPromise.then(function(response) {
    
      response.json().then(function(data) {
        callback(null, data);
        /* Lesson 8 part 6*/
        dbPromise.then(function(db) {
          var tx = db.transaction('reviews', 'readwrite');
          var keyRevStore = tx.objectStore('reviews');
          data.forEach(function(element) {
            keyRevStore.put(element);
          });
        })
    
      }).catch(function(error){
        callback(error, null);
      });
    }).catch(function(error){
      dbPromise.then(function(db){
          var tx = db.transaction('reviews', 'readonly');
          var keyRevStore = tx.objectStore('reviews');  
          var restRevIndex = keyRevStore.index('restaurant_id');
          return restRevIndex.getAll(id);
      }).then(function(data) {
          callback(null, data);
      });
    
    
    }); 
  };   


/**
* Fetch restaurants by a cuisine type with proper error handling.
*/
static fetchRestaurantByCuisine(cuisine, callback) {
// Fetch all restaurants  with proper error handling
DBHelper.fetchRestaurants((error, restaurants) => {
  if (error) {
    callback(error, null);
  } else {
    // Filter restaurants to have only given cuisine type
    const results = restaurants.filter(r => r.cuisine_type == cuisine);
    callback(null, results);
  }
});
}

/**
* Fetch restaurants by a neighborhood with proper error handling.
*/
static fetchRestaurantByNeighborhood(neighborhood, callback) {
// Fetch all restaurants
DBHelper.fetchRestaurants((error, restaurants) => {
  if (error) {
    callback(error, null);
  } else {
    // Filter restaurants to have only given neighborhood
    const results = restaurants.filter(r => r.neighborhood == neighborhood);
    callback(null, results);
  }
});
}

/**
* Fetch restaurants by a cuisine and a neighborhood with proper error handling.
*/
static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
// Fetch all restaurants
DBHelper.fetchRestaurants((error, restaurants) => {
  if (error) {
    callback(error, null);
  } else {
    let results = restaurants
    if (cuisine != 'all') { // filter by cuisine
      results = results.filter(r => r.cuisine_type == cuisine);
    }
    if (neighborhood != 'all') { // filter by neighborhood
      results = results.filter(r => r.neighborhood == neighborhood);
    }
    callback(null, results);
  }
});
}

/**
* Fetch all neighborhoods with proper error handling.
*/
static fetchNeighborhoods(callback) {
// Fetch all restaurants
DBHelper.fetchRestaurants((error, restaurants) => {
  if (error) {
    callback(error, null);
  } else {
    // Get all neighborhoods from all restaurants
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
    // Remove duplicates from neighborhoods
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
    callback(null, uniqueNeighborhoods);
  }
});
}

/**
* Fetch all cuisines with proper error handling.
*/
static fetchCuisines(callback) {
// Fetch all restaurants
DBHelper.fetchRestaurants((error, restaurants) => {
  if (error) {
    callback(error, null);
  } else {
    // Get all cuisines from all restaurants
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
    // Remove duplicates from cuisines
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
    callback(null, uniqueCuisines);
  }
});
}

/**
* Restaurant page URL.
*/
static urlForRestaurant(restaurant) {
return (`./restaurant.html?id=${restaurant.id}`);
}

/**
* Restaurant image URL.
*/
static imageUrlForRestaurant(restaurant) {
return (`/img/${restaurant.id}.jpg`);
}

/**
* Map marker for a restaurant.
*/
static mapMarkerForRestaurant(restaurant, map) {
// https://leafletjs.com/reference-1.3.0.html#marker  
const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
  {title: restaurant.name,
  alt: restaurant.name,
  url: DBHelper.urlForRestaurant(restaurant)
  })
  marker.addTo(newMap);
return marker;
} 
  static updateIndexedDb(restaurant, is_favorite){
    dbPromise.then(function(db){
      var tx = db.transaction('restaurants',"readwrite");
      //Ask for the objectStore
      var keyValStore = tx.objectStore('restaurants');
      return keyValStore.get(restaurant.id);
    }).then(function(restaurant){
      restaurant.is_favorite = !is_favorite;
      dbPromise.then(function(db){
        var tx = db.transaction('restaurants',"readwrite");
        //Ask for the objectStore
        var keyValStore = tx.objectStore('restaurants');
        keyValStore.put(restaurant);
      })
    });
  }


  static updateServerInfo(restaurant){
    var updateinfo =fetch(`${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`, {method: "PUT"});
    updateinfo.then(function (response){
      if(response.status === 200){
      }
    });
    dbPromise.then(function(db){
      var tx = db.transaction('restaurants',"readwrite");
      var keyValStore = tx.objectStore('restaurants');
      //Ask for the objectStore
      keyValStore.get(restaurant.id).then(function (upd) {
        upd["is_favorite"] = restaurant.is_favorite;
        keyValStore.put(upd);

      });
    })
  }
  static updateAllRestaurants() {
    dbPromise.then(function(db){
      var tx = db.transaction('restaurants',"readwrite");
      var keyValStore = tx.objectStore('restaurants');
      //Ask for the objectStore
      keyValStore.getAll().then(function (allrestautants) {
        allrestautants.forEach(function(restaurant){
          fetch(`${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`, {method: "PUT"}); 
        });
      })
    })
  }

  static submitNewReview(restaurant_id) {
    var revName = document.getElementById("addrevname").value;
    var revRating = document.getElementById("addrevrating").value;
    var revComments = document.getElementById("addrevcomments").value; 
    var data = {
      restaurant_id: restaurant_id,
      name: revName,
      rating: revRating,
      comments: revComments};
    fetch(DBHelper.DATABASE_REVIEW_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(res => res.json())
    .then(response => console.log('Success:', JSON.stringify(response)))
    /*.catch(error => console.error('Error:', error));  */
    .catch(function(error){
      dbPromise.then(function(db){
        var tx = db.transaction('reviews-in-waiting', 'readwrite');
        var keyRevSaveStore = tx.objectStore('reviews-in-waiting');  
          keyRevSaveStore.put(data);
      });
    })
    document.getElementById("addrevname").value = "";
    document.getElementById("addrevrating").value = "";
    document.getElementById("addrevcomments").value = "";
    fillReviewsHTML();
  };

    static updateAllReviews() {
      dbPromise.then(function(db){
        var tx = db.transaction('reviews-in-waiting','readwrite');
        var keyRevSaveStore = tx.objectStore('reviews-in-waiting');
        var revIndex = keyRevSaveStore.index('restaurant_id');

        return revIndex.openCursor();
      }).then(function reviewUpdates(cursor){
        if (!cursor) return;
        console.log("Cursored at:", cursor.value.name);
        var data = {
          restaurant_id: cursor.value.restaurant_id,
          name: cursor.value.name,
          rating: cursor.value.rating,
          comments: cursor.value.comments
        };
        fetch(DBHelper.DATABASE_REVIEW_URL, {
          method: "POST",
          body: JSON.stringify(data),
          headers:{
            'Content-Type': 'application/json'
          }
        }).then(res => res.json())
          .then(response => console.log('Success:', JSON.stringify(response)));
        // https://github.com/jakearchibald/idb
        cursor.delete(); //to delete this entry
        return cursor.continue().then(reviewUpdates);
      }).then(function() {
        console.log('Done cursoring');
      });
    }
  }
