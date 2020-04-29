/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('alldoctestController', function($scope, $controller, $rootScope,$routeParams, $route, $location, H, R, $http, S){
    $scope.id;
    $scope.testid = [];


    $scope.load = function(){

        $scope.id = $routeParams.id;

        R.get('lab_tests').query({ }, function (response) {
            $scope.tests = response;
            $scope.alltests = response;

            
			R.get('doctor').query({users_id : $rootScope.currentUser.id}, function(r){
               $scope.docid = r[0].id;

                R.get('prescribed_tests').query({doctor_id : r[0].id, users_id : $scope.id}, function(res){
                    $scope.status = res
                    //console.log(res)
    
                    for(i=0; i<$scope.status.length; i++){
                          
                        $scope.testid.push($scope.status[i].lab_tests_id)
                    }
                    console.log($scope.testid)
                });
                
			})
           // console.log($scope.tests)

        });
    }

    $scope.isAdded = function(){
        
    }
    $scope.hasTest = function(test_id){

        var n = $scope.testid.includes(test_id);
        if (n){
            return 1;   
        }

    }

    $scope.searching = function(){
        $scope.xyz = [];
        $scope.tests = $scope.alltests;
        //$scope.load()
            /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
            $timeout(function(){
                var setResCall =  H.getRes()
              //  $scope.doc_pat = setResCall.data;
               console.log(setResCall)
     
          
            }, 2000) */
            
          console.log($scope.srch)
    
            for (i = 0; i<$scope.tests.length; i++){
                var lower = $scope.tests[i].test_name.toLowerCase()
                var o = lower.indexOf($scope.srch.toLowerCase());
                console.log(o)
                if(o != -1){
                 $scope.xyz.push($scope.tests[i])   
                }
                
            }
    
            $scope.tests = $scope.xyz
    
        }

    $scope.addTest = function(test){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/prescribed_tests',
			data : {
                "doctor_id" : $scope.docid,
                "users_id" : $scope.id,
                "lab_tests_id" : test
			}
		}).then(function(response) {
            //console.log(response)
        })
        $route.reload();
    }

  /*   $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
            console.log(setResCall)
        }, 500)
    } */

})