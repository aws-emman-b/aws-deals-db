(function(){
    'use strict';

    angular
        .module('app')
        .controller('ChangePasswordController', Controller);
    
    function Controller($scope, $rootScope, $state, UserService, InputValidationService, ngToast, $stateParams) {
        $scope.user = $rootScope.user;

        $scope.submit = function () {
            if(!InputValidationService.checkPasswordChars($scope.user.password)){
                ngToast.danger('Passwords should contain lowercase, uppercase, numbers and at least 8 characters');
            }else if($scope.user.confirmPassword != $scope.user.password){
                ngToast.danger('Confirm password does not match the new password');
            }else{
                console.log($scope.user);
                UserService.Update($scope.user)
                .then(function () {
                    ngToast.success('Password changed successfully');
                })
                .catch(function (error) {
                    if(error.incorrectPW) {
                        ngToast.danger('Old password is incorrect');
                    }
                    else {
                        ngToast.danger(error); 
                    }
                });
            }
        }  
    }

})();