/*global app*/
app.controller('reportsControllerBase', ControllerFactory('report_data'));

app.controller('reporthomeController', function ($scope, $rootScope, $controller, $http, $location, $route, $window, H, R) {
    $('.collapsible').collapsible();
	$scope.H = H;
	$scope.M = H.M;
	$scope.currentUserRole = $rootScope.currentUser.role;
	$scope.currentUserId = $rootScope.currentUser.id;
	$controller('reportsControllerBase', {
		$scope: $scope
	});
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

	$scope.query({}, function(r) {
		$scope.totalformdata=r;
		$scope.totalItems = r.length;
	});

	$scope.load = function(){
		
		$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
			$scope.user_groups = r.data;
			$http.get(H.SETTINGS.baseUrl + '/report_data').then(function(response) {
		        $scope.chart_data = [];
		        $scope.data_report_ids = [];
		        $scope.data_report_original = response.data;
		        for(var i = 0; i < response.data.length; i++) {
		        	if((response.data[i].data_source.UserId != undefined && response.data[i].data_source.UserId.split(',').includes($scope.currentUserId.toString())) || (response.data[i].data_source.GroupId != undefined && checkGroups(response.data[i].data_source.GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
		        		if(!$scope.data_report_ids.includes(response.data[i].charts.id)) {
		        			$scope.chart_data.push(response.data[i].charts);
		        			$scope.data_report_ids.push(response.data[i].charts.id);
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
	
	$scope.view = function(obj){
		var id = obj;
		//$location.path('/report_show/' + id);
		$window.location.href = '#!/report_show/' + id;
	};
	$scope.edit = function(obj){
		var id = obj;
		$window.location.href = '#!/report_edit/' + id;
	};
	
	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$http.delete(H.SETTINGS.baseUrl + '/display_charts/' + obj).then(function(data) {
			$route.reload();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	};

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	};
	
	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this User?',
		text: 'If you proceed, all your records associated with this user will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ $scope.deleteObject($scope.deleteCandidate); },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	};
	
});