(function(){
    'use strict';

    angular
        .module('app')
        .controller('NewClientController', Controller);

    
    function Controller($scope, $state, ngToast, ModulesService, $stateParams) {    
        $scope.clientForm = {};
        $scope.module = {};

        //get client fields
        function getclientFields() {
            ModulesService.getModuleByName('clients').then(function(aModule) {
                $scope.module = aModule;
            }).catch(function(err) {
                console.log(err);
            });
        }

        getclientFields();

        //fill out the BU edit form
        if($stateParams._id !== '' || $stateParams._id !== undefined ) {
            ModulesService.getModuleDocById('clients', $stateParams._id).then(function(moduleDoc) {
                //console.log(moduleDoc);
                $scope.clientForm = moduleDoc;
            }).catch(function(err) {
                console.log(err);
                if(err.notFound) {
                    ngToast.danger('Client not found');
                }
                $scope.clientForm = {};
            });
        }

        $scope.submit=function(){
            var clientData = $scope.clientForm

            /*ClientService.addClient($scope.clientForm)
                .then(function () {
                    ngToast.success('Client Added'); 
                    $state.transitionTo('clientList');
                })
                .catch(function (error) {
                    ngToast.danger(err);
                    $state.transitionTo('clientList'); 
                });*/

            //Note: don't put state transition to service function or it won't work
            //$state.transitionTo('clientList');

            /*if($scope.clientForm._id === undefined) {
                ClientService.insert(clientData).then(function() {
                    $state.transitionTo('clientList');
                    ngToast.success('Client added');
                }).catch(function(error){
                    $state.transitionTo('clientList');
                    ngToast.danger(error);
                });
            } else {
                ClientService.updateClient(toSave).then(function() {
                    $state.transitionTo('clientList');
                    ngToast.success('Client updated');
                }).catch(function(err){
                    $state.transitionTo('clientList');
                    ngToast.danger(err);
                });
            }*/
            
            //Using modules service to add client
            var toSave = {
                moduleName: 'clients',
                moduleDoc: $scope.clientForm
            };

            if($scope.clientForm._id === undefined) {
                //add status with default true
                toSave.moduleDoc.status = true;

                ModulesService.addModuleDoc(toSave).then(function() {
                    ngToast.success('Client added');
                    $state.transitionTo('clientList');
                }).catch(function(err){
                    ngToast.danger(err);
                });
            } else {
                ModulesService.updateModuleDoc(toSave).then(function() {
                    ngToast.success('Client updated');
                    $state.transitionTo('clientList');
                }).catch(function(err){
                    ngToast.danger(err);
                });
            }
        }
    }
})();