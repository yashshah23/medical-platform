/*global app*/
app.controller('registerController', function($scope, $rootScope, $http, R, $location, $cookies, H, M, S) {

    $scope.firstname;
    $scope.gender;
    $scope.email;
    $scope.phone;
    $scope.password;
    $scope.pass;
    $scope.lastname;

    $scope.load = function(){
        
    }

    $scope.register = function(){

        $scope.pass = H.getHash($scope.password)
        console.log($scope.pass);
        console.log($scope.password);
        
        
        $http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/allusers/registering',
            data : {
               "email" : $scope.email,
               "password" : $scope.pass,
               "first_name" : $scope.firstname,
               "last_name" :  $scope.lastname,
               "gender" : $scope.gender,
               "phone" :$scope.phone
            }
        }).then(function(res) {
            console.log(res)

       })
    }

    
});
