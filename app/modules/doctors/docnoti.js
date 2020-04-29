

 app.controller('docnotiController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {
     //console.log("JIJIJIJIJ")
    $scope.newnoti = [];

  //  debugger
     //console.log($rootScope.currentUser);
        R.get('doctor').query({users_id : $rootScope.currentUser.id }, function (r) 
        {debugger
            $scope.curdoc = r[0].id;
            //console.log($scope.curdoc)
            R.get('last_seen').query({doctor_id : $scope.curdoc }, function (res) 
            {
                $scope.lastseen = res[0].time;
                R.get('user_trans').query({doc_id : $scope.curdoc }, function (response) 
                {
                    $scope.doctrans = response;
                    //console.log($scope.doctrans)

                    for(i = 0; i<$scope.doctrans.length; i++)
                    {
                        if($scope.doctrans[i].datetime>$scope.lastseen)
                        {
                            $scope.newnoti.push($scope.doctrans[i]);
                        }
                    }
                    console.log($scope.newnoti.length)
                    $rootScope.notiPop = $scope.newnoti.length
                })
            })
       });

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