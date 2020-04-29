/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('ongoing_transactionsController', function($scope, $routeParams, $controller, $rootScope, $route, $route, $location, H, R, $http, S){


    $scope.load = function(){
        
            R.get('lab_test_transaction').query({users_id : $rootScope.currentUser.id}, function(re){
                $scope.trans = re;
                console.log($scope.trans)
               // $scope.testsid = re.
            })

    }

})