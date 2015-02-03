'use strict';

// ----------------------------------------------------------------------
// Paginate
// ----------------------------------------------------------------------
//
// @note if using with queryString, you MUST mix the paginate mixin fist
// to ensure proper execution order
// ex: model.mix('paginate').mix('queryString') 
//
// this mixin handles basic pagination with the following assumptions: 
//
// 1. page property is 'page'
// 2. limit property is called 'limit'
// 3. api returns 'totalCount' property on responses
// 4. client calculates if max is reached (if there is a next page or not) 
//
// @note the limit defaults to 10. You can specify to over-ride
// 
// @note uses $refresh internally to refresh the collection
//
// @note you are responsible for getting inital query params from $location
// if needed.  
//
// when used with queryString, will update the query params
//
// ------------
//
// HOW TO USE:
// 
// // fetch trips
// $scope.trips = Trip.$search();
//
// // update search with filters
// trips.refresh({ownerId: 1});
//
//

angular
  .module('restmod')
  .factory('paginate', ['restmod',
    function(restmod) {
      return restmod.mixin(function() {

        var totalCount;
        var prevParams = {};

        // update totalCount from API response
        this.on('after-request', function(response) {
          totalCount = response.data.totalCount;
        });

        // compares previous and current params, minus page and limit
        // and resets page to 1 if there is a difference.
        // This ensures that if user changes other query params
        // the paging will start again from 1
        function resetPageIfParamsDidChange(request) {
          if (!this.$params || !this.$params.page) {
            return;
          }
          var paramsCopy = angular.copy(this.$params);
          delete paramsCopy.limit;
          delete paramsCopy.page;
          if (!angular.equals(prevParams, paramsCopy)) {
            request.params.page = 1;
            this.$params.page = 1;
          }
          prevParams = angular.copy(this.$params);
          delete prevParams.limit;
          delete prevParams.page;
        }

        // @note for this to work it must be mixed before queryString
        // since querystring also uses `before-request` to update $location
        // get totalCount from response
        this.on('before-request', resetPageIfParamsDidChange);

        // return true is this is last page
        function isLastPage() {
          if (!totalCount) {
            return false;
          }
          this.$params = this.$params || {};
          this.$params.page = this.$params.page || 1;
          var max = this.$params.page * this.$params.limit;
          if (max >= totalCount) {
            return true;
          }
        }

        // return true if this is first page
        function isFirstPage() {
          return !this.$params || this.$params.page === 1;
        }

        // go to next page
        var nextPage = function() {
          this.$params = this.$params || {};
          this.$params.page = this.$params.page || 1;
          this.$params.limit = this.$params.limit || 10;
          if (isLastPage.call(this) === true) {
            return;
          }
          this.$params.page++;
          this.$refresh();
        }
        this.define('Resource.$nextPage', nextPage);

        // go to previous page
        var prevPage = function() {
          if (isFirstPage.call(this) === true) {
            return;
          }
          this.$params.limit = this.$params.limit || 10;
          this.$params.page--;
          this.$refresh();
        }
        this.define('Resource.$prevPage', prevPage);

        // check if next page exists
        var hasNextPage = function() {
          return !isLastPage.call(this);
        }
        this.define('Resource.$hasNextPage', hasNextPage);

        // check if next previous exists
        var hasPrevPage = function() {
          return !isFirstPage.call(this);
        }
        this.define('Resource.$hasPrevPage', hasPrevPage);


      });

    }
  ]);




// fin