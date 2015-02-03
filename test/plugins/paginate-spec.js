'use strict';

describe('paginate Mixin', function() {

  var $httpBackend, $http, restmod, $injector, $rootScope, $location, API,
    Trip, queryString;

  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    // restmodProvider.rebase('DefaultPacker', {
    //   $config: {
    //     jsonMeta: '.'
    //   }
    // });
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

      Trip.mix('paginate');
      Trip.mix('DefaultPacker');

      // mix into Trip
      $httpBackend.whenGET(API + '/trips').respond({
        trips: [{
          tripId: 1
        }, {
          tripId: 2
        }, {
          tripId: 3
        }],
        totalCount: 3
      });

      $httpBackend.whenGET(API + '/trips?limit=2&page=2').respond({
        trips: [{
          tripId: 2
        }],
        totalCount: 3
      });

      $httpBackend.whenGET(API + '/trips?limit=1&page=1').respond({
        trips: [{
          tripId: 1
        }],
        totalCount: 3
      });
      $httpBackend.whenGET(API + '/trips?limit=10&page=1').respond({
        trips: [{
          tripId: 1
        }],
        totalCount: 3
      });

      $httpBackend.whenGET(API + '/trips?limit=10&page=2').respond({
        trips: [{
          tripId: 2
        }],
        totalCount: 3
      });

      $httpBackend.whenGET(API + '/trips?limit=1&page=3').respond({
        trips: [{
          tripId: 3
        }],
        totalCount: 3
      });

    }
  ]));

  describe('gets next and prev page', function() {

    var trips;
    beforeEach(function() {

    });

    it('has $nextPage() method', function() {
      trips = Trip.$search();
      expect(trips.$nextPage).toBeDefined();
    });

    it('has $prevPage() method', function() {
      trips = Trip.$search();
      expect(trips.$prevPage).toBeDefined();
    });

    it('limit defaults to 10', function() {
      trips = Trip.$search();
      trips.$nextPage();
      expect(trips.$params.limit).toEqual(10);
    });

    it('if params (not limit or page) change, resets page to 1', function() {
      trips = Trip.$search({
        page: 3,
        limit: 1
      });
      $httpBackend.flush();
      trips.$refresh({
        animal: 'cats'
      });
      $httpBackend.expectGET(API + '/trips?animal=cats&limit=1&page=1').respond({
        trips: []
      });
      $httpBackend.flush();
      expect(trips.$params.page).toEqual(1);
    });

    it('limit is settable', function() {
      trips = Trip.$search({
        limit: 2
      });
      trips.$nextPage();
      $httpBackend.flush();
      expect(trips.$params.limit).toEqual(2);
    });

    it('$nextPage gets page + 1', function() {
      trips = Trip.$search({
        limit: 1,
        page: 1
      });
      $httpBackend.flush();
      expect(trips[0].tripId).toEqual(1);
      trips.$nextPage();
      $httpBackend.expectGET(API + '/trips?limit=1&page=2').respond({
        trips: [{
          tripId: 'new trip'
        }]
      });
      $httpBackend.flush();
      expect(trips[0].tripId).toEqual('new trip');
    });

    it('$nextPage does nothing if page is last page', function() {
      trips = Trip.$search({
        page: 3,
        limit: 1
      });
      $httpBackend.flush();
      trips.$nextPage();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('$prevPage gets page - 1', function() {
      trips = Trip.$search({
        page: 2
      });
      trips.$prevPage();
      $httpBackend.expectGET(API + '/trips?limit=10&page=1').respond({
        trips: []
      });
      $httpBackend.flush();
    });

    it('$prevPage does nothing if already on page 1', function() {
      trips = Trip.$search({
        page: 1,
        limit: 10
      });
      trips.$prevPage();
      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('integrates with queryString pluging', function() {
      beforeEach(function() {
        Trip.mix('queryString');
        trips = Trip.$search({
          page: 1,
          limit: 10
        });
      });
      it('updates query string', function() {
        expect($location.search()).toEqual({
          page: 1,
          limit: 10
        });
      });
    });

  });

  describe('check if next or prev page exists', function() {

    var trips;

    it('has $hasNextPage() method', function() {
      trips = Trip.$search();
      expect(trips.$hasNextPage).toBeDefined();
    });

    it('has $hasPrevPage() method', function() {
      trips = Trip.$search();
      expect(trips.$hasPrevPage).toBeDefined();
    });

    it('$hasNextPage true if next page exists', function() {
      trips = Trip.$search();
      $httpBackend.flush();
      expect(trips.$hasNextPage()).toEqual(true)
    });

    it('$hasNextPage false if last page', function() {
      trips = Trip.$search({
        page: 3,
        limit: 1
      });
      $httpBackend.flush();
      expect(trips.$hasNextPage()).toEqual(false);
    });

    it('$hasPrevPage true if has prev page', function() {
      trips = Trip.$search({
        page: 2
      });
      expect(trips.$hasPrevPage()).toEqual(true);
    });

    it('$hasPrevPage false if page 1', function() {
      trips = Trip.$search({
        page: 1,
        limit: 10
      });
      expect(trips.$hasPrevPage()).toEqual(false);
    });

    // test to demonstrate that functionality is broken when
    // using search.
    it('does not work with search and $hasPrevPage', function() {
      trips = Trip.$search({
        page: 3,
        limit: 1
      });
      $httpBackend.flush();
      trips.$search({
        animal: 'cats'
      });
      expect(trips.$hasPrevPage()).toEqual(true);
    });

  });

  xdescribe('if page loads with params', function() {

    var trips;
    beforeEach(function() {
      $location.search('test1', 1);
      $location.search('test2', 2);
      trips = Trip.$search({
        page: 1,
        limit: 1
      });
      $httpBackend.whenGET(API + '/trips?limit=1&page=1&test1=1&test2=2')
        .respond(200, {
          trips: []
        });
      $httpBackend.flush();
    });

    it('add params to resource $params', function() {
      expect(trips.$params).toEqual({
        page: 1,
        limit: 1,
        test1: 1,
        test2: 2
      });
    });

  });


});





// fin