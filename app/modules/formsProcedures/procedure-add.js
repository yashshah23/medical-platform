//An example of Angular $http

app.controller('formsProcedureAddController', function($scope, $http, R, S, $location, $q) {
	$scope.pageheader="CREATE A NEW PROCEDURE";
	$scope.selectedPerson = "";
	$scope.selectedPeople = [];
	$scope.addedForms = [];
	$scope.fieldTypes = [{
		id: 1,
		title: "Text"
	}, {
		id: 2,
		title: "Number"
	}];
	$scope.fields = [];

	$scope.unselectPerson = function(p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {
			data[$scope.selectedPeople[i].first_name + ' ' + $scope.selectedPeople[i].last_name] = $scope.selectedPeople[i];
			$scope.selectedPeople.splice(i, 1);
		}
	}

	$scope.unselectForm = function(p) {     
		var i = $scope.addedForms.indexOf(p);
		console.log(i);
		if (i >= 0) {
			// remember
			// data[$scope.addedForms[i].title] = $scope.addedForms[i];
			$scope.addedForms.splice(i, 1);
		}
	}


	angular.element(document).ready(function() {
		$( "#title" ).focus(); //focus added by sanjoli
		$('.fixed-action-btn').floatingActionButton({
		});

		R.get('users').query({}, function(results) {
			var data = {};
			for (var i = 0; i < results.length; i++) {
				data[results[i].first_name + ' ' + results[i].last_name] = results[i];
			}

			$('#people').autocomplete({
				data: data,
				onAutocomplete: function(r) {
					if ($scope.selectedPeople.indexOf(data[r]) >= 0) {} else {
						$scope.selectedPeople.push(data[r]);

						$scope.$apply();
						delete data[r];
					}
					document.getElementById('people').value = '';
				}
			});

		});

		R.get('forms').query({}, function(results) {
			var data = {};
			for (i = 0; i < results.length; i++) {
				data[results[i].title] = results[i];
				//data.push({tag: results[i].first_name + ' ' + results[i].last_name, image: null});
			}

			$('#forms').autocomplete({
				data: data,
				onAutocomplete: function(r) {
					if ($scope.addedForms.indexOf(data[r]) >= 0) {} else {
						$scope.addedForms.push(data[r]);


						$scope.$apply();
						delete data[r];
					}
					document.getElementById('forms').value = '';
				}
			});

		});

	});


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Procedures.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function() {
			$location.path('forms-procedures');
		},
		showCancel: true,
		cancelText: 'Cancel',
		onCancelClick: function() {}
	}

	$scope.savedModalOptions = {
		header: 'Saved!',
		text: 'Your Procedure has been saved successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function() {
			$location.path('forms-procedures');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
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

	$scope.cancelProcedure = function() {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.launchErrorModal = function() {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showprocedureSavedModal = function() {
		$scope.modalOptions.open($scope.savedModalOptions);
	}

	$scope.addField = function(field, fieldType) {
		//if(!fieldType) {fieldType = $('#fieldTypes').val();}
		if (field && fieldType) {
			var r = $scope.fieldTypes.find(function(f) {
				return f.id == fieldType;
			});
			$scope.fields.push({
				title: field,
				field_type_id: fieldType,
				field_type: r
			});

		}

	}

	$scope.selectedFieldTypeChanged = function() {}

	$scope.saveProcedure = function() {

		var Procedure = R.get('procedures');
		var procedure = new Procedure();
		procedure.title = $scope.data;
		var Form = R.get('procedure_forms');
		var forms = [];
		procedure.$save().then(function(r) {

					for (var i in $scope.addedForms) {
			var form = new Form();
			form.procedure_id = r.id;
			form.form_id = $scope.addedForms[i].id;
			form.seq = i;
			forms.push(form.$save());
		}

		$q.all(forms).then(function(r) {
				$scope.showprocedureSavedModal();
			}, function(e) {
				$scope.launchErrorModal();
			});

		}, function(e){});





	}

	// $scope.$watch('selectedPerson', function(newObj, oldObj) {
	// 	$scope.selectedPeople.push(newObj);
	// });

});

app.controller('formsProcedureEditController', function ($http, $scope, $routeParams, $controller, R, S,$location,$q) {
$scope.pageheader="EDIT PROCEDURE";
	$scope.fields = [];
	// $scope.data={};
	$controller('proceduresControllerBase', {
		$scope: $scope
	});

	$scope.selectedPerson = "";
	$scope.selectedPeople = [];
	$scope.addedForms = [];
	$scope.fieldTypes = [{
		id: 1,
		title: "Text"
	}, {
		id: 2,
		title: "Number"
	}];
	$scope.fields = [];

	$scope.unselectPerson = function(p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {
			data[$scope.selectedPeople[i].first_name + ' ' + $scope.selectedPeople[i].last_name] = $scope.selectedPeople[i];
			$scope.selectedPeople.splice(i, 1);
		}
	}

	$scope.unselectForm = function(p) {
		var i = $scope.addedForms.indexOf(p);
	
		if (i >= 0) {
			//remember
		// remember	data[$scope.addedForms[i].title] = $scope.addedForms[i];
			$scope.addedForms.splice(i, 1);
		}
	}

	angular.element(document).ready(function() {



		R.get('users').query({}, function(results) {
			var data = {};

			for (i = 0; i < results.length; i++) {
				data[results[i].first_name + ' ' + results[i].last_name] = results[i];
			}

			$('#people').autocomplete({
				data: data,
				onAutocomplete: function(r) {
					if ($scope.selectedPeople.indexOf(data[r]) >= 0) {} else {
						$scope.selectedPeople.push(data[r]);
						$scope.$apply();
						delete data[r];
					}
					document.getElementById('people').value = '';
				}
			});

		});

		R.get('forms').query({}, function(results) {
			var data = {};
			for (i = 0; i < results.length; i++) {
				data[results[i].title] = results[i];
				//data.push({tag: results[i].first_name + ' ' + results[i].last_name, image: null});
			}

			$('#forms').autocomplete({
				data: data,
				onAutocomplete: function(r) {
					if ($scope.addedForms.indexOf(data[r]) >= 0) {} else {
						$scope.addedForms.push(data[r]);
						$scope.$apply();
						delete data[r];
					}
					document.getElementById('forms').value = '';
				}
			});

		});

	});

	$scope.addField = function(field, fieldType) {
		//if(!fieldType) {fieldType = $('#fieldTypes').val();}
		if (field && fieldType) {
			var r = $scope.fieldTypes.find(function(f) {
				return f.id == fieldType;
			});
			$scope.fields.push({
				title: field,
				field_type_id: fieldType,
				field_type: r
			});

		}

	}

	$scope.selectedFieldTypeChanged = function() {}


	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;
	$scope.data.f

	$scope.load = function () {

		R.get('procedures/' + $scope.id).get(function (r) {
			$scope.data = r;
		});

		R.get('procedure_forms').query({procedure_id:$scope.id },function(data){
			for (i = 0; i < data.length; i++) {
				$scope.addedForms.push(data[i].form);
			}
		})
	};

	$scope.addField = function (field) {

		if (field) {
			$scope.fields.push({
				title: field,
			});

		}

		$scope.datasourcenewItem = ''

	}

	$scope.save = function () {

		if ($scope.data.id) {
			var procedure = R.get('procedures/').query({}, function (data) {

				procedure = $scope.data;
				procedure.$save();
			});		

			$scope.showFormSavedModal();

		} else {

			$scope.data.$save().then(function (r) {
				$scope.showErrorModal();
			});
		}

	}


	$scope.savedModalOptions = {
		header: 'Saved!',
		text: 'Your entry has been saved successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-procedures');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () { }
	}


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Procedures.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-procedures');
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

	$scope.cancelProcedure = function () {
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