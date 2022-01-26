(function () {
    'use strict';
 
    angular
        .module('app')
        .factory('socket', Service);
 
    function Service(socketFactory) {
        return socketFactory();
    }
 
})();