'use strict';

describe('queryString Mixin', function() {

  var $httpBackend, $http, restmod, $injector, $rootScope, $location, API,
    queryString, Trip;

  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    restmodProvider.rebase('queryString');
    $provide.factory('Trip', function(restmod) {
      return restmod.model('/api/trips');
    });
  }));

  // cache entities to be used in tests
  beforeEach(inject(['$injector',
    function(_$injector) {
      $injector = _$injector;
      $httpBackend = $injector.get('$httpBackend');
      $http = $injector.get('$http');
      $location = $injector.get('$location');
      $rootScope = $injector.get('$rootScope');
      API = '/api';
      Trip = $injector.get('Trip');
      queryString = $injector.get('queryString');

      // mix into Trip
      Trip.mix('queryString');

      $httpBackend
        .whenGET(API + '/trips')
        .respond(200, []);
      $httpBackend
        .whenGET(API + '/trips?demo=true&userId=1')
        .respond(200, []);
      $httpBackend
        .whenGET(API + '/trips?demo=false&userId=1')
        .respond(200, []);
      $httpBackend
        .whenGET(API + '/trips?cats=meow&demo=false&userId=1')
        .respond(200, []);

    }
  ]));

  describe('$location integration', function() {

    var trips;

    // no existing query params
    describe('with no existing query params', function() {

      beforeEach(function() {
        trips = Trip.$search({
          userId: 1,
          demo: true
        });
        $httpBackend.flush();
      });

      describe('using $search', function() {

        it('appends each query param to url', function() {
          expect($location.search()).toEqual({
            userId: 1,
            demo: true
          });
        });

      });

      describe('using $fetch', function() {

        beforeEach(function() {
          trips.$fetch({
            userId: 1,
            demo: false,
            cats: 'meow'
          });
          $httpBackend.flush();
        });

        it('appends each query param to url', function() {
          expect($location.search()).toEqual({
            userId: 1,
            demo: false,
            cats: 'meow'
          });
        });

      });

    });



    // with query params
    describe('removes query params it has added', function() {

      it('removes query params', function() {
        trips = Trip.$search({
          userId: 1,
          demo: true
        });
        $httpBackend.flush();
        trips = Trip.$search({});
        $httpBackend.flush();
        expect($location.search()).toEqual({});
      });

    });



    // with query params
    // this test demonstrates that when a user calls search, then calls
    // additional methods, the query params remain
    //
    // @see https://github.com/platanus/angular-restmod/blob/master/dist/angular-restmod.js#L310
    //
    // this.$params remain for each request, in a way making them chainable
    // for example, you can call 
    // trips.$search({author: 'matt'}); 
    //
    // then elsewhere in the code 
    // trips.$search({tag: 'review'});
    //
    // and this will query ?author=matt&tag=review
    // 
    // this is useful for pagnation and filtering
    //
    describe('search works like that?', function() {

      it('yea it does', function() {
        trips = Trip.$search({
          userId: 1,
          demo: true
        });
        $httpBackend.flush();
        trips.$fetch({});
        $httpBackend.flush();
        expect($location.search()).toEqual({
          userId: 1,
          demo: true
        });
      });

    });



    describe('when navigating', function() {

      it('removes search params on $routeChangeSuccess', function() {
        trips = Trip.$search({
          userId: 1,
          demo: true
        });
        $httpBackend.flush();
        $rootScope.$broadcast('$routeChangeSuccess');
        expect($location.search()).toEqual({});
      });

      it('removes search params on $stateChangeSuccess', function() {
        trips = Trip.$search({
          userId: 1,
          demo: true
        });
        $httpBackend.flush();
        $rootScope.$broadcast('$stateChangeSuccess');
        expect($location.search()).toEqual({});
      });

    });



  });

});





// fin