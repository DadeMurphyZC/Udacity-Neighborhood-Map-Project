var map, largeInfoWindow;
var yelpResults = [];
// Create a new blank array for all the listing markers.
var markers = ko.observable([]);

/* Locations Model and locations array ViewModel */
var Location = function(name, id, latlng, yelpID) {
    var self = this;
    self.name = ko.observable(name);
    self.id = ko.observable(id);
    self.position = ko.observable(latlng);
    self.yelpID = ko.observable(yelpID);
};

var LocationsViewModel = function() {
    self.locations = ko.observableArray("");
    self.query = ko.observable("");
    /*    self.filteredLocations = ko.computed(function () {
    	return ko.utils.arrayFilter(self.locations(), function (item) {
    	var result = item.name().toLowerCase().indexOf(self.query().toLowerCase());

    //If-else statement used to display markers only if they meet search criteria in search bar
    	if (result === -1) {
                return self.locations();
    		} else {
                
    		}
    		return result >= 0;
    		});
    	});*/
    self.filteredLocations = ko.computed(function() {
        var filter = self.query().toLowerCase();
        if (!filter) {
            self.locations().forEach(function(location) {
                if (location.hasOwnProperty('marker')) {
                    location.marker.setVisible(true);
                }
            });
            return self.locations();
        } else {
            return ko.utils.arrayFilter(self.filteredLocations(), function(location) {
                var match = location.name().toLowerCase().indexOf(filter) !== -1;
                location.marker.setVisible(match);
                return match;
                //            return ko.utils.stringStartsWith(location.name().toLowerCase(), filter);
            });
        }
    }, LocationsViewModel);

    self.locations.push(new Location('Curbside Kitchen', 0, {
        lat: 35.376893,
        lng: -119.019162
    }, "The-Curbside-Kitchen-Bakersfield"));
    self.locations.push(new Location("Jerry's Pizza", 1, {
        lat: 35.376866,
        lng: -119.023296
    }, 'jerrys-pizza-and-pub-bakersfield'));
    self.locations.push(new Location('Sandwich Shack', 2, {
        lat: 35.374791,
        lng: -119.018197
    }, "sandwich-shack-bakersfield"));
    self.locations.push(new Location('Sub Station', 3, {
        lat: 35.377284,
        lng: -119.020409
    }, "sub-station-downtown-bakersfield"));
    self.locations.push(new Location('The Sub Tower', 4, {
        lat: 35.375521,
        lng: -119.018192
    }, "the-sub-tower-bakersfield"));
};
ko.applyBindings(new LocationsViewModel());


// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow, locations) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent(marker.content);
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
    }
};

var placeMarker = function(location) {
    populateInfoWindow(location.marker, largeInfowindow);
    location.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        location.marker.setAnimation(null);
    }, 750);
};



//oAuth Yelp API implementation
function nonce_generate() {
    return (Math.floor(Math.random() * 1e12).toString());
}
var consumerKey = 'T4h4K4LcOXHShAg07GDz-Q';
var token = '4FZRiMb2USyGi-kmRVnLKTnl4KpmS0EF';
var consumerSecret = 'V92ShDqMG-023marV7-DzSqYzvU';
var tokenSecret = 'MjurXNXVU8pqxkE96dJdEpR-ul8';
var yelpCall = function(location) {
    //Url variable
    var yelpUrl = "https://api.yelp.com/v2/business/" + location.yelpID();
    //Search parameters for my YELP search
    var parameters = {
        oauth_consumer_key: consumerKey,
        oauth_token: token,
        yelpConSec: consumerSecret,
        yelpTokSec: tokenSecret,
        oauth_nonce: nonce_generate(),
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: "1.0",
        callback: 'cb',
        location: 'Bakersfield',
        term: 'food',
        limit: 1
    };
    var encodedSignature = oauthSignature.generate('GET', yelpUrl, parameters, consumerSecret, tokenSecret);
    parameters.oauth_signature = encodedSignature;
    var settings = {
        url: yelpUrl,
        data: parameters,
        cache: true, // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
        dataType: 'jsonp',
        success: function(results) {
            // Do stuff with results
            location.marker.content = '<div>' + results.name + '</br>' + '<img src=' + results.image_url + '>' + '</br>' + results.display_phone + '</div>';
        },
        error: function() {
            console.log('Yelp API data could not be retrieved');
        }
    };
    $.ajax(settings);
};


function initMap() {


    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13,
        mapTypeControl: false
    });
    largeInfowindow = new google.maps.InfoWindow();
    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations().length; i++) {
        // Get the position from the location array.
        var position = locations()[i].position();
        var title = locations()[i].name();
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i,
        });
        locations()[i].marker = marker;
        // Push the marker to our array of markers.
        markers().push(marker);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });
    }

    Window.onload = showListings();
};

for (var i = 0; i < locations().length; i++) {
    yelpCall(locations()[i]);
};

function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers().length; i++) {
        markers()[i].setMap(map);
        markers()[i].visible = true;
        bounds.extend(markers()[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideListings() {
    for (var i = 0; i < markers().length; i++) {
        markers()[i].setMap(null);
        markers()[i].visible = false;
        //        filteredLocations()[i].marker.setMap(null);
    }
}