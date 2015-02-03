'use strict';

angular
  .module('restmod')
  .factory('queryString', ['restmod', '$location', '$rootScope',
    function(restmod, $location, $rootScope) {
      return restmod.mixin(function() {

        var previousParams = {};

        // remove previous params and clear the hash
        function _removePreviousParams() {
          angular.forEach(previousParams, function(paramValue, paramName) {
            previousParams[paramName] = null;
            $location.search(paramName, null);
          });
        }

        // add new params to location and to hash
        function _addParams(newParams) {
          angular.forEach(newParams, function(paramValue, paramName) {
            previousParams[paramName] = paramValue;
            $location.search(paramName, paramValue);
          });
        }

        // bind to before request for this resource
        this.on('before-request', function(request) {
          _removePreviousParams();
          _addParams(request.params);
        });

        // remove all of these when user navigates to new view
        $rootScope.$on('$routeChangeSuccess', _removePreviousParams);
        $rootScope.$on('$stateChangeSuccess', _removePreviousParams);

      });

    }
  ]);




// fin