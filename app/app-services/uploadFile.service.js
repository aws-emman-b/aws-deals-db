(function () {
    'use strict';
 
    angular
        .module('app')
        .factory('UploadService', Service);
 
    function Service($http, $q) {
        var service = {};
 
        service.uploadFile = uploadFile;
        service.deleteFile = deleteFile;
        service.readFile = readFile;
 
        return service;

        /*
            Function name: Read profile picture file
            Author(s): Flamiano, Glenn
            Date Modified: 2018/04/03
            Update Date: 2018/04/06
            Description: returns http response as boolean for reading the file
            Parameter(s): urlFile
            Return: http get response
        */
        function readFile(urlFile){
            return $http({url: '/api/uploadFile/readFile', 
                method: "GET", params: {urlFile:urlFile}}).then(handleSuccess, handleError);
        }

        /*
            Function name: Delete file
            Author(s): Flamiano, Glenn
            Date Modified: 2018/04/03
            Update Date: 2018/04/06
            Description: returns http update on deleting the file
            Parameter(s): scope, pathUsed, dbName
            Return: http post response
        */
        function deleteFile(scope, pathUsed, dbName) {
            scope.pathUsed = pathUsed;
            scope.dbName = dbName;
            return $http.put('/api/uploadFile/deleteFile/' + scope._id, scope).then(handleSuccess, handleError);
        }

        /*
            Function name: App Service Upload File
            Author(s): Flamiano, Glenn
            Date Modified: 2018/03/01
            Update Date: 2018/04/06
            Description: appends current unique id of the field and input file to form data and
                sends it to controllers/uploadFile.controller.js to return correct http response
            Parameter(s): input file, scope, pathUsed, dbName
            Return: http post response
        */
        function uploadFile(file, scope, pathUsed, dbName) {
            var fd = new FormData();
            fd.append('id', scope._id);
            fd.append('myfile', file.upload);
            return $http.post('/api/uploadFile/uploadFile', fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined}, params: {pathUsed:pathUsed,dbName:dbName}}).then(handleSuccess, handleError);
        }
 
        // private functions
 
        function handleSuccess(res) {
            return res.data;
        }
 
        function handleError(res) {
            return $q.reject(res.data);
        }
    }
 
})();