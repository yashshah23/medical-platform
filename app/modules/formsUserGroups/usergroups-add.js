//An example of Angular $http

app.controller('formsUsergroupAddController', function ($scope, $rootScope, $http, R, S, $location, $q) {
	$scope.pageheader = "CREATE A NEW CATEGORY";
	$scope.usersimg = {}; //added by sanjoli
	$scope.usersdata = [];
	$scope.selectedPeople = [];
	$scope.roleOfCurrentUser = $rootScope.currentUser.role;
	$scope.data ={};
	$scope.data.status =true;
	$scope.isDisabled = false;
	$scope.people = "";
	$scope.countSelectedPeople = 0;
	$scope.prevCount = 0;
	angular.element(document).ready(function () {

		$("#title").focus();
		$('.fixed-action-btn').floatingActionButton({

		});

	});

	$scope.load = function () {
		
		R.get('users').query({}, function (results) {
			// let data = {};
			//let x = {};
			for (let i = 0; i < results.length; i++) {
				$scope.usersimg[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = "images/user.png";
				$scope.usersdata[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = results[i];
			}

			$('#people').autocomplete({
				data: $scope.usersimg,
				onAutocomplete: function (r) {
					//  if ($scope.selectedPeople.indexOf(x[r]) >= 0) { } else 
					//  {
					$scope.selectedPeople.push($scope.usersdata[r]);
					$scope.countSelectedPeople++;
					$scope.$apply();
					delete $scope.usersimg[r];
					delete $scope.usersdata[r];
					//   }
					document.getElementById('people').value = '';
				}
			});

		});
	};
	
	 $scope.checkNewEntry = function (name) {
		R.get('users').query({}, function (results) {
			// let data = {};
			//let x = {};
			if(name == '') {
				return;
			}
			if($scope.countSelectedPeople != $scope.prevCount) {
				$scope.prevCount++;
				return;
			}
			for (let i = 0; i < results.length; i++) {
				if((name == results[i].first_name) || (name == results[i].last_name) || (name == results[i].role)) {
					
				} else {
					$scope.showErrorModalNewEntry();
					$scope.people = '';	
				}
			}

			

		});
	 };	
	 
	 $scope.showErrorModalNewEntry = function() {
        $scope.modalOptions.open($scope.errorModalOptionsNewEntry);
    }
    
    $scope.errorModalOptionsNewEntry = {
    	header: 'Warning ...',
        text: 'You can not add new Entry !!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {

        },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }
	
	$scope.unselectPerson = function (p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {

			$scope.selectedPeople.splice(i, 0);
			delete $scope.selectedPeople[i];

		}
		if (p[0]) {
			$scope.usersimg[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = "images/user.png";
			$scope.usersdata[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = p[0];
		} else if (p.first_name) {
			$scope.usersimg[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = "images/user.png";
			$scope.usersdata[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = p;
		}

	}


	$scope.save = function () {
		$scope.isDisabled = true;
		var userGroup = R.get('user_groups');
		var usergroup = new userGroup();
		usergroup.title = $scope.data.title;
		usergroup.status = $scope.data.status ? 1 : 0;
		var p = [];
		for (var people in $scope.selectedPeople) {

			if ($scope.selectedPeople[people][0]) {
				p.push($scope.selectedPeople[people][0].id);
			} else {
				p.push($scope.selectedPeople[people].id);
			}
		}
		usergroup.userId = p.join();
		usergroup.$save();

		$q.all(usergroup).then(function (r) {
			$scope.showFormSavedModal();
		}, function (e) {
			$scope.launchErrorModal();
		});
	}
	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of User Group.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-usergroups');
		},
		showCancel: true,
		cancelText: 'Cancel',
		onCancelClick: function () { }
	}

	$scope.savedModalOptions = {
		header: 'Saved!',
		text: 'Your entry has been saved successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-usergroups');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () {
			document.getElementById('title').value = '';
			clearFieldType();
			$scope.fields = [];
			$scope.isDisabled = false;

		}
	}
	// $scope.savedModalOptions = {
	// 	header: '',
	// 	text: 'Are you sure you want to save ?',
	// 	showOk: true,
	// 	okText: 'Yes',
	// 	onOkClick: function () {
	// 		$scope.save();
	// 	},
	// 	showCancel: true,
	// 	cancelText: 'No',
	// 	onCancelClick: function () {
	// 		document.getElementById('title').value = '';
	// 		clearFieldType();
	// 		$scope.fields = [];

	// 	}
	// }
	$scope.errorModal = {
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

	$scope.cancelForm = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.launchErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function () {
		$scope.modalOptions.open($scope.savedModalOptions);
	}
	// $scope.showsave = function () {
	// 	$scope.modalOptions.open($scope.savedModal);
	// }

});

app.controller('formsUsergroupEditController', function ($http, $scope, $location, $routeParams, $timeout, $controller, R, S) {
	// $scope.pageheader="EDIT CATEGORY";
	$scope.fields = [];
	$controller('usergroupsControllerBase', {
		$scope: $scope
	});

	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;
	$scope.userid = [];
	$scope.usersimg = {}; //added by sanjoli
	$scope.usersdata = [];
	$scope.selectedPeople = [];
	$scope.selectedPeopleTemp = [];
	$scope.people = "";
	$scope.countSelectedPeople = 0;
	$scope.prevCount = 0;
	$scope.load = function () {
		
		R.get('user_groups/' + $scope.id).get(function (r) {
			$scope.data = r;
			$scope.data.title = r.title
			$scope.data.status = r.status == 1 ? true :false; 
			if (r.userId) {
				$scope.userid = r.userId.split(',');
			}

		R.get('users').query({}, function (r) {
			for (var x in $scope.userid) {
				if (x == '$promise') {
					break;
				}
				$scope.selectedPeopleTemp.push(r.filter(function (obj) { return obj.id == $scope.userid[x] }));
			}
			$scope.selectedPeople = $scope.selectedPeopleTemp.filter(function (el) {
				return el.length != 0;
			});
		

		R.get('users').query({}, function (results) {

			//for user filter in edit by sahin
			var idsB = $scope.selectedPeople.map(function (x) {
				if (x[0].id) {
					return x[0].id
				} else if (x.id) {
					return x.id;
				}
			}).sort()
			var filtered = results.filter(
				function (e) {
					return this.indexOf(e.id) < 0;
				},
				idsB
			);
			if (!$scope.selectedPeople.length) {
				for (let i = 0; i < results.length; i++) {
					$scope.usersimg[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = "images/user.png";
					$scope.usersdata[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = results[i];

				}
			}
			if ($scope.selectedPeople.length) {
				for (let i in filtered) {
					$scope.usersimg[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role + ')'] = "images/user.png";
					$scope.usersdata[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role + ')'] = filtered[i];

				}

			}
			$('#people').autocomplete({
				data: $scope.usersimg,
				onAutocomplete: function (r) {
					$scope.selectedPeople.push($scope.usersdata[r]);
					$scope.countSelectedPeople++;
					$scope.$apply();
					delete $scope.usersimg[r];
					delete $scope.usersdata[r]

					document.getElementById('people').value = '';
				}
			});

		});
		
		});
		});
	};
	
	$scope.checkNewEntry = function (name) {
		R.get('users').query({}, function (results) {
			// let data = {};
			//let x = {};
			if(name == '') {
				return;
			}
			if($scope.countSelectedPeople != $scope.prevCount) {
				$scope.prevCount++;
				return;
			}
			for (let i = 0; i < results.length; i++) {
				if((name == results[i].first_name) || (name == results[i].last_name) || (name == results[i].role)) {
					
				} else {
					$scope.showErrorModalNewEntry();
					$scope.people = '';	
				}
			}

			

		});
	 };	
	 
	 $scope.showErrorModalNewEntry = function() {
        $scope.modalOptions.open($scope.errorModalOptionsNewEntry);
    }
    
    $scope.errorModalOptionsNewEntry = {
    	header: 'Warning ...',
        text: 'You can not add new Entry !!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {

        },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }

	$scope.unselectPerson = function (p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {
			$scope.selectedPeople.splice(i, 0);
			// Above line updated by me and commented below line

			//$scope.selectedPeople.splice(i, 1);
			delete $scope.selectedPeople[i]
		}
		if (p[0]) {
			$scope.usersimg[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = "images/user.png";
			$scope.usersdata[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = p[0];
		} else if (p.first_name) {
			$scope.usersimg[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = "images/user.png";
			$scope.usersdata[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = p;

			// $scope.peopleremain[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role.title + ')'] = "images/user.png";
			// $scope.peopleimg[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role.title + ')'] = filtered[i];

		}
	}
	$scope.editGroup = function () {
		

		var userGroup = R.get('user_groups/').query({}, function (data) {
			userGroup = $scope.data;
			var p = [];
			userGroup.status = $scope.data.status == true? 1 : 0;
			for (var people in $scope.selectedPeople) {
				if ($scope.selectedPeople[people][0]) {
					p.push($scope.selectedPeople[people][0].id);
				} else {
					p.push($scope.selectedPeople[people].id);
				}

			}
			$scope.data.userId = p.join(',')
			userGroup.$save();
		});

		$scope.showFormSavedModal();
	}

	$scope.savedModalOptions = {
		header: 'updated!',
		text: 'Your entry has been updated successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-usergroups');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () { }
	}


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of User Group.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-usergroups');
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

	$scope.cancelForm = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.showErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function () {
		$scope.modalOptions.open($scope.savedModalOptions);
	}


	$(function () {
		$("#title").focus();
		$('.fixed-action-btn').floatingActionButton({});
	});
});