/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('tests_labsController', function($scope, $controller, $rootScope, $route, $route, $location, H, R, $http, S){

    $scope.tot = [];
    $scope.sum;
    $scope.m=0;
    $scope.testsids = [];

    $scope.load = function(){


        R.get('user_tests').query({user_id : $rootScope.currentUser.id }, function (response) {
            $scope.user_tests = response;
            console.log(response);

            for(i = 0; i<$scope.user_tests.length; i++){
                $scope.testsids.push($scope.user_tests[i].lab_test_id);
            }
            $scope.testsids.toString()
            console.log($scope.testsids)

           // console.log(id)
            $http({
                method : "GET",
                url : H.SETTINGS.baseUrl + '/get/lab/?test='+ $scope.testsids,

            }).then(function(rep){
                $scope.labs = rep.data
                console.log($scope.labs);

                if($scope.labs.length == undefined){
                    $scope.oneflag = true;
                }else{
                    $scope.oneflag = false;
                }
            })

           // $rootScope.html = [1,2,3,4,5];
            

        /* $scope.total = function(){
            for (i = 0; i<$scope.user_tests.length; i++){
                $scope.tot.push($scope.user_tests[i].lab_test.fees)
            }

            for(i = 0; i<$scope.tot.length; i++){
                $scope.m = $scope.m + $scope.tot[i];
            }
            console.log($scope.m);
        }
        $scope.total() */
        
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