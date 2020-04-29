//An example of Angular $http

app.controller('formsCategoryAddController', function($scope, $rootScope, $http, R, S, $location, $q) {
	$scope.pageheader="CREATE A NEW CATEGORY";
	$scope.data={};
	$scope.data.is_active=true;
	$scope.isDisabled = false;
	$scope.roleOfCurrentUser = $rootScope.currentUser.role;
	 
	 
	R.get('category').query({}, function (r) {
		$scope.uniquecat = r;
        $scope.titlelist = r.map(function (data) {
            return data.title;
		});
    }, function (e) {

	});
	$scope.uiquecategory = function (t) {
		console.log(t);
		for(let x = 0; x < $scope.titlelist.length; x++){
		if($scope.titlelist[x] == t){
			$scope.showErrorModalNewEntry();
		}
	}

	}
	
	angular.element(document).ready(function() {

		$( "#title" ).focus();
		$('.fixed-action-btn').floatingActionButton({

		});

	});


	$scope.showErrorModalNewEntry = function() {
        $scope.modalOptions.open($scope.errorModalOptionsNewEntry);
    }
    
    $scope.errorModalOptionsNewEntry = {
    	header: 'Warning ...',
        text: 'Category name already exist !!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {

        },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Category.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function() {
			$location.path('forms-category');
		},
		showCancel: true,
		cancelText: 'Cancel',
		onCancelClick: function() {}
	}

	$scope.savedModalOptions = {
		header: 'Saved!',
		text: 'Your entry has been saved successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function() {
			$location.path('forms-category');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function() {
			document.getElementById('title').value='';
			clearFieldType();
			$scope.fields=[];
			$scope.isDisabled = false;

		}
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
	
	$scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
	$scope.errorModalOptionsTitle = {
		    header: 'Warning ...',
	        text: 'Please enter a Title to the Question!',
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

	$scope.launchErrorModal = function() {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function() {
		$scope.modalOptions.open($scope.savedModalOptions);
	}

	$scope.saveCategoty = function() {
		$scope.isDisabled = true;
		var Categoty = R.get('category');
		var category = new Categoty();
		if($scope.data.title == '' || $scope.data.title == ' ' || $scope.data.title == undefined) {
			$scope.showErrorModalTitle();
			$scope.isDisabled = false;
			return;
		}
		category.title = $scope.data.title;
		 //$scope.check = 0;
		// $scope.data.is_active = ($scope.check === 1) ? 1 : 0;
		 // $scope.data.is_active == 1 ? $scope.data.is_active = 1 : $scope.data.is_active= 0;
		 
		category.is_active = $scope.data.is_active == true ? 1:0;
		category.$save();

		$q.all(category).then(function(r) {
			$scope.showFormSavedModal();
		}, function(e) {
			$scope.launchErrorModal();
		});
	}
	
});

app.controller('formsCategoryEditController', function ($http, $scope, $location, $routeParams, $timeout, $controller, R, S) {
	$scope.pageheader="EDIT CATEGORY";
	$scope.fields = [];
	$controller('categoryControllerBase', {
		$scope: $scope
	});

	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;

	$scope.load = function () {
		$( "#title" ).focus();
		R.get('category/' + $scope.id).get(function (r) {
			$scope.data = r;
			$scope.data.title = r.title
			$scope.data.is_active = r.is_active == 1? true :false;
		});
	};
	
	$scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
	$scope.errorModalOptionsTitle = {
	        header: '',
	        text: 'Please enter a Title to the Question!',
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}


	$scope.save = function () {

		if ($scope.data.id) {
			var Categoty = R.get('category/').query({}, function (data) {
				if($scope.data.title == '' || $scope.data.title == ' ' || $scope.data.title == undefined) {
					$scope.showErrorModalTitle();
					$scope.isDisabled = false;
					return;
				}
				Categoty = $scope.data;
				// $scope.data.is_active == 1 ? $scope.data.is_active = 1 : $scope.data.is_active= 0;
				Categoty.is_active =  $scope.data.is_active == true ? 1:0;
				//$scope.is_active == true;
				//$scope.is_active == !$scope.is_active;
				Categoty.$save();
				
				
	
				$scope.showFormSavedModal();
			});

		} else {
			$scope.data.$save().then(function (r) {
				$scope.showErrorModal();
			});
		}

	}

	$scope.savedModalOptions = {
		header: 'updated!',
		text: 'Your entry has been updated successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-category');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () { }
	}


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Category.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-category');
		},
		showCancel: true,
		cancelText: 'Cancel',
		onCancelClick: function () { }
	}

	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function () { },
		showCancel: false,
		cancelText: '',
		onCancelClick: function () { }
	}

	$scope.modalOptions = {};

	$scope.cancelForm = function() {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.showErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function () {
		$scope.modalOptions.open($scope.savedModalOptions);
	}


	$(function () {
		$('.fixed-action-btn').floatingActionButton({});
	});
});