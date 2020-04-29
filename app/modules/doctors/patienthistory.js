

 app.controller('patienthistoryController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {
    $scope.newnoti = [];
    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('doctor').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            $scope.curdoc = r[0].id;
            console.log($scope.curdoc)
            R.get('user_trans').query({doc_id : $scope.curdoc }, function (response) 
            {
                $scope.newnoti = response;
                console.log($scope.doctrans)
                //console.log($scope.newnoti)
            })
       });
    }

})