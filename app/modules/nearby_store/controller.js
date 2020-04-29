/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('nearby_storeController', function($scope, L, $controller, $timeout,$rootScope, $route, $location, H, R, $http, S){

    //$scope.ser_arr = [];
    $scope.srch;

    $scope.load = function(){

        
        R.get('medical_store').query({ }, function (response) {
            $scope.stores = response;

            //console.log($scope.stores);

        });
        var m =  L.getLocation();
        
        $timeout(function(){
            
            console.log();
        },10000)
    }

    $scope.searching = function(){
        
        var ser_arr = H.searchArr('medical_store','name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.stores = setResCall.data;
            console.log(setResCall)
        }, 500)    
        //$scope.stores = ser_arr;
        //console.log(H.res)
    }

})