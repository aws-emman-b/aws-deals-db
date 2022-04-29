/*
* START Francis Nash Jasmin 2022/04/28
* Added forget/reset password controller.
*/
(function(){
    'use strict';

    angular
        .module('app')
        .controller('ForgotPasswordController', Controller);

    
    function Controller($scope, UserService) {

        $scope.displayMessage = false;
        $scope.resetForm = {
            email: ''
        };

        $scope.resetPassword = function () {
            UserService.resetPassword($scope.resetForm).then(function() {
                $scope.displayMessage = true;
                $scope.message = 'Link to reset password has been sent to your email.';
            }).catch(function(err) {
                $scope.displayMessage = true;
                $scope.message = 'User email is not found or is deactivated.';
            });
        }
    }
})();
/*  END Francis Nash Jasmin 2022/04/29 */ 