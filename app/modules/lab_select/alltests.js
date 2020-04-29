/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('alltestsController', function($scope, $controller, $rootScope, $route, $location, H, R, $http, S){

    $scope.testid = [];
    $scope.alltests = [];

    $scope.load = function(){
        
        R.get('lab_tests').query({ }, function (response) {
            $scope.alltests = response;
            $scope.tests = response;

            console.log($scope.tests)

            R.get('user_tests').query({}, function(res){
                $scope.status = res
                console.log(res)

                for(i=0; i<$scope.status.length; i++){
                if($rootScope.currentUser.id == $scope.status[i].user_id){
                      
                    $scope.testid.push($scope.status[i].lab_test_id)
                
               
            }
        }   // console.log($scope.docid);
            });

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
			url : H.SETTINGS.baseUrl + '/user_tests',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "lab_test_id" : test
			}
		}).then(function(response) {
            //console.log(response)
        })
        $route.reload();
    }

   /*  $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
            console.log(setResCall)
        }, 500)
    } */

})