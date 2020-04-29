/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('scheduletestController', function($scope, $routeParams, $controller, $rootScope, $route, $route, $location, H, R, $http, S){

    $scope.schid = $routeParams.id
    $scope.patient = "Myself"
    $scope.ids = [];

    $scope.load = function(){
        
        console.log($scope.schid)

        $http({
            method : "GET",
            url : H.SETTINGS.baseUrl + '/tests_in_labs/'+ $scope.schid,

        }).then(function(rep){
            $scope.labsid = rep.data.lab_organization_id
          //  console.log($scope.labsid)

            /* R.get('tests_in_labs').query({lab_organization_id:$scope.labsid}, function(re){
                console.log(re)
            }) */
            R.get('user_tests').query({user_id : $rootScope.currentUser.id}, function(re){
                $scope.usertests = re;
               // console.log(re)
                for(i = 0; i<re.length;i++){
                    $scope.ids.push(re[i].lab_test_id)
                }
                console.log($scope.ids)
            })
        })
    }

    $scope.setVal = function(i){
        console.log(i);
        $scope.patient = i;
    }

    $scope.addDate = function(){
        console.log($scope.dateday)
    }

    $scope.scheduleTest = function(){
        $scope.m = $scope.ids.toString()
        $scope.currenttime = H.getDatetime();
        var date = moment($scope.dateday).format("DD-MM-YYYY")
        console.log($scope.m)
        console.log(date);

        $http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/lab_test_transaction',
            data : {
                "lab_organization_id" : $scope.labsid,
                "tests_in_labs_id" : $scope.m,
                "datetime" : $scope.currenttime,
                "req_status" : 1,
                "date_sel_user" : date,
                "patient" : $scope.patient,
                "description" : $scope.comments,
                "users_id" : $rootScope.currentUser.id
            }

        }).then(function(resp){
            
            console.log(resp)
            //$route.reload();
            
            for(i = 0; i<$scope.usertests.length; i++){

                $http({
                    method : "PUT",
                    url : H.SETTINGS.baseUrl + '/user_tests/' + $scope.usertests[i].id,
                    data: {
                        "in_cart_status" : 1
                    }
        
                }).then(function(repo){
                    console.log(repo);
                })
            }

        })

    }

})