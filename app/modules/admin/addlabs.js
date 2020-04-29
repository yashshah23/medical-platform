/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('addlabsController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    $scope.load = function(){
        console.log("taro bap")
    }

    $scope.addlab = function(){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/lab_organization',
			data : {
                "name" : $scope.name,
                "priority" : $scope.priority
			}
		}).then(function(response) {
            
            console.log(response)
            
        })
    }
})