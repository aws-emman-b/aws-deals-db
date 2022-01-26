(function () {
    'use strict';
 
    angular
        .module('app')
        .factory('ModulesService', Service);
 
    function Service($http, $q) {
        var service = {};
 
        service.addModule = addModule;
        service.getAllModules = getAllModules;
        service.updateModule = updateModule;
        service.deleteModule = deleteModule;

        service.addModuleField = addModuleField;
        service.updateModuleField = updateModuleField;
        service.deleteModuleField = deleteModuleField;

        service.getModuleByName = getModuleByName;
        service.addModuleDoc = addModuleDoc;
        service.getAllModuleDocs = getAllModuleDocs;
        service.getModuleDocById = getModuleDocById;
        service.updateModuleDoc = updateModuleDoc;
        service.deleteModuleDoc = deleteModuleDoc;

        service.updateFieldArray = updateFieldArray;

        return service;

        function addModule(newModule){
            return $http.post('/api/modules/addModule', newModule).then(handleSuccess, handleError);
        }

        function getAllModules(){
            return $http.get('/api/modules/getAllModules').then(handleSuccess, handleError);
        }

        function updateModule(updateModule){
            return $http.put('/api/modules/updateModule', updateModule).then(handleSuccess, handleError);
        }
        
        function deleteModule(moduleID, moduleName){
            return $http.delete('/api/modules/deleteModule/' + moduleID + '/' + moduleName).then(handleSuccess, handleError);
        }

        function addModuleField(addModuleField){
            return $http.put('/api/modules/addModuleField', addModuleField).then(handleSuccess, handleError);
        }

        function updateModuleField(updateModuleField){
            return $http.put('/api/modules/updateModuleField', updateModuleField).then(handleSuccess, handleError);
        }

        function deleteModuleField(moduleName, moduleFieldID){
            return $http.put('/api/modules/deleteModuleField/' + moduleName + '/' + moduleFieldID).then(handleSuccess, handleError);
        }

        function getModuleByName(moduleName){
            return $http.get('/api/modules/getModuleByName/' + moduleName).then(handleSuccess, handleError);
        }

        function addModuleDoc(newModuleDoc){
            return $http.post('/api/modules/addModuleDoc', newModuleDoc).then(handleSuccess, handleError);
        }

        function getAllModuleDocs(moduleName){
            return $http.get('/api/modules/getAllModuleDocs/' + moduleName).then(handleSuccess, handleError);
        }

        function getModuleDocById(moduleName, id){
            return $http.get('/api/modules/getModuleDocById/' + moduleName + '/' + id).then(handleSuccess, handleError);
        }

        function updateModuleDoc(updateModuleDoc){
            return $http.put('/api/modules/updateModuleDoc', updateModuleDoc).then(handleSuccess, handleError);
        }

        function deleteModuleDoc(moduleName, moduleDocID){
            return $http.delete('/api/modules/deleteModuleDoc/' + moduleName + '/' + moduleDocID).then(handleSuccess, handleError);
        }

        function updateFieldArray(fieldArray){
            return $http.put('/api/modules/updateFieldArray', fieldArray).then(handleSuccess, handleError);
        }

        function handleSuccess(res) {
            return res.data;
        }
 
        function handleError(res) {
            return $q.reject(res.data);
        }

    }
})();