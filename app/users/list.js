(function(){
    'use strict';

    angular
        .module('app')
        .controller('UserListController', Controller);
    
    function Controller($scope, ModulesService, TableService, ngToast, $state) {

        //enable load if data for table is not yet fetched
        $scope.loading = true;

        $scope.users = [];

        $scope.module = [];
        $scope.currentPage = 1;
        $scope.pageSize = 10;

        $scope.reverse = false;

        //showInList not yet implemented, therefore searchbar will search all

        function getUserFields() {
            ModulesService.getModuleByName('users').then(function(aModule) {
                //console.log(aModule);
                $scope.module = aModule;
            }).catch(function(err) {
                console.log(err);
                ngToast.danger(err);
            });
        }

        getUserFields();

        function getAllUsers() {
            ModulesService.getAllModuleDocs('users').then(function(users) {                
                $scope.users = users;
            }).catch(function(err) {

            }).finally(function() {
                $scope.loading = false;
            });
        }

        getAllUsers();

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
                toSave.moduleDoc.status = false;
                //console.log(toSave);

                //update if found
                ModulesService.updateModuleDoc(toSave).then(function() {
                    ngToast.success('User deactivated');
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