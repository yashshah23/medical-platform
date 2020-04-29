/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('prescribedtestsController', function($scope, $controller, $rootScope, $route, $location, H, R, $http, S){


    app.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]);

   // $scope.doc_name = [];
    $scope.testid = [];
    $scope.path;

    $scope.load = function(){
        //console.log("Initialized")
        R.get('prescribed_tests').query({users_id: $rootScope.currentUser.id }, function (res) {
            $scope.prescribed_tests = res;
            //console.log(res)
            R.get('user_tests').query({}, function(res){
                $scope.status = res
                //console.log(res)

                for(i=0; i<$scope.status.length; i++){
                if($rootScope.currentUser.id == $scope.status[i].user_id){
                      
                    $scope.testid.push($scope.status[i].lab_test_id)
                    }
                }  
               // console.log($scope.test_id)
            });
        });

        var content = 'C:/xampp/htdocs/prestige/api/uploads/files/1-coursera';
        var blob = new Blob([ content ], { type : 'text/plain' });
        $scope.url = (window.URL || window.webkitURL).createObjectURL( blob );
        console.log(blob);
        console.log(window.URL);
        console.log(window.webkitURL)
        console.log($scope.url);
    }
    
    $scope.hasTest = function(test_id){
       // console.log(test_id)

        var n = $scope.testid.includes(test_id);
        if (n){
            return 1;   
        }

    }

    $scope.uploadFunction = function(){
        console.dir($scope.myFile)
       /*  $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/files',
			data : {
                "files" : $scope.myFile
			}
		}).then(function(response) {
            console.log(response)
        }) */

            var uploadUrl = S.baseUrl + '/files';
            var fd = new FormData();
            fd.append('file', $scope.myFile, $scope.myFile.name);
            //console.log(fd);
            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).then(function (r) {
                console.log(r)
                //callback(null,r.data.file)
            }, function (error) {
                //callback(error,null)
            });
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

})