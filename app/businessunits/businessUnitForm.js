(function(){
    'use strict';

    angular
        .module('app')
        .controller('BUFormController', Controller);
    
    function Controller($scope, $state, ModulesService, ngToast, $stateParams) {
        $scope.businessUnitForm = {};
        $scope.module = {};
        $scope.userList = {};

        function getBUFields() {
            ModulesService.getModuleByName('businessunits').then(function(aModule) {
                $scope.module = aModule;
            }).catch(function(err) {

            });
        }

        getBUFields();

        function getAllUsers() {
            ModulesService.getAllModuleDocs('users').then(function(users) {                
                $scope.users = users;
                //console.log(users);
                for(var key in users){
                    //console.log(users[key]);
                    $scope.userList[key] = users[key];
                }
                console.log($scope.userList);
            }).catch(function(err) {

            });
        }

        getAllUsers();

        //fill out the BU edit form
        if($stateParams._id !== '') {
            ModulesService.getModuleDocById('businessunits', $stateParams._id).then(function(moduleDoc) {
                //console.log(moduleDoc);
                $scope.businessUnitForm = moduleDoc;
            }).catch(function(err) {
                console.log(err);
                if(err.notFound) {
                    ngToast.danger('Business Unit not found');
                }
                $scope.businessUnitForm = {};
            });
        }

        $scope.submit = function () {
            var toSave = {
                moduleName: $scope.module.name,
                moduleDoc: $scope.businessUnitForm
            };

            if($scope.businessUnitForm._id === undefined) {
                //add status with default true
                toSave.moduleDoc.status = true;
                
                ModulesService.addModuleDoc(toSave).then(function() {
                    ngToast.success('Business Unit added');
                    $state.transitionTo('BUList');
                }).catch(function(err){
                    ngToast.danger(err);
                });
            } else {
                ModulesService.updateModuleDoc(toSave).then(function() {
                    ngToast.success('Business Unit updated');
                    $state.transitionTo('BUList');
                }).catch(function(err){
                    ngToast.danger(err);
                });
            }
        }
    }

})();