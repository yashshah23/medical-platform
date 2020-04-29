

 app.controller('addlabtechController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.ids = [];

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('lab_technician').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            $scope.labtech = r

       R.get('lab_tests').query({},function(res){
           //console.log(res)
           $scope.avlabs = res
           
           R.get('tests_in_labs').query({lab_organization_id : $scope.labtech[0].lab_organization.id},function(re){
            $scope.orgtests = re;
            console.log(re)
                
            for(i = 0; i<$scope.orgtests.length; i++){
                $scope.ids.push($scope.orgtests[i].lab_tests_id)
            }
            console.log($scope.ids)
        })
       })
    });
    }

    $scope.addtest = function(){

        var k = $scope.ids.includes(Number($scope.labid))

       if(k == false) {
                $http({
                method : "POST",
                url : H.SETTINGS.baseUrl + '/tests_in_labs',
                data : {
                    "lab_organization_id" : $scope.labtech[0].lab_organization.id,
                    "lab_tests_id" : $scope.labid,
                    "result_time" : $scope.time,
                    "fees" : $scope.fees
                }
            }).then(function(response) {
                console.log(response);
                $route.reload();
                $location.path('/alluploads');
            })
        } else {
            alert('Test Already Entered');
            $route.reload()
        }
    }

})