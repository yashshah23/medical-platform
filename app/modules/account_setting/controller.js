/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('account_settingController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
			
	
	$scope.load = function(){
		$scope.user = $rootScope.currentUser
		console.log($scope.user)
	}
    $scope.logout = function(){
		if ($rootScope.currentUser.role == 'doctor'){
			R.get('doctor').query({users_id : $rootScope.currentUser.id}, function(res){
				$scope.docid = res[0].id
				console.log($scope.docid)
				R.get('last_seen').query({doctor_id : $scope.docid}, function(resp){
					$scope.lastseenid = resp[0].id
					console.log(resp)
					$http({
						method : "PUT",
						url : H.SETTINGS.baseUrl + '/last_seen',
						data : {
							"id" : $scope.lastseenid,
							"doctor_id" : $scope.docid,
							"time" : H.getDatetime()
						}
					}).then(function(response) {
						console.log(response);
								
					$cookies.remove(H.getCookieKey());
					delete $rootScope.currentUser;
					$location.path('/sign-in');
						
					})
				})
			})

		} else {
			
			$timeout(function(){
			$cookies.remove(H.getCookieKey());
			delete $rootScope.currentUser;
			$location.path('/sign-in');
			}, 500)
		}

    }

})