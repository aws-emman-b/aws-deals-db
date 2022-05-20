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
        $scope.displayOption = 'Active';
        $scope.reverse = false;

        //showInList not yet implemented, therefore searchbar will search all

        function getBUFields() {
            ModulesService.getModuleByName('businessunits').then(function(aModule) {
                $scope.module = aModule;
            }).catch(function(err) {

            });
        }

        getBUFields();

        $scope.getAllBUs = function() {
            ModulesService.getAllModuleDocs('businessunits').then(function(businessUnits) {      
                // START 05162022 Dullao, Joshua
                // Displays all client from the database          
                $scope.businessUnits = businessUnits;
                // END 05162022 Dullao, Joshua
                /**
                 * START Reynaldo Pena Jr. 20220518
                 * Sorts the list ASC order
                 * Created an Option dropdown
                 */
                $scope.businessUnits = businessUnits.sort(function(a,b){
                    let fa = a.BU.toLowerCase(),
                        fb = b.BU.toLowerCase();

                    if (fa < fb){
                        return -1;
                    }
                    if (fa > fb){
                        return 1;
                    }
                    return 0;
                });

                switch($scope.displayOption){
                    case 'Active': {
                        $scope.businessUnits = $scope.businessUnits.filter(function(businessUnits){
                            return businessUnits.status !== false;
                        });
                    } break;

                    case 'Inactive': {
                        $scope.businessUnits = $scope.businessUnits.filter(function(businessUnits){
                            return businessUnits.status === false;
                        });
                    }
                    }
                //END Reynaldo Pena Jr. 20220520
            }).catch(function(err) {

            }).finally(function() {
                $scope.loading = false;
            });
        }

        $scope.getAllBUs();

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
                // toSave.moduleDoc.status = false;

                //START 05132022 Dullao, Joshua
                //set the status as true/false when checked
                if(moduleDoc.status == false){
                    toSave.moduleDoc.status = true;
                    ngToast.success('Business Unit Reactivated');
                } else{
                    toSave.moduleDoc.status = false;
                    ngToast.success('Business Unit Deactivated');
                }
                //END 05132022 Dullao, Joshua 
                //console.log(toSave);

                //update if found
                ModulesService.updateModuleDoc(toSave).then(function() {
                    // START 05122022 Dullao, Joshua
                    // Transferred the message
                    // ngToast.success('Business Unit deactivated');
                    // END 05122022 Dullao, Joshua 
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
        /*
        Reynaldo Pena Jr. 
        
        START February 11, 2022 Error message for duplicate Business Unit-->
        */
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

        //END February 12, 2022
    }

})();