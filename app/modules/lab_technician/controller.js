

 app.controller('lab_technicianController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('lab_technician').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
           // console.log(r);
            $scope.orgname = r[0].lab_organization.name;

         R.get('lab_test_transaction').query({lab_organization_id:r[0].lab_organization.id},function(re){
            console.log(re);
            $scope.requests = re;

            R.get('user_tests').query({lab_organization_id:r[0].lab_organization.id},function(re){
               console.log(re);
               $scope.requests = re;
               
            })
         })

       });
    }

})