/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('addtestsController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    $scope.load = function(){
        console.log("taro bap")
    }

    $scope.addtest = function(){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/lab_tests',
			data : {
                "test_name" : $scope.name,
                "test_details" : $scope.description
			}
		}).then(function(response) {
            
            console.log(response)
            
        })
    }
})