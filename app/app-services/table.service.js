(function () {
    'use strict';
 
    angular
        .module('app')
        .factory('TableService', Service);
 
    function Service() {
        var service = {};
 
        service.sortSelectedColumn = sortSelectedColumn;
        service.sortSelectedClass = sortSelectedClass;
 
        return service;
 
        function sortSelectedColumn(reverse, col){
            var reverseclass = '';
            var result = false;
            if(reverse){
                result = false;
                reverseclass = 'arrow-up';
            }else{
                result = true;
                reverseclass = 'arrow-down';
            }
            return {result ,reverseclass};
        }

        function sortSelectedClass(reverse, col, column){
            var result = '';
            if(column == col){
                if(reverse){
                    result = 'arrow-down'; 
                }else{
                    result = 'arrow-up';
                }
            }else{
                result = 'arrow-dormant';
            }
            return result;
        }

    }
 
})();