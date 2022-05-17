(function(){
    'use strict';

    angular
        .module('app')
        .controller('BUFormController', Controller);
    
    function Controller($scope, $state, ModulesService, ngToast, $stateParams) {
        $scope.businessUnitForm = {};
        $scope.module = {};
        $scope.userList = {};
        /**
         * START REYNALDO PENA JR 20220516
         * Added a BUList for the dropdown options of SD Group*/
        $scope.BUList = [];
        /* END REYNALDO PENA JR. 20220516*/

        function getBUFields() {
            ModulesService.getModuleByName('businessunits').then(function(aModule) {
                $scope.module = aModule;
            }).catch(function(err) {

            });
        }

        getBUFields();

        /**
         * Start REYNALDO PENA JR. 20220516
         * Gets all business units in the db  */ 
        function getAllBusinessUnits(){
            ModulesService.getAllModuleDocs('businessunits').then(function(businessunits){
                $scope.businessunits = businessunits;
                for(var key in businessunits){
                    $scope.BUList[key] = businessunits[key];
                }
                $scope.BUList = $scope.BUList.filter(bu => bu['Is it an SD?'] == 'Yes')
                console.log($scope.BUList);
            }).catch(function(err){

            });
        }

        getAllBusinessUnits();

        /*END REYNALDO PENA JR. 20220516 */

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
                    ngToast.danger('The Business Unit already exist');
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

        /**
         * START Francis Nash Jasmin 20220517
         * Clears the SD Group selection when Is it an SD option Yes is selected
         */
        $scope.clearSelection = function() {
            if($scope.businessUnitForm['Is it an SD?'] == 'Yes') {
                $scope.businessUnitForm['SD Group'] = '';
            }
            console.log( $scope.businessUnitForm['SD Group'])
        }
        /**END Francis Nash Jasmin 20220517 */
    }

})();