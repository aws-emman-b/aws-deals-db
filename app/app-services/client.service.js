(function () {
    'use strict';
 
    angular
        .module('app')
        .factory('ClientService', Service);
 
    function Service($http, $q) {
        var service = {};
 
        service.insert = insert;
        service.getAllClients = getAllClients;
        service.updateClient = updateClient;
 
        return service;  
        
        function insert(clientForm){
            console.log(clientForm);
            return $http.post('/api/client/addClient', clientForm).then(handleSuccess, handleError);
        }

        function getAllClients(){
            return $http.get('/api/client/getAllClients').then(handleSuccess, handleError);
        }

        function updateClient(client){
            return $http.put('/api/client/updateClient/' + client._id, client).then(handleSuccess, handleError);
        }
 
        // private functions
        function handleSuccess(res) {
            return res.data;
        }
 
        function handleError(res) {
            return $q.reject(res.data);
        }
    }
 
})();