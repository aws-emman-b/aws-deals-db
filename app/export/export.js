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
        .filter('pagination', function () {
            return function (data, start) {
                //data is an array. slice is removing all items past the start point
                return data.slice(start);
            };
        });

    function Controller($scope, $rootScope, $state, ModulesService, TableService, ngToast, $filter) {
        $scope.loading = true;
        $scope.selectedView = 'alternate';
        
        $scope.currentPage = 1;
        $scope.pageSize = 10;
        
        /*
        * START Francis Nash Jasmin 2022/02/21
        * 
        * Added additional filters for displaying columns (JP and GD values in distribution fields).
        * 
        */
        // Sets whether direct to client (jp or gd) or intra-company (jp or gd) should be displayed on the table in alternative view.
        $scope.distValues = {
            directJP: true,
            intraJP: false,
            directGD: false,
            intraGD: false
        };
        /* END Francis Nash Jasmin 2022/02/22 */

        $scope.DATE_FORMAT = 'yyyy/MM/dd';
        // Set default dates
        $scope.startingMonthYear = new Date();
        $scope.currentFiscalYear = {
            currentYear: (($scope.startingMonthYear.getMonth() <= 2) ? $scope.startingMonthYear.getFullYear() - 1 : $scope.startingMonthYear.getFullYear()) + '-04-01'
        };

        /*
        * START Francis Nash Jasmin 2022/02/21
        * 
        * Fixed display of date columns.
        * 
        */
        $scope.enteredStartDate = '';
        $scope.enteredEndDate = '';
        $scope.startDate = moment($scope.currentFiscalYear.currentYear);
        $scope.endDate = moment($scope.currentFiscalYear.currentYear).add(11, 'month');
        $scope.showDates = true;

        $scope.months = [];

        // Checks the date input and displays the generated array of dates in the table.
        $scope.setDates = function(enteredStartDate, enteredEndDate) {
            if(enteredEndDate !== '') {
                if (enteredStartDate > enteredEndDate) {
                    ngToast.danger('Start Date must be before the End Date');
                } else {
                    $scope.startDate = enteredStartDate;
                    $scope.endDate = enteredEndDate;
                } 
            } else {
                $scope.startDate = enteredStartDate;
                $scope.endDate = moment(enteredStartDate).add(11, 'month');
            }
        }
        /* END Francis Nash Jasmin 2022/02/22 */

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

        /*
        * START Francis Nash Jasmin 2022/02/21
        * 
        * Gets the Japanese equivalent of the step code.
        * 
        */
        // Used to fetch the json file step_levels
        $scope.steps_levels = [
            { "Step": "1", "Level": "1.1", "JA": "契約済", "EN": "Contracted" },
            { "Step": "1", "Level": "1.2", "JA": "発注済", "EN": "Order Approved" },
            { "Step": "2", "Level": "2.1", "JA": "発注待ち", "EN": "Waiting for Client Order" },
            { "Step": "2", "Level": "2.2", "JA": "見積り提出済", "EN": "Estimate Submitted" },
            { "Step": "2", "Level": "2.3", "JA": "見積り中", "EN": "Under Estimation" },
            { "Step": "3", "Level": "3.1", "JA": "概算見積り提出済", "EN": "Rough Estimate Submitted" },
            { "Step": "3", "Level": "3.2", "JA": "概算見積り提出予定", "EN": "Rough Estimate Submission Plan" },
            { "Step": "3", "Level": "3.3", "JA": "提案済", "EN": "Plan Proposed" },
            { "Step": "3", "Level": "3.4", "JA": "提案予定", "EN": "Plan Proposal" },
            { "Step": "4", "Level": "4.1", "JA": "概要提案済", "EN": "Planned Overview Proposed" },
            { "Step": "4", "Level": "4.2", "JA": "概要提案予定", "EN": "Planned Overview Proposal" },
            { "Step": "5", "Level": "5.1", "JA": "訪問済", "EN": "Client Visited" },
            { "Step": "5", "Level": "5.2", "JA": "訪問予定", "EN": "Client Visit Scheduled" },
            { "Step": "9", "Level": "9.1", "JA": "失注", "EN": "Lost Order" }
        ]        

        // Get the equivalent Japanese translation for the step.
        $scope.getStepJA = (stepCode) => {
            if(stepCode !== undefined) {
                let steps = $scope.steps_levels.Steps;
                let stepJA = steps ? steps.find(step => { return step.Level === stepCode }).JA : '';
                return stepJA;
            }
        }
        /* END Francis Nash Jasmin 2022/02/21 */

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
                'AWS Resp (Sales) BU': 'BU Sales',
                'AWS Resp (Dev) BU': 'BU Dev',
                'Division': 'Division',
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

        /*
        * START Francis Nash Jasmin 2022/04/29
        * 
        * Updated method of creating the exported excel file. Creation of excel no longer relies on html table displayed, rather on a json file containing the deals.
        * 
        */
        //export excel from html
        $scope.exportData = function () {
            let fileUserName = '';

            let today = new Date();
            let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            let time = today.getHours() + '-' + today.getMinutes() + '-'+ today.getSeconds();
            let currentDateAndTime = date + ' ' + time;
        
            if($rootScope.user.firstName === undefined || $rootScope.user.lastName === undefined){
                fileUserName = $rootScope.user.email;
            } else {
                fileUserName = $rootScope.user.firstName + ' ' + $rootScope.user.lastName;
            }

            let fileName = 'Deals List - ' + fileUserName + ' ' + currentDateAndTime + '.xlsx';

            let headers = createHeaders();

            let wb = XLSX.utils.book_new();
            let ws = XLSX.utils.json_to_sheet([]);
            XLSX.utils.sheet_add_aoa(ws, headers);
            
            let preprocessedDeals = preprocessDeals($scope.filteredDeals);
            let totalRow = computeTotals($scope.filteredDeals);
            preprocessedDeals.push(totalRow);

            XLSX.utils.sheet_add_json(ws, preprocessedDeals, { origin: 'A2', skipHeader: true });

            ws = styleTable(ws);

            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, fileName);
        }

        // Styles the table to be exported. Uses sheetjs-styles library.
        function styleTable(ws) {
            // Define arrays for each res, res, cm columns. Res and cm have same format
            // Formats used in excel
            // res, rev and cm: #,##0.0;[Red]-#,##0.0
            // rev and cm total: _-"¥"* #,##0_-;-"¥"* #,##0_-;_-"¥"* "-"_-;_-@_
            let numColumns = [];
            let totalColumnsRes = [];
            let totalColumnsOthers = [];
            for (var i in ws) {
				if (typeof(ws[i]) != "object") continue;
				let cell = XLSX.utils.decode_cell(i);

                // Style all cells
				ws[i].s = { font: { name: "Calibri", sz: 11 } };

                // Style first row
				if (cell.r == 0) { 
					ws[i].s = { font: { name: "Calibri", sz: 11, bold: true } }
                    
                    if(ws[i].v.includes('RMM Total')) {
                        totalColumnsRes.push(cell.c);
                    }

                    if(ws[i].v.includes('Revenue Total') || ws[i].v.includes('CM Total')) {
                        totalColumnsOthers.push(cell.c);
                    }

                    if(ws[i].v.includes('/')) {
                        numColumns.push(cell.c);
                    }
				} 

                // Style 'Level' column
                if(cell.c == 3 && cell.r != 0) {
                    ws[i].s.alignment = {
                        horizontal: "right"
                    }
                }

                if(numColumns.includes(cell.c) && cell.r != 0) {
                    ws[i].s.numFmt = "#,##0.0;[Red]-#,##0.0";
                }

                if(totalColumnsRes.includes(cell.c) && cell.r != 0) {
                    ws[i].s.numFmt = "#,##0.0_);;;";
                }

                if(totalColumnsOthers.includes(cell.c) && cell.r != 0) {
                    ws[i].s.numFmt = '_-"¥"* #,##0_-;-"¥"* #,##0_-;_-"¥"* "-"_-;_-@_-';
                }
			}
            return ws;
        }

        // Sets the name of the headers of the table to be exported.
        function createHeaders() {
            let monthHeaders = $scope.months.map(month => $scope.formatMonthHeader(month));
            let headers = [['DocNumber', 'Customer', 'Subject', 'Level', 'Step', 'ServiceType', 'RespSales', 'RespDev', 'StartDate', 'EndDate', 'DueDate']];

            if($scope.distValues.directJP) {
                headers[0].push(
                    monthHeaders, 'RMM Total (Direct to Client JP)', 
                    monthHeaders, 'Revenue Total (Direct to Client JP)',
                    monthHeaders, 'CM Total (Direct to Client)'
                );
            }

            if($scope.distValues.intraJP) {
                headers[0].push(
                    monthHeaders, 'RMM Total (Intra-Company JP)',
                    monthHeaders, 'Revenue Total (Intra-Company JP)',
                    monthHeaders, 'CM Total (Intra-Company)'
                );
            }

            if($scope.distValues.directGD) {
                headers[0].push(
                    monthHeaders, 'RMM Total (Direct to Client GD)',
                    monthHeaders, 'Revenue Total (Direct to Client GD)'
                );
            }

            if($scope.distValues.intraGD) {
                headers[0].push(
                    monthHeaders, 'RMM Total (Intra-Company GD)',
                    monthHeaders, 'Revenue Total (Intra-Company GD)'
                )
            }

            headers[0].push('BU Sales', 'BU Dev', 'Division');

            return [headers[0].flat()];
        }

        // Created the array of deal objects to be added in the exported file.
        function preprocessDeals(dealArray) {
            let processedDeals = [];
            dealArray.forEach(dealObj => {
                let deal = {
                    'DocNumber': '',
                    'Customer': '',
                    'Subject': '',
                    'Level': '',
                    'Step': '',
                    'ServiceType': '',
                    'RespSales': '',
                    'RespDev': '',
                    'StartDate': '',
                    'EndDate': '',
                    'DueDate': ''
                };
        
                deal.DocNumber = dealObj['ID'];
                deal.Customer = dealObj.profile['Client'];
                deal.Subject = dealObj.essential['Deal Name'];
                deal.Level = dealObj.profile['Level'];
                deal.Step = dealObj.profile['Step Description'];
                deal.ServiceType = dealObj.profile['Type'].toUpperCase();
                deal.RespSales = dealObj.profile['AWS Resp (Sales) person'];
                deal.RespDev = dealObj.profile['AWS Resp (Dev) person'];
                deal.StartDate = $scope.formatDate(dealObj.profile['Duration (Start)']);
                deal.EndDate = $scope.formatDate(dealObj.profile['Duration (End)']);
                deal.DueDate = $scope.formatDate(dealObj.essential['Due Date']);
                
                // Format of the distribution value in the created deal object
                // 04/22_[DIR/INT]_[RES/REV/CM]_[J/G]

                if($scope.distValues.directJP) {
                    deal = assignDistValues(deal, dealObj, 'res', 'Direct to Client', 'jp');
                    deal['RMM Total (Direct to Client JP)'] = $scope.calculateTotal(dealObj, $scope.months, 'res', 'Direct to Client', 'jp');
    
                    deal = assignDistValues(deal, dealObj, 'rev', 'Direct to Client', 'jp');
                    deal['Revenue Total (Direct to Client JP)'] = $scope.calculateTotal(dealObj, $scope.months, 'rev', 'Direct to Client', 'jp');
    
                    deal = assignDistValues(deal, dealObj, 'cm', 'Direct to Client', 'jp');
                    deal['CM Total (Direct to Client)'] = $scope.calculateTotal(dealObj, $scope.months, 'cm', 'Direct to Client', 'jp');
                }

                if($scope.distValues.intraJP) {
                    deal = assignDistValues(deal, dealObj, 'res', 'Intra-Company', 'jp');
                    deal['RMM Total (Intra-Company JP)'] = $scope.calculateTotal(dealObj, $scope.months, 'res', 'Intra-Company', 'jp');
    
                    deal = assignDistValues(deal, dealObj, 'rev', 'Intra-Company', 'jp');
                    deal['Revenue Total (Intra-Company JP)'] = $scope.calculateTotal(dealObj, $scope.months, 'rev', 'Intra-Company', 'jp');
    
                    deal = assignDistValues(deal, dealObj, 'cm', 'Intra-Company', 'jp');
                    deal['CM Total (Intra-Company)'] = $scope.calculateTotal(dealObj, $scope.months, 'cm', 'Intra-Company', 'jp');
                }

                if($scope.distValues.directGD) {                    
                    deal = assignDistValues(deal, dealObj, 'res', 'Direct to Client', 'gd');
                    deal['RMM Total (Direct to Client GD)'] = $scope.calculateTotal(dealObj, $scope.months, 'res', 'Direct to Client', 'gd');
    
                    deal = assignDistValues(deal, dealObj, 'rev', 'Direct to Client', 'gd');
                    deal['Revenue Total (Direct to Client GD)'] = $scope.calculateTotal(dealObj, $scope.months, 'rev', 'Direct to Client', 'gd');
                }

                if($scope.distValues.intraGD) {
                    deal = assignDistValues(deal, dealObj, 'res', 'Intra-Company', 'gd');
                    deal['RMM Total (Intra-Company GD)'] = $scope.calculateTotal(dealObj, $scope.months, 'res', 'Intra-Company', 'gd');
    
                    deal = assignDistValues(deal, dealObj, 'rev', 'Intra-Company', 'gd');
                    deal['Revenue Total (Intra-Company GD)'] = $scope.calculateTotal(dealObj, $scope.months, 'rev', 'Intra-Company', 'gd');
                }

                deal['BU Sales'] = dealObj.profile['AWS Resp (Sales) BU'];
                deal['BU Dev'] = dealObj.profile['AWS Resp (Dev) BU'];
                deal.Division = dealObj.profile['Division'];

                processedDeals.push(deal);
            })
            
            return processedDeals;
        }

        // Gets the distribution values (resources, revenue and cm) for the deals to be added in the exported file.
        function assignDistValues(deal, dealObj, dist, contract, distType) {
            for(var i = 0; i < $scope.months.length; i++){
                deal[`${$scope.formatMonthHeader($scope.months[i])}_${contract}_${dist}_${distType}`] = $scope.getDistValue(dealObj, $scope.months[i], dist, contract, distType);
            }
            return deal;
        }

        // Total values to be displayed in the last row of the table.
        function computeTotals(deals) {
            let total = {};

            $scope.months.map(month => {
                if($scope.distValues.directJP) {
                    total[`${$scope.formatMonthHeader(month)}_Direct to Client_res_jp`] = $scope.calculateDistValueTotal(deals, month, 'res', 'Direct to Client', 'jp');
                    total[`${$scope.formatMonthHeader(month)}_Direct to Client_rev_jp`] = $scope.calculateDistValueTotal(deals, month, 'rev', 'Direct to Client', 'jp');
                    total[`${$scope.formatMonthHeader(month)}_Direct to Client_cm_jp`] = $scope.calculateDistValueTotal(deals, month, 'cm', 'Direct to Client', 'jp');
                }

                if($scope.distValues.intraJP) {
                    total[`${$scope.formatMonthHeader(month)}_Intra-Company_res_jp`] = $scope.calculateDistValueTotal(deals, month, 'res', 'Intra-Company', 'jp');
                    total[`${$scope.formatMonthHeader(month)}_Intra-Company_rev_jp`] = $scope.calculateDistValueTotal(deals, month, 'rev', 'Intra-Company', 'jp');
                    total[`${$scope.formatMonthHeader(month)}_Intra-Company_cm_jp`] = $scope.calculateDistValueTotal(deals, month, 'cm', 'Intra-Company', 'jp');
                }

                if($scope.distValues.directGD) {                    
                    total[`${$scope.formatMonthHeader(month)}_Direct to Client_res_gd`] = $scope.calculateDistValueTotal(deals, month, 'res', 'Direct to Client', 'gd');
                    total[`${$scope.formatMonthHeader(month)}_Direct to Client_rev_gd`] = $scope.calculateDistValueTotal(deals, month, 'rev', 'Direct to Client', 'gd');
                }

                if($scope.distValues.intraGD) {
                    total[`${$scope.formatMonthHeader(month)}_Intra-Company_res_gd`] = $scope.calculateDistValueTotal(deals, month, 'res', 'Intra-Company', 'gd');
                    total[`${$scope.formatMonthHeader(month)}_Intra-Company_rev_gd`] = $scope.calculateDistValueTotal(deals, month, 'rev', 'Intra-Company', 'gd');
                }
            });
            
            if($scope.distValues.directJP) {
                total['RMM Total (Direct to Client JP)'] = $scope.calculateOverallTotal(deals, $scope.months, 'res', 'Direct to Client', 'jp')
                total['Revenue Total (Direct to Client JP)'] = $scope.calculateOverallTotal(deals, $scope.months, 'rev', 'Direct to Client', 'jp')
                total['CM Total (Direct to Client)'] = $scope.calculateOverallTotal(deals, $scope.months, 'cm', 'Direct to Client', 'jp')
            }

            if($scope.distValues.intraJP) {
                total['RMM Total (Intra-Company JP)'] = $scope.calculateOverallTotal(deals, $scope.months, 'res', 'Intra-Company', 'jp')
                total['Revenue Total (Intra-Company JP)'] = $scope.calculateOverallTotal(deals, $scope.months, 'rev', 'Intra-Company', 'jp')
                total['CM Total (Intra-Company)'] = $scope.calculateOverallTotal(deals, $scope.months, 'cm', 'Intra-Company', 'jp')
            }

            if($scope.distValues.directGD) {                    
                total['RMM Total (Direct to Client GD)'] = $scope.calculateOverallTotal(deals, $scope.months, 'res', 'Direct to Client', 'gd')
                total['Revenue Total (Direct to Client GD)'] = $scope.calculateOverallTotal(deals, $scope.months, 'rev', 'Direct to Client', 'gd')
            }

            if($scope.distValues.intraGD) {
                total['RMM Total (Intra-Company GD)'] = $scope.calculateOverallTotal(deals, $scope.months, 'res', 'Intra-Company', 'gd')
                total['Revenue Total (Intra-Company GD)'] = $scope.calculateOverallTotal(deals, $scope.months, 'rev', 'Intra-Company', 'gd')
            }

            return total;
        }
        /* END Francis Nash Jasmin 2022/05/04 */

        $scope.open = function (dealID) {
            window.open($state.href('dealForm', { ID: dealID }), dealID);
        }

        /*
        * START Francis Nash Jasmin 2022/03/15
        * 
        * Added formatting of dates to YYYY/MM/DD.
        * 
        */
        $scope.formatDate = (date) => {
            return moment(new Date(date)).format('YYYY/MM/DD');
        }
        /* END Francis Nash Jasmin 2022/03/15 */

        // Used to get values under resources, revenue and cm in a deal's distribution field.
        // value for dist is res, rev or cm
        // contract is Direct to Customer or Intra-Company
        // distType is jp or gd
        $scope.getDistValue = function(deal, month, dist, contract, distType) {
            if(deal.distribution[contract] !== undefined) {
                if(deal.distribution[contract][dist] !== undefined) {
                    if(deal.distribution[contract][dist][distType] !== undefined) {
                        // cm field in distribution does not have jp or gd subfield
                        /* START Francis Nash Jasmin 2022/03/15 Added parsing of numbers to Float when displaying in table and computing for totals. */
                        if(dist === 'cm') {
                            if(Object.keys(deal.distribution[contract][dist]).includes(month.substring(0, 7))) {
                                return parseFloat(deal.distribution[contract][dist][month.substring(0, 7)]);
                            } else return '';
                        }
                        if(Object.keys(deal.distribution[contract][dist][distType]).includes(month.substring(0, 7))) {
                            return parseFloat(deal.distribution[contract][dist][distType][month.substring(0, 7)]);
                        } else return '';
                        /* END Francis Nash Jasmin 2022/03/15 */
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
            return total;
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
            return total;
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
            return total;
        }

        /*
        * START Francis Nash Jasmin 2022/02/28
        * 
        * Added code for formatting dates (MM/YY).
        * 
        */
        $scope.formatMonthHeader = function(month) {
            return moment(month).format('MM/YY');
        }
        /* END Francis Nash Jasmin 2022/02/21 */
    }
}());

/*  END Francis Nash Jasmin 2022/02 */
