(function () {
    'use strict';
 
    angular
        .module('app', ['ui.router', 'ui.bootstrap', 'ngToast', 'ngFileUpload', 'ngFileSaver'])
        .config(config)
        .run(run);

    function config($stateProvider, $urlRouterProvider, $httpProvider) {
        $urlRouterProvider.otherwise('/');
 
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'login/login.html',
                controller: 'LoginController'
            })
            .state('main', {
                templateUrl: 'main/main.html',
                controller: 'MainController'
            })
            .state('home', {
                url: '/',
                parent: 'main',
                templateUrl: 'home/home.html',
                controller: 'HomeController'
            })
            .state('clientList', {
                url: '/clients/list',
                parent: 'main',
                templateUrl: 'clients/list.html',
                controller: 'ClientListController'
            })
            .state('dealList', {
                url: '/deals/list',
                parent: 'main',
                templateUrl: 'deals/list.html',
                controller: 'DealListController'
            })
            .state('dealForm', {
                url: '/deals/dealForm/:ID',
                parent: 'main',
                templateUrl: 'deals/dealForm.html',
                controller: 'DealFormController'
            })
            .state('newClient', {
                url: '/clients/new',
                parent: 'main',
                templateUrl: 'clients/new.html',
                controller: 'NewClientController'
            })
            .state('ClientForm', {
                url: '/clients/clientForm/:_id',
                parent: 'main',
                templateUrl: 'clients/new.html',
                controller: 'NewClientController'
            })
            .state('fields', {
                url: '/fields',
                parent: 'main',
                templateUrl: 'fields/fields.html',
                controller: 'FieldsController'
            })
            .state('BUList', {
                url: '/businessunits/list',
                parent: 'main',
                templateUrl: 'businessunits/list.html',
                controller: 'BUListController'
            })
            .state('BUForm', {
                url: '/businessunits/businessUnitForm/:_id',
                parent: 'main',
                templateUrl: 'businessunits/businessUnitForm.html',
                controller: 'BUFormController'
            })
            .state('UserList', {
                url: '/users/list',
                parent: 'main',
                templateUrl: 'users/list.html',
                controller: 'UserListController'
            })
            .state('UserForm', {
                url: '/users/userForm/:_id',
                parent: 'main',
                templateUrl: 'users/userForm.html',
                controller: 'UserFormController'
            })
            .state('changePassword', {
                url: '/changePassword/changePassword',
                parent: 'main',
                templateUrl: 'changePassword/changePassword.html',
                controller: 'ChangePasswordController'
            })
            /*
            * START Francis Nash Jasmin 2022/01/31
            * 
            * Added import and export directories to the deals app.
            * 
            */
            .state('export', {
                url: '/export',
                parent: 'main',
                templateUrl: 'export/export.html',
                controller: 'ExportController'
            })
            .state('import', {
                url: '/import',
                parent: 'main',
                templateUrl: 'import/import.html',
                controller: 'ImportController'
            });
            /*  END Francis Nash Jasmin 2022/01/31 */ 


        $httpProvider.interceptors.push(function($q, $window, $location){
            return {
                'responseError': function(rejection){
                    var defer = $q.defer();

                    if(rejection.status == 401){
                        console.log('401 detected');
                        $window.location.href="/#!/login";
                    }

                    defer.reject(rejection);

                    return defer.promise;
                }
            };
        });
    }
 
    function run($rootScope, $state, UserService, $http) {
        $rootScope.user = {};

        $rootScope.fromState = {
            name: 'home',
            url: '/'
        };

        $rootScope.logout = function () {
            UserService.logout().then(function() {
                $rootScope.user = {};
                delete $http.defaults.headers.common['Authorization'];
                $state.transitionTo('login');
            });            
        }

        // add JWT token as default auth header
        $http.get('/app/token').then(function(res){
            $http.defaults.headers.common['Authorization'] = 'Bearer ' + res.data;
        });

        //when the app is refreshed, get the current logged in user
        UserService.getCurrent().then(function(user) {
            $rootScope.user = user;
        }).catch(function(err) {
            console.log(err);
            $state.transitionTo('login');
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
            //not logged in
            if ($rootScope.user.email === undefined && toState.name !== 'login') {
                $state.transitionTo('login');
            //already logged in
            } else if ($rootScope.user.email !== undefined && toState.name === 'login') {
                //return to previous page
                $state.transitionTo($rootScope.fromState.name);
            //restrict access of 'users' to fields page
            } else if ($rootScope.user.role !== 'Admin' && 
                (toState.name === 'fields' || toState.name === 'businessunits')) {
                //go back to previous
                $state.transitionTo(fromState.name);
            //access is allowed
            } else {
                //save fromState (except login) to rootScope variable
                if(fromState.name === 'dealForm') {
                    window.name = null;
                }
                
                $rootScope.fromState = (fromState.name !== 'login') ? {
                    name: fromState.name,
                    url: fromState.url
                } : {
                    name: 'home',
                    url: '/'
                };
            }
        });
    }
})();