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

        // Used to fetch the json file step_levels
        $scope.steps_levels = {}
        fetch('./import/steps_levels.json')
            .then(res => res.json())
            .then(data => {
                $scope.steps_levels = data; 
            })
            .catch(err => console.log(err))
        
        // Will show the table containing the imported data on the webpage.
        $scope.importExcel = function() {
            if($scope.importedDeals.length !== 0) {
                $scope.showTable = true;
            }
        };

        // Makes the string into sentence case.
        function capitalize(s) { 
            return s.replace(/\w\S*/g, function(t) { return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase(); }); 
        }

        // Converts date to yyyy/mm/dd format
        function convertDateToString(date) {
            return moment(new Date(Math.round((date - 25569) * 86400 * 1000))).format('YYYY/MM/DD');
        }

        // sets date display on table as yyyy-mm-dd on the table
        $scope.formatDate = (date) => {
            return new Date(Math.round((date - 25569) * 86400 * 1000)).toISOString().split('T')[0]
        }

        // Creates deal objects from the imported file.
        function preprocessDeals(dealArray) {
            dealArray.forEach(dealObj => {
                let deal = {
                    essential: {},
                    profile: {},
                    process: {},
                    distribution: {
                        'Direct to Client': { res: {}, rev: {}, cm: {} },
                        total: {}
                    },
                    status: {},
                    content: {}
                };

                deal['ID'] = dealObj.DocNumber;
                deal.essential['Deal Name'] = dealObj.Subject;
                deal.essential['Due Date'] = convertDateToString(dealObj.DueDate);
                
                deal.profile['Country'] = dealObj.BU;
                deal.profile['Division'] = dealObj.Division;
                deal.profile['Client'] = dealObj.Customer;
                deal.profile['Client Resp'] = dealObj.Customer;
                deal.profile['Level'] = dealObj.Level;
                deal.profile['Step'] = $scope.getStep(dealObj.Step);
                deal.profile['Step Description'] = dealObj.Step;
                deal.profile['Type'] = dealObj.ServiceType === 'AG' ? dealObj.ServiceType : capitalize(dealObj.ServiceType);
                deal.profile['Duration (Start)'] = convertDateToString(dealObj.StartDate);
                deal.profile['Duration (End)'] = convertDateToString(dealObj.EndDate);
                deal.profile['AWS Resp (Sales) person'] = dealObj.dspRespSales;
                deal.profile['AWS Resp (Sales) BU'] = dealObj.BU;
                deal.profile['AWS Resp (Dev) person'] = dealObj.dspRespDev;
                deal.profile['AWS Resp (Dev) BU'] = dealObj.BUDev;
                deal.profile['SD'] = dealObj.BUDev;

                // get the fields that starts with Month
                let filteredMonths = Object.keys(dealObj)
                    .filter(key => key.startsWith('Month'))
                    .reduce((obj, key) => {
                        obj[key] = dealObj[key];
                        return obj;
                    }, {});
                
                // Used to create the values for the distribution field
                let resJP = getKeys(filteredMonths, dealObj, 'res', true)
                let resGD = getKeys(filteredMonths, dealObj, 'res', false)
                let revJP = getKeys(filteredMonths, dealObj, 'rev', true)
                let revGD = getKeys(filteredMonths, dealObj, 'rev', false)
                let cm = getKeys(filteredMonths, dealObj, 'cm', false)

                // add distribution here, key name should be yyyy/mm only
                deal.distribution['Direct to Client'].res['jp'] = resJP;
                deal.distribution['Direct to Client'].res['gd'] = resGD;
                deal.distribution['Direct to Client'].rev['jp'] = revJP;
                deal.distribution['Direct to Client'].rev['gd'] = revGD;
                deal.distribution['Direct to Client'].cm = cm;

                $scope.processedDeals.push(deal);
            })
            var deals = $scope.processedDeals;
            return deals;
        }

        // Get the equivalent/ code for the step, as step is imported as kanji.
        $scope.getStep = (stepJA) => {
            let steps = $scope.steps_levels.Steps;
            return steps.find(step => { return step.JA === stepJA }).Level
        }

        // Get the values for res, rev, and cm under the distribution field
        // type is res, rev, or cm
        // isJP tells whether the values fall under jp or gd
        function getKeys(filteredMonths, deal, type, isJP) {
            // check if the same ending (_1, _2, _3...)
            // remove J first if isJP is true
            // make value of month the key
            let values = Object.keys(deal)
                .filter(key => 
                    ((type === 'res' && isJP) && (key.startsWith('MM') && key.endsWith('J'))) ||
                    ((type === 'res' && !isJP) && (key.startsWith('MM') && !key.endsWith('J'))) ||
                    ((type === 'rev' && isJP) && (key.startsWith('Yen') && key.endsWith('J'))) ||
                    ((type === 'rev' && !isJP) && (key.startsWith('Yen') && !key.endsWith('J'))) ||
                    ((type === 'cm') && (key.startsWith('CM')))
                )
                .reduce((obj, key) => {
                    if(isJP) {
                        obj[key.slice(0, -1).split('_')[1]] = deal[key];
                    } else {
                        obj[key.split('_')[1]] = deal[key];
                    }
                    
                    return obj;
                }, {});

            let keys = {};
            Object.keys(filteredMonths)
                .filter(month => {
                    return Object.keys(values).includes(month.split('_')[1])
                })
                .forEach((month, index) => {
                    let value = Object.keys(values)[index];
                    if(value !== undefined) {
                        if(month.split('_')[1] === value){
                            // Store this in an object
                            keys[convertDateToString(filteredMonths[month]).slice(0, 7)] = values[value]
                        }
                    }
                    if (keys[convertDateToString(filteredMonths[month]).slice(0, 7)] === '') {
                        delete keys[convertDateToString(filteredMonths[month]).slice(0, 7)];
                    }
                    
                })
            return keys;
        }
        
        /*
        * START Francis Nash Jasmin 2022/02/21
        * 
        * Fix notification on adding deals through import.
        * Added generation of logs in using the import feature.
        * 
        */
        $scope.duplicateQty = 0;
        $scope.duplicateIDs = [];

        // Adds each deal in the file to the database.
        $scope.addDeals = (dealArray) => {
            var tempDeals = dealArray;
            $scope.duplicateQty = 0;
            $scope.duplicateIDs.length = 0;

            try {
                tempDeals = preprocessDeals(tempDeals);
                tempDeals.forEach((deal, index) => {
                    DealsService.addDeal(deal)
                        .then(function () {
                        })
                        .catch(function (err) {
                            $scope.duplicateQty += 1;
                            $scope.duplicateIDs.push(deal.ID);
                            if(index === (tempDeals.length - 1)) {
                                let duplicateIDs = [...new Set($scope.duplicateIDs)];
                                ngToast.danger(`The following deal IDs already exist: ${duplicateIDs.join(', ')}.`);
                            }
                        })
                        .finally(function () {
                            if(index === (tempDeals.length - 1)) {
                                let duplicateIDs = [...new Set($scope.duplicateIDs)];
                                ngToast.success(`${tempDeals.length - $scope.duplicateQty} deals added, ${duplicateIDs.length} duplicates found.`);
                                if((tempDeals.length - $scope.duplicateQty) !== 0) {
                                    $state.transitionTo('dealList');
                                }

                                let importedIDs = tempDeals.filter(deal => !$scope.duplicateIDs.includes(deal.ID)).map(deal => { return deal.ID });
                                let dealIDs = { importedDeals: importedIDs, duplicateDeals: $scope.duplicateIDs }
                                DealsService.generateLogs(dealIDs)
                                    .then(function() {
                                        console.log('Logs generated.');
                                    })
                                    .catch(function(err) {
                                        console.log('Failed to generate logs.')
                                    });
                            }
                        });
                });
            } catch (e) {
                ngToast.danger(e.message);
            }
        };
        /* END Francis Nash Jasmin 2022/02/23 */
    }
    
    // Reads the contents of the excel file.
    // Uses SheetJS library to convert spreadsheet data to json.
    function Directive() {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function($scope, elem, attrs, ngModel) {
                elem.bind('change', function(event){
                    let fileData, workbook, rowObj;

                    $scope.file = document.getElementById('file').files[0];
                    ngModel.$setViewValue($scope.file);
                    $scope.$apply();

                    let reader = new FileReader();
                    reader.onload = function() {
                        fileData = reader.result;
                        workbook = XLSX.read(fileData, { type: 'binary', cellText: false });
                        rowObj = XLSX.utils.sheet_to_json(workbook.Sheets['Data']);

                        $scope.importedDeals = rowObj.filter(d => Object.keys(d).includes('DocNumber'));
                        console.log(rowObj)
                        $scope.months = Object.keys(rowObj[0]).filter(key => key.startsWith('Month'));
                    };
                    reader.readAsBinaryString($scope.file);
                })
            }
        }
    }
}());

/*  END Francis Nash Jasmin 2022/02 */
