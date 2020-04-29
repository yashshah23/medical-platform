app.controller('formsUsersDetailsController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, S) {

	$scope.id = $routeParams.id;
	$scope.disabled = true;
    $scope.mode = 'view';
    $scope.modeDisable = false;

    $scope.roles = [];

    $scope.role;

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			direction: 'top'
		});
	});
	
	$scope.load = function() {
		
		//$scope.id = 0;
		R.get('users/' + $scope.id).get(function(r) {
            $scope.data = r;
            $scope.data.role = r.role;
            $scope.data.is_active = r.is_active == 1? true :false;
		});
    };
    
    R.get('roles').query({}, function (roles) {
    	let j = 0;
    	for(let i =0; i < roles.length; i++) {
    		if(roles[i].id != 1) {
        		$scope.roles[j] = roles[i];
        		j++;
    		}
    	}
    });
   
    $scope.savedModalOptions = {
        header: 'Saved!',
        text: 'Your entry has been saved successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function() {
            $location.path('forms-users');
            
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function() {
            $scope.data.first_name = ''
            $scope.data.last_name = ''
            $scope.data.email = ''
            $scope.data.password = ''
            $scope.data.confirmPassword = ''
            $scope.data.role = ''
        }
    }


    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Users.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {
            $location.path('forms-users');
        },
        showCancel: true,
        cancelText: 'Cancel',
        onCancelClick: function() {}
    }

    $scope.errorModalOptions = {
        header: 'An error occured ...',
        text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }

    $scope.modalOptions = {};

    $scope.cancelForm = function() {
        $scope.modalOptions.open($scope.cancelModalOptions);
    }

    $scope.showErrorModal = function() {
        $scope.modalOptions.open($scope.errorModalOptions);
    }

    $scope.showFormSavedModal = function() {
        $scope.modalOptions.open($scope.savedModalOptions);
    }


});

app.controller('formsUsersAddController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, S, H) {
	$controller('formsUsersDetailsController', {
		$scope: $scope
    });
    
    $scope.prioritiess;
	$scope.disabled = true;
    $scope.mode = 'add';
    $scope.user = {
        password: "",
        confirmPassword: ""
      };
    $scope.modeDisable = false;
    
    $scope.techlab;

    $scope.role;

    // if($scope.mode == 'add'){
    //     $scope.modeDisable = true
    // }
	
	var User = R.get('users');

	$scope.load = function() {
        $( "#title" ).focus();
        $scope.data = new User();
		
        $scope.data.is_active=true;
        
        R.get('lab_organization').query({}, function(res){
            console.log(res)
            $scope.totallabs = res
        })
        
        R.get('roles').query({}, function (roles) {
            let j = 0;
		    	for(let i =0; i < roles.length; i++) {
		    		if(roles[i].id != 1) {
		        		$scope.roles[j] = roles[i];
		        		j++;
		    		}
		    	}
        });
    };

    $scope.click = function(id){
        $scope.lab = id
        console.log($scope.lab)
    }

    $scope.priorities = function(x){
        $scope.prioritiess = x;
        
    }

    $scope.saveUser = function() {
    	$scope.data.is_active == true ? 1:0;
         if($scope.user.password !=$scope.user.confirmPassword){
            return;
        }
        $scope.data.password = H.getHash($scope.user.password);
        $scope.data.$save().then(function(r){
            console.log($scope.prioritiess)
            console.log(r);
            if(r.role == 'doctor'){
                $http({
                    method : "POST",
                    url : H.SETTINGS.baseUrl + '/doctor',
                    data : {
                        
                        "doctor_name" : r.first_name +' '+ r.last_name,
                        "users_id" : r.id,
                        "medical_service_id" : 4,
                       "priority" : $scope.prioritiess
                    }
                }).then(function(response) { 
                    $http({
                        method : "POST",
                        url : H.SETTINGS.baseUrl + '/last_seen',
                        data : {
                            "time" : H.getDatetime(),
                            "doctor_id" : response.data.id
                        }
                    }).then(function(resp) {
                        console.log(resp)
                })
            })
            } else if(r.role == 'technician'){
                $http({
                    method : "POST",
                    url : H.SETTINGS.baseUrl + '/lab_technician',
                    data : {
                        "name" :  r.first_name +' '+ r.last_name,
                        "lab_organization_id" : $scope.lab,
                        "users_id" : r.id
                    }
                }).then(function(resp) {
                    console.log(resp)
            })
            }
        }, function(e){
            $scope.showErrorModal();
        });
    }
    
});


app.controller('formsUsersEditController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, S, H) {


//app.controller('usersEditController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, SETTINGS) {


    $controller('formsUsersDetailsController', {
        $scope: $scope
    });
    $scope.disabled = false;
    $scope.mode = 'edit';
    $scope.role;


    if($scope.mode == 'edit'){
        $scope.modeDisable = true
    }

    $scope.roles = [] ;

    $scope.load = function() {
        $( "#title" ).focus();
       // $scope.data = new User();
        
        R.get('users/' + $scope.id).get(function(r) {
            $scope.data = r;
            $scope.data.role = r.role;
            $scope.data.is_active = r.is_active == 1? true :false;
		});


        R.get('roles').query({}, function (roles) {
		    let j = 0;
	    	for(let i =0; i < roles.length; i++) {
	    		if(roles[i].id != 1) {
	        		$scope.roles[j] = roles[i];
	        		j++;
	    		}
	    	}

            
        });
    };
    
    $scope.save = function() {
        if($scope.data.id){
            var User = R.get('users/').query(function(data){
                delete $scope.data.role
                User=$scope.data;
                User.is_active =  $scope.data.is_active == true ? 1:0;
                User.$save();
                })
            $scope.showFormSavedModal();

        }else{
            $scope.data.$save().then(function(r) {
                $scope.showErrorModal();
            });
        }
    }

    $scope.savedModalOptions = {
        header: 'Updated!',
        text: 'Your entry has been updated successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function() {
            $location.path('forms-users');
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function() {
            $scope.data.first_name = ''
            $scope.data.last_name = ''
            $scope.data.email = ''
            $scope.data.password = ''
            $scope.data.confirmPassword = ''
            $scope.data.role = ''
        }
    }


    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Users.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {
            $location.path('forms-users');
        },
        showCancel: true,
        cancelText: 'Cancel',
        onCancelClick: function() {}
    }

    $scope.errorModalOptions = {
        header: 'An error occured ...',
        text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }

    $scope.modalOptions = {};

    $scope.cancelForm = function() {
        $scope.modalOptions.open($scope.cancelModalOptions);
    }

    $scope.showErrorModal = function() {
        $scope.modalOptions.open($scope.errorModalOptions);
    }

    $scope.showFormSavedModal = function() {
        $scope.modalOptions.open($scope.savedModalOptions);
    }


    $(function() {
        $('.fixed-action-btn').floatingActionButton({});
    });
});



