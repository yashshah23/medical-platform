/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('mydoctorsController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
      
    $scope.load = function(){
        R.get('user_trans').query({user_id : $rootScope.currentUser.id}, function (res) {
            console.log(res)
            $scope.mydocs = res;
            
        });
    }

    $scope.initPay = function(id){
        $scope.dateTime = H.getDatetime()
        $http({
			method : "PUT",
			url : H.SETTINGS.baseUrl + '/user_trans/' + id,
			data : {
                "req_status" : 4,
                "datetime" : $scope.dateTime
			}
		}).then(function(response) {
            console.log(response)
        })
        $route.reload()
    }

})