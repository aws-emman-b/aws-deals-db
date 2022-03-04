(function () {
    'use strict';

    angular
        .module('app')
        .controller('DealFormController', Controller)
        .directive('numberInput', Directive);

    function Controller($scope, $rootScope, $state, $stateParams, $filter, ModulesService, DealsService, ClientService, ngToast) {
        /*
        * START Francis Nash Jasmin 2022/02/21
        * 
        * Gets the Japanese equivalent of the step code.
        * 
        */
        // Used to fetch the json file step_levels
        $scope.steps_levels = {}
        fetch('./import/steps_levels.json')
            .then(res => res.json())
            .then(data => {
                $scope.steps_levels = data; 
            })
            .catch(err => console.log(err))

        // Get the equivalent Japanese translation for the step.
        $scope.getStepJA = (stepCode) => {
            if(stepCode !== undefined) {
                let steps = $scope.steps_levels.Steps;
                let stepJA = steps ? steps.find(step => { return step.Level === stepCode }).JA : '';
                return stepJA;
            }
        }
        /* END Francis Nash Jasmin 2022/02/21 */

        //ng-model for a deal
        $scope.dealForm = {
            essential: {},
            profile: {},
            process: {},
            distribution: {},
            status: {},
            content: {}
        };

        //working format for two way conversion
        $scope.DATE_FORMAT = 'yyyy/MM/dd';

        //initialize clients array
        $scope.clients = [];

        //initialize users array
        //initialize business units array
        $scope.users = [];
        $scope.businessUnits = [];
        $scope.salesBU = [];
        $scope.devBU = [];

        //initialize variables for distribution section
        $scope.currentMonths = [];
        $scope.startingMonthYear = new Date();
        //this will not change even if startingMonthYear is changed
        //starting day is april 01, ending month is march 31
        //even though display format is yyyy/MM/dd, use yyyy-MM-dd in conversion or computation of dates since the latter is a standard format
        $scope.currentFiscalYear = {
            currentYearMonthBefore: $scope.startingMonthYear.getFullYear() + '-03-01', //this is the starting point for calculating starting April
            currentYear: $scope.startingMonthYear.getFullYear() + '-04-01',
            nextYear: ($scope.startingMonthYear.getFullYear() + 1) + '-03-31',
            years: $scope.startingMonthYear.getFullYear() + '-' + ($scope.startingMonthYear.getFullYear() + 1)
        };

        //store in arrays to be able to use ng-repeat
        $scope.fields = {
            essential: [],
            profile: [],
            process: [],
            distribution: [],
            status: [],
            content: []
        };

        //default strings for distribution table
        var distributionStrings = {
            direct: 'Direct to Client',
            intra: 'Intra-Company'
        };

        //default selected for distribution table
        $scope.contracts = [distributionStrings.direct];

        //variables for parsing excel file
        var rABS = true;
        $scope.showUpload = true;

        //store total computations outside of dealForm.distribution to avoid registering changes in $scope.$watch
        //set this to dealForm.distribution[dealForm.process['SOW Scheme']].total during submit
        $scope.total = {};
        //initialize $scope.total based from distribution strings
        $scope.total[distributionStrings.direct] = {};
        $scope.total[distributionStrings.direct][$scope.currentFiscalYear.years] = {};
        $scope.total[distributionStrings.intra] = {};
        $scope.total[distributionStrings.intra][$scope.currentFiscalYear.years] = {};

        //get the fields arrays of dealessential, dealprofile, dealprocess, dealstatus, and dealcontent
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

        //called once
        getAllFields();

        function getClients() {
            /*ClientService.getAllClients().then(function (clients) {
                $scope.clients = clients;
            }).catch(function () {

            });*/
            ModulesService.getAllModuleDocs('clients').then(function (clients) {
                $scope.clients = clients.filter(function (aClient) {
                    //do not include inactive/deleted clients
                    return aClient.status !== false;
                });
            }).catch(function (err) {

            });

        }

        //called once
        getClients();

        //for now, exclude accounts with admin roles and only active users
        function getAllUsers() {
            ModulesService.getAllModuleDocs('users').then(function (users) {
                $scope.users = users.filter(function (aUser) {
                    return (aUser.role !== 'Admin' && aUser.status === true);
                });
            }).catch(function (err) {

            });
        }

        //called once
        getAllUsers();

        function getAllBUs() {
            ModulesService.getAllModuleDocs('businessunits').then(function (businessUnits) {

                //exclude deactivated business units
                $scope.businessUnits = businessUnits.filter(function (aBusinessUnit) {
                    //do not include inactive/deleted clients
                    return aBusinessUnit.status !== false;
                });
                $scope.salesBU = $scope.businessUnits.filter(function(businessUnit) {
                    return businessUnit['Category'] === 'Sales';
                });

                $scope.devBU = $scope.businessUnits.filter(function(businessUnit) {
                    return businessUnit['Category'] === 'Dev';
                });
            }).catch(function (err) {

            });
        }

        //called once
        getAllBUs();

        //if there is a parameter on the url, it means that a deal is loaded and will be updated
        if ($stateParams.ID !== '') {
            //get one then store to $scope.dealForm;
            DealsService.getDealById($stateParams.ID).then(function (aDeal) {
                //use true to convert datestrings to date objects
                $scope.dealForm = preProcess(aDeal, true);
                /*
                * START Francis Nash Jasmin 2022/02/21
                * 
                * Sets the starting month of the distribution table to the duration start of the deal.
                * 
                */
                $scope.startingMonthYear = $scope.dealForm.profile['Duration (Start)'];
                /* END Francis Nash Jasmin 2022/02/21 */
                $scope.showUpload = false;
                //console.log($scope.dealForm);
            }).catch(function () {
                //$scope.message = 'Cannot find the deal';
                $scope.showUpload = false;
                ngToast.danger('Cannot find the deal');
            });
        }

        $scope.submit = function () {
            //use Object.assign(target, source) instead
            var tempDealForm = {};
            Object.assign(tempDealForm, $scope.dealForm);

            //use false to convert date objects to datestrings
            try {
                tempDealForm = preProcess(tempDealForm, false);
                if (tempDealForm._id === undefined) {
                    DealsService.addDeal(tempDealForm)
                        .then(function () {
                            ngToast.success('Deal added');
                            $state.transitionTo('dealList');
                        })
                        .catch(function (err) {

                        });
                } else {
                    DealsService.updateDeal(tempDealForm)
                        .then(function () {
                            ngToast.success('Deal updated');
                            $state.transitionTo('dealList');
                        })
                        .catch(function () {

                        });
                }
            } catch (e) {
                //console.log(e);
                //$scope.message = e.message;
                ngToast.danger(e.message);
            }
        }

        //update the distribution table headers whenever input starting month is changed
        $scope.$watch('startingMonthYear', function () {
            //reset the array
            $scope.currentMonths = [];

            //assign to the current date if input is null
            if ($scope.startingMonthYear === null) {
                $scope.startingMonthYear = new Date();
            }
            //+ 1 since javascript months starts with 0
            var setMonth = $scope.startingMonthYear.getMonth() + 1;
            var setYear = $scope.startingMonthYear.getFullYear();
            var temp = '';
            var i;

            i = setMonth;
            //this loop populates table headers for the distribution table (for 1 year)
            //it also puts leading '0' if month is < 10
            do {
                //next year
                if (i < setMonth) {
                    temp = (i < 10) ? ((setYear + 1) + '/' + '0' + i) : ((setYear + 1) + '/' + i);
                    //current year
                } else {
                    temp = (i < 10) ? (setYear + '/' + '0' + i) : (setYear + '/' + i);
                }

                $scope.currentMonths.push(temp);
                //console.log($scope.currentMonths);

                //use modulo to set i as 1 instead of 13
                i = (i % 12 === 0) ? 1 : (i + 1);
            //exit loop initial month repeats
            } while (i != setMonth);
            
            /*
            * START Francis Nash Jasmin 2022/03/02
            * 
            * Calls the computeDistribution function when starting month is changed.
            * 
            */
            computeDistribution();
            /* END Francis Nash Jasmin 2022/03/03 */
        });

        //$scope.getCurrentDisplay();

        //this function processes the data (e.g. conversion of date objects [from html] to datestrings)
        function preProcess(dealForm, isLoaded) {
            var tempObject = dealForm;

            //perform operations on variables that you can explicitly determine here
            //during load
            if (isLoaded) {
                //set the sow scheme (for the distribution table)
                $scope.setContracts(tempObject.process['SOW Scheme']);
            //during submit
            } else {
                //explicitly set SOW scheme (because default selected options is not working) to Direct
                if (tempObject.process['SOW Scheme'] === null || tempObject.process['SOW Scheme'] === undefined) {
                    tempObject.process['SOW Scheme'] = 'Direct to Customer';
                }

                /*
                * START Francis Nash Jasmin 2022/02/21
                * 
                * Added storing of step description in Japanese for a deal.
                * 
                */
                tempObject.profile['Step Description'] = $scope.getStepJA(tempObject.profile['Step']);
                /* END Francis Nash Jasmin 2022/02/22 */

                //throw error if start date > end date
                if (tempObject.profile['Duration (Start)'] > tempObject.profile['Duration (End)']) {
                    throw new Error('Start Date must be before the End Date');
                }

                //throw error if Due Date > SOW Date
                if (tempObject.essential['Due Date'] > tempObject.process['SOW Date']) {
                    throw new Error('Due date must be before the SOW Date');
                }

                //set $scope.total to distribution['total']
                tempObject.distribution['total'] = $scope.total;


            }

            //use $scope.fields and iterate each array
            angular.forEach($scope.fields, function (fields, category) {
                var i, currentField;
                for (i = 0; i < fields.length; i++) {
                    currentField = $scope.fields[category][i];

                    //preprocess when loading
                    if (isLoaded) {
                        if (currentField.type === 'date' && tempObject[category][currentField.name]) {
                            //change format to yyyy-MM-dd
                            const tempDate = tempObject[category][currentField.name].replace(/\//g, '-');
                            tempObject[category][currentField.name] = new Date(tempDate);
                        }
                        //preprocess during submit
                    } else {
                        //do not store keys with null values
                        if (tempObject[category][currentField.name] === null) {
                            delete tempObject[category][currentField.name];
                        }

                        if (currentField.type === 'date' && tempObject[category][currentField.name]) {
                            //convert date object to datestring with prescribed format
                            tempObject[category][currentField.name] = $filter('date')(tempObject[category][currentField.name], $scope.DATE_FORMAT);
                        }
                    }
                }

            });

            return tempObject;
        }

        //returns the field object from the array of specified category (called from html)
        $scope.getField = function (category, fieldName) {
            return $scope.fields[category].find(function (field) {
                return field.name === fieldName;
            });
        }

        //updates the distribution table display according to the selected SOW Scheme
        //$scope.contracts is used in ng-repeat as well as an object property
        $scope.setContracts = function (sowScheme) {
            if (sowScheme === 'Transfer Pricing to UBICOM') {
                $scope.contracts = [distributionStrings.intra, distributionStrings.direct];
            } else {
                $scope.contracts = [distributionStrings.direct];
            }
        }

        //use true to register changes in values
        //this will be called whenever there is a change in the distribution property of $scope.dealForm
        $scope.$watch('dealForm.distribution', function () {
            //perform check so that errors are avoided when $scope.dealForm.distribution is being initialized
            if (!angular.equals($scope.dealForm.distribution, {})) {
                computeDistribution();
            }
        }, true);

        //this function computes total resource, revenue, and CM for the CURRENT fiscal year
        function computeDistribution() {
            /*
            Note isBetween the starting point is (currentYear)-03-01 because if starts at april, it
            won't accept the first value of the array
            */
            //use variables like sumRes as temporary sum
            var i, resJP, resGD, revJP, revGD, cm, resSum, revSum, cmSum, forCompute, editedProp;
            // TODO: Adjust automatically based on duration start
            var start = moment($scope.startingMonthYear).subtract(1, 'months').format('YYYY-MM-DD');
            var end = moment($scope.startingMonthYear).add(12, 'month').format('YYYY-MM-DD');
            //for direct or indirect
            for (i = 0; i < $scope.contracts.length; i++) {
                //console.log($scope.dealForm.distribution[$scope.contracts[i]].res);
                //reset per contract
                resJP = [], resGD = [], revJP = [], revGD = [], cm = [];
                resSum = 0, revSum = 0, cmSum = 0;
                //compute total resource
                if ($scope.dealForm.distribution[$scope.contracts[i]] !== undefined) {
                    /**
                     * check if not undefined to avoid displaying errors
                     * for res & rev, need to check both jp & gd if not undefined to avoid errors
                     * */
                    //use object.values since they are all integers
                    
                    /*
                    * START Francis Nash Jasmin 2022/03/02
                    * 
                    * Adjusted months included in computing for total values in distribution.
                    * 
                    */
                    
                    //Resource (MM)
                    if ($scope.dealForm.distribution[$scope.contracts[i]].res !== undefined) {
                        //for JP
                        if ($scope.dealForm.distribution[$scope.contracts[i]].res.jp !== undefined) {
                            forCompute = {};
                            Object.assign(forCompute, $scope.dealForm.distribution[$scope.contracts[i]].res.jp);
                            for (var prop in forCompute) {
                                //prop is assumed to have yyyy/MM format (from $scope.getCurrentDisplay())
                                //to properly use moment, convert it to yyyy-MM-01 (01 since date is not given)
                                editedProp = prop.replace(/\//, '-') + '-01';
                                //console.log($scope.currentFiscalYear.currentYear);
                                //this condition is to check if yyyy/MM is within current fiscal year
                                if (!moment(editedProp)
                                    .isBetween(start, end) || forCompute[prop] === null) {
                                        //console.log('not included '+forCompute[prop]);
                                    delete forCompute[prop];
                                }
                            }
                            resJP = Object.values(forCompute);
                            //console.log(resJP);
                        }

                        //for GD
                        if ($scope.dealForm.distribution[$scope.contracts[i]].res.gd !== undefined) {
                            forCompute = {};
                            Object.assign(forCompute, $scope.dealForm.distribution[$scope.contracts[i]].res.gd);
                            for (var prop in forCompute) {
                                editedProp = prop.replace(/\//, '-') + '-01';
                                if (!moment(editedProp)
                                    .isBetween(start, end) || forCompute[prop] === null) {

                                    delete forCompute[prop];
                                }
                            }
                            resGD = Object.values(forCompute);
                        }

                        //compute total resource
                        if (resJP.length > 0 || resGD.length > 0) {
                            resSum = resJP.concat(resGD).reduce(function (total, value) {
                                return (value !== undefined && value !== null) ? total + value : total + 0;
                            });
                        }
                    }

                    //Revenue (JPY)
                    if ($scope.dealForm.distribution[$scope.contracts[i]].rev !== undefined) {
                        //for JP
                        if ($scope.dealForm.distribution[$scope.contracts[i]].rev.jp !== undefined) {
                            forCompute = {};
                            Object.assign(forCompute, $scope.dealForm.distribution[$scope.contracts[i]].rev.jp);
                            for (var prop in forCompute) {
                                editedProp = prop.replace(/\//, '-') + '-01';
                                if (!moment(editedProp)
                                    .isBetween(start, end) || forCompute[prop] === null) {

                                    delete forCompute[prop];
                                }
                            }
                            revJP = Object.values(forCompute);
                        }
                        //for GD
                        if ($scope.dealForm.distribution[$scope.contracts[i]].rev.gd !== undefined) {
                            forCompute = {};
                            Object.assign(forCompute, $scope.dealForm.distribution[$scope.contracts[i]].rev.gd);
                            for (var prop in forCompute) {
                                editedProp = prop.replace(/\//, '-') + '-01';
                                if (!moment(editedProp)
                                    .isBetween(start, end) || forCompute[prop] === null) {

                                    delete forCompute[prop];
                                }
                            }
                            revGD = Object.values(forCompute);
                        }

                        //compute total revenue
                        if (revJP.length > 0 || revGD.length > 0) {
                            revSum = revJP.concat(revGD).reduce(function (total, value) {
                                return (value !== undefined && value !== null) ? total + value : total + 0;
                            });
                        }
                    }

                    //CM (JPY)
                    if ($scope.dealForm.distribution[$scope.contracts[i]].cm !== undefined) {
                        forCompute = {};
                        Object.assign(forCompute, $scope.dealForm.distribution[$scope.contracts[i]].cm);
                        for (var prop in forCompute) {
                            editedProp = prop.replace(/\//, '-') + '-01';
                            if (!moment(editedProp)
                                .isBetween(start, end) || forCompute[prop] === null) {

                                delete forCompute[prop];
                            }
                        }
                        cm = Object.values(forCompute);

                        //compute total cm
                        if (cm.length > 0) {
                            cmSum = cm.reduce(function (total, value) {
                                return (value !== undefined && value !== null) ? total + value : total + 0;
                            });
                        }
                    }
                    /* END Francis Nash Jasmin 2022/03/03 */

                    //console.log(resSum, revSum, cmSum);

                    //perform null check cleared inputs (entered then deleted values) become null

                    $scope.total[$scope.contracts[i]][$scope.currentFiscalYear.years].resource = (resSum !== null) ? resSum : 0;
                    $scope.total[$scope.contracts[i]][$scope.currentFiscalYear.years].revenue = (revSum !== null) ? revSum : 0;
                    //((revSum / resSum) !== NaN) does not work
                    var tempAverage = revSum / resSum;
                    var tempPercent = (cmSum / revSum) * 100;

                    $scope.total[$scope.contracts[i]][$scope.currentFiscalYear.years].average = (tempAverage !== Infinity) ? tempAverage : 0;
                    $scope.total[$scope.contracts[i]][$scope.currentFiscalYear.years].cm = (cmSum !== null) ? cmSum : 0;
                    $scope.total[$scope.contracts[i]][$scope.currentFiscalYear.years].percent = (tempPercent !== Infinity) ? tempPercent : 0;
                    //console.log($scope.total);

                    //console.log(revSum / resSum);

                    // Added by Glenn
                    //Assign Total Revenue and CM to Revenue in Profile
                    $scope.dealForm.profile['Revenue'] = revSum;
                    $scope.dealForm.profile['CM'] = cmSum;
                }
            }
        }

        //get the latest change date for the specified level from $scope.dealForm['Change History'] array
        //since all changes are pushed into the change history, get the last index
        //called from Change History table in html
        $scope.getLatestChangeDate = function (level) {
            if ($scope.dealForm['Change History'] !== undefined) {
                var tempArray = [];
                tempArray = $scope.dealForm['Change History'].filter(function (change) {
                    return change.level === level;
                });
                return (tempArray[tempArray.length - 1]) ? tempArray[tempArray.length - 1].date : '';
            } else {
                return '';
            }
        }

        //function for reading spreadsheet data & filling $scope.dealForm
        //currently NOT USED because: it works on .ods files BUT NOT on .xls files :(
        function processExcel(e) {
            var spreadsheet, j, rows;
            var tempObject = {
                essential: {},
                profile: {},
                process: {},
                distribution: {},
                status: {},
                content: {}
            };
            var numberFields = ['Resource Size (MM)', 'Resource Size (FTE)', 'Revenue', 'CM'];

            var files = e.target.files;
            var f = files[0];
            var reader = new FileReader();
            reader.onerror = function(ex){
                console.log(ex);
            };
            reader.onload = function (e) {
                var data = e.target.result;
                if (!rABS) {
                    data = new Uint8Array(data);
                }
                spreadsheet = XLSX.read(data, { type: (rABS) ? 'binary' : 'array' });

                //delete 'options' sheet (this sheet is for dropdown options which MUST be the same as the deal form)
                spreadsheet['SheetNames'].splice(spreadsheet['SheetNames'].indexOf('options'), 1);

                //console.log('spreadsheet', spreadsheet);
                //get the contents of each sheet (each category)
                for (var i = 0; i < spreadsheet['SheetNames'].length; i++) {
                    //initialize variables
                    //get the keys which represents the cells
                    rows = Object.keys(spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]);

                    //check the rows, skip the sheet if it is empty (e.g. distribution table may be empty for now)
                    if (rows.length === 0) {
                        continue;
                    }

                    j = 1;
                    tempObject[spreadsheet['SheetNames'][i]] = {};
                    do {
                        //store cell's value if not undefined
                        if (spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j] !== undefined) {
                            
                                /* ['A' + j] & ['B' + j] will result to the cell then the 'w' property is the value (formatted text) of that cell
                                ['A' + j].w is the field from the template, ['B' + j].w is the value inputted by the user
                                example of object structure
                                spreadsheet['SheetNames'][i] = 'profile'
                                spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['A' + j].w = 'Country'
                                spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j].w = 'PH'
                                the difference between v & w is that the v is the true value (if number, etc) whereas w is just the formatted text
                                this is important since Resource Size are in numbers, Level & Step are strings, and Dates are in strings */
                             

                            //console.log(spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j]);
                            tempObject[spreadsheet['SheetNames'][i]][spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['A' + j].w] =
                                (numberFields.indexOf(spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['A' + j].w) !== -1) ?
                                    spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j].v : spreadsheet['Sheets'][spreadsheet['SheetNames'][i]]['B' + j].w;
                        }
                        //increment j
                        j++;
                        //!ref is the last key of each sheet object. this tells the range of cells e.g. 'A1:B4'
                    } while (rows[j] !== '!ref');
                }

                //console.log(tempObject);
                //need to wrap assignment to $scope.$apply() to update the bindings in the html immediately
                $scope.$apply(function () {
                    $scope.dealForm = preProcess(tempObject, true);
                });
                //console.log($scope.dealForm);
            }

            if (rABS) {
                reader.readAsBinaryString(f);
            } else {
                reader.readAsArrayBuffer(f);
            }
        }

        //$('#newDealFile')[0].addEventListener('change', processExcel, false);

        //this function returns the corresponding message depending on the error. 
        $scope.getTooltipMessage = function (formElementName) {
            if (formElementName !== undefined) {
                return (formElementName.$error.required) ? 'Please fill out this field' :
                    (formElementName.$error.parse) ? 'Please input a valid date' :
                        (formElementName.$error.email) ? 'Please input a valid email address' :
                            (formElementName.$error.min) ? 'Please input a value greater than or equal to ' + formElementName.$$element[0].min :
                                (formElementName.$error.max) ? 'Please input a value less than or equal to ' + formElementName.$$element[0].max :
                                    (formElementName.$error.step) ? 'Please input a value with increments of ' + formElementName.$$element[0].step :
                                        (formElementName.$valid) ? '' :
                                            'Invalid input';
            }

            return '';
        }

        //filter the options for 'AWS Resp (Sales) BU' depending on the selected 'AWS Resp (Sales) person'
        $scope.setSalesBU = function() {
            $scope.salesBU = $scope.businessUnits.filter(function(businessUnit) {
                return businessUnit['Category'] === 'Sales' && businessUnit['Manager'] === $scope.dealForm['profile']['AWS Resp (Sales) person'];
            });
        }

        //filter the options for 'AWS Resp (Dev) BU' depending on the selected 'AWS Resp (Dev) person'
        $scope.setDevBU = function() {
            $scope.devBU = $scope.businessUnits.filter(function(businessUnit) {
                return businessUnit['Category'] === 'Dev' && businessUnit['Manager'] === $scope.dealForm['profile']['AWS Resp (Dev) person'];
            });

            //auto-selects the BU if there is only 1 result
            if($scope.devBU.length === 1) {
                $scope.dealForm['profile']['AWS Resp (Dev) BU'] = $scope.devBU[0].BU;
            }
        }
    }

    /*
    * START Francis Nash Jasmin 2022/02/04
    * 
    * Displays numeric input as comma-separated in the deals form.
    * 
    */
    function Directive($filter) {
        return {
          require: 'ngModel',
          link: function(scope, elem, attrs, ngModelCtrl) {
      
            ngModelCtrl.$formatters.push(function(modelValue) {
                return setDisplayNumber(modelValue, true);
            });
      
            ngModelCtrl.$parsers.push(function(viewValue) {
                setDisplayNumber(viewValue);
                return setModelNumber(viewValue);
            });
      
            // Sets the displayed number in the field with commas
            elem.bind('keyup focus', function() {
                setDisplayNumber(elem.val());
            });
      
            function setDisplayNumber(val, formatter) {
                var valStr, displayValue;
        
                // If no value is entered yet, do not display anything in the field.
                if (typeof val === 'undefined') {
                    return '';
                }
        
                valStr = val.toString();
                displayValue = valStr.replace(/,/g, '').replace(/[A-Za-z]/g, '');
                displayValue = parseFloat(displayValue);
                displayValue = (!isNaN(displayValue)) ? displayValue.toString() : '';
        
                // handle leading character -/0
                if (valStr.length === 1 && valStr[0] === '-') {
                    displayValue = valStr[0];
                } else if (valStr.length === 1 && valStr[0] === '0') {
                    displayValue = '';
                } else {
                    displayValue = $filter('number')(displayValue);
                }
        
                // handle decimal
                if (!attrs.integer) {
                    if (displayValue.indexOf('.') === -1) {
                        if (valStr.slice(-1) === '.') {
                            displayValue += '.';
                        } else if (valStr.slice(-2) === '.0') {
                            displayValue += '.0';
                        } else if (valStr.slice(-3) === '.00') {
                            displayValue += '.00';
                        }
                    } else {
                        if (valStr.slice(-1) === '0') {
                            displayValue += '0';
                        }
                    }
                }
        
                if (attrs.positive && displayValue[0] === '-') {
                    displayValue = displayValue.substring(1);
                }
        
                if (typeof formatter !== 'undefined') {
                    return (displayValue === '') ? '' : displayValue;
                } else {
                    elem.val((displayValue === '0') ? '' : displayValue);
                }
            }
      
            function setModelNumber(val) {
                var modelNum = val.toString().replace(/,/g, '').replace(/[A-Za-z]/g, '');
                modelNum = parseFloat(modelNum);
                modelNum = (!isNaN(modelNum)) ? modelNum : 0;
                if (modelNum.toString().indexOf('.') !== -1) {
                    modelNum = Math.round((modelNum + 0.00001) * 100) / 100;
                }
                if (attrs.positive) {
                    modelNum = Math.abs(modelNum);
                }
                return modelNum;
            }
          }
        };
    }

    /*  END Francis Nash Jasmin 2022/02/08 */ 
})();