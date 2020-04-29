//An example of Angular $http

app.controller('formsQuestionBankAddController', function ($scope, $timeout, $route, $rootScope, $http, R, S, $location, $q) {
	$scope.selectedPerson = "";
	$scope.selectedPeople = [];
	$scope.fields = [];
	$scope.isDisabled = false;
	$scope.newFieldItem = false;

	$scope.unselectPerson = function (p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {
			data[$scope.selectedPeople[i].first_name + ' ' + $scope.selectedPeople[i].last_name] = $scope.selectedPeople[i];
			$scope.selectedPeople.splice(i, 1);
		}
	}

	angular.element(document).ready(function () {
		activate();

	});

	function activate() {
		$("#title").focus();

		$('.fixed-action-btn').floatingActionButton({

		});

		R.get('users').query({}, function (results) {
			data = {};
			for (i = 0; i < results.length; i++) {
				data[results[i].first_name + ' ' + results[i].last_name] = results[i];
				//data.push({tag: results[i].first_name + ' ' + results[i].last_name, image: null});
			}

			$('input.autocomplete').autocomplete({
				data: data,
				onAutocomplete: function (r) {
					if ($scope.selectedPeople.indexOf(data[r]) >= 0) { } else {
						$scope.selectedPeople.push(data[r]);
						$scope.$apply();
						delete data[r];
					}
					document.getElementById('people').value = '';
				}
			});

		});

		R.get('field_types').query({}, function (results) {

			//$scope.fieldTypes = results;
			$('select').formSelect();
		});
	}

	$scope.load = function(){
		console.log("Load Function!")
	}
	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Question Bank.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-question-bank');
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
			$location.path('forms-question-bank');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () {
			document.getElementById('title').value = '';
			clearFieldType();
			$scope.fields = [];
			$scope.isDisabled = false;
			// activate();
			// clearFieldSourceItem();
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

	$scope.questionBankTypeChanged = function () {

		if ($scope.data.field_type) {
			$scope.selectedFieldTypeCategory = JSON.parse($scope.data.field_type).type;
			//$scope.selectedFieldTypeCategory = $scope.data.field_type.type;
		}
	}

	$scope.addField = function (field) {
		$scope.isSame = false;
		if (field) {
			for(i = 0; i < $scope.fields.length; i++) {
				if($scope.fields[i].title == field) {
					$scope.isSame = true;
					break;
				}
			}
			if(!$scope.isSame) {
				$scope.fields.push({
					title: field,
				});
			} else {
				$scope.showErrorModalDuplicate();
			}
			
		}
		$scope.datasource.newItem = '';
	}

	$scope.saveQuestionBank = function () {
		//$scope.isDisabled = true;
		var QuestionBank = R.get('question_bank_fields');
		var DataSource = R.get('question_bank_field_datasource');
		var questionBank = new QuestionBank();
		if($scope.data.title == '' || $scope.data.title == undefined) {
			$scope.showErrorModalTitle();
		} else {
			questionBank.title = $scope.data.title;
			// questionBank.default_value=$scope.data.default_value;
			if($scope.data.field_type == null) {
				$scope.showErrorModal();
			} else {
				if((JSON.parse($scope.data.field_type).id == 3 || JSON.parse($scope.data.field_type).id == 4 || JSON.parse($scope.data.field_type).id == 5) && $scope.fields.length == 0) {
					$scope.showErrorModalFields();
				} else {
					questionBank.field_type_id = JSON.parse($scope.data.field_type).id;
					//questionBank.field_type_id = $scope.data.field_type.id;
		
					var QuestionBanks = [];
			
			
					questionBank.$save().then(function (r) {
			
						for (var i in $scope.fields) {
							var ds = new DataSource();
							ds.title = $scope.fields[i].title;
							ds.question_bank_field_id = r.id;
							QuestionBanks.push(ds.$save());
						}
					},
						function (e) { 
							//$route.reload();
							$scope.showErrorModalDuplicate();
							$scope.statusCheck = e.status
							console.log($scope.statusCheck)
						});	

						$timeout(function () {	
							if($scope.statusCheck  != 409){
								$q.all(QuestionBanks).then(function (r) {
									let fields = [];
									$scope.showFormSavedModal();
						
								}, function (e) {
									console.log(e);
								})
							};
						}, 1500);
				
					$scope.data.field_type = '';
				}
				
			}
		}
		
		

	}
	
	$scope.showErrorModal = function() {
        $scope.modalOptions.open($scope.errorModalOptions);
    }
    
    $scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
    $scope.showErrorModalFields = function() {
        $scope.modalOptions.open($scope.errorModalOptionsFields);
    }
    
    $scope.errorModalOptions = {
        header: '',
        text: 'Please select a Question Type!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
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
    
    $scope.errorModalOptionsFields = {
        header: '',
        text: 'Please enter data items to proceed further!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }
    
    $scope.showErrorModalDuplicate = function() {
		//$scope.load()
        $scope.modalOptions.open($scope.errorModalOptionsDuplicate);
    }
    
    $scope.errorModalOptionsDuplicate = {
        header: '',
        text: 'You are trying to enter a duplicate entry!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {$route.reload()},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }
	
});





app.controller('formsQuestionBankEditController', function ($http, $scope, $routeParams, $controller, R, S, $timeout, $location) {
	$scope.fields = [];
	$scope.remaningfields = []
	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;
	// $scope.data={};
	$controller('questionBankControllerBase', {
		$scope: $scope
	});

	$scope.load = function () {

		$("#title").focus();
		R.get('question_bank_fields/' + $scope.id).get(function (r) {
			$scope.data = r;

			$scope.data.field_type = r.field_type;
			// $scope.data.default_value=r.default_value;
			$timeout(function () {
				selectedFieldType(r.field_type.title);
				$scope.selectedFieldTypeCategory = r.field_type.type;
			}, 1);
		});
		R.get('field_types').query({}, function (results) {
			$('select').formSelect();
		});
		R.get('question_bank_field_datasource').query({ question_bank_field_id: $scope.id }, function (data) {
			//$scope.remaningfields = data;
			$scope.oldfields = data;
			for(let i = 0; i < data.length; i++) {
				$scope.fields.push({
					title: data[i].title,
				});
			}
		})


	};

	$scope.questionBankTypeChanged = function (field_type) {

		if (field_type.length) {
			let id = field_type[0].question_bank_field.id;
			R.get('question_bank_field_datasource/').query({ question_bank_field_id: id }, function (r) {

				for (var x in r) {
					$scope.deleteCandidate = r;
					$scope.modalOptions.open($scope.deleteModalOptions);
				}

			});
		}
		if ($scope.data.field_type) {
			$scope.selectedFieldTypeCategory = JSON.parse($scope.data.field_type).type;
			//$scope.selectedFieldTypeCategory = $scope.data.field_type.type;

		}
	}
	$scope.addField = function (field) {
		$scope.isSame = false;
		if (field) {
			for(i = 0; i < $scope.fields.length; i++) {
				if($scope.fields[i].title == field) {
					$scope.isSame = true;
					break;
				}
			}
			if(!$scope.isSame) {
				$scope.fields.push({
					title: field,
				});
			} else {
				$scope.showErrorModalDuplicate();
			}
			
		}
		$scope.datasource.newItem = '';
	}

	$scope.deleteObject = function (obj) {
		for (let x in obj) {
			$scope.delete(obj[x], function (r) {
				if (r.status && r.status == 405) {
					$scope.modalOptions.open($scope.errorModalOptions);
				}
				$scope.query();
			});
		}
	};

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this Data Source?',
		text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () {
			$scope.deleteObject($scope.deleteCandidate);
			$scope.remaningfields = [];
			$scope.fields = [];
		},
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function () {
			$scope.cancelDelete();
		}
	}
	$scope.save = function () {
		if($scope.data.title == '') {
			$scope.showErrorModalTitle();
		} else {
			if($scope.data.field_type == null) {
				$scope.showErrorModalFieldType();
			} else {
				if($scope.data.field_type.id == undefined) {
					if((JSON.parse($scope.data.field_type).id == 3 || JSON.parse($scope.data.field_type).id == 4 || JSON.parse($scope.data.field_type).id == 5) && $scope.fields.length == 0) {
						$scope.showErrorModalFields();
					} else {
						console.log($scope.data);
						var DataSource = R.get('question_bank_field_datasource');
						if ($scope.data.id) {
							var QuestionBank = R.get('question_bank_fields/');
							var QuestionBank = R.get('question_bank_fields/').query({}, function (data) {
								var field_type_id = JSON.parse($scope.data.field_type).id;
								//var field_type_id = $scope.data.field_type.id;
								delete $scope.data.list;
								delete $scope.data.field_type;
								$scope.data.field_type_id = field_type_id;
								QuestionBank = $scope.data;
								QuestionBank.$save();
							});
							for(let i = 0; i < $scope.oldfields.length; i++) {
								$http.delete(S.baseUrl + '/question_bank_field_datasource/' + $scope.oldfields[i].id).then(function(response) {
									
								});
							}
				
							if ($scope.data.id) {
								var QuestionBankdata = R.get('question_bank_field_datasource/').query({}, function (data) {
									for (var i in $scope.fields) {
										var ds = new DataSource();
										if($scope.fields[i].title != '') {
											ds.title = $scope.fields[i].title;
											ds.question_bank_field_id = $scope.data.id;
											ds.$save();	
										}
										
									}
								}, function (r) {
									if (r.status && r.status == 404) {
										for (var i in $scope.fields) {
											var ds = new DataSource();
											if($scope.fields[i].title != '') {
												ds.title = $scope.fields[i].title;
												ds.question_bank_field_id = $scope.data.id;
												ds.$save();	
											}
										}
									}
								});
							}
							$scope.showFormSavedModal();
						} else {
							$scope.data.$save().then(function (r) {
								$scope.showErrorModal();
							});
						}
					}
				} else {
					$scope.showErrorJSON = ($scope.data.field_type.id == 3 || $scope.data.field_type.id == 4 || $scope.data.field_type.id == 5) && $scope.fields.length == 0;
					if(($scope.data.field_type.id == 3 || $scope.data.field_type.id == 4 || $scope.data.field_type.id == 5) && $scope.fields.length == 0) {
						$scope.showErrorModalFields();
					} else {
						console.log($scope.data);
						var DataSource = R.get('question_bank_field_datasource');
						if ($scope.data.id) {
							var QuestionBank = R.get('question_bank_fields/');
							var QuestionBank = R.get('question_bank_fields/').query({}, function (data) {
								//var field_type_id = JSON.parse($scope.data.field_type).id;
								var field_type_id = $scope.data.field_type.id;
								delete $scope.data.list;
								delete $scope.data.field_type;
								$scope.data.field_type_id = field_type_id;
								QuestionBank = $scope.data;
								QuestionBank.$save();
							});
							for(let i = 0; i < $scope.oldfields.length; i++) {
								$http.delete(S.baseUrl + '/question_bank_field_datasource/' + $scope.oldfields[i].id).then(function(response) {
									
								});
							}
				
							if ($scope.data.id) {
								var QuestionBankdata = R.get('question_bank_field_datasource/').query({}, function (data) {
									for (var i in $scope.fields) {
										var ds = new DataSource();
										if($scope.fields[i].title != '') {
											ds.title = $scope.fields[i].title;
											ds.question_bank_field_id = $scope.data.id;
											ds.$save();	
										}
										
									}
								}, function (r) {
									if (r.status && r.status == 404) {
										for (var i in $scope.fields) {
											var ds = new DataSource();
											if($scope.fields[i].title != '') {
												ds.title = $scope.fields[i].title;
												ds.question_bank_field_id = $scope.data.id;
												ds.$save();	
											}
										}
									}
								});
							}
							$scope.showFormSavedModal();
						} else {
							$scope.data.$save().then(function (r) {
								$scope.showErrorModal();
							});
						}
					}
				}	
			}
		}
	}
	
	$scope.showErrorModalFieldType = function() {
        $scope.modalOptions.open($scope.errorModalOptionsFieldType);
    }
    
    $scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
    $scope.errorModalOptionsFieldType = {
        header: '',
        text: 'Please select a Question Type!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
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

	$scope.showErrorModalFields = function() {
        $scope.modalOptions.open($scope.errorModalOptionsFields);
    }
    
    $scope.errorModalOptionsFields = {
        header: '',
        text: 'Please enter data items to proceed further!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }



		$scope.savedModalOptions = {
			header: 'updated!',
			text: 'Your entry has been updated successfully!',
			showOk: true,
			okText: 'Go to listing page!',
			onOkClick: function () {
				$location.path('forms-question-bank');


			},
			showCancel: true,
			cancelText: 'Stay on this page!',
			onCancelClick: function () {
				document.getElementById('title').value = '';
				clearFieldType();
				$scope.fields = [];
				// activate();
				// clearFieldSourceItem();
			}
		}


		$scope.cancelModalOptions = {
			header: 'Are you sure you want to leave this page?',
			text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Question Bank.',
			showOk: true,
			okText: 'Ok',
			onOkClick: function () {
				$location.path('forms-question-bank');
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
		
		$scope.showErrorModalDuplicate = function() {
	        $scope.modalOptions.open($scope.errorModalOptionsDuplicate);
	    }
	    
	    $scope.errorModalOptionsDuplicate = {
	        header: '',
	        text: 'You are trying to enter a duplicate entry!',
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	    }


		$(function () {
			$('.fixed-action-btn').floatingActionButton({});
		});
	});
