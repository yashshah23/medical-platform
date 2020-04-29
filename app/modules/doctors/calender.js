
   app.controller('calenderController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S) {
    $scope.dateobj = {};
    $scope.ardate = [];
    $scope.load = function(){
      if($rootScope.currentUser.role =='doctor'){
        $scope.date = new Date()
        $scope.currentdate = moment($scope.date).format('DD-MM-YY');
      R.get('doctor').query({users_id: $rootScope.currentUser.id},function(r){
        console.log(r)

        R.get('user_trans').query({doc_id : r[0].id, req_status : 5}, function(re){
          $scope.calval = re
          for (i = 0; i<$scope.calval.length; i++){
            $scope.nowdate = new Date()
            var d = re[i].date_selected_usr
            var k = d.split('-')
            var dateObject = new Date(+k[2], k[1] - 1, +k[0]); 
            var day = moment(dateObject).format('dddd')
            var month = moment(dateObject).format('MMMM')
            var daydate = moment(dateObject).format('DD')
            console.log(re);

            $scope.dateobj = {
              "date" : re[i].available_doc_time,
              "day" : day,
              "dateobj" : dateObject,
              "name" : re[i].type.name,
              "daydate" : daydate,
              "month" : month,
              "address" : re[i].user.addr2,
              "typeid" : re[i].type.id,
              "phone" : re[i].user.phone,
              "usrname" : re[i].user.first_name +' '+ re[i].user.last_name,
              "fromtime" : re[i].available_doc_time.fromtime,
              "totime" : re[i].available_doc_time.totime
            }

            //if($scope.nowdate < dateObject){

              $scope.ardate.push($scope.dateobj)
           // }
          }
          $scope.ardate.sort(function(a,b){
            var c = new Date(a.dateobj);
            var d = new Date(b.dateobj);
            return c-d;
            });
          console.log($scope.ardate)
        })
        /* $http({
          method : 'POST',
          url : 'http://localhost:80/pRESTige/api/procedures/calender',
          data : {
            "dates" : $scope.currentdate,
            "doctor_id" : r[0].id
          }
        }).then(function(res){
          console.log(res)
          $scope.calval = res.data
        }) */

      })
    }
  }
  
    });