

 app.controller('alluploadsController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('lab_technician').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            console.log(r);
            console.log(r[0].lab_organization.id)
            /* R.get('lab_tests').query({lab_organization : r[0].lab_organization.id},function(tests){
                $scope.tests = tests;
                console.log(tests)
            }) */

            R.get('tests_in_labs').query({lab_organization_id : r[0].lab_organization.id},function(res){
                console.log(res)
                $scope.avlabs = res
            })
       });
    }

    $scope.delTest = function(id){
        
        $http({
			method : "DELETE",
			url : H.SETTINGS.baseUrl + '/tests_in_labs/'+id
		}).then(function(response) {
            console.log(response);
            $route.reload()
        })
    }

})