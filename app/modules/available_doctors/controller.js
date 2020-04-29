/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('available_doctorsController', function($scope, $controller, $rootScope, $location, H, R, $http, S){


    $scope.doc_name = []

    $scope.load = function(){
        //console.log("Initialized")
        R.get('doctor_patient').query({ }, function (response) {
            $scope.doc_pat = response;

            console.log($scope.doc_pat)
            /* var arr = $scope.doc_pat
            var array = [];

            var obj = arr.reduce(function(obj, item){
                obj[item.doctor.name] = obj[item.doctor.name] || [];
                obj[item.doctor.name].push(item);
                return obj;
            },[])
            console.log(obj)
            
            
            $scope.disp = Object.keys(obj).reduce(function(array, key){
                array.push({
                    name: key,
                    data: obj[key]
                });
                return array;
            }, [])

            console.log($scope.disp) */

            for(i=0; i<$scope.doc_pat.length; i++){
                $scope.doc_name.push($scope.doc_pat[i].doctor.name);
                if($scope.doc_pat[i].patient.user.id == $rootScope.currentUser.id){
                    //console.log($scope.doc_pat[i].doctor.name);
                }
            }
            console.log($scope.doc_name)
            var uniqueItems = Array.from(new Set($scope.doc_name))
            console.log(uniqueItems)



            R.get('doctor_info').query({}, function(res){
                $scope.doctors = res
                //console.log(res)
            });

        });
    }

})