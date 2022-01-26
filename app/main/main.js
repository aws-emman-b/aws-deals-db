(function(){
    'use strict';

    angular
        .module('app')
        .controller('MainController', Controller);

    
    function Controller($scope, $rootScope, $state, UserService, $window) {
        
        //console.log($rootScope.user);
        $scope.currentUser = $rootScope.user;

        // Instance the tour
        var name = $rootScope.user.firstName;
        var introTour = new Tour({
            //debug: true,
            storage : false,
            template: "<div class='popover tour-tour fight right in'>"+
                "<div class='arrow'></div>"+
                "<h3 class='popover-title'></h3>"+
                "<div class='popover-content'></div>"+
                "<div class='popover-navigation'>"+
                    "<div>"+
                        "<button class='btn btn-default' data-role='next'>Next</button>"+
                        "<button class='btn btn-default' data-role='end'>End tour</button>"+
                    "<div>"+
                "</div>"+
            "</div>",
            //template: "<div class='popover tour'><div class='arrow'></div><div class='popover-content'></div><div class='popover-navigation'><button class='btn btn-default' data-role='prev'>Å· Prev</button><span data-role='separator'>|</span><button class='btn btn-default' data-role='next'>Next Å‚</button></div><button class='btn btn-default' data-role='end'>End tour</button></div>",
            onEnd: function (tour) { 
                document.getElementById("overlay").style.display = "none";
            }
        });
        introTour.addSteps([
        {
            orphan: true,
            title: "AWS Deals Management System",
            content: "Welcome "+name+"! Let's start exploring the features of the application",
        },
        {
            element: ".nav_deals",
            placement: "right",
            backdrop: false,
            title: "Deals",
            content: "This section displays the deals list.", 
        },
        {
            element: ".nav_clients",
            placement: "right",
            backdrop: false,
            title: "Clients",
            content: "This section displays the clients list.",
            onNext: function (tour) {
                $state.go('dealList');
            },
        },

        //deal list
        {
            orphan: "true",
            title: "Deals List",
            content: "Here are the list of deals. You can add and edit a specific deal on the list.",
            backdrop: false,
        },
        {
            element: ".newDealBtn",
            placement: "right",
            title: "New deal button",
            content: "Click the New Deal button to add new deal.",
            backdrop: false,
        },
        {
            element: ".displayOptionsBox",
            placement: "right",
            title: "Display Options",
            content: "You can filter the deals list using this dropdown box.",
            backdrop: false,
        },
        {
            element: ".searchBox",
            placement: "left",
            backdrop: false,
            title: "Search Box",
            content: "You can use the search box for searching deals in the table.", 
        },
        {
            element: ".th_ID",
            placement: "top",
            backdrop: false,
            title: "Deal ID Link",
            content: "You can click the link when you want to edit the deal.", 
            onNext: function (tour) {
                $state.go('dealForm');
            },
        },
        /*{
            element: ".th_ID",
            placement: "top",
            //orphan: true,
            backdrop: false,
            title: "Deal ID Link",
            content: "You can click the link when you want to edit the deal.",
            onNext: function (tour) {
                $state.go('dealForm');
            },
        },*/

        //deal form
        {
            orphan: true,
            title: "New Deal Form",
            content: "This is the deal form divided into 5 distinct sections.",
            backdrop: false,
        },
        {
            element: ".profileSection",
            placement: "top",
            backdrop: false,
            title: "Profile",
            content: "The Profile Section.", 
        },
        {
            element: ".processSection",
            placement: "top",
            backdrop: false,
            title: "Process",
            content: "The Process Section.",
        },
        {
            element: ".distributionSection",
            placement: "top",
            backdrop: false,
            title: "Distribution",
            content: "The Distribution Section.",
        },
        {
            element: ".statusSection",
            placement: "top",
            backdrop: false,
            title: "Status",
            content: "The Status Section.",
        },
        {
            element: ".contentSection",
            placement: "top",
            backdrop: false,
            title: "Content",
            content: "The Content Section.",
        },
        {
            element: ".dealSubmitBtn",
            placement: "left",
            backdrop: false,
            title: "Submit Button",
            content: "The Deal Submit button is enabled when all inputs in all sections are valid.",
        },
        {
            orphan: true,
            backdrop: false,
            title: "End",
            content: "This ends the application guided tour. hank you for using AWS Deals Management System.",
        },

        ]);

        // Start the tour
        //console.log($rootScope.user.firstTimeLoggedIn);
        if($rootScope.user._id != undefined && $rootScope.user.firstTimeLoggedIn == true){

            //$rootScope.user.firstTimeLoggedIn = false;
            
            $scope.currentUser.firstTimeLoggedIn = false;

            UserService.Update($scope.currentUser)
            .then(function () {
                //update first time login to false
                //console.log($scope.currentUser);
            })
            .catch(function (error) {
                ngToast.danger(error); 
            });

            introTour.init();
            document.getElementById("overlay").style.display = "block";
            introTour.start();
        }
    }
})();