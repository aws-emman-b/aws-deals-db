/*
    Deals Service for Angular
    Author(s): Sanchez, Macku
                Jeremy Reccion
    Date Created: June 2018
    Date Modified: June 6, 2018
    Description: Angular Service for the Deals Page
    Functions:
        addDeal();
        updateDeal();
        getDealById();
        handleSuccess();
        handleError();
*/


(function () {
    'use strict';
 
    angular
        .module('app')
        .factory('DealsService', Service);
 
    function Service($http, $q) {
        var service = {};
 
        service.addDeal = addDeal;
        service.updateDeal = updateDeal;
        service.getDealById = getDealById;
        service.deleteDeal = deleteDeal;
        service.newDealFile = newDealFile;
        service.generateLogs = generateLogs;
        service.addFileToDB = addFileToDB;
        service.downloadFile = downloadFile;
        service.deleteFile = deleteFile;
 
        return service;  
        
        function addDeal(dealsForm) {
            //console.log(clientForm)
            return $http.post('/api/deals/addDeal', dealsForm).then(handleSuccess, handleError);
        }

        /*
        * START Francis Nash Jasmin 2022/02/23
        * 
        * Added post request for generation of logs in the backend.
        * 
        */
        function generateLogs(dealIDs) {
            return $http.post('/api/deals/generateLogs', dealIDs).then(handleSuccess, handleError);
        }
        /* END Francis Nash Jasmin 2022/02/23 */

        /* START Francis Nash Jasmin 2022/03/09
        * Added post, get, and delete request for adding, downloading and deleting attachments to the backend.
        */
        function addFileToDB(fileInfo) {
            return $http.post('/api/deals/addFileToDB', fileInfo).then(handleSuccess, handleError);
        }

        function downloadFile(filename) {
            return $http.get('/api/deals/downloadFile/' + filename, { responseType: 'blob' }).then(handleSuccess, handleError);
        }

        function deleteFile(filename) {
            return $http.delete('/api/deals/deleteFile/' + filename).then(handleSuccess, handleError);
        }
        /* END Francis Nash Jasmin 2022/03/16 */

        function updateDeal(dealsForm) {
            //console.log(dealsForm)
            return $http.put('/api/deals/editDeal', dealsForm).then(handleSuccess, handleError);
        }

        function getDealById(dealId) {
            return $http.get('/api/deals/' + dealId).then(handleSuccess, handleError);
        }

        function deleteDeal(dealId) {
            return $http.delete('/api/deals/deleteDeal/' + dealId).then(handleSuccess, handleError);
        }

        function newDealFile(file) {
            var formData = new FormData();
            var name = 'deal_file';
            formData.append(name, file);
            const httpOptions = {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }

            return $http.post('/api/deals/upload/' + name, formData, httpOptions).then(handleSuccess, handleError);
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