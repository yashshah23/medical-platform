/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('homeodochomeController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    
    $scope.doc_name = [];
    $scope.docid = [];
    $scope.srch;
    $scope.date;
    $scope.name  = "Myself"
    $scope.doctors = []
    

    $scope.load = function(){
        //console.log($scope.dateTime)

        var now = new Date();

     var mm = moment(now).format("YYYY-MM-DD");
     console.log(mm)

     document.getElementById("dateday").value=mm;

     $scope.getDate()

     $scope.getDatetime()
      
        R.get('doctor').query({ }, function (response) {
            $scope.doc_pat = response;

            R.get('user_trans').query({}, function(res){
                $scope.status = res
                //console.log($scope.status)

                for(i=0; i<$scope.status.length; i++){
                    if($rootScope.currentUser.id == $scope.status[i].user_id){
                        
                        $scope.docid.push($scope.status[i].doc_id)
                    }
                }   // console.log($scope.docid);
            });
        });
    }

    //console.log($scope.date)

    /* $scope.getDatetime = function() {
        var m = new Date();
        $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
        //console.log($scope.dateTime);
      }; */

    $scope.hasDoc = function(doc_id){

        var n = $scope.docid.includes(doc_id);
        if (n){
            return 1;   
        }

    }
            $scope.getStat = $timeout(function(id){
                
                for(i = 0; i<$scope.status.length; i++){
                    if($scope.status[i].id == id){
                        //console.log($scope.status[i].req_status);
                    }
                }
            }, 2000)
    
    $scope.getReq = function(o){
        //console.log(o);
        R.get('user_trans').query({doc_id : o},function(res){
        return res.req_status;
    })
}

    $scope.fiftyClicks = function(name){
        $scope.name = name
      //  console.log(name)

        
        var tablinks = document.getElementsByClassName("tablinks");
        console.log(tablinks)
		for (i = 0; i < tablinks.length; i++) {
		  if (tablinks[i].id===name) {
             // console.log("Inside Loop")
			tablinks[i].className += " active"
          }
          else
          {
            tablinks[i].className= tablinks[i].className.replace("active","")             
          }
        }
        
       
    }
      
    $scope.sendReq = function(id){
        //console.log(id);

        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "doc_id" : id,
                "req_status" : 1,
                "date_selected_usr" : $scope.dateusr,
                "available_doc_time" : $scope.seltime,
                "datetime" : $scope.dateTime,
                "type" : 2,
                "patient" : $scope.name
			}
		}).then(function(response) {
            $scope.load()
            $scope.hasDoc(response.data.doc_id)
           // console.log(response.data.doc_id)
        })
        
    }

    $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
           // console.log(setResCall)
        }, 500)
    }
$scope.onclking = function(){
    
    var acc = document.getElementsByClassName("accordion");
    var i;
    
    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
} 

$scope.sendTime = function(id){
    $scope.seltime = id
    //console.log(id)
}

$scope.getDatetime = function() {
       var m = new Date();
       $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
       //console.log($scope.dateTime);
     };

     $scope.searching = function(){
        $scope.xyz = [];
            /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
            $timeout(function(){
                var setResCall =  H.getRes()
              //  $scope.doc_pat = setResCall.data;
               console.log(setResCall)
     
          
            }, 2000) */
            
          console.log($scope.srch)
    
            $scope.disp = $scope.doctors;
    
            for (i = 0; i<$scope.disp.length; i++){
                var lower = $scope.disp[i].name.toLowerCase()
                var o = lower.indexOf($scope.srch.toLowerCase());
                console.log(o)
                if(o != -1){
                 $scope.xyz.push($scope.disp[i])   
                }
                
            }
    
            $scope.disp = $scope.xyz
    
        }

 $scope.getDate=function(){
    //$scope.day = H.getDatetime()
    $scope.filtered = [];
    $scope.day=document.getElementById("dateday").valueAsDate;
    console.log($scope.day)
    $scope.dateusr = moment($scope.day).format("DD-MM-YYYY");  
     
    var m = moment($scope.day).format("dddd");  
    //console.log(m)

    R.get('available_doc_time').query({}, function(res){
        $scope.respo = res

        for(i = 0; i<$scope.respo.length; i++){
            if($scope.respo[i].available_doc_day.day_week.day == m){
                $scope.filtered.push($scope.respo[i])
            }
        }

        var arr = $scope.filtered
            var array = [];

            var obj = arr.reduce(function(obj, item){
                obj[item.available_doc_day.doctor.doctor_name] = obj[item.available_doc_day.doctor.doctor_name] || [];
                obj[item.available_doc_day.doctor.doctor_name].push(item);
                //console.log(item)
                return obj;
            },[])
            
            
            $scope.disp = Object.keys(obj).reduce(function(array, key){
                
                array.push({
                    name: key,
                    data: obj[key]
                });
                return array;
            }, [])
            
            $scope.doctors = $scope.disp
            //console.log($scope.disp)
    })

 }
    

})