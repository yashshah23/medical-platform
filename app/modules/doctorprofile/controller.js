/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */
app.controller('doctorprofileController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
    
    $scope.doc_name = []
    $scope.docid = [];
    $scope.phone;
    $scope.email;
    $scope.gender;
    $scope.addr;
    $scope.lastname;
    $scope.firstname;

    $scope.drid;
    $scope.doctor_name ; 
    $scope.specialization;
    $scope.education;
    $scope.details;
    $scope.fees;
    $scope.experience;
    $scope.address;
    $scope.medical_service_id;
    $scope.users_id;
    $scope.temp=[];
//$scope.days = ["Monday", "Tuesday","Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
$scope.hours = ['1:00','2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00','11:00','12:00']


$scope.load = function(){
    //console.log($rootScope.currentUser)

    $http({
        method : "GET",
        url : H.SETTINGS.baseUrl + '/users/' + $rootScope.currentUser.id

    }).then(function(res) 
    {
        console.log(res);
        $scope.id = res.data.id
        $scope.firstname = res.data.first_name 
        $scope.lastname = res.data.last_name
        $scope.addr = res.data.addr1
        $scope.gender = res.data.gender
        $scope.email = res.data.email
        $scope.phone = res.data.phone
        //console.log(res[0].first_name);
        //console.log($scope.lastname);
       // $rootScope.currentUser = res.data;
       // console.log($rootScope.currentUser);
        //alert("Successfully Updated User Information")
        
    })

   /*  R.get('users').query({email : $rootScope.currentUser.email}, function (res) 
    {
        //console.log(res);
        $scope.id = res[0].id
        $scope.firstname = res[0].first_name 
        $scope.lastname = res[0].last_name
        $scope.addr = res[0].addr1
        $scope.gender = res[0].gender
        $scope.email = res[0].email
        $scope.phone = res[0].phone
        //console.log(res[0].first_name);
        //console.log($scope.lastname);
        
    }); */

    R.get('day_week').query({}, function (res) 
    {
        //console.log(res);
        $scope.days = res
        //console.log(res);
        //console.log($scope.lastname);
        
    });

    R.get('doctor').query({}, function (res) 
    {
        //console.log(res);
        $scope.datas = res
        //console.log(res);
        //console.log($scope.lastname);
        
    });

    R.get('doctor').query({users_id : $rootScope.currentUser.id}, function (res) {
        //console.log(res);
        $scope.drid = res[0].id
        $scope.doctor_name = res[0].doctor_name 
        $scope.specialization = res[0].specialization
        $scope.education = res[0].education
        $scope.details = res[0].details
        $scope.fees = res[0].fees
        //$scope.phone = res[0].phone
        $scope.experience = res[0].experience
        $scope.address = res[0].address
        $scope.medical_service_id = res[0].medical_service_id
        $scope.users_id = res[0].users_id
       // console.log(res[0]);
        //console.log($scope.lastname);
        R.get('available_doc_days').query({doctor_id: $scope.drid}, function (re){
           $scope.totalworkingdays = re;
           

            R.get('available_doc_time').query({}, function(resp){
                $scope.totalworkingtime = resp;
            })
     });
        
    });
    
}
  
$scope.sendReq = function()
{
    //console.log(id);
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
                    "addr1" : $scope.addr 
                }
            }).then(function(response) 
            {
                console.log("cugkuahsiccjbiAjs")
                $rootScope.currentUser = response.data;
                console.log($rootScope.currentUser);
                //alert("Successfully Updated User Information")
                
            })
}
$scope.addCookie= function()
{
    for(i=0;i<$scope.datas.length;i++)
    {
       // console.log($scope.datas[i].id)
    $cookies.putObject($scope.datas[i].id, $scope.datas[i]);
    }
}
$scope.getCookie= function()
{
   // console.log("Cookkeee")
   //console.log($cookies.get("Data"))
   for(i=0;i<$scope.datas.length;i++)
   {
       //console.log(i)
    var p=$cookies.get($scope.datas[i].id)
    //console.log(p)
    var m =JSON.parse(p)
    //console.log("--------------------Bad SHAH-------------------------------------")
    //console.log(m)
   // console.log(JSON.parse(m))
    $scope.temp.push(m)
   }
  // console.log( $scope.temp)
}

$scope.sendPersonalDetails=function(){
//console.log(id);
$http({
    method : "POST",
    url : H.SETTINGS.baseUrl + '/doctor',
    data : {
        'id' : $scope.drid,
        'doctor_name' : $scope.doctor_name, 
        'specialization' : $scope.specialization,
        'education' : $scope.education,
        'details' : $scope.details,
        'fees' :$scope.fees,
        'experience' : $scope.experience,
        'address' : $scope.address,
        'medical_service_id' : $scope.medical_service_id,
        'users_id' : $scope.users_id
    }
}).then(function(response) 
{
    $rootScope.currentUser = response.data;
    //console.log($rootScope.currentUser);
    //alert("Successfully Updated User Information")
  
//   $scope.addCookie()
    $scope.getCookie()
})
}

    $scope.pusharr = function(){
    R.get('available_doc_days').query({doctor_id:$scope.drid, day_week_id: $scope.weekday    },function(res)
    {
        
        //console.log("Inside Dr Avaibility")
        //console.log(res)
        if(res.length == 0){$http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/available_doc_days',
            data : 
            {
                "doctor_id" : $scope.drid,
                "day_week_id" : $scope.weekday

            }
        }).then(function(response) 
        {
            $scope.av_day_id = response.data.id;
            $http({
                method : "POST",
                url : H.SETTINGS.baseUrl + '/available_doc_time',
                data : {
                    "available_doc_day_id" : $scope.av_day_id,
                    "fromtime" : $scope.hours1 + ' ' + $scope.fromampm,
                    "totime" :   $scope.hours2 + ' ' + $scope.toampm
    
                }
            }).then(function(response) {
                //alert("Insertedddd")
            })
        })
    } else {
        $http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/available_doc_time',
            data : {
                "available_doc_day_id" :res[0].id,
                "fromtime" : $scope.hours1 + ' ' + $scope.fromampm,
                "totime" :   $scope.hours2 + ' ' + $scope.toampm

            }
        }).then(function(response) {
            //alert("Insertedddd")
        })
    }
    $scope.load();
    })
    
    }

    $scope.delday = function(delid){
        $http({
            method : "DELETE",
            url : H.SETTINGS.baseUrl + '/available_doc_days/'+ delid

        }).then(function(ro) {
            console.log(ro)
            $scope.load()
        })
    }
})