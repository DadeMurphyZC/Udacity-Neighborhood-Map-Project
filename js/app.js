var map, largeInfoWindow;
var yelpResults = [];
var markers = ko.observable([]);
var showAlert = true;

// Locations Model - location object constructor
var Location = function(name, id, latlng, yelpID) {
    var self = this;
    self.name = ko.observable(name);
    self.id = id;
    self.position = ko.observable(latlng);
    self.yelpID = ko.observable(yelpID);
};

// Locations ViewModel - filter and marker visibility used in the View bindings
var LocationsViewModel = function() {
    self.locations = ko.observableArray("");
    self.query = ko.observable("");
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
            });
        }
    }, LocationsViewModel, this);

    self.locations.push(new Location('Curbside Kitchen', 0, {
        lat: 35.3763749,
        lng: -119.0227596
    }, "The-Curbside-Kitchen-Bakersfield"));
    self.locations.push(new Location("Jerry's Pizza", 1, {
        lat: 35.37585,
        lng: -119.01917
    }, 'jerrys-pizza-and-pub-bakersfield'));
    self.locations.push(new Location('Sandwich Shack', 2, {
        lat: 35.3743578493595,
        lng: -119.017867818475
    }, "sandwich-shack-bakersfield"));
    self.locations.push(new Location('Sub Station', 3, {
        lat: 35.3771838,
        lng: -119.0200836
    }, "sub-station-downtown-bakersfield"));
    self.locations.push(new Location('The Sub Tower', 4, {
        lat: 35.3740463256836,
        lng: -119.017311096191
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
    location.marker.setAnimation(google.maps.Animation.DROP);
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
            location.marker.content = '<div class="iw-name">' + results.name + '</div>' + '<div class="iw-img">' + '<img src=' + results.image_url + '>' + '</div>' + '<div class="iw-phone">' + '<div>' + results.location.address[0] + '<br>' + '<div>' + results.location.city + ', ' + results.location.state_code + '</div>' + results.display_phone + '</div>' + '<div class="iw-rating">' + '<img src="' + results.rating_img_url + '"></img>' + '</div>' + '<br>';
        },
        //API error handling
        error: function() {
            if (showAlert==true)
                {
                    $("body").prepend('<div class="alert">' +
                    'ERROR!: Yelp API data failed to load. Please press F5 to refresh and try again.' +
                    '</div>');
                }
            showAlert = false;
        }
    };
    $.ajax(settings);
};

//Initializes an instance of Google Map and Marker objects with InfoWindows
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13,
        styles: [{"featureType":"all","elementType":"geometry","stylers":[{"color":"#ffffff"}]},{"featureType":"all","elementType":"labels.text.fill","stylers":[{"gamma":0.01},{"lightness":20}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"saturation":-31},{"lightness":-33},{"weight":2},{"gamma":0.8}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative.country","elementType":"labels","stylers":[{"lightness":"55"},{"weight":"0.25"}]},{"featureType":"administrative.land_parcel","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"administrative.land_parcel","elementType":"labels.text.fill","stylers":[{"saturation":"-100"}]},{"featureType":"landscape","elementType":"all","stylers":[{"lightness":"-12"},{"saturation":"-100"},{"color":"#6c6d3a"},{"visibility":"simplified"},{"gamma":"2.77"},{"weight":"1.00"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"lightness":30},{"saturation":30},{"color":"#e8e8e8"}]},{"featureType":"landscape","elementType":"labels","stylers":[{"saturation":"-100"}]},{"featureType":"landscape","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"landscape","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"saturation":20}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"lightness":20},{"saturation":-20}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":10},{"saturation":-30}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"saturation":25},{"lightness":25}]},{"featureType":"water","elementType":"all","stylers":[{"lightness":-20}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels.text","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels.icon","stylers":[{"visibility":"off"}]}]
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
            this.setAnimation(google.maps.Animation.DROP);
        });
    }
    Window.onload = showListings();
};




for (var i = 0; i < locations().length; i++) {
    yelpCall(locations()[i]);
};

// This function will loop through the Markers array and set them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers().length; i++) {
        markers()[i].setMap(map);
        bounds.extend(markers()[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the Markers array and hide them all.
function hideListings() {
    for (var i = 0; i < markers().length; i++) {
        markers()[i].setMap(null);
    }
}