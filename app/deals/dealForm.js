(function () {
    'use strict';

    angular
        .module('app')
        .controller('DealFormController', Controller)
        .directive('numberInput', Directive);

    function Controller($scope, $rootScope, $state, $stateParams, $filter, ModulesService, DealsService, ClientService, ngToast, $uibModal, FileSaver, Upload) {
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
            content: {},
            attachments: []
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
            content: [],
            attachments: []
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

        /* START Francis Nash Jasmin 2022/03/15
        * Added option to show or hide attachment section in deal form through the Attachments option in the Fields page.
        */
        $scope.showAttachmentForm = true;
        /* END Francis Nash Jasmin 2022/03/15 */

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
                /* START Francis Nash Jasmin 2022/03/15 Added code for determining whether the attachment section should be shown in the deals form or not. */
                $scope.fields.attachments = allModules.find(a => a.name === 'attachments').fields;
                $scope.showAttachmentForm = $scope.fields.attachments.find(a => a.name === 'Attachments').showInList;
                /* END Francis Nash Jasmin 2022/03/15 */
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

                //START Reynaldo Pena Jr. 20220519
                // Only displays SD Groups in SD Field
                $scope.businessUnits = $scope.businessUnits.filter(bu => bu['Is it an SD?'] == 'Yes')
                //END Reynaldo Pena Jr. 20220519
            }).catch(function (err) {

            });
        }

        //called once
        getAllBUs();

        /*
        * START Francis Nash Jasmin 2022/05/11
        * Added conditions to enable/disable edit and delete buttons based on user roles.
        */
        $scope.dealAuthors = [];
        $scope.canEditDeal = $stateParams.ID === '' ? true : false;
        $scope.canDeleteDeal = false;
        $scope.dealID = $stateParams.ID;
        /* END Francis Nash Jasmin 2022/05/16 */

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

                /*
                * START Francis Nash Jasmin 2022/05/11
                * Added conditions to enable/disable edit and delete buttons based on user roles.
                */
                $scope.dealAuthors = aDeal['Change History'].map(hist => hist.user);
                $scope.canEditDeal = ($rootScope.user.role.toUpperCase() === 'ADMIN') || 
                                        (aDeal['Author'] === $rootScope.user.email) || 
                                        ($scope.dealAuthors.includes($rootScope.user.firstName + ' ' + $rootScope.user.lastName)) ||
                                        (aDeal.profile['AWS Resp (Dev) person'] === $rootScope.user.email) ||
                                        (aDeal.profile['AWS Resp (Sales) person'] === $rootScope.user.email) ||
                                        (aDeal.profile['AWS Resp (Dev) person'] === $rootScope.user.firstName + ' ' + $rootScope.user.lastName) ||
                                        (aDeal.profile['AWS Resp (Sales) person'] === $rootScope.user.firstName + ' ' + $rootScope.user.lastName);
                                        
                $scope.canDeleteDeal = ($rootScope.user.role.toUpperCase() === 'ADMIN') || 
                                        (aDeal['Author'] === $rootScope.user.email) || 
                                        ($scope.dealAuthors.includes($rootScope.user.firstName + ' ' + $rootScope.user.lastName));
                /* END Francis Nash Jasmin 2022/05/16 */
            }).catch(function () {
                //$scope.message = 'Cannot find the deal';
                $scope.showUpload = false;
                ngToast.danger('Cannot find the deal');
            });
        }

        $scope.tempAttachments = [];

        $scope.submit = function () {
            //use Object.assign(target, source) instead
            var tempDealForm = {};
            Object.assign(tempDealForm, $scope.dealForm);
            var createdDeal = {};

            //use false to convert date objects to datestrings
            try {
                tempDealForm = preProcess(tempDealForm, false);
                if (tempDealForm._id === undefined) {
                    DealsService.addDeal(tempDealForm)
                        .then(function (deal) {
                            // Gets the created deal from the backend for the processing of attachment files.
                            createdDeal = deal;
                            ngToast.success('Deal added');
                            $state.transitionTo('dealList');
                        })
                        .catch(function (err) {
                        })
                        .finally(function () {
                            /* START Francis Nash Jasmin 2022/03/14
                            * Added code for adding attachments to a newly created deal.
                            */
                            // Only add the attachment files after the deal has been created and added to the database.
                            if($scope.tempAttachments.length !== 0) {
                                // Rename files first from [TEMP] Filename.extension to [DL-####] Filename.extension
                                let renamedFiles = $scope.tempAttachments.map(attachment => {
                                    let datetimestamp = moment(new Date()).format('YYYY-MM-DD_HH-mm-ss');
                                    let originalName = attachment.file.name.substring(0, attachment.file.name.lastIndexOf('.')).split(' ').slice(1).join(' ');
                                    let extension = attachment.file.name.split('.').pop();
                                    let newName = `[${createdDeal.ID}] ${originalName}-${datetimestamp}.${extension}`;
                                    let renamedFile = new File([attachment.file.slice(0, attachment.file.size, attachment.file.type)], newName, {type: attachment.file.type});
                                    return {...attachment, file: renamedFile};
                                })
                                
                                // Call attachFile from backend to upload files. Uses ng-file-upload.
                                // NOTE: CHANGE THE URL OF LOCALHOST WHEN DEPLOYING TO A SERVER.
                                renamedFiles.map(attachment => {
                                    Upload.upload({
                                        url: 'http://localhost:5000/api/deals/attachFile',
                                        data: { file: attachment.file, 'description': attachment.description, 'deal': createdDeal } 
                                    }).then(function (res) {
                                        if(res.data.error_code === 0){
                                            ngToast.success('File attached');
                                        } else {
                                            ngToast.danger('An error occurred while uploading the file.')
                                        }
                                    });
                                })

                                // The following code adds the filename and description to the deals database.
                                let files = renamedFiles.map(a => {
                                    return {...a, file: a.file.name, description: a.description}
                                })
                                DealsService.addFileToDB({files: files, deal: createdDeal}).then(function () {}).catch(function (err) {})
                            }
                            /* END Francis Nash Jasmin 2022/03/18 */
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

        /*
        * START Francis Nash Jasmin 2022/05/11
        * Added delete functionality.
        */
        $scope.deleteDeal = function() {
            try {
                if ($stateParams.ID !== '') {
                    if(confirm("Are you sure you want to delete this deal?")) {
                        DealsService.deleteDeal($stateParams.ID)
                            .then(function () {
                                ngToast.success('Deal deleted');
                                $state.transitionTo('dealList');
                            })
                            .catch(function (err) {
                                ngToast.danger(err);
                            });
                    }
                }
            } catch (e) {
                ngToast.danger(e.message);
                $state.transitionTo('dealList');
            }
        }
        /* END Francis Nash Jasmin 2022/05/16 */

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

                /*
                * START Francis Nash Jasmin 2022/04/28
                * 
                * Added code for converting level to string if it is an integer.
                * 
                */
                tempObject.profile['Level'] = tempObject.profile['Level'].toString();
                tempObject['Change History'] = tempObject['Change History'].map(history => {
                    history.level = history.level.toString();
                    return history;
                })
                /* END Francis Nash Jasmin 2022/04/28 */
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

        //START Reynaldo Pena Jr 20220518
        $scope.unitOrder = function(level){
             return parseInt(level);
            }
        //END Reynaldo Pena Jr. 20220518

        //this function computes total resource, revenue, and CM for the CURRENT fiscal year
        function computeDistribution() {
            /*
            Note isBetween the starting point is (currentYear)-03-01 because if starts at april, it
            won't accept the first value of the array
            */
            //use variables like sumRes as temporary sum
            var i, resJP, resPH, revJP, revPH, cm, resSum, revSum, cmSum, forCompute, editedProp;
            var start = moment($scope.startingMonthYear).subtract(1, 'months').format('YYYY-MM-DD');
            var end = moment($scope.startingMonthYear).add(12, 'month').format('YYYY-MM-DD');
            //for direct or indirect
            for (i = 0; i < $scope.contracts.length; i++) {
                //console.log($scope.dealForm.distribution[$scope.contracts[i]].res);
                //reset per contract
                resJP = [], resPH = [], revJP = [], revPH = [], cm = [];
                resSum = 0, revSum = 0, cmSum = 0;
                //compute total resource
                if ($scope.dealForm.distribution[$scope.contracts[i]] !== undefined) {
                    /**
                     * check if not undefined to avoid displaying errors
                     * for res & rev, need to check both jp & ph if not undefined to avoid errors
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

                            /* START Francis Nash Jasmin 2022/03/15 Added parsing of values to Float when computing for totals. */
                            resJP = Object.values(forCompute).map(function (val) { 
                                return parseFloat(val); 
                            });
                            /* END Francis Nash Jasmin 2022/03/15 */
                        }

                        //for PH
                        if ($scope.dealForm.distribution[$scope.contracts[i]].res.ph !== undefined) {
                            forCompute = {};
                            Object.assign(forCompute, $scope.dealForm.distribution[$scope.contracts[i]].res.ph);
                            for (var prop in forCompute) {
                                editedProp = prop.replace(/\//, '-') + '-01';
                                if (!moment(editedProp)
                                    .isBetween(start, end) || forCompute[prop] === null) {

                                    delete forCompute[prop];
                                }
                            }

                            /* START Francis Nash Jasmin 2022/03/15 Added parsing of values to Float when computing for totals. */
                            resPH = Object.values(forCompute).map(function (val) { 
                                return parseFloat(val); 
                            });
                            /* END Francis Nash Jasmin 2022/03/15 */
                        }

                        //compute total resource
                        if (resJP.length > 0 || resPH.length > 0) {
                            resSum = resJP.concat(resPH).reduce(function (total, value) {
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

                            /* START Francis Nash Jasmin 2022/03/15 Added parsing of values to Float when computing for totals. */
                            revJP = Object.values(forCompute).map(function (val) { 
                                return parseFloat(val); 
                            });
                            /* END Francis Nash Jasmin 2022/03/15 */
                        }
                        //for PH
                        if ($scope.dealForm.distribution[$scope.contracts[i]].rev.ph !== undefined) {
                            forCompute = {};
                            Object.assign(forCompute, $scope.dealForm.distribution[$scope.contracts[i]].rev.ph);
                            for (var prop in forCompute) {
                                editedProp = prop.replace(/\//, '-') + '-01';
                                if (!moment(editedProp)
                                    .isBetween(start, end) || forCompute[prop] === null) {

                                    delete forCompute[prop];
                                }
                            }

                            /* START Francis Nash Jasmin 2022/03/15 Added parsing of values to Float when computing for totals. */
                            revPH = Object.values(forCompute).map(function (val) { 
                                return parseFloat(val); 
                            });
                            /* END Francis Nash Jasmin 2022/03/15 */
                        }

                        //compute total revenue
                        if (revJP.length > 0 || revPH.length > 0) {
                            revSum = revJP.concat(revPH).reduce(function (total, value) {
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

                        /* START Francis Nash Jasmin 2022/03/15 Added parsing of values to Float when computing for totals. */
                        cm = Object.values(forCompute).map(function (val) { 
                            return parseFloat(val); 
                        });
                        /* END Francis Nash Jasmin 2022/03/15 */

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

        //START Francis Nash Jasmin 20220518
        //Added setting of SRB Number for new deals.
        function setSRBNo() {
            if($stateParams.ID === '') {
                let previousID;
                let IDnumber;
                let ID = 'PS-0000';

                ModulesService.getAllModuleDocs('deals').then(function (allDeals) { 
                    let deals = allDeals;      
                    
                    previousID = deals.sort(function(a, b) {
                        let fa = a.ID.toLowerCase(),
                            fb = b.ID.toLowerCase();
        
                        if (fa < fb) {
                            return -1;
                        }
                        if (fa > fb) {
                            return 1;
                        }
                        return 0;
                    })[deals.length - 1].ID;

                    IDnumber = previousID.slice(3, 7);
                    IDnumber++;
                    if (IDnumber <= 9) {
                        // 0-9
                        ID = previousID.slice(0, 6) + IDnumber;
                    } else if (IDnumber > 9 && IDnumber <= 99) {
                        // 10-99
                        ID = previousID.slice(0, 5) + IDnumber;
                    } else if (IDnumber > 99 && IDnumber <= 999) {
                        // 100-999
                        ID = previousID.slice(0, 4) + IDnumber;
                    } else {
                        // 1000 above
                        ID = previousID.slice(0, 3) + IDnumber;
                    }
                    $scope.dealForm.process['SRB No'] = ID.replace('DL', 'PS');
                }).catch(function (err) {});
            }
        }

        setSRBNo()
        //END Francis Nash Jasmin 20220519

        /*
        * START Francis Nash Jasmin 2022/03/10
        * Added functions for downloading and deleting attachments of an already existing deal.
        */
        $scope.downloadFile = function(filename) {
            try {
                DealsService.downloadFile(filename)
                    .then(function (res) {
                        FileSaver.saveAs(res, filename);
                        ngToast.success('File downloaded');
                    })
                    .catch(function (err) {
                        ngToast.danger(err);
                    });
            } catch(e) {
                ngToast.danger(e);
            }
        };

        $scope.deleteFile = function(filename) {
            if($scope.dealForm.ID === undefined) {
                $scope.tempAttachments = $scope.tempAttachments.filter(attachment => attachment.file.name !== filename);
                $scope.dealForm.attachments = $scope.dealForm.attachments.filter(file => file.fileName !== filename);
            } else {
                try {
                    DealsService.deleteFile(filename)
                        .then(function () {
                            if(!window.alert('The file ' + filename + ' has been deleted successfully.')){
                                window.location.reload();
                            };
                        })
                        .catch(function (err) {
                            console.log(err)
                            ngToast.danger('Delete failed. File cannot be found.');
                        });
                } catch(e) {
                    ngToast.danger(e);
                }
            }
        };
        /* END Francis Nash Jasmin 2022/03/18 */
        
        /*
        * START Francis Nash Jasmin 2022/03/09
        * Added code for opening a modal for adding attachment and description.
        */
        $scope.openModal = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'deals/attachmentModal.html',
                controller: 'ModalInstanceCtrl',
                controllerAs: 'modal',
                resolve: {
                    data: function () {
                        return $scope.dealForm;
                    },
                    tempAttachments: function () {
                        return $scope.tempAttachments;
                    }
                }
            })
            modalInstance.result.then(function () {
            }).catch(function (resp) {
                if (['cancel', 'backdrop click', 'escape key press'].indexOf(resp) === -1) throw resp;
            });;
        };
        /* END Francis Nash Jasmin 2022/03/18 */
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

/*
* START Francis Nash Jasmin 2022/03/09
* Added controller for a modal for adding attachment and description for new and existing deals.
*/
angular.module('app').controller('ModalInstanceCtrl', function ($uibModalInstance, data, tempAttachments, $scope, $window) {
    var modal = this;
    // Data contains deal information
    modal.data = data;
    // tempattachments contain files for a deal that has not been created yet.
    modal.tempAttachments = tempAttachments;
    
    // Called when adding attachments to existing deals.
    $scope.submit = function (fileName) {
        $uibModalInstance.close();
        if(!$window.alert('Success. ' + fileName + ' attached.')){
            window.location.reload();
        };
    };

    // Called when adding attachment and description for a deal that is not created or added to the database yet.
    $scope.addFileToNewDeal = function(file, description) {
        $uibModalInstance.close();
        modal.tempAttachments.push({
            file,
            description
        });
    }
  
    modal.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});
/* END Francis Nash Jasmin 2022/03/18 */

/*
* START Francis Nash Jasmin 2022/03/09
* Added controller for a modal for adding attachment and description for new and existing deals.
*/
angular.module('app').controller('UploadCtrl', ['Upload', '$window', '$scope', 'DealsService', function (Upload, $window, $scope, DealsService, data) {
    var modal = this;
    // Data contains deal information
    modal.data = data;
    
    modal.submit = function (deal) {
        // upload is only called when a file of any type has been selected.
        if(modal.file) {
            modal.upload(modal.file, modal.description, deal);
        }
    };

    modal.upload = function (file, description, deal) {
        var originalName = file.name.substring(0, file.name.lastIndexOf('.'));
        var extension = file.name.split('.').pop();
        let datetimestamp = moment(new Date()).format('YYYY-MM-DD_HH-mm-ss');
        
        // File naming convention is: [DL-####] Filename-YYYY-MM-DD_HH-mm-ss.ext for existing deals and [TEMP] Filename.ext for deals not created yet.
        // [TEMP] file will be renamed to [DL-####] Filename-YYYY-MM-DD_HH-mm-ss.ext when deal has been created and added to DB.
        if(deal.ID === undefined) {
            var newName = `[TEMP] ${originalName}.${extension}`;
        } else {
            var newName = `[${deal.ID}] ${originalName}-${datetimestamp}.${extension}`;
        }
        var renamedFile = new File([file.slice(0, file.size, file.type)], newName, {type: file.type});

        if(deal.ID !== undefined) {
            // Code is executed when there is an existing deal.
            // Calls attachFile function from backend to upload file.
            // NOTE: CHANGE THE URL OF LOCALHOST WHEN DEPLOYING TO A SERVER.
            Upload.upload({
                url: 'http://localhost:5000/api/deals/attachFile',
                data: { file: renamedFile, 'description': description, 'deal': deal } 
            }).then(function (res) {
                if(res.data.error_code === 0){
                    $scope.submit(res.config.data.file.name);
                } else {
                    $window.alert('An error occured while uploading the file.');
                }
            });

            // Used to add filename and description to the deals database.
            let file = [{file: renamedFile.name, description: description}];
            DealsService.addFileToDB({files: file, deal: deal})
            .then(function () {})
            .catch(function (err) {
                console.log(err)
            })
        } else {
            // Code is executed when deal is not created yet.
            // Adds attachment to deal form.
            deal.attachments.push({
                fileName: renamedFile.name,
                description: description,
                directory: ''
            });
            $scope.addFileToNewDeal(renamedFile, description);
        }
    }
}]);
/* END Francis Nash Jasmin 2022/03/18 */