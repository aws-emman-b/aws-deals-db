(function(){
    'use strict';

    angular
        .module('app')
        .controller('HomeController', Controller);
    
    function Controller($scope, $rootScope, $state, UserService, ModulesService, InputValidationService, ngToast, $stateParams) {  
       
        function getTimeStamp(myDate){
            var newDate = myDate[1] + "/" + myDate[2] + "/" + myDate[0];
            return new Date(newDate).getTime();
        }

        function getMonthOnly(myDate){
            var month = new Array();
            month[0] = "Jan";
            month[1] = "Feb";
            month[2] = "Mar";
            month[3] = "Apr";
            month[4] = "May";
            month[5] = "Jun";
            month[6] = "Jul";
            month[7] = "Aug";
            month[8] = "Sep";
            month[9] = "Oct";
            month[10] = "Nov";
            month[11] = "Dec";

            var newDate = myDate[1] + "/" + myDate[2] + "/" + myDate[0];
            var month = month[new Date(newDate).getMonth()];
            var year = new Date(newDate).getFullYear();
            return month + ' ' + year;
        }

        //Added by: Glenn
        //Get quarterly only
        function getQuarterly(myDate){
          //console.log(myDate);
          var quarter = 'Q1';
          var monthVal = parseInt(myDate[1]);
          //var yearVal = parseInt(myDate[0]);

          if(monthVal >= 4 && monthVal <= 6) {
            quarter = 'Q1';
          } else if(monthVal >= 7 && monthVal <= 9) {
            quarter = 'Q2';
          } else if(monthVal >= 10 && monthVal <= 12) {
            quarter = 'Q3';
          } else if(monthVal >= 1 && monthVal <= 3) {
            quarter = 'Q4';
          }
          
          return quarter;
      }

        var monthNames = {
          "Apr": 1,
          "May": 2,
          "Jun": 3,
          "Jul": 4,
          "Aug": 5,
          "Sept": 6,
          "Oct": 7,
          "Nov": 8,
          "Dec": 9,
          "Jan": 10,
          "Feb": 11,
          "Mar": 12
        };

        var deals = {};
        var allBUs = {};
        $scope.optionsBU = '';
        $scope.selectedBU = '--ALL--';
        $scope.selectedDiv = '--ALL--';
        $scope.selectedTimeline = 'monthly';
        //$scope.stackedOptions = 'Revenue';
        $scope.isGD = true;
        $scope.isESD = false;

        //for time series
        var dealRevenuePerDate = [];
        var dealCMPerDate = [];

        //for time series in quarterly
        var dealRevenuePerDateQ = [];
        var dealCMPerDateQ = [];

        //per stack
        var dealRevenueLevel1 = [];
        var dealRevenueLevel2 = [];
        var dealRevenueLevel3 = [];
        var dealRevenueLevel4 = [];

        //deals revenue level 5 and 9
        var dealRevenueLevel5 = [];
        var dealRevenueLevel9 = [];

        /*
         *START Dullao, Joshua 02/15/2022
         *
         * Declared variables and functions for the CM per level chart 
         */
        var dealCmLevel1 = [];
        var dealCmLevel2 = [];
        var dealCmLevel3 = [];
        var dealCmLevel4 = [];

        var dealCmLevel5 = [];
        var dealCmLevel9 = [];

        //per deal
        var dealRevenue = [];
        var dealCM = [];

        //revenue percentage per dev
        var revenuePerDev = [];

        //revenue per unique date
        var dealPerUniqueDate = [];

        //revenue per unique month
        var dealPerUniqueMonth = [];

        //deals for quarterly in a fiscal year
        var dealRevenueLevel1Q = [];
        var dealRevenueLevel2Q = [];
        var dealRevenueLevel3Q = [];
        var dealRevenueLevel4Q = [];
        var dealRevenueLevel5Q = [];
        var dealRevenueLevel9Q = [];

        var dealCmLevel1Q = [];
        var dealCmLevel2Q = [];
        var dealCmLevel3Q = [];
        var dealCmLevel4Q = [];
        var dealCmLevel5Q = [];
        var dealCmLevel9Q = [];

        //deals data for charts
        //line
        var dealRevenuePerDateLine = [];
        var dealCMPerDateLine = [];

        //bar
        var dealRevenueLevel1Bar = [];
        var dealRevenueLevel2Bar = [];
        var dealRevenueLevel3Bar = [];
        var dealRevenueLevel4Bar = [];
        var dealRevenueLevel5Bar = [];
        var dealRevenueLevel9Bar = [];

        var dealCmLevel1Bar = [];
        var dealCmLevel2Bar = [];
        var dealCmLevel3Bar = [];
        var dealCmLevel4Bar = [];
        var dealCmLevel5Bar = [];
        var dealCmLevel9Bar = [];

        var isInit = false;

        function init(){
            ModulesService.getAllModuleDocs('deals').then(function (allDeals) {
                //console.log(allDeals);
                if($scope.selectedDiv != '--ALL--'){

                  for(var i = 0; i < allDeals.length; i++){
                    if($scope.selectedDiv == 'GD'){
                      if(allDeals[i].profile['Division'] == 'GD'){
                        deals.push(allDeals[i]);
                      }
                    }else if($scope.selectedDiv == 'ESD'){
                      if(allDeals[i].profile['Division'] == 'ESD'){
                        deals.push(allDeals[i]);
                      }
                    }
                  }
                  
                }else{
                  if($scope.selectedBU == '--ALL--'){
                    deals = allDeals;
                  } else {
                    for(var i = 0; i < allDeals.length; i++){
                      if(allDeals[i].profile['AWS Resp (Dev) BU'] == $scope.selectedBU){
                        deals.push(allDeals[i]);
                      }
                    }
                    //console.log(deals);
                  }
                }
                
                //console.log(deals.length);
                loadBUs();
            }).catch(function (err) {
              ngToast.danger(err);
              console.log(err);
            });
        }

        init();

        $scope.reloadAll = function(){
          //console.log($scope.selectedBU);
          deals = [];
          dealRevenuePerDate = [];
          dealCMPerDate = [];
          dealRevenueLevel1 = [];
          dealRevenueLevel2 = [];
          dealRevenueLevel3 = [];
          dealRevenueLevel4 = [];

          dealCmLevel1 = [];
          dealCmLevel2 = [];
          dealCmLevel3 = [];
          dealCmLevel4 = [];

          //deals revenue level 5 and 9
          dealRevenueLevel5 = [];
          dealRevenueLevel9 = [];

          dealCmLevel5 = [];
          dealCmLevel9 = [];

          dealRevenue = [];
          dealCM = [];
          revenuePerDev = [];

          //deals line for quarterly
          dealRevenuePerDateQ = [];
          dealCMPerDateQ = [];
          
          dealPerUniqueDate = [];
          dealPerUniqueMonth = [];
          
          //deals for quarterly in a fiscal year
          dealRevenueLevel1Q = [];
          dealRevenueLevel2Q = [];
          dealRevenueLevel3Q = [];
          dealRevenueLevel4Q = [];
          dealRevenueLevel5Q = [];
          dealRevenueLevel9Q = [];

          dealCmLevel1Q = [];
          dealCmLevel2Q = [];
          dealCmLevel3Q = [];
          dealCmLevel4Q = [];
          dealCmLevel5Q = [];
          dealCmLevel9Q = [];

          //deals data for charts
          //line
          dealRevenuePerDateLine = [];
          dealCMPerDateLine = [];

          //bar
          dealRevenueLevel1Bar = [];
          dealRevenueLevel2Bar = [];
          dealRevenueLevel3Bar = [];
          dealRevenueLevel4Bar = [];
          dealRevenueLevel5Bar = [];
          dealRevenueLevel9Bar = [];

          dealCmLevel1Bar = [];
          dealCmLevel2Bar = [];
          dealCmLevel3Bar = [];
          dealCmLevel4Bar = [];
          dealCmLevel5Bar = [];
          dealCmLevel9Bar = [];

          init();
        }

        function loadBUs(){
            ModulesService.getAllModuleDocs('businessunits').then(function(businessUnits) {                
               allBUs = businessUnits;
               $scope.optionsBU = businessUnits;
               loadCharts();
            }).catch(function(err) {
              console.log(err);
            });
        }

        function loadCharts() {
            
            var totalRev = 0;

            //to load data on revenue bar chart
            for(var j = 0; j < deals.length; j++){
                
                var monthly = deals[j].essential['Due Date'].split('/');

                //console.log(monthly[1]);

                dealPerUniqueDate.push(getTimeStamp(monthly));
                dealPerUniqueMonth.push(getMonthOnly(monthly));
            }

            //console.log(dealPerUniqueMonth);

            let unique = (names) => names.filter((v,i) => names.indexOf(v) === i);
            dealPerUniqueDate = unique(dealPerUniqueDate);
            dealPerUniqueMonth = unique(dealPerUniqueMonth);
            //console.log(dealPerUniqueMonth);
            
            //initialize time series deals
            for(var i = 0; i < dealPerUniqueDate.length; i++){
              dealRevenuePerDate.push([dealPerUniqueDate[i], 0]);
              dealCMPerDate.push([dealPerUniqueDate[i], 0]);
            }

            //initialize quarterly time series deals
            for(var q = 0; q < 4; q++){
              dealRevenuePerDateQ.push(['Q'+(q+1), 0]);
              dealCMPerDateQ.push(['Q'+(q+1), 0]);
            }

            //initialize stacked chart deals
            for(var i = 0; i < dealPerUniqueMonth.length; i++){
              dealRevenueLevel1.push([dealPerUniqueMonth[i], 0]);
              dealRevenueLevel2.push([dealPerUniqueMonth[i], 0]);
              dealRevenueLevel3.push([dealPerUniqueMonth[i], 0]);
              dealRevenueLevel4.push([dealPerUniqueMonth[i], 0]);

              //for deals revenue levels 5 and 9
              dealRevenueLevel5.push([dealPerUniqueMonth[i], 0]);
              dealRevenueLevel9.push([dealPerUniqueMonth[i], 0]);
            }

            //intialize stacked chart deals CM
            for(var i = 0; i < dealPerUniqueMonth.length; i++){
              dealCmLevel1.push([dealPerUniqueMonth[i], 0]);
              dealCmLevel2.push([dealPerUniqueMonth[i], 0]);
              dealCmLevel3.push([dealPerUniqueMonth[i], 0]);
              dealCmLevel4.push([dealPerUniqueMonth[i], 0]);

              dealCmLevel5.push([dealPerUniqueMonth[i], 0]);
              dealCmLevel9.push([dealPerUniqueMonth[i], 0]);
            }

            //josh
            //initialize quarterly bar chart deals
            for(var q = 0; q < 4; q++){
              dealRevenueLevel1Q.push(['Q'+(q+1), 0]);
              dealRevenueLevel2Q.push(['Q'+(q+1), 0]);
              dealRevenueLevel3Q.push(['Q'+(q+1), 0]);
              dealRevenueLevel4Q.push(['Q'+(q+1), 0]);

              //for deals revenue levels 5 and 9
              dealRevenueLevel5Q.push(['Q'+(q+1), 0]);
              dealRevenueLevel9Q.push(['Q'+(q+1), 0]);
            }
            
            //josh
            //initialize quarterly bar chart deals
            for(var q = 0; q < 4; q++){
              dealCmLevel1Q.push(['Q'+(q+1), 0]);
              dealCmLevel2Q.push(['Q'+(q+1), 0]);
              dealCmLevel3Q.push(['Q'+(q+1), 0]);
              dealCmLevel4Q.push(['Q'+(q+1), 0]);
     
              dealCmLevel5Q.push(['Q'+(q+1), 0]);
              dealCmLevel9Q.push(['Q'+(q+1), 0]);
            }


            //console.log(dealRevenueLevel5);
            //console.log(dealRevenueLevel5Q);

            //load data in revenue line chart
            for(var j = 0; j < deals.length; j++){
              var monthly = deals[j].essential['Due Date'].split('/');

              //for monthly line chart
              for(var k = 0; k < dealRevenuePerDate.length; k++){
                if(dealRevenuePerDate[k][0] == getTimeStamp(monthly)){
                  if(isNaN(deals[j].profile.Revenue)){
                    dealRevenuePerDate[k][1] += 0;
                  }else{
                    dealRevenuePerDate[k][1] += deals[j].profile.Revenue;
                  }
                }
              }

              for(var k = 0; k < dealCMPerDate.length; k++){
                if(dealCMPerDate[k][0] == getTimeStamp(monthly)){
                  if(isNaN(deals[j].profile.CM)){
                    dealCMPerDate[k][1] += 0;
                  }else{
                    dealCMPerDate[k][1] += deals[j].profile.CM;
                  }
                }
              }

              //for quarterly line chart
              for(var k = 0; k < dealRevenuePerDateQ.length; k++){
                if(dealRevenuePerDateQ[k][0] == getQuarterly(monthly)){
                  if(isNaN(deals[j].profile.Revenue)){
                    dealRevenuePerDateQ[k][1] += 0;
                  }else{
                    dealRevenuePerDateQ[k][1] += deals[j].profile.Revenue;
                  }
                }
              }

              //for CM quarterly line chart
              for(var k = 0; k < dealCMPerDateQ.length; k++){
                if(dealCMPerDateQ[k][0] == getQuarterly(monthly)){
                  if(isNaN(deals[j].profile.CM)){
                    dealCMPerDateQ[k][1] += 0;
                  }else{
                    dealCMPerDateQ[k][1] += deals[j].profile.CM;
                  }
                }
              }
            }
          
            //console.log(dealRevenuePerDate);

            //console.log(totalRev);

            //console.log(allBUs);

            //initialize revenuePerDev
            for(var j = 0; j < allBUs.length; j++){
                revenuePerDev.push([allBUs[j].BU, 0]);
            }           

            //load data on hbar chart
            for(var j = 0; j < deals.length; j++){
                var monthly = deals[j].essential['Due Date'].split('/');
                /*console.log(deals[j].profile['Level'] + ' ' + deals[j].profile.Revenue + ' ' + 
                  getMonthOnly(monthly) + ' ' + deals[j].essential['Due Date']);*/


                //Load data in monthly hbar chart
                //level 1
                for(var k = 0; k < dealRevenueLevel1.length; k++){
                  if(dealRevenueLevel1[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 1){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel1[k][1] += 0;
                    }else{
                      dealRevenueLevel1[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }


                //level 2
                for(var k = 0; k < dealRevenueLevel2.length; k++){
                  if(dealRevenueLevel2[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 2){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel2[k][1] += 0;
                    }else{
                      dealRevenueLevel2[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //level 3
                for(var k = 0; k < dealRevenueLevel3.length; k++){
                  if(dealRevenueLevel3[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 3){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel3[k][1] += 0;
                    }else{
                      dealRevenueLevel3[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //level 4
                for(var k = 0; k < dealRevenueLevel4.length; k++){
                  if(dealRevenueLevel4[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 4){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel4[k][1] += 0;
                    }else{
                      dealRevenueLevel4[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //Added by: Glenn
                //level 5
                for(var k = 0; k < dealRevenueLevel5.length; k++){
                  if(dealRevenueLevel5[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 5){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel5[k][1] += 0;
                    }else{
                      dealRevenueLevel5[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //Added by: Glenn
                //level 9
                for(var k = 0; k < dealRevenueLevel9.length; k++){
                  if(dealRevenueLevel9[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 9){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel9[k][1] += 0;
                    }else{
                      dealRevenueLevel9[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }


                //Added by Josh
                //Load data in monthly hbar chart for CM
                 //level 1
                 for(var k = 0; k < dealCmLevel1.length; k++){
                  if(dealCmLevel1[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 1){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel1[k][1] += 0;
                    }else{
                      dealCmLevel1[k][1] += deals[j].profile.CM;
                    }
                  }
                }


                //level 2
                for(var k = 0; k < dealCmLevel2.length; k++){
                  if(dealCmLevel2[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 2){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel2[k][1] += 0;
                    }else{
                      dealCmLevel2[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 3
                for(var k = 0; k < dealCmLevel3.length; k++){
                  if(dealCmLevel3[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 3){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel3[k][1] += 0;
                    }else{
                      dealCmLevel3[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 4
                for(var k = 0; k < dealCmLevel4.length; k++){
                  if(dealCmLevel4[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 4){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel4[k][1] += 0;
                    }else{
                      dealCmLevel4[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 5
                for(var k = 0; k < dealCmLevel5.length; k++){
                  if(dealCmLevel5[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 5){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel5[k][1] += 0;
                    }else{
                      dealCmLevel5[k][1] += deals[j].profile.CM;
                    }
                  }
                }
            
                //level 9
                for(var k = 0; k < dealCmLevel9.length; k++){
                  if(dealCmLevel9[k][0] == getMonthOnly(monthly) && deals[j].profile['Level'] == 9){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel9[k][1] += 0;
                    }else{
                      dealCmLevel9[k][1] += deals[j].profile.CM;
                    }
                  }
                }
              

                //Added by Glenn
                //Load data in monthly hbar chart
                //level 1
                for(var k = 0; k < dealRevenueLevel1Q.length; k++){
                  if(dealRevenueLevel1Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 1){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel1Q[k][1] += 0;
                    }else{
                      dealRevenueLevel1Q[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //level 2
                for(var k = 0; k < dealRevenueLevel2Q.length; k++){
                  if(dealRevenueLevel2Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 2){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel2Q[k][1] += 0;
                    }else{
                      dealRevenueLevel2Q[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //level 3
                for(var k = 0; k < dealRevenueLevel3Q.length; k++){
                  if(dealRevenueLevel3Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 3){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel3Q[k][1] += 0;
                    }else{
                      dealRevenueLevel3Q[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //level 4
                for(var k = 0; k < dealRevenueLevel4Q.length; k++){
                  if(dealRevenueLevel4Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 4){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel4Q[k][1] += 0;
                    }else{
                      dealRevenueLevel4Q[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //level 5
                for(var k = 0; k < dealRevenueLevel5Q.length; k++){
                  if(dealRevenueLevel5Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 5){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel5Q[k][1] += 0;
                    }else{
                      dealRevenueLevel5Q[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //level 9
                for(var k = 0; k < dealRevenueLevel9Q.length; k++){
                  if(dealRevenueLevel9Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 9){
                    if(isNaN(deals[j].profile.Revenue)){
                      dealRevenueLevel9Q[k][1] += 0;
                    }else{
                      dealRevenueLevel9Q[k][1] += deals[j].profile.Revenue;
                    }
                  }
                }

                //Added by Josh
                //Load data in monthly hbar chart for CM
                //level 1
                for(var k = 0; k < dealCmLevel1Q.length; k++){
                  if(dealCmLevel1Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 1){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel1Q[k][1] += 0;
                    }else{
                      dealCmLevel1Q[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 2
                for(var k = 0; k < dealCmLevel2Q.length; k++){
                  if(dealCmLevel2Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 2){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel2Q[k][1] += 0;
                    }else{
                      dealCmLevel2Q[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 3
                for(var k = 0; k < dealCmLevel3Q.length; k++){
                  if(dealCmLevel3Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 3){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel3Q[k][1] += 0;
                    }else{
                      dealCmLevel3Q[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 4
                for(var k = 0; k < dealCmLevel4Q.length; k++){
                  if(dealCmLevel4Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 4){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel4Q[k][1] += 0;
                    }else{
                      dealCmLevel4Q[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 5
                for(var k = 0; k < dealCmLevel5Q.length; k++){
                  if(dealCmLevel5Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 5){
                    if(isNaN(deals[j].profile.CM)){
                      dealRevenueLevel5Q[k][1] += 0;
                    }else{
                      dealCmLevel5Q[k][1] += deals[j].profile.CM;
                    }
                  }
                }

                //level 9
                for(var k = 0; k < dealCmLevel9Q.length; k++){
                  if(dealCmLevel9Q[k][0] == getQuarterly(monthly) && deals[j].profile['Level'] == 9){
                    if(isNaN(deals[j].profile.CM)){
                      dealCmLevel9Q[k][1] += 0;
                    }else{
                      dealCmLevel9Q[k][1] += deals[j].profile.CM;
                    }
                  }
                }
            }

            //dealRevenueLevel1.sort(function(a, b) { return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];});

            //sort deals revenue level by month
            dealRevenueLevel1.sort(function(a, b) {
             return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });
            dealRevenueLevel2.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });
            dealRevenueLevel3.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });
            dealRevenueLevel4.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });

            
            //deal revenues for level 5 and 9
            dealRevenueLevel5.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });
            dealRevenueLevel9.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });

            //added by Josh
            //sort deals CM level  by month
            dealCmLevel1.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
             });
             dealCmLevel2.sort(function(a, b) {
               return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
             });
             dealCmLevel3.sort(function(a, b) {
               return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
             });
             dealCmLevel4.sort(function(a, b) {
               return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
             });

             //deal cm for level 5 and 9
            dealCmLevel5.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });
            dealCmLevel9.sort(function(a, b) {
              return monthNames[a[0].split(' ')[0]] - monthNames[b[0].split(' ')[0]];
            });
            
            //set deals by Timeline Selection
            //Change chart timeline
            if($scope.selectedTimeline == 'monthly'){
              //line chart
              dealRevenuePerDateLine = dealRevenuePerDate;
              dealCMPerDateLine = dealCMPerDate;

              //bar chart
              dealRevenueLevel9Bar = dealRevenueLevel9;
              dealRevenueLevel5Bar = dealRevenueLevel5;
              dealRevenueLevel4Bar = dealRevenueLevel4;
              dealRevenueLevel3Bar = dealRevenueLevel3;
              dealRevenueLevel2Bar = dealRevenueLevel2;
              dealRevenueLevel1Bar = dealRevenueLevel1;

              //bar chart for CM
              dealCmLevel9Bar = dealCmLevel9;
              dealCmLevel5Bar = dealCmLevel5;
              dealCmLevel4Bar = dealCmLevel4;
              dealCmLevel3Bar = dealCmLevel3;
              dealCmLevel2Bar = dealCmLevel2;
              dealCmLevel1Bar = dealCmLevel1;


            } else if($scope.selectedTimeline == 'quarterly') {
              //line chart
              dealRevenuePerDateLine = dealRevenuePerDateQ;
              dealCMPerDateLine = dealCMPerDateQ;

              //bar chart
              dealRevenueLevel9Bar = dealRevenueLevel9Q;
              dealRevenueLevel5Bar = dealRevenueLevel5Q;
              dealRevenueLevel4Bar = dealRevenueLevel4Q;
              dealRevenueLevel3Bar = dealRevenueLevel3Q;
              dealRevenueLevel2Bar = dealRevenueLevel2Q;
              dealRevenueLevel1Bar = dealRevenueLevel1Q;

              //bar chart for CM 
              dealCmLevel9Bar = dealCmLevel9Q;
              dealCmLevel5Bar = dealCmLevel5Q;
              dealCmLevel4Bar = dealCmLevel4Q;
              dealCmLevel3Bar = dealCmLevel3Q;
              dealCmLevel2Bar = dealCmLevel2Q;
              dealCmLevel1Bar = dealCmLevel1Q;
            }

            //console.log(dealRevenueLevel5Bar);

            renderCharts();
        }

        function renderCharts(){
            
            //set data if monthly or quarterly
            var scaleXData = {};
            var seriesData = [];

            if($scope.selectedTimeline == 'monthly'){

              scaleXData = {
                 /*
                *START Dullao, Joshua 02/24/2022
                *
                * Fixed the Revenue and CM Line chart
                */
                minValue: getTimeStamp([new Date().getFullYear() - 1, '04', '01']),
                maxValue: getTimeStamp([new Date().getFullYear(), '03', '31']),
                zooming: true,
                // zoomTo:[0,15],
                /**END Dullao, Joshua 02/24/2022 */
                step: 'day',
                transform:{
                  type: 'date',
                  all: '%M %d'
                }
              };
              seriesData = [  // Insert your series data here.
                { values : dealRevenuePerDate.sort(), text: 'Revenue' },
                { values : dealCMPerDate.sort(), text: 'CM' }
              ];

            } else if($scope.selectedTimeline == 'quarterly'){

              scaleXData = {
                "zooming": true,
                "zoomTo":[0,15],
              };
              seriesData =  [{
                  "values": dealRevenuePerDateQ,
                  "text": "Revenue",
                },
                {
                  "values": dealCMPerDateQ,
                  "text": "CM"
                }
              ];

            }

            //line chart
            var dealsData = {
                "type": "line",  // Specify your chart type here.
                "title": {
                  "text": "Deals Revenue and CM Per Date",
                  "adjustLayout": true,
                  "marginTop": 5
                },
                "legend": {
                  "align": "center",
                  "verticalAlign": "top",
                  "backgroundColor":"none",
                  "borderWidth": 0,
                  "item":{
                    "cursor": "hand"
                  },
                  "marker":{
                    "type":"circle",
                    "borderWidth": 0,
                    "cursor": "hand"
                  }
                },
                "plotarea":{
                  "margin":"dynamic 70"
                },
                "plot":{
                  "aspect": "spline",
                  "lineWidth": 2,
                  "marker":{
                    "borderWidth": 0,
                    "size": 5
                  }
                },
                "preview":{
                  "adjustLayout": true,
                  "borderColor":"#E3E3E5",
                  "mask":{
                    "backgroundColor":"#E3E3E5"
                  }
                },
                "scale-y":{
                  "short":true,
                  "shortUnit":"K"
                },
                "scale-x":scaleXData,
                "series":seriesData
            };
            zingchart.render({
                id: 'dealsChart',
                data: dealsData,
                height: "100%",
                width: "100%"
            });

            //multi bar chart per level
            var multiBarChart = {
              "graphset": [{
                "type": "bar",
                "background-color": "white",
                "title": {
                  "text": "Revenue Per Level",
                  "backgroundColor": "none",
                  "font-size": "22px",
                  "alpha": 1,
                  "adjust-layout": true,
                },
                "plotarea": {
                  "margin": "dynamic"
                },
                "legend": {
                  "alpha": 0.05,
                  "shadow": false,
                  "align": "center",
                  "adjust-layout": true,
                  "marker": {
                    "type": "circle",
                    "border-color": "none",
                    "size": "10px"
                  },
                  "border-width": 0,
                  "maxItems": 3,
                  "toggle-action": "hide",
                  "pageOn": {
                    "backgroundColor": "#000",
                    "size": "10px",
                    "alpha": 0.65
                  },
                  "pageOff": {
                    "backgroundColor": "#7E7E7E",
                    "size": "10px",
                    "alpha": 0.65
                  },
                  "pageStatus": {
                    "color": "black"
                  }
                },
                "plot": {
                  "bars-space-left": 0.15,
                  "bars-space-right": 0.15,
                  "valueBox":{
                    "placement":"top-out",
                    "short":true
                  }
                },
                "preview":{
                  "adjustLayout": true,
                  "borderColor":"#E3E3E5",
                  "mask":{
                    "backgroundColor":"#E3E3E5"
                  }
                },
                "scale-x": {
                  "zooming": true,
                  "zoomTo":[0,15],
                },
                "scale-y": {
                  "short":true,
                  "shortUnit":"K"
                },
                "tooltip": {
                  "visible": false
                },
                "crosshair-x": {
                  "line-width": "100%",
                  "alpha": 0.18,
                  "plot-label": {
                    "header-text": "%kv Sales"
                  }
                },
                "series": [{
                    "values": dealRevenueLevel9Bar,
                    "alpha": 0.95,
                    "borderRadiusTopLeft": 7,
                    "text": "Level 9",
                  },
                  {
                    "values": dealRevenueLevel5Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 5"
                  },
                  {
                    "values": dealRevenueLevel4Bar,
                    "alpha": 0.95,
                    "borderRadiusTopLeft": 7,
                    "text": "Level 4"
                  },
                  {
                    "values": dealRevenueLevel3Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 3"
                  },
                  {
                    "values": dealRevenueLevel2Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 2"
                  },
                  {
                    "values": dealRevenueLevel1Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 1"
                  }
                ]
              }]
            };
            zingchart.render({
              id: 'multiBarChart',
              data: multiBarChart,
              height: '100%',
              width: '100%'
            });
            

            // Added by Josh
            // CM multi bar chart per level
             var cmMultiBarChart = {
              "graphset": [{
                "type": "bar",
                "background-color": "white",
                "title": {
                  "text": "CM Per Level",
                  "backgroundColor": "none",
                  "font-size": "22px",
                  "alpha": 1,
                  "adjust-layout": true,
                },
                "plotarea": {
                  "margin": "dynamic"
                },
                "legend": {
                  "alpha": 0.05,
                  "shadow": false,
                  "align": "center",
                  "adjust-layout": true,
                  "marker": {
                    "type": "circle",
                    "border-color": "none",
                    "size": "10px"
                  },
                  "border-width": 0,
                  "maxItems": 3,
                  "toggle-action": "hide",
                  "pageOn": {
                    "backgroundColor": "#000",
                    "size": "10px",
                    "alpha": 0.65
                  },
                  "pageOff": {
                    "backgroundColor": "#7E7E7E",
                    "size": "10px",
                    "alpha": 0.65
                  },
                  "pageStatus": {
                    "color": "black"
                  }
                },
                "plot": {
                  "bars-space-left": 0.15,
                  "bars-space-right": 0.15,
                  "valueBox":{
                    "placement":"top-out",
                    "short":true
                  }
                },
                "preview":{
                  "adjustLayout": true,
                  "borderColor":"#E3E3E5",
                  "mask":{
                    "backgroundColor":"#E3E3E5"
                  }
                },
                "scale-x": {
                  "zooming": true,
                  "zoomTo":[0,15],
                },
                "scale-y": {
                  "short":true,
                  "shortUnit":"K"
                },
                "tooltip": {
                  "visible": false
                },
                "crosshair-x": {
                  "line-width": "100%",
                  "alpha": 0.18,
                  "plot-label": {
                    "header-text": "%kv Sales"
                  }
                },
                "series": [{
                    "values": dealCmLevel9Bar,
                    "alpha": 0.95,
                    "borderRadiusTopLeft": 7,
                    "text": "Level 9",
                  },
                  {
                    "values": dealCmLevel5Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 5"
                  },
                  {
                    "values": dealCmLevel4Bar,
                    "alpha": 0.95,
                    "borderRadiusTopLeft": 7,
                    "text": "Level 4"
                  },
                  {
                    "values": dealCmLevel3Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 3"
                  },
                  {
                    "values": dealCmLevel2Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 2"
                  },
                  {
                    "values": dealCmLevel1Bar,
                    "borderRadiusTopLeft": 7,
                    "alpha": 0.95,
                    "text": "Level 1"
                  }
                ]
              }]
            };
            zingchart.render({
              id: 'cmMultiBarChart',
              data: cmMultiBarChart,
              height: '100%',
              width: '100%'
            });
            /*END Dullao, Joshua 02/16/2022*/
        }
    }
})();