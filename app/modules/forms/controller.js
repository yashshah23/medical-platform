//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('formsControllerBase', ControllerFactory('forms'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD

app.controller('formsController', function ($scope, $rootScope, $controller, S, $mdDialog, $q, H, R, $location, $routeParams, $http) {

	//Copy all scope variables from Base Controller,

	$controller('formsControllerBase', {
		$scope: $scope
	});



	//$scope.roleOfCurrentUser = false;
	$scope.CurrentUserAdmin = false;
	$scope.CurrentUserEditor = false;
	$scope.CurrentUserCreator = false;
	$scope.CurrentUserViewer = false;
	$scope.copyfromid;
	$scope.autoIncre;
	$scope.countEntries = 1;
	$scope.currentUserId = $rootScope.currentUser.id;
	$scope.currentUser = $rootScope.currentUser.role;

	$scope.formcount = $rootScope.formCount;
	
	

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

	$scope.status = ' ';
	$scope.itemsDetails=[];
	$scope.customFullscreen = false;
	$scope.formId;
	$scope.categories = [];
	$scope.fieldSources = [];
	var formId = $routeParams.id;
	$scope.fields = [];
	$scope.totalformdata = [];
   
	//
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
    ///end
	//Load all posts on initialization
	$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(response) {
		$scope.user_groups = response.data;
        $scope.query({}, function (r) {
			$scope.totalformdata=r;
			$scope.totalItems = r.length;
			$scope.userIdsGroups = [];
			for(var i = 0; i < r.length; i++) {
				if(r[i].GroupId != undefined) {
					var groupsOfForm = r[i].GroupId.split(",").map(function(item) {
				   		return $scope.user_groups.find(function(i) {
				   			return i.id == item;
				   		});
				   	});
			    	var userIdsOfGroupsString = groupsOfForm.map(function(item) {
			    		return item.userId;
				    });
				   	$scope.userIdsGroups[i] = userIdsOfGroupsString.join().split(',');
				} else {
					$scope.userIdsGroups[i] = [];
				}
			}
	    	$scope.validForms = [];
	    	for(var i = 0; i < r.length; i++) {
				if((r[i].UserId != undefined && r[i].UserId.split(',').includes($scope.currentUserId.toString())) || (r[i].GroupId != undefined && checkGroups(r[i].GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
	        		$scope.validForms.push(r[i]);
	        	}
	    	}	
		});
		
    });
    
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

	$scope.cancel = function (obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};
	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this form?',
		text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () {
			$scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length = "";
		},
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
	$scope.sameformnameModalOption = {
		header: 'An error occured ...',
		text: 'Same form name are not valid',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () { },
		showCancel: false,
		cancelText: '',
		onCancelClick: function () { }
	}
	$scope.modalOptions = {};

	$scope.deleteObject = function (obj) {
		$scope.delete(obj, function (r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	R.get('category').query({ is_active: 1 }, function (categories) {
		$scope.categories = categories;
	});

	$scope.copy = function (ev, data) {

		$scope.copyfromid = data.id;
		$scope.autoIncre = data.autoIncrement;
		R.get('form_fields').query({
			form_id: $scope.copyfromid
		}, function (r) {
			$scope.data.form_fields = r;
			$scope.fields = r;
		});
		var confirm = $mdDialog.prompt()
			.title('Enter Form Name')
			.textContent('Same form name are not allowed ')
			.placeholder('Dog name')
			.ariaLabel('Dog name')
			.initialValue(data.title + ' -copy')
			.targetEvent(ev)
			.required(true)
			.ok('Copy')
			.cancel('Cancel');

		$mdDialog.show(confirm).then(function (result) {

			var title = [];
			var boll;
			var form;
			R.get('forms').query({}, function (r) {

				for (var x in r) {
					if (boll = r[x].title == result) {
						return $scope.modalOptions.open($scope.sameformnameModalOption);
					} else {
					}
				}

				form = angular.copy(data);
				form.title = result;
				$scope.data.list.push(form);
			 
				$scope.saveForm(form);
			});


		},
			function () {
				$scope.status = 'You didn\'t name your form.';
			});
	};
	///start




	$scope.saveForm = function (formdata) {

		R.get('entries/').query({ form_id: $scope.copyfromid }, function (r) {
			for (let i = 0; i <= r.length; i++) {
				$scope.countEntries = r.length + 1;
			}
		}, function (e) {
			console.log(e);
		});

		var Form = R.get('forms');
		var form = new Form();
		var Entry = R.get('entries');
		form.title = formdata.title;
		form.numberofColumn = formdata.numberofColumn;
		form.categoryId = formdata.category.id;
		form.UserId = formdata.UserId;
		form.GroupId = formdata.GroupId;
		form.is_group = formdata.is_group;
		form.autoIncrement = formdata.autoIncrement;
		form.master_id = formdata.master_id ? formdata.master_id : null;
		form.default_field_id = formdata.default_field ? formdata.default_field.id : null
		form.masterEnableUpadte = formdata.masterEnableUpadte;
		form.sendEmailAlert = formdata.sendEmailAlert;
		form.reasonForUpdate = formdata.reasonForUpdate;
		form.masterEnableList = formdata.masterEnableList;
		// var Entries = R.get('entry_values');
		var Field = R.get('fields');
		var FormField = R.get('form_fields');
		var FormDefaultFields = R.get('form_default_fields');
		var FieldSourceItem = R.get('form_field_datasource');
		// var EntriesDefault = R.get('entry_default_values');
		// var entryVersions = R.get('entry_versions');
		var Formulas = R.get('form_formulas');
		var fieldSavePromises = [];
		var savedFields = [];
		var form_fields = [];
		var form_field_ds = [];
		var requiredFields = {};
		// var entrydata = [];
		// var newverson = [];
		// var v = [];
		var formula_fields = [];

		for (let x in $scope.fields) {

			if (x == '$promise') {
				break;
			}
			var field = new Field();
			field.title = $scope.fields[x].field.title;
			field.field_type_id = $scope.fields[x].field.field_type.id;
			requiredFields[$scope.fields[x].field.title] = {
				required: $scope.fields[x].is_required,
				is_multiple: $scope.fields[x].is_multiple,
				seq: $scope.fields[x].seq,
				default_value: $scope.fields[x].default_value,
				is_formula: $scope.fields[x].is_formula,
			};
			fieldSavePromises.push(field.$save());
		}


		$q.all(fieldSavePromises).then(function (r) {
			savedFields = r;
			form.$save().then(function (r) {

				$scope.formId = r.id

				// R.get('entries').query({
				// 	form_id: $scope.copyfromid
				// }, function (entries) {
				// 	for (let i in entries) {
				// 		if (i == '$promise') {
				// 			break;
				// 		}
				// 		var entry = new Entry();
				// 		entry.form_id = $scope.formId;
				// 		entry.display_id = $scope.countEntries;
				// 		entrydata.push(entry.$save())
				// 	}
				// });
				for (let i in savedFields) {
					var f = new FormField();
					if (i == '$promise') {
						break;
					}
					f.form_id = r.id;
					f.field_id = savedFields[i].id;
					f.is_formula = requiredFields[savedFields[i].title].is_formula;
					f.default_value = requiredFields[savedFields[i].title].default_value;
					f.is_required = requiredFields[savedFields[i].title].required;
					f.is_multiple = requiredFields[savedFields[i].title].is_multiple;
					f.seq = requiredFields[savedFields[i].title].seq;
					form_fields.push(f.$save());
				}

				R.get('form_default_fields').query({
					form_id: $scope.copyfromid
				}, function (res) {
					var formdefultfield = new FormDefaultFields();
					for (let j in res) {
						if (j == '$promise') {
							break;
						}
						formdefultfield.default_field_id = res[j].default_field.id;
						formdefultfield.form_id = $scope.formId;
						formdefultfield.is_required = res[j].is_required;
						formdefultfield.master_id = res[j].master.id;
						formdefultfield.$save();
					}
				}, function (e) { })


				$q.all(form_fields).then(function (r) {


					R.get('form_fields').query({
						form_id: $scope.formId
					}, function (res) {
						$scope.data.form_fields = res;
						R.get('form_formulas').query({ form_id: $scope.copyfromid }, function (formulas) {
							// var formulafields=$scope.data.form_fields.filter(e=> e.	is_formula)

							for (let j in formulas) {
								if (j == '$promise') {
									break;
								}
								var formula = new Formulas();
								var formulafields = $scope.data.form_fields.filter(e => {
									if (e.field.title == formulas[j].form_field.field.title) {
										return e.id;
									}
								})
								formula.form_id = $scope.formId;
								formula.form_field_id = formulafields[0].id;
								formula.question = formulas[j].question;
								formula.formulasing = formulas[j].formulasing;
								formula.type = formulas[j].type;
								formula.value = formulas[j].value;
								formula.operator = formulas[j].operator;
								formula_fields.push(formula.$save());
							}
						}, function (e) { })

						$q.all(form_field_ds).then(function (r) {
							// $scope.showFormSavedModal();

							R.get('form_field_datasource').query({ form_id: $scope.copyfromid }, function (source) {
								var val = []
								for (let x in source) {
									if (x == '$promise') {
										break;
									}
									// $scope.fieldSources.push(source[x])
									// var val =source.filter(e=> e.form_field.field.title==$scope.data.form_fields.field.title )
									val.push($scope.data.form_fields.filter(function (d) {
										return d.field.title == source[x].form_field.field.title
									}));
								}
								if (source) {
									for (let j in val) {
										let fs = new FieldSourceItem();
										fs.form_id = $scope.formId;
										fs.form_field_id = val[j][0].id;
										fs.title = source[j].title;
										form_field_ds.push(fs.$save());
									}
								}

							}, function (r) {
								for (let i in r) {
									//start here
									if (r[i] && r[i].field) {
										let val = $scope.fieldSources[r[i].field.title];

										if (val) {
											for (let j in val) {
												let fs = new FieldSourceItem();
												fs.form_id = $scope.formId;
												fs.form_field_id = r[i].id;
												fs.title = val[j];
												form_field_ds.push(fs.$save());
											}
										}
									}
								}
							});
						})
					}, function (e) {
						console.log(e);
						// $scope.launchErrorModal();

					});




				}, function (e) {
					// $scope.launchErrorModal();
				});
			}, function (e) {
				console.log(e);
			});

		});
		$scope.selectedFieldType = '';
	}

	$scope.cancel = function (obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () {
			$scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length = "";
		},
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

	$(function () {
		$('.fixed-action-btn').floatingActionButton({
			direction: 'left'
		});
	});

});
