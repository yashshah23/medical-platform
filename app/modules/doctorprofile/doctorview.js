/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */
app.controller('doctorviewController', function($scope, $cookies,$routeParams, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
    
    $scope.load = function(){
        console.log($routeParams.id)
        
        $http({
            method : "GET",
            url : H.SETTINGS.baseUrl + '/doctor/' + $routeParams.id
    
        }).then(function(res) {
            $scope.d = res.data;
        })
    }
})