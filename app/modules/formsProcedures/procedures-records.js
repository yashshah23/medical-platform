app.controller('formRecordsControllerBase', ControllerFactory('entry_values'));

app.controller('proceduresRecordsController', function ($scope, $rootScope, $controller, $http, R, S, $location, $q, $routeParams, H, $timeout) {

	$controller('formRecordsControllerBase', {
		$scope: $scope
	});

	$scope.CurrentUserAdmin = false;
	$scope.CurrentUserEditor = false;
	$scope.CurrentUserCreator = false;
	$scope.CurrentUserViewer = false;
	$scope.currentUser = $rootScope.currentUser.role;

	if ($scope.currentUser == 'admin') {
		$scope.CurrentUserAdmin = true
	}
	else if ($scope.currentUser == 'editor') {
		$scope.CurrentUserEditor = true
	}
	else if ($scope.currentUser == 'creator') {
		$scope.CurrentUserCreator = true
	}
	else {
		$scope.CurrentUserViewer = true
	}

	var procedureId = $routeParams.id;
	$scope.data = {};
	$scope.formIds = [];
	$scope.selectform = '';
	$scope.formId;
	R.get('procedure_forms').query({
		procedure_id: procedureId
	}, function (resu) {
		$scope.procedureOriginal = resu;
        $scope.procedure = [];
        if($rootScope.currentUser.role == 'admin') {
        	$scope.procedure = $scope.procedureOriginal;
        	$scope.formIds = $scope.procedure.map(function (data) {
	            return data.form.id;
	        });
        } else {
        	rec(0, resu);
        }

	}, function (e) {

	});
	
	function rec(k, result) {
    	if(k >= result.length) {
    		
    	} else {
    		var id = result[k].form.id;
        	$http.get(H.SETTINGS.baseUrl + '/forms/' + id).then(function(response) {
        		if((response.data.UserId != undefined && response.data.UserId.split(',').includes($rootScope.currentUser.id.toString())) || (response.data.GroupId != undefined && checkGroups(response.data.GroupId.split(',')))) {
	        		$scope.procedure.push(result[k]);	
		        }
		       	if(k == result.length - 1) {
		       		$scope.formIds = $scope.procedure.map(function (data) {
			            return data.form.id;
			        });
		        }
        	});
        	rec(k + 1, result);
    	}
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
	
	$scope.selectformbyid = function (form_id) {
		$scope.selectform = form_id;
		$scope.formId = form_id;
		formdata($scope.formId, form_id);
	}
	function formdata(formId, form_id) {

		$scope.formId =form_id;

	for (let z = 0; z < $scope.formIds.length; z++) {


		R.get('forms/' + $scope.formId).get(function (r) {
			$scope.data.form = r;
		}, function (e) {
			console.log(e);
		});


		R.get('default_fields').query({

		}, function (r) {
			$scope.data.default_fields = r;
		}, function (e) {
			console.log(e);
		});

		// R.get('form_default_fields').query({ form_id: formId }, function (r) {
		// 	$scope.data.form_default_fields = r;
		// 	console.log($scope.data.form_default_fields)
		// }, function (e) { });


		R.get('form_default_fields').query({}, function (r) {
			for (let i = 0; i < r.length; i++) {
				for (j = 0; j < r.length; j++) {
					if (r[i].default_field.id == r[j].default_field.title) {
						r[j].default_field.title = r[i].default_field.title;
					}
				}
			}
			$scope.data.form_default_fields = r.filter(e => e.form.id == $scope.formId);
		}, function (e) { });

		R.get('form_fields').query({
			form_id: $scope.formId
		}, function (r) {

			$scope.data.form_fields = r;
			//console.log($scope.data.form_fields);
		}, function (e) {
			console.log(e);
		});


		R.get('entries').query({
			form_id: $scope.formId
		}, function (res) {
			$scope.data.entries = res;
		}, function (e) {
			console.log(e);
		});


		R.get('entry_values').query({
			form_id: $scope.formId
		}, function (entryv) {
			var d = [];
			for (let i = 0; i < entryv.length; i++) {
				if (entryv[i].form_field.field.field_type.id == 6 || entryv[i].form_field.field.field_type.id == 7 || entryv[i].form_field.field.field_type.id == 8 || entryv[i].form_field.field.field_type.id == 11) {
					entryv[i].entry_value = entryv[i].entry_value;
				} else {
					entryv[i].entry_value = entryv[i].entry_value;
					// $http.post(S.baseUrl + '/encrypt/data', { dec: entryv[i].entry_value })
					// 	.then(function (res) {
					// 		if (res) {
					// 			entryv[i].entry_value = res.data;

					// 			for (let i = 0; i < entryv.length; i++) {
					// 				//console.log("After: ");
					// 				//console.log(entryv[i]);
					// 				if (!d[entryv[i].entry.id]) d[entryv[i].entry.id] = [];
					// 				if (!d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id]) d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id] = [];
					// 				//console.log(entryv[i].entry_value);
					// 				d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id][entryv[i].form_field.field.title] = entryv[i].entry_value;
					// 				if (entryv[i].form_field.field.field_type.type == "file") d[entryv[i].entry_version.entry.id][entryv[i].form_field.field.title] = entryv[i].entry_value ? entryv[i].entry_value.includes(',') ? entryv[i].entry_value.split(',') : entryv[i].entry_value : null;
					// 				var d2 = [];
					// 				//console.log(d);
					// 				for (var j in d) {
					// 					var len = d[j].length - 1;
					// 					if (len >= 0) d2[j] = d[j][len];
					// 				}

					// 			}
					// 			$scope.data.entry_values = d2;

					// 		}
					// 		//console.log(entryv[i]);
					// 	}, function (e) { });
				}
				/*console.log("Before: ");
						console.log(entryv[i]);*/

				$timeout(function () {

					//var d = [];
					for (let i = 0; i < entryv.length; i++) {
						//console.log("After: ");
						//console.log(entryv[i]);
						if (!d[entryv[i].entry.id]) d[entryv[i].entry.id] = [];
						if (!d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id]) d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id] = [];
						//console.log(entryv[i].entry_value);
						d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id][entryv[i].form_field.field.title] = entryv[i].entry_value;
						if (entryv[i].form_field.field.field_type.type == "file") d[entryv[i].entry_version.entry.id][entryv[i].form_field.field.title] = entryv[i].entry_value ? entryv[i].entry_value.includes(',') ? entryv[i].entry_value.split(',') : entryv[i].entry_value : null;
						var d2 = [];
						//console.log(d);
						for (var j in d) {
							var len = d[j].length - 1;
							if (len >= 0) d2[j] = d[j][len];
						}

					}
					$scope.data.entry_values = d2;
					 
				}, 1);

			}



		}, function (e) { });


		R.get('master_entry_values').query({

		}, function (master) {
			$scope.data.master_entry_values = master;
		}, function (e) {
			console.log(e);
		});

		R.get('entry_default_values').query({
			form_id: $scope.formId
		}, function (r) {

			for (var l = 0; l < r.length; l++) {
				var ri = r[l];
				// if (ri && ri.form_default_field.default_field && ri.form_default_field.default_field.field_type && ri.form_default_field.default_field.field_type.id && ri.form_default_field.default_field.field_type.id == 12) {

				// 	var k = r[l].entry_value;

				// 	if (k && k != undefined || k != null) {
				// 		var a = []

				// 		let mE = $scope.data.master_entry_values;

				// 		for (i = 0; i < mE.length; i++) {

				// 			if (mE[i].master_entry.id == k) {
				// 				a.push(mE[i])
				// 			}
				// 		}

				// 		var d = [];
				// 		for (var i = 0; i < a.length; i++) {
				// 			if (!d[a[i].master_entry.id]) d[a[i].master_entry.id] = [];
				// 			if (!d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id]) d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id] = [];
				// 			d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id] = a[i];
				// 		}

				// 		var d1 = [];

				// 		for (var j in d) {
				// 			var len = d[j].length - 1;
				// 			if (len >= 0) d1[j] = d[j][len];
				// 		}
				// 		r[l].entry_value = d1[k].master_entry_value;
				// 	}

				// }
				// else {
				r[l].entry_value = r[l].entry_value;
				// }

			}
			var x = [];
			for (var i = 0; i < r.length; i++) {
				if (!x[r[i].entry.id]) x[r[i].entry.id] = [];
				if (!x[r[i].entry_version.entry.id][r[i].entry_version.id]) x[r[i].entry_version.entry.id][r[i].entry_version.id] = [];
				x[r[i].entry_version.entry.id][r[i].entry_version.id][r[i].form_default_field.default_field.id] = r[i].entry_value;
			}

			var y = [];
			for (var j in x) {
				var len = x[j].length - 1;
				if (len >= 0) y[j] = x[j][len];
			}

			$scope.data.entry_default_values = y;

		}, function (e) { });
	}
}
	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of forms.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-procedures');
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
		onOkClick: function () { $scope.deleteObject($scope.deleteCandidate); },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function () { $scope.cancelDelete(); }
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
		$scope.delete(obj, function (r) {
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

	$(function () {
		$('.fixed-action-btn').floatingActionButton({});
	});



});