(function(){
    'use strict';

    angular
        .module('app')
        .controller('FieldsController', Controller);

    
    function Controller($scope, $rootScope, $state, $filter, ModulesService, ngToast) {
        $scope.message = '';
        $scope.module = {
            name: 'dealessential',
            fields: []
        };
        $scope.fieldForm = {            
            name: '',
            type: 'text',
            unique: false,
            required: false,
            showInList: false
        };

        /* $scope.resetMessage = function () {
            $scope.message = '';
        } */
 
        $scope.resetFieldForm = function () {
            //initialize the fieldForm
            $scope.fieldForm = {            
                name: '',
                type: 'text',
                unique: false,
                required: false,
                showInList: false
            };
            //separate field options from fieldForm object because this needs processing
            $scope.fieldOptions = '';
        }
        $scope.resetFieldForm();

        $scope.getModuleByName = function () {
            ModulesService.getModuleByName($scope.module.name).then(function (aModule) {
                $scope.module = aModule;
                $scope.resetFieldForm();
            }).catch(function (err) {
                //$scope.message = 'Not found';
                ngToast.danger('Not Found');
                $scope.resetFieldForm();
                //console.log($scope.fieldForm);
                //reset the module.fields to remove the fields of a previously selected module
                $scope.module.fields = [];
            });
        }
        $scope.getModuleByName();

        $scope.submitField = function () {
            //include options to fieldForm object
            if ($scope.hasFieldOptions()) {
                $scope.fieldForm.options = $scope.fieldOptions.split(',');

                //remove duplicates from the array
                $scope.fieldForm.options = $scope.fieldForm.options.filter(function (value, index, self) {
                    return (self.indexOf(value) == index && value != null && value != '');
                });

                //check if the array is empty
                if ($scope.fieldForm.options.length === 0) {
                    //$scope.message = 'No options inputted';
                    ngToast.danger('No options inputted');
                    //exit the function instead of proceeding
                    return;
                }
            }

            //required object parameter for ModulesService.addModuleField and .updateModuleField
            var forSave = {
                moduleName: $scope.module.name,
                field: $scope.fieldForm
            }
            //add since there is no id property
            if ($scope.fieldForm.id === undefined) {
                ModulesService.addModuleField(forSave).then(function () {
                    //$scope.message = 'Field added';
                    ngToast.success('Field added');
                    $scope.resetFieldForm();
                    $scope.getModuleByName();
                }).catch(function (err) {
                    console.log(err);
                    //$scope.message = 'Cannot add the field';
                    ngToast.danger('Cannot add the field');
                });
            //update
            } else {
                ModulesService.updateModuleField(forSave).then(function () {
                    //$scope.message = 'Field updated';
                    ngToast.success('Field updated');
                    $scope.resetFieldForm();
                    $scope.getModuleByName();
                }).catch(function (err) {
                    console.log(err);
                    //$scope.message = 'Cannot update the field';
                    ngToast.danger('Cannot update the field');
                });
            }
        }

        $scope.editField = function (aField) {
            angular.copy(aField, $scope.fieldForm);
            //convert fieldForm.options to a string and save it to fieldOptions
            if ($scope.hasFieldOptions()) {
                $scope.fieldOptions = $scope.fieldForm.options.toString();
            }
        }

        $scope.deleteField = function (aField) {
            ModulesService.deleteModuleField($scope.module.name, aField.id).then(function () {
                //$scope.message = 'Field deleted';
                ngToast.success('Field deleted');
                $scope.resetFieldForm();
                $scope.getModuleByName();
            }).catch(function (err) {
                //$scope.message = 'Cannot delete the field';
                ngToast.danger('Cannot delete the field');
            });
        }

        $scope.hasFieldOptions = function () {
            return ($scope.fieldForm.type === 'dropdown' || $scope.fieldForm.type === 'radio' 
            || $scope.fieldForm.type === 'checkbox' ) ? true : false;
        }
    }
})();