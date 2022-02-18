(function(){
    'use strict';

    angular
        .module('app')
        .controller('UserFormController', Controller)
         /*
        * START Dullao, Joshua 02/11/2022
        * 
        * Filter to convert the camel case to title case
        * 
        */
        .filter('titleCase', [function () {
            return function (input) {
          
              if (typeof input !== "string") {
                return input;
              }
          
              return input
                .replace(/([A-Z])/g, (match) => ` ${match}`)
                .replace(/^./, (match) => match.toUpperCase());
          
            };
        }]);
        /* END Dullao, Joshua 02/11/2022 */

    
    function Controller($scope, $rootScope, $location, $state, ModulesService, UserService, ngToast, $stateParams) {
        $scope.userForm = {};
        $scope.module = {};

        //Enable/Disable Email input based on url location
        var userFormLocation = $location.$$path;
        $scope.emailInputEnabled = true;
        if(userFormLocation != '/users/userForm/'){
            $scope.emailInputEnabled = false;
        }

        function getUserFields() {
            ModulesService.getModuleByName('users').then(function(aModule) {
                $scope.module = aModule;
            }).catch(function(err) {

            });
        }

        getUserFields();
        //console.log($stateParams._id);
        
        if($stateParams._id !== '') {
            ModulesService.getModuleDocById('users', $stateParams._id).then(function(moduleDoc) {
                console.log(moduleDoc);
                $scope.userForm = moduleDoc;
            }).catch(function(err) {
                console.log(err);
                if(err.notFound) {
                    ngToast.danger('User not found');
                }
                $scope.userForm = {};
            });
        }

 
        $scope.submit = function () {
            var toSave = {
                moduleName: $scope.module.name,
                moduleDoc: $scope.userForm
            };

            if($scope.userForm._id === undefined) {

                //Save first time logged in boolean
                $scope.userForm.firstTimeLoggedIn = true;

                //set status default active user to true
                $scope.userForm.status = true;


                UserService.Insert($scope.userForm).then(function () {
                    ngToast.success('User added');
                    $state.transitionTo('UserList');

                }).catch(function(err){
                    /*
                    * START Dullao, Joshua 02/10/2022
                    * 
                    * Error message for duplicate user or email
                    * 
                    */
                    if(err.exists){
                        ngToast.danger('Email is already taken');
                    }
                    else if(err.invalid){
                        ngToast.danger('Email is invalid');
                    }
                    else{
                        ngToast.danger('Cannot Add User');
                    }
                });
                    /* END Dullao, Joshua 02/11/2022 */


            } else {
                UserService.Update($scope.userForm).then(function() {
                    ngToast.success('User updated');
                    $state.transitionTo('UserList');   
                }).catch(function (err) {
                    ngToast.danger(err);
                });
            }
        }
    }

})();