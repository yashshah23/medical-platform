/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('cartController', function($scope, $controller, $rootScope, $route, $route, $location, H, R, $http, S){

    $scope.tot = [];
    $scope.sum;
    $scope.m=0;
    $scope.load = function(){
        console.log("Init")
        R.get('user_tests').query({user_id : $rootScope.currentUser.id }, function (response) {
            $scope.user_tests = response;
            console.log(response);

           // $rootScope.html = [1,2,3,4,5];
            

        $scope.total = function(){
            for (i = 0; i<$scope.user_tests.length; i++){
                $scope.tot.push($scope.user_tests[i].lab_test.fees)
            }

            for(i = 0; i<$scope.tot.length; i++){
                $scope.m = $scope.m + $scope.tot[i];
            }
            console.log($scope.m);
        }
        $scope.total()
        
        });
        
    }

    $scope.delTest = function(id){
        console.log(id)
        $http({
			method : "DELETE",
			url : H.SETTINGS.baseUrl + '/user_tests/'+ id,
        })
        $route.reload()
    }

    $scope.payTest = function(){

    }

})