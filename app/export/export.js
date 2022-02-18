/*
 * START Francis Nash Jasmin 2022/01/31
 * 
 * Added an export feature controller for deals where its columns can be filtered based on user input.
 * 
 */

(function() {
    'use strict';

    angular
        .module('app')
        .controller('ExportController', Controller)

    function Controller($scope, $rootScope, $state, ModulesService, TableService, ngToast, $filter) {
        $scope.loading = true;
        $scope.selectedView = 'default';
        
        // Sets whether direct to client or intra-company should be displayed on the table in alternative view.
        $scope.distValues = {
            direct: true,
            intra: true
        };

        $scope.DATE_FORMAT = 'yyyy/MM/dd';
        // Set default dates
        $scope.startingMonthYear = new Date();
        $scope.currentFiscalYear = {
            currentYear: ($scope.startingMonthYear.getFullYear() - 1) + '-04-01'
        };

        $scope.startDate = $scope.currentFiscalYear.currentYear;
        $scope.endDate = moment($scope.startDate).add(11, 'month');
        $scope.showDates = false;

        $scope.months = [];

        // Checks the date input and displays the generated array of dates in the table.
        $scope.setDates = function(startDate, endDate) {
            if ($scope.startDate > $scope.endDate) {
                ngToast.danger('Start Date must be before the End Date');
            } else {
                $scope.startDate = startDate;
                $scope.endDate = endDate;
                $scope.showDates = !$scope.showDates;
            }
        }

        // Generates an array of dates based on input.
        $scope.generateMonths = function(startDate, endDate) {
            const start = moment(startDate).set({'date': 1});
            const end = moment(endDate).set({'date': 1});
            const months = [];
            
            while (end.diff(start, 'months') >= 0) {
                months.push(start.format('YYYY/MM/DD'));
                start.add(1, 'month');
            }
            $scope.months = months;
            return months;
        }

        $scope.deals = [];
        $scope.filteredDeals = [];

        $scope.fields = {
            essential: [],
            profile: [],
            process: [],
            distribution: [],
            status: []
        };

        // Fields names for the table in alternative view.
        $scope.renamedFields = {
            essential: {
                'ID': 'DocNumber',
                'Deal Name': 'Subject',
                'Due Date': 'DueDate'
            },
            profile: {
                'Client': 'Customer',
                'AWS Resp (Sales) person': 'RespSales',
                'AWS Resp (Dev) person': 'RespDev',
                'Service': 'Service',
                'Type': 'ServiceType',
                'Level': 'Level',
                'Step': 'Step',
                'Resource Size (MM)': 'RMM Total',
                'Revenue': 'Revenue Total',
                'CM': 'CM Total',
                'Duration (Start)': 'StartDate',
                'Duration (End)': 'EndDate',
                'Division': 'Division',
                'AWS Resp (Sales) BU': 'BU Sales',
                'AWS Resp (Dev) BU': 'BU Dev',
                'SD': 'SD'
            }
        };

        // get deals from db
        ModulesService.getAllModuleDocs('deals').then(function (allDeals) {
            $scope.deals = allDeals;
            $scope.filteredDeals = $scope.deals;
        }).catch(function (err) {
            console.log(err);
        }).finally(function () {
            $scope.loading = false;
        });

        // gets all the fields from the modules database and filters it with 'deal' in its name
        function getAllFields() {
            ModulesService.getAllModules().then(function (allModules) {
                var category;
                for (var i = 0; i < allModules.length; i++) {
                    if (allModules[i].name.search('deal') !== -1 && allModules[i].name !== 'deals') {
                        category = allModules[i].name.replace('deal', '');
                        $scope.fields[category] = allModules[i].fields;
                    }
                }
            }).catch(function (err) {
                console.log(err);
            });
        }

        getAllFields();

        $scope.sortColumn = function (category, fieldName) {
            $scope.column = category + "['" + fieldName + "']";
            $scope.reverse = TableService.sortSelectedColumn($scope.reverse, $scope.column).result;
        }

        $scope.sortClass = function (category, fieldName) {
            return TableService.sortSelectedClass($scope.reverse, category + "['" + fieldName + "']", $scope.column);
        }

        $scope.search = {};
        $scope.searchColumn = 'all,$';

        $scope.setSearch = function () {
            $scope.search = {};

            var splitted = angular.copy($scope.searchColumn.split(','));
            if (splitted[0] === 'all' || splitted[1] === 'ID') {
                $scope.search[splitted[1]] = $scope.searchText;
            } else if($scope.searchText !== '' && $scope.searchText !== undefined) {
                $scope.search[splitted[0]] = {};
                $scope.search[splitted[0]][splitted[1]] = $scope.searchText;
            }
            
            $scope.filteredDeals = $filter('filter')($scope.deals, $scope.search);
        }

        //export excel from html
        $scope.exportData = function () {
            var fileUserName = '';

            var today = new Date();
            var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            var time = today.getHours() + '-' + today.getMinutes() + '-'+ today.getSeconds();
            var currentDateAndTime = date + ' ' + time;
        
            if($rootScope.user.firstName === undefined || $rootScope.user.lastName === undefined){
                fileUserName = $rootScope.user.email;
            } else {
                fileUserName = $rootScope.user.firstName + ' ' + $rootScope.user.lastName;
            }

            let fileName = 'Deals List - ' + fileUserName + ' ' + currentDateAndTime + '.xlsx';

            var excelData = $scope.selectedView === 'default' ? document.querySelector("#defaultView") : document.querySelector("#altView");
            TableToExcel.convert(excelData, {
                name: fileName
            });
        }

        $scope.open = function (dealID) {
            window.open($state.href('dealForm', { ID: dealID }), dealID);
        }

        // Used to get values under resources, revenue and cm in a deal's distribution field.
        // value for dist is res, rev or cm
        // contract is Direct to Customer or Intra-Company
        // distType is jp or gd
        $scope.getDistValue = function(deal, month, dist, contract, distType) {
            if(deal.distribution[contract] !== undefined) {
                if(deal.distribution[contract][dist] !== undefined) {
                    if(deal.distribution[contract][dist][distType] !== undefined) {
                        // cm field in distribution does not have jp or gd subfield
                        if(dist === 'cm') {
                            if(Object.keys(deal.distribution[contract][dist]).includes(month.substring(0, 7))) {
                                return deal.distribution[contract][dist][month.substring(0, 7)];
                            } else return '';
                        }
                        if(Object.keys(deal.distribution[contract][dist][distType]).includes(month.substring(0, 7))) {
                            return deal.distribution[contract][dist][distType][month.substring(0, 7)];
                        } else return '';
                    } else return '';
                } else return '';
            } else return '';
        }

        // Computes the total of resources, revenue and cm based on the range of dates specified.
        $scope.calculateTotal = function(deal, months, dist, contract, distType){
            let values = months.map(month => {
                return $scope.getDistValue(deal, month, dist, contract, distType)
            }).filter(value => value !== '')
            let total = 0;
            angular.forEach(values, function(item){
                total += item;
            });
            return total !== 0 ? total : '';
        }

        // Computes the total of resources, revenue and cm for a single month.
        $scope.calculateDistValueTotal = function(deals, month, dist, contract, distType) {
            let values = deals.map(deal => {
                return $scope.getDistValue(deal, month, dist, contract, distType)
            }).filter(value => value !== '')
            let total = 0;
            angular.forEach(values, function(item){
                total += item;
            });
            return total !== 0 ? total : '';
        }

        // Computes the overall total of resources, revenue, and cm for all months based on the range of dates specified.
        $scope.calculateOverallTotal = function(deals, months, dist, contract, distType){
            let values = months.map(month => {
                return $scope.calculateDistValueTotal(deals, month, dist, contract, distType)
            }).filter(value => value !== '')
            let total = 0;
            angular.forEach(values, function(item){
                total += item;
            });
            return total !== 0 ? total : '';
        }
    }
}());

/*  END Francis Nash Jasmin 2022/02 */
