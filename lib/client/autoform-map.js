(function() {
  var defaults = {
    mapType: 'roadmap',
    defaultLat: 1,
    defaultLng: 1,
    defaultZoom: 1,
    zoomOnLocate: 13,
    clickToChoose: true
  };

  var initTemplateAndGoogleMaps = function() {
    this.options = _.extend({}, defaults, this.data.atts);
    this.data.marker = void 0;

    this.setMarker = (function(_this) {
      return function(map, location, zoom) {
        if (zoom == null) {
          zoom = 0;
        }
        if (_this.data.marker) {
          _this.data.marker.setMap(null);
        }
        _this.data.marker = new google.maps.Marker({
          position: location,
          map: map
        });
        if (zoom > 0) {
          return _this.map.setZoom(zoom);
        }
      };
    })(this);

    this.setPlace = (function(_this) {
      return function(place) {
        //console.log(place);
        _this.$('input[name=lat]').val(place.geometry.location.lat());
        _this.$('input[name=lng]').val(place.geometry.location.lng());
        _this.$('input[name=place_id]').val(place.place_id);
        this.setAddress(place.formatted_address);
      };
    })(this);

    this.setAddress = (function(_this) {
      return function(formatted_address) {
        _this.$('input[name=formatted_address]').val(formatted_address);
        _this.$('input.af-map-search').val(formatted_address);
      };
    })(this);

    //Options
    var mapOptions = {
      zoom: 0,
      mapTypeId: google.maps.MapTypeId[this.options.mapType],
      streetViewControl: false
    };
    if (this.data.atts.googleMap) {
      _.extend(mapOptions, this.data.atts.googleMap);
    }
    this.map = new google.maps.Map(this.find('.af-map'), mapOptions);
    this.map.setCenter(new google.maps.LatLng(this.options.defaultLat, this.options.defaultLng));
    this.map.setZoom(this.options.defaultZoom);
    
    //init search input
    var input = this.find('.af-map-search');
    var searchBox = new google.maps.places.SearchBox(input);
    google.maps.event.addListener(searchBox, 'places_changed', (function(_this) {
      return function() {
        var place = searchBox.getPlaces()[0];
        _this.setPlace(place);
        _this.setMarker(_this.map, place.geometry.location, _this.options.zoomOnLocate);
        return _this.map.setCenter(place.geometry.location);
      };
    })(this));

    if (typeof this.data.atts.rendered === 'function') {
      this.data.atts.rendered(this.map);
    }

    google.maps.event.addListener(this.map, 'zoom_changed', (function(_this) {
      return function(e) {
        return _this.$('input[name=zoom]').val(_this.map.getZoom());
      };
    })(this));

    this.$('.af-map').closest('form').on('reset', (function(_this) {
      return function() {
        var ref;
        _this.data.marker && _this.data.marker.setMap(null);
        _this.map.setCenter(new google.maps.LatLng(_this.options.defaultLat, _this.options.defaultLng));
        return _this.map.setZoom(((ref = _this.options) != null ? ref.defaultZoom : void 0) || 0);
      };
    })(this));

    return this.mapReady.set(true);
  };

  AutoForm.addInputType('map', {
    template: 'afMap',
    valueOut: function() {
      var lat, lng, node;
      node = $(this.context);
      lat = node.find('input[name=lat]').val();
      lng = node.find('input[name=lng]').val();
      if (lat.length > 0 && lng.length > 0) {
        return {
          zoom: node.find('input[name=zoom]').val(),
          lat: lat,
          lng: lng,
          formatted_address: node.find('input[name=formatted_address]').val(),
          place_id: node.find('input[name=place_id]').val()
        };
      }
    },
    contextAdjust: function(ctx) {
      ctx.loading = new ReactiveVar(false);
      return ctx;
    },
    valueConverters: {
      string: function(value) {
        if (this.attr('reverse')) {
          return value.lng + "," + value.lat;
        } else {
          return value.lat + "," + value.lng;
        }
      },
      numberArray: function(value) {
        return [value.lng, value.lat];
      }
    }
  });

  Template.afMap.created = function() {
    this.mapReady = new ReactiveVar(false);
    GoogleMaps.load({
      libraries: 'places'
    });
    this._stopInterceptValue = false;
    return this._interceptValue = function(ctx) {
      var location, t;
      t = Template.instance();
      if (t.mapReady.get() && ctx.value && !t._stopInterceptValue) {
        location = typeof ctx.value === 'string' ? ctx.value.split(',') : ctx.value.hasOwnProperty('lat') ? [ctx.value.lat, ctx.value.lng] : [ctx.value[1], ctx.value[0]];
        location = new google.maps.LatLng(parseFloat(location[0]), parseFloat(location[1]));
        if (location.lat() && location.lng()) {
          if (ctx.value.zoom) {
            t.setMarker(t.map, location, ctx.value.zoom);
          } else {
            t.setMarker(t.map, location, t.options.zoomOnLocate);
          }
        } else {
          t.setMarker(t.map, location, t.options.defaultZoom);
        }
        t.map.setCenter(location);

        var address = ctx.value.hasOwnProperty('formatted_address') ? ctx.value.formatted_address : null;
        t.setAddress(address);

        return t._stopInterceptValue = true;
      }
    };
  };

  Template.afMap.rendered = function() {
    return this.autorun((function(_this) {
      return function() {
        return GoogleMaps.loaded() && initTemplateAndGoogleMaps.apply(_this);
      };
    })(this));
  };

  Template.afMap.helpers({
    schemaKey: function() {
      Template.instance()._interceptValue(this);
      return this.atts['data-schema-key'];
    },
    width: function() {
      if (typeof this.atts.width === 'string') {
        return this.atts.width;
      } else {
        return '100%';
      }
    },
    height: function() {
      if (typeof this.atts.height === 'string') {
        return this.atts.height;
      } else {
        return '200px';
      }
    },
    loading: function() {
      return this.loading.get();
    }
  });

  Template.afMap.events({
    'keydown .af-map-search': function(e) {
      if (e.keyCode === 13) { //enter key
        return e.preventDefault();
      }
    }
  });

})();