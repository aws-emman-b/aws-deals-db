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
        * START Dullao, Joshua 02/11/2022
        * 
        * Filter to convert the camel case to title case
        * 
        */
        .filter('titleCase', [function () {
            return function (input) {
          
              if (typeof input !== "string") {
                return input;
              }
          
              return input
                .replace(/([A-Z])/g, (match) => ` ${match}`)
                .replace(/^./, (match) => match.toUpperCase());
          
            };
        }])
        /* END Dullao, Joshua 02/11/2022 */
      

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
        /*
        * START Dullao, Joshua 02/21/2022
        * 
        * Set the page size to 20
        * 
        */
        $scope.pageSize = 20;
        /* END Dullao, Joshua 02/21/2022 */

        $scope.currentPage = 1;

        $scope.reverse = false;
        $scope.clients = [];
        
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

        //START Francis Nash Jasmin 20220518
        //Added sorting the list in ASC order and filters based on status.
        $scope.displayOption = 'Active';

        /*
            Function name: getAllClients
            Author(s): Flamiano, Glenn
            Date Modified: 5/29/2018
            Description: Retrieves all client data from clients collection from DealManager in mongoDB
            Parameter(s): none
            Return: none
        */
        $scope.getAllClients = function() {
            /*ClientService.getAllClients().then(function (clients) {
                //console.log(clients);
                $scope.allClients = clients;
                $scope.clientLength = Object.size(clients);
            }).finally(function() {
                $scope.loading = false;
            });*/
            ModulesService.getAllModuleDocs('clients').then(function(clients) {  
                /*
                * START Dullao, Joshua 02/11/2022
                * 
                * filtered the clients so only those with a status of true 
                * will be passed
                */              
                // $scope.clients = clients.filter(unit => unit.status === true);
                /*END Dullao, Joshua 02/11/2022*/

                // START 05162022 Dullao, Joshua
                // Displays all client from the database
                $scope.clients = clients.sort(function(a, b) {
                    let fa = a.cmpnyNameShort.toLowerCase(),
                        fb = b.cmpnyNameShort.toLowerCase();
    
                    if (fa < fb) {
                        return -1;
                    }
                    if (fa > fb) {
                        return 1;
                    }
                    return 0;
                });
                // END 05162022 Dullao, Joshua
                $scope.clientLength = Object.size(clients);

                switch ($scope.displayOption) {
                    case 'Active': {
                        $scope.clients = $scope.clients.filter(function (client) {
                            return client.status && client.status !== false;
                        });
                    } break;

                    case 'Inactive': {
                        $scope.clients = $scope.clients.filter(function (client) {
                            return client.status === false || !client.status;
                        });
                    }
                }
            }).catch(function(err) {
                console.log(err);
            }).finally(function() {
                $scope.loading = false;
            });
        }
        $scope.getAllClients();
        //END Francis Nash Jasmin 20220519

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

                //START 05122022 Dullao, Joshua
                //set the status as true/false when checked
                if(moduleDoc.status == false){
                    toSave.moduleDoc.status = true;
                    ngToast.success('Client Reactivated');
                } else{
                    toSave.moduleDoc.status = false;
                    ngToast.success('Client Deactivated');
                }
                //END 05122022 Dullao, Joshua 
                //console.log(toSave);

                //update if found
                ModulesService.updateModuleDoc(toSave).then(function() {
                    // START 05162022 Dullao, Joshua
                    // Transferred the message
                    // ngToast.success('Client deactivated');
                    // END 05162022 Dullao, Joshua
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