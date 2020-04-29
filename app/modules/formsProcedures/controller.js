//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('proceduresControllerBase', ControllerFactory('procedures'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD
app.controller('formsProceduresController', function($scope, $rootScope, $controller, S, R, H, $http) {
	//Copy all scope variables from Base Controller
	$controller('proceduresControllerBase', {
		$scope: $scope
	});


	
	$scope.roleOfCurrentUser = false;
		//console.log($rootScope.currentUser);
        $scope.currentUser = $rootScope.currentUser.role;
        if($scope.currentUser == 'admin'){
            $scope.roleOfCurrentUser = true;
        }
		$scope.viewby = 5;
		// $scope.totalItems = $scope.data.length;
		$scope.currentPage = 3;
		$scope.itemsPerPage = 10;
		  $scope.maxSize = 2;
		  $scope.setPage = function (pageNo) {
		  $scope.currentPage = pageNo;
		};
	  
		$scope.pageChanged = function() {
		  console.log('Page changed to: ' + $scope.currentPage);
		};
	  
	  $scope.setItemsPerPage = function(num) {
		$scope.itemsPerPage = num;
		$scope.currentPage = 1; //reset to first page
	  }
		  //
	//Load all posts on initialization
	$scope.query({}, function(r) {
		$scope.totalformdata=r;
		$scope.totalItems = r.length;
	});
	
	$scope.load = function(){
		
		$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
			$scope.user_groups = r.data;
			$http.get(H.SETTINGS.baseUrl + '/procedure_forms').then(function(response) {
		        $scope.procedure_data = [];
		        $scope.procedure_ids = [];
		        $scope.procedure_data_original = response.data;
		        for(var i = 0; i < response.data.length; i++) {
		        	if((response.data[i].form.UserId != undefined && response.data[i].form.UserId.split(',').includes($rootScope.currentUser.id.toString())) || (response.data[i].form.GroupId != undefined && checkGroups(response.data[i].form.GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
		        		if(!$scope.procedure_ids.includes(response.data[i].procedure.id)) {
		        			$scope.procedure_data.push(response.data[i].procedure);
		        			$scope.procedure_ids.push(response.data[i].procedure.id);
		        		}
		        	}
		        }
		    });
		});    
	}
	
	function checkGroups(groups) {
    	var groupsOfForm = groups.map(function(item) {
			return $scope.user_groups.find(function(i) {
		   		return i.id == item;
	   		});
		});
		var userIdsOfGroupsString = groupsOfForm.map(function(item) {
			return item.userId;
		});
		return userIdsOfGroupsString.join().split(',').includes($scope.currentUserId.toString());
		
    }

	$scope.edit = function(obj) {
		$scope.mode = $scope.MODES.edit;
		$scope.editing = obj.id;
	};

	$scope.saveSingle = function() {
		$scope.save(null, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.initSingle();
			$scope.query();
		});
	};

	$scope.saveObject = function(obj) {
		$scope.save(obj, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.query();
		});
	};

	$scope.cancel = function(obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this procedure?',
		text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ $scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length=""
		 },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	}

	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function(){},
		showCancel: false,
		cancelText: '',
		onCancelClick: function(){}
	}

	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$scope.delete(obj, function(r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	}

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			direction: 'left'
		});
	});


});