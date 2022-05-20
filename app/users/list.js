(function(){
    'use strict';

    angular
        .module('app')
        .controller('UserListController', Controller)

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
        }]);
        /* END Dullao, Joshua 02/11/2022 */

    
    function Controller($scope, ModulesService, TableService, ngToast, $state) {

        //enable load if data for table is not yet fetched
        $scope.loading = true;

        $scope.users = [];

        $scope.module = [];
        $scope.currentPage = 1;
        $scope.pageSize = 15;

        $scope.reverse = false;

        //showInList not yet implemented, therefore searchbar will search all

        function getUserFields() {
            ModulesService.getModuleByName('users').then(function(aModule) {
                // console.log(aModule);
                $scope.module = aModule;
            }).catch(function(err) {
                console.log(err);
                ngToast.danger(err);
            });
        }

        getUserFields();

        //START Francis Nash Jasmin 20220518
        //Added sorting the list in ASC order and filters based on status.
        $scope.displayOption = 'Active';

        $scope.getAllUsers = function() {
            ModulesService.getAllModuleDocs('users').then(function(users) { 
                // START 05162022 Dullao, Joshua
                // Displays all users from the database                   
                $scope.users = users.sort(function(a, b) {
                    let fa = a.nickname.toLowerCase(),
                        fb = b.nickname.toLowerCase();
    
                    if (fa < fb) {
                        return -1;
                    }
                    if (fa > fb) {
                        return 1;
                    }
                    return 0;
                });
                // END 05162022 Dullao, Joshua
                switch ($scope.displayOption) {
                    case 'Active': {
                        $scope.users = $scope.users.filter(function (user) {
                            return user.status &&  user.status !== false;
                        });
                    } break;

                    case 'Inactive': {
                        $scope.users = $scope.users.filter(function (user) {
                            return user.status === false || !user.status;
                        });
                    }
                }
            }).catch(function(err) {

            }).finally(function() {
                $scope.loading = false;
            });
        }

        $scope.getAllUsers();
        //END Francis Nash Jasmin 20220519

        $scope.sortColumn = function (fieldName) {
            //$scope.column = category + '.' + fieldName;
            $scope.column = fieldName;
            $scope.reverse = TableService.sortSelectedColumn($scope.reverse, $scope.column).result;
        }
        
        $scope.sortClass = function (fieldName) {
            return TableService.sortSelectedClass($scope.reverse, fieldName, $scope.column);
        }

        //deactivate a user
        $scope.deleteUser = function(userId) {
            //Update the status filed only to inactive
            var toSave = {
                moduleName: 'users',
                moduleDoc: {}
            };

            ModulesService.getModuleDocById('users', userId).then(function(moduleDoc) {
                toSave.moduleDoc = moduleDoc;
                
                //set status field to false to not display client
                // toSave.moduleDoc.status = false;

                
                //START 05132022 Dullao, Joshua
                //set the status as true/false when checked
                if(moduleDoc.status == false){
                    toSave.moduleDoc.status = true;
                    ngToast.success('User Reactivated');
                } else{
                    toSave.moduleDoc.status = false;
                    ngToast.success('User Deactivated');
                }
                //END 05132022 Dullao, Joshua 

                //console.log(toSave);

                //update if found
                ModulesService.updateModuleDoc(toSave).then(function() {
                    // START 05122022 Dullao, Joshua
                    // Transferred the message
                    // ngToast.success('User deactivated');
                    // END 05122022 Dullao, Joshua 
                    $state.transitionTo('UserList');
                    getAllUsers();
                }).catch(function(err){
                    console.log(err);
                    ngToast.danger(err);
                });

            }).catch(function(err) {
                console.log(err);
                if(err.notFound) {
                    ngToast.danger('User not found');
                }
            });
        }
    }

})();