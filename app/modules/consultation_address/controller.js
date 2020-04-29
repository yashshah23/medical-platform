
app.controller('consultation_addressControllerBase', ControllerFactory('consultation_address'))

app.controller('consultation_addressController', function($scope, $controller, $rootScope, $location, H, R, $http, S){

    $scope.load = function(){
        R.get('patient_info').query({}, function(res){
            $scope.pat_add = res;
        })
    }

})