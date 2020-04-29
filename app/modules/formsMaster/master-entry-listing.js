app.controller('mastersEntryControllerBase', ControllerFactory('master_entry_values'));

app.controller('formsMasterEntryListingController', function ($scope, $rootScope, $controller, $http, R, S, $location, $q, $routeParams, H) {
	//function ($scope, $rootScope, $http, R, SETTINGS, $location, $q) {

	$controller('mastersEntryControllerBase', {
		$scope: $scope
	});

	$scope.CurrentUserAdmin = false;
	$scope.CurrentUserEditor = false;
	$scope.CurrentUserContributor = false;
	$scope.CurrentUserSubscriber = false;
	$scope.currentUser = $rootScope.currentUser.role;
	$scope.data.master_entry_values = [];
	
	if ($scope.currentUser == 'admin') {
		$scope.CurrentUserAdmin = true;
	}
	else if ($scope.currentUser == 'editor') {
		$scope.CurrentUserEditor = true;
	}
	else if ($scope.currentUser == 'creator') {
		$scope.CurrentUserCreator = true;
	}
	else {
		$scope.CurrentUserViewer = true;
	}

	// var masterId = $routeParams.id;
	$scope.masterId = $routeParams.id;
	$scope.data = {};
	R.get('master_entries').query({
		master_id: $scope.masterId
	}, function (r) {
		$scope.data.master_entries = r;
	}, function (e) {
		console.log(e);
	});

	R.get('default_fields').query({
		//master_id: masterId 
	}, function (r) {
		for (let i = 0; i < r.length; i++) {
			for (j = 0; j < r.length; j++) {
				if (r[i].id == r[j].title) {
					r[j].title = r[i].title
				}
			}
		}
		$scope.data.default_fields = r.filter(e => e.master.id == $scope.masterId)
	}, function (e) {
		console.log(e);
	});



	R.get('master_entry_versions').query({

	}, function (resu) {
		$scope.versions = [];
		// resu.filter(e=> e.master_entry.id == $scope.data.master_entries[0].id);
		for (let i = 0; i < $scope.data.master_entries.length; i++) {
			for (let j = 0; j < resu.length; j++) {
				if (resu[j].master_entry.id == $scope.data.master_entries[i].id) {
					$scope.versions[resu[j].master_entry.id] = [];
					$scope.versions[resu[j].master_entry.id].push(resu[j].id);
					if ($scope.versions[resu[j].master_entry.id] == resu[j].master_entry.id) {
						$scope.versions[resu[j].master_entry.id] = [];
						$scope.versions[resu[j].master_entry.id].push(resu[j].id);
					}
				}
			}
		}
		//console.log("data", $scope.versions);
	}, function (e) {

	});
	R.get('master_entry_values').query({

	}, function (r) {

		let tmpentry=[]
		let filterentry=[]
		tmpentry =r.map(e => e.master_entry.id);
		
		for (let i = 0; i < $scope.data.master_entries.length; i++) {
			if (tmpentry.includes($scope.data.master_entries[i].id)) {
				filterentry.push($scope.data.master_entries[i]);
			}			
		}
		$scope.data.master_entries=filterentry;

		//console.log("res"+r);
		var test = [];
		var tempr = angular.copy(r);
		var extratmp = angular.copy(r);
		$scope.scopeR = angular.copy(r);

		for (let i = 0; i < $scope.scopeR.length; i++) {
			for (j = 0; j < extratmp.length; j++) {
				if ($scope.scopeR[i].master_entry.id == extratmp[j].master_entry_value && $scope.scopeR[i].default_field.id == extratmp[j].default_field.title) {
					tempr[j].master_entry_value = $scope.scopeR[i].master_entry_value;
				}
			}
		}

		r = tempr;
		$scope.data.master_entry_values = r.filter(e => e.master.id == $scope.masterId);
		var data = [];
		for (let i = 0; i < $scope.data.master_entry_values.length; i++) {
			for (let j = 0; j < $scope.data.default_fields.length; j++) {
				if ($scope.data.default_fields[j].id == $scope.data.master_entry_values[i].default_field.id && $scope.versions.length && $scope.versions[$scope.data.master_entry_values[i].master_entry.id][0] == $scope.data.master_entry_values[i].master_entry_version.id) {
					if (data[$scope.data.default_fields[j].id] == undefined) data[$scope.data.default_fields[j].id] = [];
					if (data[$scope.data.default_fields[j].id][$scope.data.master_entry_values[i].master_entry.id] == undefined) data[$scope.data.default_fields[j].id][$scope.data.master_entry_values[i].master_entry.id] = [];
					data[$scope.data.default_fields[j].id][$scope.data.master_entry_values[i].master_entry.id].push($scope.data.master_entry_values[i].master_entry_value)
				}
			}

		}

		$scope.data.master_entry_values = data;

	}, function (e) { });

	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Masters.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-master');
		},
		showCancel: true,
		cancelText: 'Cancel',
		onCancelClick: function () { }
	}

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () {
			
			$scope.deleteObject($scope.deleteCandidate);
			let index = $scope.data.master_entries.indexOf($scope.deleteCandidate);
			$scope.data.master_entries.splice(index, 1)
			$scope.data.list = {};
		},
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function () {
			$scope.cancelDelete();
		}
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

	$scope.edit = function (obj) {
		$scope.mode = $scope.MODES.edit;
		$scope.editing = obj.id;
	};

	$scope.saveSingle = function () {
		$scope.save(null, function () {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.initSingle();
			$scope.query();
		});
	};

	$scope.saveObject = function (obj) {
		$scope.save(obj, function () {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.query();
		});
	};
	$scope.modalOptions = {};

	$scope.deleteObject = function (obj) {
		
		let id = obj.id
		$scope.delete(obj, function (r) {
			
			if (r.success.code == 200) {
				R.get('master_entry_values').query({ master_entry_value: id }, function (result) {

					for (let i = 0; i < result.length; i++) {
						$scope.delete(result[i], function (r) {

						});
					}
				})
			}
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function (obj) {
		
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function () {
		$scope.deleteCandidate = null;
	}

	$scope.showCancelFormModal = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.showErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	// $(function() {
	// 	$('.fixed-action-btn').floatingActionButton({});
	// });


});

