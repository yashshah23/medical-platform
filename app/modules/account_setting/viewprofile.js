/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('viewprofileController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    
    $scope.doc_name = []
    $scope.docid = [];
    $scope.phone;
    $scope.email;
    $scope.gender;
    $scope.addr;
    $scope.lastname;
    $scope.firstname;
    $scope.editmode = false;
    $scope.names = [];
    $scope.city;
    $scope.area;
    

    $scope.load = function(){

        R.get('city').query({}, function(re){
            $scope.city = re;
            console.log(re)
        })
        
        R.get('users').query({email : $rootScope.currentUser.email}, function (res) {
            console.log(res);
            $scope.id = res[0].id
            $scope.firstname = res[0].first_name 
            $scope.lastname = res[0].last_name
            $scope.addr = res[0].addr1
            $scope.addr2 = res[0].addr2
            $scope.zip = res[0].zip
            $scope.gender = res[0].gender
            $scope.email = res[0].email
            $scope.phone = res[0].phone
            $scope.myCity = res[0].city.city_name
            $scope.myArea = res[0].are.area_name
            
        });
        
        
    }

    $scope.edit = function(){
        $scope.editmode = true;
    }

    $scope.filterArea = function(cityId){
        $scope.cityId = cityId;
        console.log(cityId);
        R.get('area').query({city_id: cityId}, function(r){
            $scope.areas = r;
            console.log($scope.city)
            console.log(r)
        })
    }

    $scope.getArea = function(ar){
        $scope.area = ar;
    }
      
    $scope.sendReq = function(area){
        console.log($scope.addr2);
        console.log($scope.area);
        console.log(area)
        

        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/users',
			data : {
                "id" : $scope.id,
                "first_name" :  $scope.firstname,
                "last_name" :  $scope.lastname,
                "gender" : $scope.gender,
                "email" : $scope.email,
                "phone" :$scope.phone,
                "addr1" : $scope.addr, 
                "addr2" : $scope.addr2,
                "zip" : $scope.zip,
                "city_id" : $scope.cityId,
                "are_id" : $scope.area
			}
		}).then(function(response) {
            $rootScope.currentUser = response.data;
            $scope.editmode = false;
            console.log($rootScope.currentUser);
            alert("Successfully Updated User Information")
            
        })
    }

})