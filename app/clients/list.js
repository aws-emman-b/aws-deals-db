(function(){
    'use strict';

    angular
        .module('app')
        .controller('ClientListController', Controller)
        /*
            Function name: Object filter
            Author(s): Flamiano, Glenn
            Date Modified: 5/29/2018
            Description: to order the rows of the table
            Parameter(s): none
            Return: Array
        */
        .filter('orderObjectBy', function() {
          return function(items, field, reverse) {
            var filtered = [];
            angular.forEach(items, function(item) {
              filtered.push(item);
            });
            filtered.sort(function (a, b) {
              return (a[field] > b[field] ? 1 : -1);
            });
            if(reverse) filtered.reverse();
            return filtered;
          };
        })

        /*
            Function name: Pagination filter
            Author(s): Flamiano, Glenn
            Date Modified: 5/29/2018
            Description: to slice table per page based on number of items
            Parameter(s): none
            Return: Array
        */
        .filter('pagination', function(){
            return function(data, start){
                //data is an array. slice is removing all items past the start point
                return data.slice(start);
            };
        });

    
    function Controller($scope, $rootScope, $state, ModulesService, ngToast, ClientService, TableService) {

        //enable load if data for table is not yet fetched
        $scope.loading = true;

        $scope.pageSize = 6;
        $scope.currentPage = 1;

        $scope.reverse = false;
        $scope.allClients = [];
        
        /*
            Function name: Calculate Object size
            Author(s): Flamiano, Glenn
            Date Modified: 5/29/2018
            Description: to compute the size of an object
            Parameter(s): none
            Return: size
        */
        Object.size = function(obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

        /*
            Function name: getAllClients
            Author(s): Flamiano, Glenn
            Date Modified: 5/29/2018
            Description: Retrieves all client data from clients collection from DealManager in mongoDB
            Parameter(s): none
            Return: none
        */
        function getAllClients() {
            /*ClientService.getAllClients().then(function (clients) {
                //console.log(clients);
                $scope.allClients = clients;
                $scope.clientLength = Object.size(clients);
            }).finally(function() {
                $scope.loading = false;
            });*/

            ModulesService.getAllModuleDocs('clients').then(function(clients) {                
                $scope.allClients = clients;
                $scope.clientLength = Object.size(clients);
            }).catch(function(err) {
                console.log(err);
            }).finally(function() {
                $scope.loading = false;
            });
        }
        getAllClients();

        //get client fields
        function getclientFields() {
            ModulesService.getModuleByName('clients').then(function(aModule) {
                $scope.module = aModule;
            }).catch(function(err) {

            });
        }
        getclientFields();

        $scope.deleteClient = function(clientId){
            //Update the status filed only to inactive
            var toSave = {
                moduleName: 'clients',
                moduleDoc: {}
            };

            ModulesService.getModuleDocById('clients', clientId).then(function(moduleDoc) {
                toSave.moduleDoc = moduleDoc;
                
                //set status field to false to not display client
                toSave.moduleDoc.status = false;
                //console.log(toSave);

                //update if found
                ModulesService.updateModuleDoc(toSave).then(function() {
                    ngToast.success('Client deactivated');
                    $state.transitionTo('clientList');
                    getAllClients();
                }).catch(function(err){
                    console.log(err);
                    ngToast.danger(err);
                });

            }).catch(function(err) {
                console.log(err);
                if(err.notFound) {
                    ngToast.danger('Client not found');
                }
            });
        }

        $scope.sortColumn = function (fieldName) {
            //$scope.column = category + '.' + fieldName;
            $scope.column = fieldName;
            $scope.reverse = TableService.sortSelectedColumn($scope.reverse, $scope.column).result;
        }
        
        $scope.sortClass = function (fieldName) {
            return TableService.sortSelectedClass($scope.reverse, fieldName, $scope.column);
        }
    }
})();