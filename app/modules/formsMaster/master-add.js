//An example of Angular $http

app.controller('formsMasterAddController', function ($scope, $rootScope, $http, R, S, $location, $q) {
	$scope.pageheader = "CREATE A NEW MASTER";
	$scope.selectedPerson = "";
	$scope.selectedPeople = [];
	$scope.fields = [];
	$scope.isDisabled = false;
	$scope.fieldSources = {};
	$scope.masterId;
	$scope.masterEntryValue = {};
	$scope.selectedMasterId;
	$scope.display_field_name;
	$scope.isPrimaryDisabled = false;
	$scope.listtitle;
	$scope.MasterFormFieldSource = [];

	$scope.uniquemaster = function(t){
		debugger
		R.get('master').query({}, function (r) {
			$scope.data.master = r;
			$scope.listtitle = r.map(function(data){
				return data.title
			})
		}, function (e) { });
		console.log("hello")
		for(var c =0; c < $scope.listtitle.length; c++){
			if($scope.listtitle[c] == t){
				$scope.showErrorModalNewEntry();
			}
		}
	}
	$scope.showErrorModalNewEntry = function() {
        $scope.modalOptions.open($scope.errorModalOptionsNewEntry);
    }
    
    $scope.errorModalOptionsNewEntry = {
    	header: 'Warning ...',
        text: 'Master name already exist !!',
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
			data[$scope.selectedPeople[i].first_name + ' ' + $scope.selectedPeople[i].last_name] = $scope.selectedPeople[i];
			$scope.selectedPeople.splice(i, 1);
		}
	}

/* 	$scope.load = function(){
		R.get('master').query({}, function (r) {
            
			$scope.data.master = r
			console.log(r)

            for (i = 0; i < r.length; i++) {
                if ($scope.data.parentMasterArray[r[i].default_field.title] == undefined) $scope.data.parentMasterArray[r[i].default_field.title] = [];
                if (r[i].master_entry_version.id == $scope.versions[r[i].master_entry.id][0]) {
                    $scope.data.parentMasterArray[r[i].default_field.title].push(r[i].master)
                }
            }
        }, function (e) { });
	} */

	angular.element(document).ready(function () {

		$("#title").focus();
		$('.fixed-action-btn').floatingActionButton({

		});

		R.get('users').query({}, function (results) {
			data = {};
			for (let i = 0; i < results.length; i++) {
				data[results[i].first_name + ' ' + results[i].last_name] = results[i];
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
			$('select').formSelect();
		});

	});

	R.get('master').query({}, function (r) {
		$scope.data.master = r;
		$scope.listtitle = r.map(function(data){
			return data.title
		})
	}, function (e) { });

      
	$scope.selectedParentMasterChanged = function (m_id) {
		console.log("every time");
		$scope.data.master_entry_value = ''
		$scope.selectedMasterId = m_id;

		R.get('default_fields').query({
		}, function (r) {
			for (let i = 0; i < r.length; i++) {
				for (j = 0; j < r.length; j++) {
					if (r[i].id == r[j].title) {
						r[j].title = r[i].title
					}
				}
			}
			$scope.data.default_field =r;
			$scope.data.default_fields = r.filter(e => e.master.id == $scope.selectedMasterId)
			console.log($scope.data.default_fields)
		}, function (e) { });

	}

	R.get('master_entry_values/').query({}, function (r) {
		$scope.data.master_entry_values = r;

		$scope.data.master_entry_values = r.filter(e => e.default_field.id == e.master.parentMasterDisplayField)

	}, function (e) {
		console.log(e);
	});

	$scope.selectedParentDisplayFieldChanged = function (d_id) {
		/* console.log(d_id);
		console.log($scope.data.default_fields); */
		$scope.isMasterClicked = true;
		

		for (i = 0; i < $scope.data.default_fields.length; i++) {
			if ($scope.data.default_fields[i].id == d_id) {
				console.log($scope.data.default_fields[i].id);
				$scope.display_field_name = $scope.data.default_fields[i].id;
				console.log($scope.display_field_name);
			}
		}

		$scope.addField($scope.display_field_name, S.fieldTypes[11].id, 0, 0)
	}

	$scope.addMasterFieldSource = function(fieldTitle, fieldSourceItem) {

			//$scope.array1 = []
			//var m = $scope.array1
			$scope.isCollectionMasterDisabled = true;

			for (i=0;i<$scope.data.default_fields.length; i++){
				if($scope.data.default_fields[i].id == fieldSourceItem){
				console.log($scope.data.default_fields[i].title)
				$scope.MasterFormFieldSource.push($scope.data.default_fields[i].title);
				console.log($scope.MasterFormFieldSource)
				}
			}

			//console.log($scope.MasterFormFieldSource)
			
            var o = Object.values($scope.MasterFormFieldSource)
            var op;

            if (o[0] != undefined) {
                for (i = 0; i < o.length; i++) {
                    op = o[i][0].id

                    if (fieldSourceItem.length > 1) {
                        f = fieldSourceItem.filter(e => e == op)
                        if (f == op) {
                            return $scope.modalOptions.open($scope.existingMastreFieldsOptions);
                        }
                    }
                    else {
                        
                        if (op == fieldSourceItem) {
                            return $scope.modalOptions.open($scope.existingMastreFieldsOptions);
                        }
                    }

                }
            }

            var a = [];
           
            for (i = 0; i < fieldSourceItem.length; i++) {
                $scope.MasterFormFieldSource.push($scope.default_fields.filter(e => e.master.id == fieldTitle && e.id == fieldSourceItem[i]));
                //console.log($scope.MasterFormFieldSource)
                if ($scope.default_fields.filter(e => e.master.id == fieldTitle && e.id == fieldSourceItem[i])) {
                  let title=$scope.default_fields[i].master.title
                    if(!$scope.tmparray.includes(title)){
                       $scope.tmparray.push($scope.default_fields[i].master.title)
                        $scope.masterSeleted.push($scope.default_fields[i].master)
                        //console.log($scope.tmparray);
                        //console.log($scope.default_fields[i].master);
                   }
                }
            }
            console.log($scope.MasterFormFieldSource)

            $scope.data.default_field_id = ''

		
	}

/* 	$scope.checkIsPrimaryExist = function () {

		var a = {}

        a = $scope.data.master.filter(e => e.master.title == $scope.masterId)
		console.log(a);
		a = $scope.data.master
		array=a.map(title)
		console.log(a)

		var tagMap = a.reduce(function(map, a) {
			map[a.title] = map[a.name];
			return map;
		  }, {});

		  console.log(tagMap)

		  var first = [
			{ "id": 1, "name": "python" }, 
			{ "id": 2, "name": "NodeJs" }, 
			{ "id": 3, "name": "git" }];
		  
		  var selectedExpTags = [1,2];
		  var names = selectedExpTags.map(x=> first.find( y=> y.id === x ).name )
		  
		  console.log(names);
		
		console.log($scope.masterTitle)

        for (i = 0; i < a.length; i++) {
            if (a[i].master == $scope.maste.title) {
                $scope.IsPrimaryExistModal();
            }
        }
        $scope.data.default_entries[fieldId] = '';
	}
	
	$scope.IsPrimaryExistModalOptions = {
        header: 'Warning!',
        text: 'Value of Entered Fields Already Exists!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            //$location.path('forms-master');
            $location.path('forms-master/' + masterId + '/entry/list');
            $scope.load();
        },
        showCancel: false
    }

    $scope.IsPrimaryExistModal = function () {
        $scope.modalOptions.open($scope.IsPrimaryExistModalOptions);
    } */

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

	$scope.savedModalOptions = {
		header: 'Saved!',
		text: 'Your entry has been saved successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-master');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () {
			clearFieldType(); //added to reset the field by sanjoli
			$scope.fields = []; //added to reset the field by sanjoli
			$scope.isDisabled = false;
			$scope.master.title = '';
			$scope.master.description = '';
		}
	}
	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$scope.isDisabled = false
		},
		showCancel: false,
		cancelText: '',
		onCancelClick: function () { }
	}

	$scope.masterErrorModalOptions = {
		header: 'Kindly Add a Primary Key...',
		text: 'It is mandatory to add a Primary Key in order to save the master',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$scope.isDisabled = false
		},
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

	$scope.launchMasterErrorModal = function () {
		$scope.modalOptions.open($scope.masterErrorModalOptions);
	}

	$scope.showFormSavedModal = function () {
		$scope.modalOptions.open($scope.savedModalOptions);
	}

	$scope.addField = function (field, fieldType, is_primary, is_autoIncrement) {
		
		if (field && fieldType) {
			let r = $scope.fieldTypes.find(function (f) {
				return f.id == fieldType;
			});

			if (fieldType == 12) {
				for (let i = 0; i < $scope.data.default_fields.length; i++) {
					if ($scope.data.default_fields[i].id == field) {
						field = $scope.data.default_fields[i].title
					}
				}
			}

			$scope.fields.push({
				title: angular.copy(field),
				field_type_id: angular.copy(fieldType),
				field_type: r,
				is_primary: (is_primary ? 1 : 0),
				is_autoIncrement: (is_autoIncrement ? 1 : 0)
			});

			for (i = 0; i < $scope.fields.length; i++) {
				if ($scope.fields[i].is_primary == 1) {
					$scope.isPrimaryDisabled = true;
				}
				if ($scope.fields[i].is_autoIncrement == 1) {
					$scope.isAutoIncrementDisabled = true;
				}

			}
		}
		$scope.data.title = '';
		$scope.data.is_primary = false;
		$scope.data.is_autoIncrement = false;

		clearFieldType();
	}


	$scope.deletefields = function (x) {

		if (x.is_primary == 1) {
			$scope.isPrimaryDisabled = false;
		}
		if (x.is_autoIncrement == 1) {
			$scope.isAutoIncrementDisabled = false;
		}
	}

	$scope.addFieldSource = function (fieldTitle, fieldSourceItem) {
		
		if (!$scope.fieldSources[fieldTitle])
			$scope.fieldSources[fieldTitle] = [];
		$scope.fieldSources[fieldTitle].push(fieldSourceItem);
		clearFieldSourceItem()
	}
	$scope.masterTypeChanged = function () {
		if ($scope.data.field_type) {
			$scope.selectedFieldTypeCategory = JSON.parse($scope.data.field_type).type;
			// $scope.fields = [];
		}
	}
 
	
	$scope.saveMaster = function () {
		
		if ($scope.isPrimaryDisabled == true){
			console.log("Whats Up")

			$scope.isDisabled = true;
			var Master = R.get('master');
			var DefaultFields = R.get('default_fields');
			var DataSource = R.get('default_field_datasource');

			var default_fields = [];
			var datasoure = [];

			var Value = R.get('master_entry_values');
			var master_entry_value = [];

			// save master 
			var master = new Master();
			master.title = $scope.master.title;
			//console.log($scope.master.title)
			master.description = $scope.master.description;
			master.parentMaster = $scope.master.parentMaster != undefined ? $scope.master.parentMaster : null;
			master.parentMasterDisplayField = $scope.master.parentMasterDisplayField;

			master.$save().then(function (masterRes) {
				
				for (let field = 0; field < $scope.fields.length; field++) {
					$scope.masterId = masterRes.id;
					var defaultFields = new DefaultFields();

					if ($scope.fields[field].field_type_id == 12) {
						for (let i = 0; i < $scope.data.default_field.length; i++) {
							if ($scope.data.default_field[i].title == $scope.fields[field].title) {
								defaultFields.title = $scope.data.default_field[i].id
							}
						}
					}else {
						defaultFields.title = $scope.fields[field].title;
					}

					//defaultFields.title = $scope.fields[field].title;
					defaultFields.field_type_id = $scope.fields[field].field_type_id;
					defaultFields.master_id = masterRes.id;
					defaultFields.is_primary = $scope.fields[field].is_primary;
					defaultFields.is_autoIncrement = $scope.fields[field].is_autoIncrement;
					default_fields.push(defaultFields.$save());
					//console.log($scope.fields[field].is_autoIncrement)
				}

				$q.all(default_fields).then(function (r) {
					for (var i in r) {

						if (r[i] && r[i].master) {
							var val = $scope.fieldSources[r[i].title];

							if (val) {
								for (var j in val) {
									var ds = new DataSource();
									ds.default_field_id = r[i].id;
									ds.title = val[j];
									ds.master_id = $scope.masterId;
									ds.$save();
								}
							}
						}
					}

					$q.all(default_fields).then(function (r) {
						$scope.showFormSavedModal();
					})

				},

					function (e) {
						$scope.launchErrorModal();
					});

			});
		} else {
			$scope.launchMasterErrorModal();
		}
	}
});


app.controller('defaultFieldsControllerBase', ControllerFactory('default_fields'));
app.controller('formsMasterEditController', function ($http, $scope, $q, $location, $routeParams, $timeout, $controller, R, S) {

	var masterId = $routeParams.id;

	$scope.pageheader = "EDIT MASTER";
	$scope.fields = [];
	$scope.remaningfields = [];
	$scope.fields = [];
	$scope.isDisabled = false;
	$scope.fieldSources = {};
	$scope.selectedMasterId;
	$scope.selected_default_fields_id;
	$scope.isPrimaryDisabled = false;
	$scope.isAutoIncrementDisabled = false;
	// $scope.data={};
	$controller('mastersControllerBase', {
		$scope: $scope
	});
	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;

	$scope.load = function () {
		$("#title").focus();
		R.get('master/' + $scope.id).get(function (r) {
			$scope.master = r;
			$scope.data.field_type = r.field_type
			$scope.selectedMasterId = r.parentMaster;
			$scope.selected_default_fields_id = r.parentMasterDisplayField;
			$scope.master.parentMaster = '';
			// $timeout(function () {
			// 	selectedFieldType(r.field_type.title);
			// 	$scope.selectedFieldTypeCategory = r.field_type.type;
			// }, 100);
			//$scope.data.field_type = r.field_type
		});
		R.get('field_types').query({}, function (results) {
			$('select').formSelect();
		});
		R.get('default_fields').query({ master_id: $scope.id }, function (field) {

			R.get('default_fields').query({}, function (df) {
				for (let k = 0; k < df.length; k++) {
					for (let j = 0; j < field.length; j++) {
						if (df[k].id == field[j].title) {
							field[j].title = df[k].title
						}
					}
				}
			});

			$scope.existingfields = field;
			for (i = 0; i < $scope.existingfields.length; i++) {
				if ($scope.existingfields[i].is_primary == 1) {
					$scope.isPrimaryDisabled = true;
				}
				if ($scope.existingfields[i].is_autoIncrement == 1) {
					$scope.isAutoIncrementDisabled = true;
				}
			}

		})
		R.get('default_field_datasource').query({ default_field_id: $scope.id }, function (data) {
			$scope.remaningfields = data;
		})
	};

	$scope.swapField = function (x, y, item) {

        var len, lenexist;
		//len = $scope.fields.length;
		lenexist = $scope.existingfields.length;
		//console.log(lenexist);

        /* if (x >= 0 && y >= 0 && x < len && y < len && $scope.fields.length && item == 'fields') {
            var t;
            len = $scope.fields.length;
            t = $scope.fields[x];
            $scope.fields[x] = $scope.fields[y];
            $scope.fields[y] = t;
        } */
        if (lenexist && x >= 0 && y >= 0 && x < lenexist && y < lenexist && item == 'existingFormfields') {
            t = $scope.existingfields[x];
            $scope.existingfields[x] = $scope.existingfields[y];
            $scope.existingfields[y] = t;
		}
		console.log(lenexist);

	};
	
	/* $scope.swapField = function (x, y) {

		var len = $scope.fields.length;
		console.log($scope.fields)
        if (x >= 0 && y >= 0 && x < len && y < len) {
            var t = $scope.fields[x];
            $scope.fields[x] = $scope.fields[y];
            $scope.fields[y] = t;
        }
    } */

	R.get('master').query({}, function (r) {
		$scope.data.master = r;
	}, function (e) { });

	R.get('default_fields').query({}, function (r) {


		for (let i = 0; i < r.length; i++) {
			for (j = 0; j < r.length; j++) {
				if (r[i].id == r[j].title) {
					r[j].title = r[i].title
				}
			}
		}


		$scope.data.default_fields = r;
		$scope.default_fields = r;
	}, function (e) { });


	$scope.selectedParentMasterChanged = function (m_id) {
		// 
		// $scope.data.master_entry_value = ''
		// $scope.selectedMasterId = m_id;
		// $scope.data.default_fields = $scope.default_fields.filter(e => e.master.id == $scope.selectedMasterId)
		
		$scope.data.master_entry_value = ''
		$scope.selectedMasterId = m_id;

		R.get('default_fields').query({
		}, function (r) {
			for (let i = 0; i < r.length; i++) {
				for (j = 0; j < r.length; j++) {
					if (r[i].id == r[j].title) {
						r[j].title = r[i].title
					}
				}
			}
			$scope.data.default_fields = r.filter(e => e.master.id == $scope.selectedMasterId)
		}, function (e) { });

	}

	R.get('master_entry_values/').query({}, function (r) {
		$scope.data.master_entry_values = r;

		$scope.data.master_entry_values = r.filter(e => e.default_field.id == e.master.parentMasterDisplayField)

	}, function (e) {
		console.log(e);
	});

	$scope.selectedParentDisplayFieldChanged = function (d_id) {
		
		for (i = 0; i < $scope.data.default_fields.length; i++) {
			if ($scope.data.default_fields[i].id == d_id) {
				$scope.display_field_name = $scope.data.default_fields[i].title
			}
		}
		$scope.addField($scope.display_field_name, S.fieldTypes[11].id, 0, 0)

	}

	$scope.masterTypeChanged = function (field_type) {
		if (field_type.length) {
			let id = field_type[0].default_field.id;
			R.get('default_field_datasource/').query({ default_field_id: id }, function (r) {
				for (var x in r) {
					$scope.deleteCandidate = r;
					$scope.modalOptions.open($scope.deleteModalOptions);
				}

			});
		}
		if ($scope.data.field_type) {
			$scope.selectedFieldTypeCategory = JSON.parse($scope.data.field_type).type;
			// $scope.fields = [];
		}
	}

	$scope.addField = function (field, fieldType, is_primary, is_autoIncrement) {
		if (field && fieldType) {
			var r = $scope.fieldTypes.find(function (f) {
				return f.id == fieldType;
			});

			if (fieldType == 12) {
				for (let i = 0; i < $scope.data.default_fields.length; i++) {
					if ($scope.data.default_fields[i].id == field) {
						field = $scope.data.default_fields[i].title
					}
				}
			}

			$scope.fields.push({
				title: angular.copy(field),
				field_type_id: angular.copy(fieldType),
				field_type: r,
				is_primary: (is_primary ? 1 : 0),
				is_autoIncrement: (is_autoIncrement ? 1 : 0)
			});

			for (i = 0; i < $scope.fields.length; i++) {
				if ($scope.fields[i].is_primary == 1) {
					$scope.isPrimaryDisabled = true;
				}
				if ($scope.fields[i].is_autoIncrement == 1) {
					$scope.isAutoIncrementDisabled = true;
				}
			}
		}
		$scope.data.title = '';
		$scope.data.is_primary = false;
		$scope.data.is_autoIncrement = false;

		clearFieldType();
	}
	$scope.launchErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}
	$scope.addFieldSource = function (fieldTitle, fieldSourceItem) {

		if (!$scope.fieldSources[fieldTitle])
			$scope.fieldSources[fieldTitle] = [];
		$scope.fieldSources[fieldTitle].push(fieldSourceItem);
		clearFieldSourceItem()
	}

	$scope.save = function () {
		$scope.isDisabled = true;
		// var Master = R.get('master');
		var DefaultFields = R.get('default_fields');
		//console.log(DefaultFields)
		var DataSource = R.get('default_field_datasource');
		var default_fields = [];
		var master = R.get('master').query({}, function () {

			master = $scope.master;
			master.$save().then(function (r) {
				$scope.showFormSavedModal();


			}, function (e) {
			});
			for (let field = 0; field < $scope.fields.length; field++) {
				var defaultFields = new DefaultFields();

				if ($scope.fields[field].field_type_id == 12) {
					for (let i = 0; i < $scope.data.default_fields.length; i++) {
						if ($scope.data.default_fields[i].title == $scope.fields[field].title) {
							defaultFields.title = $scope.data.default_fields[i].id
						}
					}
				}
				else {
					defaultFields.title = $scope.fields[field].title;
				}


				// defaultFields.title = $scope.fields[field].title;
				defaultFields.field_type_id = $scope.fields[field].field_type.id;
				defaultFields.master_id = $scope.id;
				defaultFields.is_primary = $scope.fields[field].is_primary;
				defaultFields.is_autoIncrement = $scope.fields[field].is_autoIncrement;
				default_fields.push(defaultFields.$save());
				//console.log($scope.fields[field].is_autoIncrement)
			}


			$q.all(default_fields).then(function (r) {
				for (var i in r) {

					if (r[i] && r[i].master) {
						var val = $scope.fieldSources[r[i].title];

						if (val) {
							for (var j in val) {
								var ds = new DataSource();
								ds.default_field_id = r[i].id;
								ds.title = val[j];
								ds.master_id = $scope.id;
								ds.$save();
							}
						}
					}
				}

				$q.all(default_fields).then(function (r) {
					$scope.showFormSavedModal();
				})
			},

				function (e) {
					$scope.launchErrorModal();
				});
		})
	}

	$scope.deletefields = function (x) {

		if (x.is_primary == 1) {
			$scope.isPrimaryDisabled = false;
		}
		if (x.is_autoIncrement == 1) {
			$scope.isAutoIncrementDisabled = false;
		}
	}

	$scope.deleteObject = function (obj) {

		let id = obj.id;
		$scope.delete(obj, function (r) {
			if (r.success.code == 200) {
				R.get('default_fields/').query({ title: id }, function (result) {
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

	$scope.savedModalOptions = {
		header: 'Updated!',
		text: 'Your entry has been updated successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-master');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () {
			$scope.fields = [];
		}
	}


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: ' Any progress you have made on this page will be lost. You will be redirected to the list of Masters.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-master');
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
		onOkClick: function () {
			$scope.isDisabled = false;
		},
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
	$scope.launchDelete = function (obj, index) {

		$scope.existingfields.splice(index, 1);
		$scope.deletefield = obj

		objId = obj.id

		R.get('default_fields/' + objId).get(function (r) {
			$scope.deleteCandidate = r;
			$scope.modalOptions.open($scope.deleteModalOptions);
		})
		if (obj.is_primary == 1) {
			$scope.isPrimaryDisabled = false;
		}
		if (obj.is_autoIncrement == 1) {
			$scope.isAutoIncrementDisabled = false;
		}
	}


	$(function () {
		$('.fixed-action-btn').floatingActionButton({});

	});
});