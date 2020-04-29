

 app.controller('doctorhomeController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.newnoti = [];
    $scope.online = [];
    $scope.home = [];
    //$scope.consultation = 1;

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('doctor').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            $scope.curdoc = r[0].id;
            console.log($scope.curdoc)
            R.get('user_trans').query({doc_id : $scope.curdoc }, function (response) 
            {
                $scope.temp = response;
                $scope.newnoti = response;
                //console.log($scope.doctrans)
                console.log($scope.newnoti)
            })
       });
    }

    $scope.chgflg5 = function(id)
    {
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "id" : id,
                "req_status" : 5
			}
        }).then(function(response) 
        {
            console.log(response)
        })
        $route.reload();
    }

    $scope.chgflg3 = function(id)
    {
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "id" : id,
                "req_status" : 3
			}
		}).then(function(response) {
            console.log(response)
        })      
        $route.reload()
    }

})