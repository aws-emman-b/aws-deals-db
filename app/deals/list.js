(function () {
    'use strict';

    angular
        .module('app')
        .controller('DealListController', Controller)

        /*
            Function name: Pagination filter
            Author(s): Flamiano, Glenn
            Date Created: June 6, 2018
            Date Modified: June 6, 2018
            Description: to slice table per page based on number of items
            Parameter(s): none
            Return: Array
        */
        .filter('pagination', function () {
            return function (data, start) {
                //data is an array. slice is removing all items past the start point
                return data.slice(start);
            };
        });



    function Controller($scope, $rootScope, $state, ModulesService, DealsService, TableService, ngToast, $filter) {

        //enable load if data for table is not yet fetched
        $scope.loading = true;

        $scope.DATE_FORMAT = 'MM/dd/yyyy';

        $scope.deals = [];
        $scope.filteredDeals = [];

        $scope.fields = {
            essential: [],
            profile: [],
            process: [],
            distribution: [],
            status: []
        };

        $scope.currentPage = 1;
        $scope.pageSize = 7;

        $scope.reverse = false;

        $scope.displayOption = 'Active';

        $scope.search = {};
        $scope.searchColumn = 'all,$';

        //default names as per review comments
        $scope.columnNames = {
            essential: {
                'ID': 'No',
                'Deal Name': 'Deal Name',
                'Due Date': 'Due'
            },
            profile: {
                'Client': 'Client',
                'AWS Resp (Sales) person': 'AWS Sales',
                'AWS Resp (Dev) person': 'AWS Dev',
                'Type': 'Type',
                'Level': 'Level',
                'Confidence': 'Confidence',
                'Resource Size (MM)': 'MM',
                'Resource Size (FTE)': 'FTE',
                'Revenue': 'Budget',
                'CM': 'CM%',
                'Duration (Start)': 'Start',
                'Duration (End)': 'End'
            },
            process: {
                'SRB No': 'SRB No',
                'SRB Date': 'SRB',
                'SRB Status': 'SRB Status',
                'SOW Scheme': 'SOW Scheme',
                'SOW Date': 'SOW'
            }
        }

        $scope.users = [];

        $scope.getDeals = function () {
            ModulesService.getAllModuleDocs('deals').then(function (allDeals) {
                $scope.deals = allDeals;
                switch ($scope.displayOption) {
                    //display levels 2,3,4,5 only
                    case 'Active': {
                        $scope.deals = $scope.deals.filter(function (aDeal) {
                            return aDeal.profile['Level'] !== '1' && aDeal.profile['Level'] !== '9';
                        });
                    } break;

                    case 'Mine': {
                        $scope.deals = $scope.deals.filter(function (aDeal) {
                            return ((aDeal.profile['Level'] !== '1' && aDeal.profile['Level'] !== '9') &&
                                (aDeal.profile['AWS Resp (Sales) person'] === $rootScope.user.email ||
                                    aDeal.profile['AWS Resp (Dev) person'] === $rootScope.user.email));
                        });
                    } break;
                    //1 - same as active
                    //2 - showing 1 month (up to next month) (active deals that are due before next month)
                    //3 - unclosed deals whose due date is before this month
                    case '1 Month': {
                        var nextMonth = moment().add(1, 'months').endOf('month');
                        //console.log(nextMonth.month());
                        var diff;
                        $scope.deals = $scope.deals.filter(function (aDeal) {
                            //using 'months' in .diff() results to 0 for the next month and next next month
                            //e.g. current month is june, so july 31 is next month
                            //if this is used, deals due on august are also included
                            diff = nextMonth.diff(aDeal.essential['Due Date'].replace(/\//g, '-'), 'months', true);
                            //console.log(diff);
                            return ((aDeal.profile['Level'] !== '1' && aDeal.profile['Level'] !== '9') &&
                                (diff >= 0));
                        });
                    } break;
                    case '2-3 Months': {
                        var nextMonth = moment().add(3, 'months').endOf('month');
                        //console.log(nextMonth.month());
                        var diff;
                        $scope.deals = $scope.deals.filter(function (aDeal) {
                            //use true to get decimal places. this is to avoid having 0s for adjacent months
                            //i.e. next month & next next month
                            diff = nextMonth.diff(aDeal.essential['Due Date'].replace(/\//g, '-'), 'months', true);
                            //console.log(diff);
                            return ((aDeal.profile['Level'] !== '1' && aDeal.profile['Level'] !== '9') &&
                                (diff >= 0 && diff <= 2));
                        });
                    } break;
                    case 'Over Due': {
                        $scope.deals = $scope.deals.filter(function (aDeal) {
                            return aDeal.profile['Level'] !== '1' &&
                                aDeal.profile['Level'] !== '9' &&
                                moment().diff(aDeal.essential['Due Date'].replace(/\//g, '-'), 'days') > 0;
                        });
                    } break;

                    case 'Closed in 2018': {
                        $scope.deals = $scope.deals.filter(function (aDeal) {
                            return aDeal.profile['Level'] === '1' &&
                                moment(aDeal.closedDate).year() === new Date().getFullYear();
                        });
                    }
                }
                //getAllFields();
                processDeals();

            }).catch(function (err) {

            }).finally(function () {
                $scope.loading = false;
            });
        }

        function getAllFields() {
            ModulesService.getAllModules().then(function (allModules) {
                var category;
                for (var i = 0; i < allModules.length; i++) {
                    //first condition is to make sure that collections that have 'deal' in its name are only processed.
                    if (allModules[i].name.search('deal') !== -1 && allModules[i].name !== 'deals') {
                        category = allModules[i].name.replace('deal', '');
                        $scope.fields[category] = allModules[i].fields;
                    }
                }
            }).catch(function (err) {
            });
        }

        function getUsers() {
            ModulesService.getAllModuleDocs('users').then(function (users) {
                $scope.users = users;
            }).catch(function (err) {
                ngToast.danger('cannot find users');
            });
        }

        //getAllFields() must be called first
        getAllFields();
        getUsers();
        $scope.getDeals();

        $scope.sortColumn = function (category, fieldName) {
            //$scope.column = category + '.' + fieldName;
            $scope.column = category + "['" + fieldName + "']";
            $scope.reverse = TableService.sortSelectedColumn($scope.reverse, $scope.column).result;
        }

        $scope.sortClass = function (category, fieldName) {
            return TableService.sortSelectedClass($scope.reverse, category + "['" + fieldName + "']", $scope.column);
        }

        /* $scope.deleteDeal = function (aDeal) {
            console.log('weee');
            if (confirm('are you sure you want to delete ' + aDeal.essential['Deal Name'] + '?')) {
                DealsService.deleteDeal(aDeal.ID).then(function () {
                    getAllDeals();
                }).catch(function (err) {});
            }
        } */

        /* $scope.uploadFile = function () {
            const file = $('#newDealFile')[0].files[0];
            DealsService.newDealFile(file).then(function () {
                ngToast.success('File uploaded');
                $scope.getDeals();
            })
                .catch(function (err) {
                    ngToast.danger('Error in uploading file');
                });
        } */

        function processDeals() {
            //ewww dirty code 2 for loops, bale 3 nested loops all in all :(
            //delete properties of each deal which are not shown in the list to avoid its values being searched
            var awsSales, awsDev, assignee;
            angular.forEach($scope.deals, function (aDeal) {
                //delete 'Change history' and '_id' property. use 'ID' to open a deal
                delete aDeal['Change History'], delete aDeal['_id'];

                //find user by the data (id) stored in the deal's AWS Sales & AWS Dev
                awsSales = $scope.users.find(function (user) {
                    return user.email === aDeal['profile']['AWS Resp (Sales) person'];
                });

                awsDev = $scope.users.find(function (user) {
                    return user.email === aDeal['profile']['AWS Resp (Dev) person'];
                });

                assignee = $scope.users.find(function (user) {
                    return user.email === aDeal['essential']['Assignee'];
                });

                //assign nickname to AWS Sales & AWS Dev
                if (awsSales !== undefined) {
                    aDeal['profile']['AWS Resp (Sales) person'] = awsSales.nickname;
                }

                if (awsDev !== undefined) {
                    aDeal['profile']['AWS Resp (Dev) person'] = awsDev.nickname;
                }

                if (assignee !== undefined) {
                    aDeal['essential']['Assignee'] = assignee.nickname;
                }

                for (var category in $scope.fields) {
                    angular.forEach($scope.fields[category], function (aField) {

                        if (!aField.showInList) {
                            delete aDeal[category][aField.name];
                        } else if (!aField.default) {
                            //store user-added fields to column names
                            $scope.columnNames[category][aField.name] = aField.name;
                        }

                        //format date to MM/DD
                        //console.log(aDeal[category][aField.name]);
                        if (aField.type === 'date' && aDeal[category][aField.name] !== undefined) {
                            aDeal[category][aField.name] = moment(aDeal[category][aField.name].replace(/\//g, '-')).format('MM/DD');
                        }

                    });
                }
            });

            //filtered deals is the array of the table
            $scope.filteredDeals = $scope.deals;
        }

        $scope.open = function (dealID) {
            window.open($state.href('dealForm', { ID: dealID }), dealID);
        }

        $scope.setSearch = function () {
            //console.log($scope.searchColumn);
            //reset the search object
            $scope.search = {};

            var splitted = angular.copy($scope.searchColumn.split(','));
            if (splitted[0] === 'all' || splitted[1] === 'ID') {
                $scope.search[splitted[1]] = $scope.searchText;
            //perform this only if searchText is not blank and not undefined
            } else if($scope.searchText !== '' && $scope.searchText !== undefined) {
                //needed to initialize 'first' layer to avoid undefined
                $scope.search[splitted[0]] = {};
                $scope.search[splitted[0]][splitted[1]] = $scope.searchText;
            }
            //console.log($scope.search);

            //filtering is done here to update the filteredDeals's length which is needed in pagination
            //filter the deals according to the search object
            $scope.filteredDeals = $filter('filter')($scope.deals, $scope.search);
        }

        //export excel from html
        $scope.exportData = function () {

            //get current date and time
            var today = new Date();
            var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
            var currentDateAndTime = date+' '+time;

            var fileUserName = '';
           
            if($rootScope.user.firstName === undefined || $rootScope.user.lastName === undefined){
                fileUserName = $rootScope.user.email;
            } else {
                fileUserName = $rootScope.user.firstName+' '+$rootScope.user.lastName;
            }

            var excelData = document.querySelector("#exportForExcel");
            TableToExcel.convert(excelData);
            //var excelData = document.getElementById('exportForExcel').innerHTML;
            //console.log(excelData);
            /*var blob = new Blob([excelData], {
                type: "application/vnd.ms-excel"
            });
            saveAs(blob, 'Deals List - '+fileUserName+' '+currentDateAndTime+'.xls');*/
        }

        //export as excel file from JSON
        /*$scope.exportExcel = function() {
            console.log($scope.deals);
            $scope.dealsExcel = [];
            ngToast.success("Excel file exported");
            for(var i=0;i<$scope.deals.length;i++){
                //console.log($scope.deals[i]['essential']);
                var dealID = {};
                
                dealID['ID'] = $scope.deals[i]['ID'];

                var essentialExcel = $scope.deals[i]['essential'];
                var profileExcel = $scope.deals[i]['profile'];
                var processExcel = $scope.deals[i]['process'];

                //it is in order top down
                var combinedfinal = {
                    ...dealID,
                    ...essentialExcel,
                    ...profileExcel,
                    ...processExcel
                };
                
                $scope.dealsExcel.push(combinedfinal);
            }
            console.log($scope.dealsExcel);
            
            //get current date and time
            var today = new Date();
            var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
            var time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
            var currentDateAndTime = date+' '+time;

            var fileUserName = '';
           
            if($rootScope.user.firstName === undefined || $rootScope.user.lastName === undefined){
                fileUserName = $rootScope.user.email;
            } else {
                fileUserName = $rootScope.user.firstName+' '+$rootScope.user.lastName;
            }
            alasql('SELECT * INTO XLSX("Deals List - '+fileUserName+' '+currentDateAndTime+'.xlsx",{headers:true}) FROM ?',[$scope.dealsExcel]);
        }*/
    }
})();