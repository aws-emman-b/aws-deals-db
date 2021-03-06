(function(){
    'use strict';

    angular
        .module('app')
        .controller('BUListController', Controller);
    
    function Controller($scope, ModulesService, TableService, ngToast, $state, $stateParams) {

        //enable load if data for table is not yet fetched
        $scope.loading = true;
        
        $scope.businessUnits = [];

        $scope.module = {};
        $scope.currentPage = 1;
        $scope.pageSize = 10;

        $scope.reverse = false;

        //showInList not yet implemented, therefore searchbar will search all

        function getBUFields() {
            ModulesService.getModuleByName('businessunits').then(function(aModule) {
                $scope.module = aModule;
            }).catch(function(err) {

            });
        }

        getBUFields();

        function getAllBUs() {
            ModulesService.getAllModuleDocs('businessunits').then(function(businessUnits) {                
                $scope.businessUnits = businessUnits;
            }).catch(function(err) {

            }).finally(function() {
                $scope.loading = false;
            });
        }

        getAllBUs();

        $scope.sortColumn = function (fieldName) {
            //$scope.column = category + '.' + fieldName;
            $scope.column = fieldName;
            $scope.reverse = TableService.sortSelectedColumn($scope.reverse, $scope.column).result;
        }
        
        $scope.sortClass = function (fieldName) {
            return TableService.sortSelectedClass($scope.reverse, fieldName, $scope.column);
        }

        //delete BU
        $scope.deleteBU = function(BUId) {
            //console.log(BUId);
            //var toDel = filterIndexById($scope.businessUnits, index);
            /*ModulesService.deleteModuleDoc('businessunits', index).then(function(moduleDoc) {
                //console.log(moduleDoc);
                ngToast.success('Business Unit deleted');
                $state.transitionTo('BUList');
                getAllBUs();
            }).catch(function(err) {
                console.log(err);
                if(err.notFound) {
                    ngToast.danger('Business Unit not found');
                }
            });*/

            //Update the status filed only to inactive
            var toSave = {
                moduleName: 'businessunits',
                moduleDoc: {}
            };

            ModulesService.getModuleDocById('businessunits', BUId).then(function(moduleDoc) {
                toSave.moduleDoc = moduleDoc;
                
                //set status field to false to not display client
                toSave.moduleDoc.status = false;

                //update if found
                ModulesService.updateModuleDoc(toSave).then(function() {
                    ngToast.success('Business Unit deactivated');
                    $state.transitionTo('BUList');
                    getAllBUs();
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
    }

})();