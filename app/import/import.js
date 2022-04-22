/*
 * START Francis Nash Jasmin 2022/01/31
 * 
 * Added an import feature controller for deals where an excel file is used to add deals to the database.
 * 
 */
(function() {
    'use strict';

    angular
        .module('app')
        .controller('ImportController', Controller)
        .directive('fileUpload', Directive)

    function Controller($scope, $state, DealsService, ngToast) {
        $scope.importedDeals = [];
        $scope.showTable = false;

        $scope.processedDeals = [];

        $scope.months = [];

        /*
        * START Francis Nash Jasmin 2022/04/19
        * 
        * Moved the file reading of the excel to the onclick event of the Preview button (file reading used to be on the Directive function at the bottom of the code).
        * 
        */
        // Will show the table containing the imported data on the webpage.
        $scope.importExcel = function() {
            let fileData, workbook, rowObj;
            $scope.file = document.getElementById('file').files[0];

            if($scope.file) {
                let reader = new FileReader();
                reader.readAsBinaryString($scope.file);

                reader.onload = function() {
                    fileData = reader.result;
                    workbook = XLSX.read(fileData, { type: 'binary', cellText: false });
                    var sheet_name_list = workbook.SheetNames;
                    rowObj = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    
                    $scope.importedDeals = rowObj;
                    $scope.months = Object.keys(rowObj[0]).filter(key => key.startsWith('Month'));
                    $scope.showTable = true;
                };
            }
        }
        /* END Francis Nash Jasmin 2022/04/22 */

        // sets date display on table as yyyy-mm-dd on the table
        $scope.formatDate = (date) => {
            return new Date(Math.round((date - 25569) * 86400 * 1000)).toISOString().split('T')[0]
        }
        
        /*
        * START Francis Nash Jasmin 2022/04/19
        * 
        * Changed method of importing deals to the database by moving the preprocessing and adding of deals to the backend.
        * 
        */
        $scope.loading = false;
        $scope.buttonText = 'Submit';
        
        $scope.submitOnClick = () => {
            $scope.loading = true;
            $scope.buttonText = 'Submitting';
            $scope.addDeals();
        }

        // Adds each deal in the file to the database.
        $scope.addDeals = () => {
            try {
                // newDealFile function is used to send the file to the backend and perform preprocessing and adding of deals there.
                DealsService.newDealFile($scope.file).then(function({ importedIDs, duplicateIDs }) {
                    if(importedIDs.length !== 0) {
                        alert(`${importedIDs.length} deals added, ${duplicateIDs.length} duplicates found.`);
                        $state.transitionTo('dealList');
                        $scope.loading = false;
                        $scope.buttonText = 'Submit';   
                    }
                    if(duplicateIDs.length !== 0) {
                        alert(`The following deal IDs already exist (${duplicateIDs.length} duplicates): ${duplicateIDs.join(', ')}.`)
                        $scope.loading = false;
                        $scope.buttonText = 'Submit';
                    }
                }).catch(function(err) {
                    ngToast.danger(err);
                })
            } catch (e) {
                ngToast.danger(e.message);
            } 
        };
        /* END Francis Nash Jasmin 2022/04/22 */
    }
    
    // Reads the contents of the excel file.
    // Uses SheetJS library to convert spreadsheet data to json.
    function Directive() {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function($scope, elem, attrs, ngModel) {
                elem.bind('change', function(event){
                    $scope.file = document.getElementById('file').files[0];
                    ngModel.$setViewValue($scope.file);
                    $scope.$apply(); 
                })
            }
        }
    }
}());

/*  END Francis Nash Jasmin 2022/02 */
