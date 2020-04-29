//An example of Angular $http
app.controller('formsControllerBase', ControllerFactory('forms'));
app.controller('formsDetailsController', function ($scope, $routeParams, R) {

    $scope.id = $routeParams.id;

    $scope.disabled = true;
    $scope.mode = 'view';

    $(function () {
        $('.fixed-action-btn').floatingActionButton({
            direction: 'top'
        });
    });

    $scope.load = function () {
        R.get('forms/' + $scope.id).get(function (r) {
            $scope.data = r;
        });
    };
});
app.controller('formsAddController', function ($scope, $rootScope, $controller, $http, R, S, $location, $q, $timeout) {
    
    $controller('formsControllerBase', {
        $scope: $scope
    });
    
    $scope.selectedPerson = "";
    $scope.selectedPeople = [];
    $scope.selectedField = [];
    $scope.allPeople = [];
    $scope.fields = [];
    $scope.y = {}; //added by sanjoli
    $scope.x = [];
    $scope.f = [];
    $scope.formuladata = [];
    $scope.formuladata1 = [];
    $scope.formuladatacopy = [];
    $scope.Questions = [];
    $scope.formulas = ['+', '-', '/', '*']
    $scope.formula = {};
    $scope.addformula = [];
    $scope.fieldname;
    $scope.primary_array = [];

    $scope.categories = [];
    $scope.masters = [];
    $scope.default_fields = [];
    $scope.form_default_fields = [];
    $scope.MasterFormFieldSource = [];

    $scope.masterSeleted = []

    $scope.isMasterClicked;
    $scope.isCollectionMasterDisabled;
    $scope.Columns = [{
        id: 'col s6',
        title: 'Double Column'
    }, {
        id: 'col s12',
        title: 'Single Column'
    }]
    $scope.confirmed;
    $scope.option;
    $scope.questiontype;
    $scope.existingFields;
    $scope.fieldchoose;
    $scope.Formula = [];
    $scope.defaultAdd = {};
    $scope.IsVisible = false;
    $scope.groupImg = [];
    $scope.groupData = [];
    $scope.selectedGroup = [];
    $scope.usertype;
    $scope.isDisabled = false;
    $scope.active = true;
    $scope.active1 = true;
    $scope.remabtag =[];
    $scope.tmparray=[] //for prvent duplicat master title 
    $scope.ShowHide = function () {
        //If DIV is visible it will be hidden and vice versa.
        $scope.IsVisible = $scope.chkdefault_value;
    }
    $scope.default_value = "";
    $scope.choose = ['Choose Questions from Question Bank', 'Create Question']
    $scope.userType = ['User', 'User Group'];
    
    $scope.people = "";
	$scope.countSelectedPeople = 0;
	$scope.prevCountPeople = 0;
	$scope.countSelectedGroup = 0;
	$scope.prevCountGroup = 0;

    $scope.unselectPerson = function (p) {
        var i = $scope.selectedPeople.indexOf(p);
        if (i >= 0) {

            $scope.selectedPeople.splice(i, 0);
            delete $scope.selectedPeople[i];

        }
        if (p[0]) {
            $scope.y[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = "images/user.png";
            $scope.x[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = p[0];
        } else if (p.first_name) {
            $scope.y[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = "images/user.png";
            $scope.x[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = p;
        }

    }
    $scope.unselectGroup = function (p) {

        var i = $scope.selectedGroup.indexOf(p);
        if (i >= 0) {

            $scope.selectedGroup.splice(i, 0);
            delete $scope.selectedGroup[i];

        }
        if (p[0]) {
            $scope.groupImg[p[0].title] = "images/user-group.png";
            $scope.groupData[p[0].title] = p[0];
        } else if (p.title) {
            $scope.groupImg[p.title] = "images/user-group.png";
            $scope.groupData[p.title] = p;
        }
    }

    $scope.unselectfield = function (v) {

        var f = $scope.selectedField.indexOf(v);
        if (f >= 0) {
            data[$scope.selectedField[f].title] = $scope.selectedField[f];
            $scope.selectedField.splice(f, 1);

        }
    }

    angular.element(document).ready(function () {
        activate();
    });

    function activate() {
        $("#title").focus();

        $('.fixed-action-btn').floatingActionButton({});


        R.get('question_bank_fields').query({}, function (results) {
            $scope.Questions = results;
            let data = {};
            let x = {}
            for (let i = 0; i < results.length; i++) {
                data[results[i].title] = null;
                x[results[i].title] = results[i]
            }

            $('#field').autocomplete({

                data: data,
                onAutocomplete: function (r) {
                    
                    $scope.defaultAdd = x[r];
                    $scope.questiontype = x[r].field_type.id;
                    if ($scope.selectedField.indexOf(x[r]) >= 0) {

                    } else {
                        $scope.selectedField.push(x[r]);
                        $scope.$apply();
                        delete data[r];
                    }
                }
            });
        });

        R.get('category').query({
            is_active: 1
        }, function (categories) {
            $scope.categories = categories;
        });

        R.get('master').query({}, function (r) {
            $scope.masters = r;
        }, function (e) { });

        R.get('form_default_fields').query({}, function (r) {
            $scope.form_default_fields = r;

        }, function (e) { });

        $scope.selectedParentMasterChanged = function (m_id) {
            //console.log(m_id)
            $scope.isMasterClicked = true

            // $scope.isMasterClicked = true

            R.get('default_fields').query({ }, function (r) {
                //console.log(r)
                for (let i = 0; i < r.length; i++) {
                    for (j = 0; j < r.length; j++) {
                        if (r[i].id == r[j].title) {
                            r[j].title = r[i].title
                        }
                    }
                }
                $scope.default_fields = r.filter(e =>  e.master.id == m_id);
            }, function (e) { });
          $scope.data.default_field_id=[];
        }

        $scope.selectedParentMasterField = function(field_id){
            //console.log(field_id);
        }

        $scope.addMasterFieldSource = function (fieldTitle, fieldSourceItem) {

            $scope.isCollectionMasterDisabled = true

            var o = Object.values($scope.MasterFormFieldSource)
            //console.log(fieldTitle)
            //console.log(fieldSourceItem)
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

            for(i=0; i<$scope.MasterFormFieldSource.length; i++){
                $scope.primary_array.push($scope.MasterFormFieldSource[i][0].is_primary)
            }

            
            
            var sum = $scope.primary_array.reduce(function(a, b) { return a + b; }, 0)
                
            console.log(sum)

            if(sum == 0){
                $scope.modalOptions.open($scope.neededMastreFieldsOptions);
            } else {
               $scope.displayFormFieldSource = $scope.MasterFormFieldSource;
            }

            $scope.data.default_field_id = ''

        }

        $scope.existingMastreFieldsOptions = {
            header: 'This Master Field is already used.',
            text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
            showOk: true,
            okText: 'Ok!',
            onOkClick: function () { },
            showCancel: false
        }

        $scope.neededMastreFieldsOptions = {
            header: 'Please add a field of Primary Key to save',
            showOk: true,
            okText: 'Ok!',
            onOkClick: function () { $scope.MasterFormFieldSource = [] },
            showCancel: false
        }

        $scope.masterDelete = function (id) {
            for (i = 0; i <= $scope.MasterFormFieldSource.length; i++) {
                return $scope.MasterFormFieldSource.splice(i, 1);
            }
            $scope.data.default_field_id = []
            $scope.data.master_id = []

        }

        R.get('users').query({}, function (results) {
            // let data = {};
            //let x = {};
            for (let i = 0; i < results.length; i++) {
                $scope.y[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = "images/user.png";
                $scope.x[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = results[i];
            }

            $('#people').autocomplete({
                data: $scope.y,
                onAutocomplete: function (r) {
                    //  if ($scope.selectedPeople.indexOf(x[r]) >= 0) { } else 
                    //  {
                    $scope.selectedPeople.push($scope.x[r]);
                    $scope.countSelectedPeople++;
                    $scope.$apply();
                    delete $scope.y[r];
                    delete $scope.x[r];
                    //   }
                    document.getElementById('people').value = '';
                }
            });

        });

        R.get('user_groups').query({ status: 1 }, function (results) {
            for (let i = 0; i < results.length; i++) {
                $scope.groupImg[results[i].title] = "images/user-group.png";
                $scope.groupData[results[i].title] = results[i];
            }

            $('#group').autocomplete({
                data: $scope.groupImg,
                onAutocomplete: function (r) {
                    $scope.selectedGroup.push($scope.groupData[r]);
                    $scope.countSelectedGroup++;
                    $scope.$apply();
                    delete $scope.groupImg[r];
                    delete $scope.groupData[r];
                    document.getElementById('group').value = '';
                }
            });

        });

        R.get('field_types').query({}, function (results) {
            $('select').formSelect();
        });
    }
    
    $scope.checkNewEntryPeople = function (name) {
		R.get('users').query({}, function (results) {
			// let data = {};
			//let x = {};
			if(name == '') {
				return;
			}
			if($scope.countSelectedPeople != $scope.prevCountPeople) {
				$scope.prevCountPeople++;
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
	 
	 $scope.checkNewEntryGroup = function (name) {
		R.get('user_groups').query({ status: 1 }, function (results) {
			// let data = {};
			//let x = {};
			if(name == '') {
				return;
			}
			if($scope.countSelectedGroup != $scope.prevCountGroup) {
				$scope.prevCountGroup++;
				return;
			}
			for (let i = 0; i < results.length; i++) {
				if((name == results[i].title)) {
					
				} else {
					$scope.showErrorModalNewEntry();
					$scope.group = '';	
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

    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Forms.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            $location.path('forms');
        },
        showCancel: true,
        cancelText: 'Cancel',
        onCancelClick: function () { }
    }
    $scope.formulaModalOptions = {
        header: 'To configure formula please add at least one Number type of question.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            // $location.path('forms');
        },
        showCancel: true,
        cancelText: 'Cancel',
        onCancelClick: function () { }
    }
    $scope.primaryKeyModalOptions = {
        header: 'Enter a Primary Key of the master selected',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            // $location.path('forms');
        },
        showCancel: true,
        cancelText: 'Cancel',
        onCancelClick: function () { }
    }
    $scope.savedModalOptions = {
        header: 'Saved!',
        text: 'Your form has been saved successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function () {
            $location.path('forms');
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function () {
            document.getElementById('title').value = '';
            $scope.selectedPeople = [];
            $scope.selectedField = [];
            $scope.existingFields = '';
            $scope.fields = [];
            $scope.selectedGroup = [];
            $scope.fieldTypes = [];
            $scope.fieldchoose = '';
            $scope.fieldSources = '';
            $scope.fieldSourceItem = '';
            $scope.selectedPerson = "";
            $scope.allPeople = [];
            $scope.isDisabled = false;
            $scope.data.categoryId = '';
            //$scope.defaultAdd={};
            $scope.IsVisible = false;
            document.getElementById('opt').value = false;
            activate();
        }
    }

    $scope.addFieldModalOptions = {
        header: 'An error occured ...',
        text: 'Please Enter Field Name',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () { },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }
    
    $scope.addFieldTypeModalOptions = {
        header: 'An error occured ...',
        text: 'Please Select Field Type',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () { },
        showCancel: false,
        cancelText: '',
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
    $scope.addformulaModalOptions = {
        header: 'An error occured ...',
        text: 'Please configur formula',
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
    $scope.datachange = function () {
        return $scope.data1.selectedField

    }

    $scope.launchErrorModal = function () {
        $scope.modalOptions.open($scope.errorModalOptions);
    }

    $scope.showFormSavedModal = function () {
        $scope.modalOptions.open($scope.savedModalOptions);
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
    
    $scope.optionchnages = function (fieldchoose) {
        $scope.default_value = ''
        $scope.chkdefault_value = ''
        $scope.IsVisible = $scope.chkdefault_value;
    }
    $scope.changeusertype = function () {
        $scope.selectedGroup = [];
        $scope.selectedPeople = [];
    }

    $scope.addQuestion = function () {

        $scope.addField($scope.defaultAdd.title, $scope.defaultAdd.field_type.id, $scope.data1.is_required, $scope.data1.default_value, $scope.data1.is_multiple)
        if ($scope.defaultAdd.field_type.id == 3 || $scope.defaultAdd.field_type.id == 4 || $scope.defaultAdd.field_type.id == 5) {
            $scope.addFieldSource($scope.defaultAdd.title, $scope.defaultAdd.id)
            document.getElementById('field').value = '';
        }
        $scope.selectedField = '';
        $scope.existingFields = ''
        $scope.data1.is_required = false;
        $scope.data1.is_multiple = false;
        $scope.data1.default_value = '';
        $scope.selectedFieldType = '';
        $scope.data1.selectedField = '';
        $scope.chkdefault_value = ''
        $scope.IsVisible = $scope.chkdefault_value;
    }

    $scope.addField = function (field, fieldType, is_required, default_value, is_multiple) {

        if ($scope.data1.selectedFieldType == 10) {
            if (!$scope.addformula.length && !$scope.formuladatacopy.length) {
                return $scope.modalOptions.open($scope.addformulaModalOptions);
            } else {
                $scope.addformulafield('end');
            }
        }
        if(field == "" || field == undefined){
           $scope.modalOptions.open($scope.addFieldModalOptions);
        }
        if(fieldType == null || fieldType == "") {
        	$scope.modalOptions.open($scope.addFieldTypeModalOptions);
        }
        if (field && fieldType) {
            //test67 #remember 
        	// if((fieldType == 3 || fieldType == 4 || fieldType == 5) && ($scope.fieldSources[field] == undefined || $scope.fieldSources[field].length == 0)) {
        	// 	$scope.showErrorModalFields();
        	// } else {
        		var r = $scope.fieldTypes.find(function (f) {
	                return f.id == fieldType;
	            });
	
	            $scope.fields.push({
	                title: angular.copy(field),
	                field_type_id: angular.copy(fieldType),
	                field_type: r,
	                formula: r.id == 10 ? $scope.addformula : null,
	                default_value: (default_value ? default_value : null),
	                is_required: (is_required ? 1 : 0),
	                is_multiple: (is_multiple ? 1 : 0)
	            });
        	// }
            
        }
        $scope.selectedField = '';
        $scope.data1.is_required = false;
        $scope.data1.is_multiple = false;
        $scope.data1.default_value = '';
        $scope.selectedFieldType = '';
        $scope.data1.selectedField = '';
        $scope.chkdefault_value = ''
        $scope.IsVisible = $scope.chkdefault_value;
        $scope.data1.selectedFieldType = '';
        $scope.formula = [];
        $scope.Formula = [];
        $scope.formuladatacopy = [];
        $scope.f = [];
        $scope.formuladata1 = [];
        $scope.addformula = [];

        clearFieldType();
    }


    $scope.fieldSources = {};

    $scope.addFieldSource = function (fieldTitle, field) {
		
        if (typeof field == 'number') {
            R.get('question_bank_field_datasource').query({
                question_bank_field_id: field
            }, function (r) {
                r.forEach(element => {
                    field = element.title
                    if (!$scope.fieldSources[fieldTitle]) $scope.fieldSources[fieldTitle] = [];
                    $scope.fieldSources[fieldTitle].push(field);
                });
            })

        } else {
        	$scope.isSame = false;
        	if($scope.fieldSources[fieldTitle] == null) {
        		if (!$scope.fieldSources[fieldTitle]) $scope.fieldSources[fieldTitle] = [];
            	$scope.fieldSources[fieldTitle].push(field);
        	} else {
        		for(i = 0; i < $scope.fieldSources[fieldTitle].length; i++) {
					if($scope.fieldSources[fieldTitle][i] == field) {
						$scope.isSame = true;
						break;
					}
				}
				if(!$scope.isSame) {
					if (!$scope.fieldSources[fieldTitle]) $scope.fieldSources[fieldTitle] = [];
	            	$scope.fieldSources[fieldTitle].push(field);
				} else {
					$scope.showErrorModalDuplicate();
				}
        	}
        	
            
        }
        clearFieldSourceItem();
        $scope.fieldSourceItem = '';
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

    $scope.swapField = function (x, y) {

        var len = $scope.fields.length;
        if (x >= 0 && y >= 0 && x < len && y < len) {
            var t = $scope.fields[x];
            $scope.fields[x] = $scope.fields[y];
            $scope.fields[y] = t;
        }
    }

    $scope.deleteformula = function (index) {

        if (typeof index != "number") {
            $scope.Formula = [];
            $scope.formula = [];
            $scope.f = [];
            $scope.formuladata1 = [];
            $scope.formuladatacopy = [];
            $scope.data1.selectedFieldType = '';
        } else {
            if ($scope.Formula.length != $scope.formuladata1.length) {
                $scope.addformula.splice(index + 1, 1);
                $scope.formuladata1.splice(index + 3);
            }
            $scope.Formula.splice(index, 1);
            $scope.f = [];
        }

        if (!$scope.Formula.length) {
            $scope.data1.selectedField = '';
            clearFieldType();
        }

    }
    $scope.selectedFieldTypeChanged = function () {
        if ($scope.data1.selectedFieldType == 10) {
            var x = $scope.fields.map(f => f.field_type.id)
            if (!x.includes(2)) {
                $scope.modalOptions.open($scope.formulaModalOptions);
                clearFieldType();
                $scope.data1.selectedFieldType = '';
                return;
            }
        }
        //$scope.selectedField = '';
        $scope.data1.is_required = false;
        $scope.data1.is_multiple = false;
        $scope.data1.default_value = '';
        $scope.selectedFieldType = '';
        // $scope.fieldSources = {};
        $scope.chkdefault_value = ''
        $scope.IsVisible = $scope.chkdefault_value;
        // $scope.data1.selectedFieldType = '';
        $scope.formula = [];
        $scope.f = [];
        $scope.formuladata1 = [];
        $scope.formuladatacopy = [];
        $scope.Formula = [];
        $scope.addformula = [];
    }

    $scope.formId = 0;

    $scope.displayVals = function (confirmedradio) {
        
        // Above code commented by Karan

        // Start 12th june - Added by Karan

        if ($scope.data1.selectedFieldType == 4 || $scope.data1.selectedFieldType == 3) {
            $scope.data1.default_value = confirmedradio;
        }
        else {
            var hobbies = $('input:checked').map(function () {
                if (this.value != 'on') {
                    return this.value;
                }
            }).get();
            $scope.data1.default_value = hobbies.join(",");
        }

        // End 12th june
        $scope.fieldSourceItem = '';

    }
    
    $scope.onblur = function (type, fromula, index) {

        if (fromula) {
            if (type == 'question') {
                let data = $scope.formuladata.filter(e => e.index == index && e.question);
                let data1 = $scope.formuladata1.filter(e => e.index == index && e.question);
                if (data.length) {
                    for (let i in $scope.formuladata) {
                        if ($scope.formuladata[i].question && $scope.formuladata[i].index == index) {
                            $scope.formuladata[i].question = fromula;
                        }
                    }
                } else {
                    $scope.formuladata.push({ question: fromula, index: index });
                }

                if (data1.length) {
                    for (let i in $scope.formuladata1) {
                        if ($scope.formuladata1[i].question && $scope.formuladata1[i].index == index) {
                            $scope.formuladata1[i].question = fromula;
                        }
                    }
                } else {
                    $scope.formuladata1.push({ question: fromula, index: index });
                }
            }
            else if (type == 'addvalue') {
                let data1 = $scope.formuladata1.filter(e => e.index == index && e.addvalue);
                let data = $scope.formuladata.filter(e => e.index == index && e.addvalue);

                if (data1.length) {
                    for (let i in $scope.formuladata1) {
                        if ($scope.formuladata1[i].addvalue && $scope.formuladata1[i].index == index) {
                            $scope.formuladata1[i].addvalue = fromula;
                        }
                    }
                } else {
                    $scope.formuladata1.push({ addvalue: fromula, index: index })
                }
                if (data.length) {
                    for (let i in $scope.formuladata) {
                        if ($scope.formuladata[i].addvalue && $scope.formuladata[i].index == index) {
                            $scope.formuladata[i].addvalue = fromula;
                        }
                    }
                } else {
                    $scope.formuladata.push({ addvalue: fromula, index: index })
                }

            }
            else if (type == 'formulasing') {
                let data1 = $scope.formuladata1.filter(e => e.index == index && e.formulasing);
                let data = $scope.formuladata.filter(e => e.index == index && e.formulasing);

                if (data1.length) {
                    for (let i in $scope.formuladata1) {
                        if ($scope.formuladata1[i].formulasing && $scope.formuladata1[i].index == index) {
                            $scope.formuladata1[i].formulasing = fromula;
                        }
                    }
                } else {
                    $scope.formuladata1.push({ formulasing: fromula, index: index })
                }
                if (data.length) {
                    for (let i in $scope.formuladata) {
                        if ($scope.formuladata[i].formulasing && $scope.formuladata[i].index == index) {
                            $scope.formuladata[i].formulasing = fromula;
                        }
                    }
                } else {
                    $scope.formuladata.push({ formulasing: fromula, index: index })
                }


            }
            else if (type == 'operator') {
                let data1 = $scope.formuladata1.filter(e => e.index == index && e.operator);
                let data = $scope.formuladata.filter(e => e.index == index && e.operator);

                if (data1.length) {
                    for (let i in $scope.formuladata1) {
                        if ($scope.formuladata1[i].operator && $scope.formuladata1[i].index == index) {
                            $scope.formuladata1[i].operator = fromula;
                        }
                    }
                } else {
                    $scope.formuladata1.push({ operator: fromula, index: index })
                }

                if (data.length) {
                    for (let i in $scope.formuladata) {
                        if ($scope.formuladata[i].operator && $scope.formuladata[i].index == index) {
                            $scope.formuladata[i].operator = fromula;
                        }
                    }
                } else {
                    $scope.formuladata.push({ operator: fromula, index: index })
                }
            }
            else if (type == 'question1') {
                let data1 = $scope.formuladata1.filter(e => e.index == index && e.question1);
                let data = $scope.formuladata.filter(e => e.index == index && e.question1);

                if (data1.length) {
                    for (let i in $scope.formuladata1) {
                        if ($scope.formuladata1[i].question1 && $scope.formuladata1[i].index == index) {
                            $scope.formuladata1[i].question1 = fromula;
                        }
                    }
                } else {
                    $scope.formuladata1.push({ question1: fromula, index: index })
                }

                if (data.length) {
                    for (let i in $scope.formuladata) {
                        if ($scope.formuladata[i].question1 && $scope.formuladata[i].index == index) {
                            $scope.formuladata[i].question1 = fromula;
                        }
                    }
                } else {
                    $scope.formuladata.push({ question1: fromula, index: index })
                }

            }
            else if (type == 'type') {
                let data1 = $scope.formuladata1.filter(e => e.index == index && e.type);
                let data = $scope.formuladata.filter(e => e.index == index && e.type);

                if (data1.length) {
                    for (let i in $scope.formuladata1) {
                        if ($scope.formuladata1[i].type && $scope.formuladata1[i].index == index) {
                            $scope.formuladata1[i].type = fromula;
                        }
                    }
                } else {
                    $scope.formuladata1.push({ type: fromula, index: index })
                }
                if (data.length) {
                    for (let i in $scope.formuladata) {
                        if ($scope.formuladata[i].type && $scope.formuladata[i].index == index) {
                            $scope.formuladata[i].type = fromula;
                        }
                    }
                } else {
                    $scope.formuladata.push({ type: fromula, index: index })
                }

            }

        }
        if (fromula) {
            if (type == 'formula.question') {
                let q1 = $scope.formuladatacopy.findIndex(x => x.question);
                if (q1 != -1) {
                    $scope.formuladatacopy.splice(q1, 1);
                    $scope.formuladatacopy.splice(q1, 0, { question: fromula });
                } else {
                    $scope.formuladatacopy.push({ question: fromula })
                }
            } else if (type == 'formula.addvalue') {
                let q1 = $scope.formuladatacopy.findIndex(x => x.addvalue);
                if (q1 != -1) {
                    $scope.formuladatacopy.splice(q1, 1);
                    $scope.formuladatacopy.splice(q1, 0, { addvalue: fromula });
                } else {
                    $scope.formuladatacopy.push({ addvalue: fromula })
                }
            } else if (type == 'formula.formulasing') {
                let q1 = $scope.formuladatacopy.findIndex(x => x.formulasing);
                if (q1 != -1) {
                    $scope.formuladatacopy.splice(q1, 1);
                    $scope.formuladatacopy.splice(q1, 0, { formulasing: fromula });
                } else {
                    $scope.formuladatacopy.push({ formulasing: fromula })
                }
            } else if (type == 'formula.question1') {
                let q1 = $scope.formuladatacopy.findIndex(x => x.question1);
                if (q1 != -1) {
                    $scope.formuladatacopy.splice(q1, 1);
                    $scope.formuladatacopy.splice(q1, 0, { question1: fromula });
                } else {
                    $scope.formuladatacopy.push({ question1: fromula })
                }
            } else if (type == 'formula.value"') {
                $scope.formuladatacopy.push({ type: fromula })
            }
        }


    }

    $scope.addformulafield = function (formuls) {

        if ($scope.formuladata.length) {
            let q = $scope.formuladata.findIndex(x => x.question);
            let f = $scope.formuladata.findIndex(x => x.formulasing);
            let a = $scope.formuladata.findIndex(x => x.addvalue ? x.addvalue : x.question1);
            let o = $scope.formuladata.findIndex(x => x.operator);
            let t = $scope.formuladata.findIndex(x => x.type);
            $scope.addformula.push({
                question: $scope.formuladata[q] ? $scope.formuladata[q].question : '',
                formulasing: $scope.formuladata[f] ? $scope.formuladata[f].formulasing : '',
                addvalue: $scope.formuladata[a] ? $scope.formuladata[a].addvalue ? $scope.formuladata[a].addvalue || '' : $scope.formuladata[a].question1 || '' : '',
                operator: $scope.formuladata[o] ? $scope.formuladata[o].operator : '',
                type: $scope.formuladata[t] ? $scope.formuladata[t].type == 'Value' ? 1 : 0 : 0
            });
            $scope.formuladata = [];
        } else if ($scope.formula) {
            $scope.addformula.push({
                question: $scope.formula.question || '',
                addvalue: $scope.formula.addvalue ? $scope.formula.addvalue || '' : $scope.formula.question1 || '',
                formulasing: $scope.formula.formulasing ? $scope.formula.formulasing : '',
                type: $scope.formula.value == 'Value' ? 1 : 0
            });
        }

        if (formuls != 'end') {
            $scope.Formula.push(formuls);
        }
    }
    $scope.saveForm = function () {

        $scope.isDisabled = true;
        var Form = R.get('forms');
        var form = new Form();
        var p = [];
        var groupids = [];
        form.title = $scope.data.title;
        form.numberofColumn = $scope.data.numberofColumn;
        form.autoIncrement = $scope.data.autoIncrement;
        form.masterEnableUpadte = $scope.data.masterEnableUpadte;
        if($scope.data.masterEnableList){
            form.masterEnableList = $scope.data.masterEnableList.join(",")
        }
        form.sendEmailAlert =$scope.data.sendEmailAlert;
        form.reasonForUpdate =$scope.data.reasonForUpdate;
        form.categoryId = $scope.data.categoryId;
        form.is_group = $scope.usertype == "User" ? 0 : 1;
        if ($scope.usertype == "User") {
            for (var people in $scope.selectedPeople) {
                //     p.push($scope.selectedPeople[people].id);
                // }
                if ($scope.selectedPeople[people][0]) {
                    p.push($scope.selectedPeople[people][0].id);
                } else {
                    p.push($scope.selectedPeople[people].id);
                }
            }
        } else {
            for (var group in $scope.selectedGroup) {

                if ($scope.selectedGroup[group]) {
                    p.push($scope.selectedGroup[group].userId);
                    groupids.push($scope.selectedGroup[group].id);
                }

            }
        }
        form.GroupId = groupids.join();
        form.UserId = p.join();
        var Field = R.get('fields');
        var FormField = R.get('form_fields');
        var Formformula = R.get('form_formulas');
        var FieldSourceItem = R.get('form_field_datasource');

        var FormDefaultFields = R.get('form_default_fields');
        var form_default_fields = [];

        var fieldSavePromises = [];
        var savedFields = [];
        var form_fields = [];
        var form_field_ds = [];
        var requiredFields = {};


        for (var i in $scope.fields) {
            var field = new Field();
            field.title = $scope.fields[i].title;
            field.field_type_id = $scope.fields[i].field_type_id;
            requiredFields[$scope.fields[i].title] = {
                required: $scope.fields[i].is_required,
                is_multiple: $scope.fields[i].is_multiple,
                is_formula: $scope.fields[i].formula ? 1 : 0,
                seq: i,
                default_value: $scope.fields[i].default_value
            };
            fieldSavePromises.push(field.$save());
        }


        $q.all(fieldSavePromises).then(function (r) {
            savedFields = r;
            form.$save().then(function (r) {

                $scope.formId = r.id;

                for (var i in $scope.MasterFormFieldSource) {
                    var formMasterFields = new FormDefaultFields();
                    formMasterFields.form_id = $scope.formId;
                    formMasterFields.default_field_id = $scope.MasterFormFieldSource[i][0].id
                    formMasterFields.master_id = $scope.MasterFormFieldSource[i][0].master.id
                    form_default_fields.push(formMasterFields.$save());
                }

                for (var i in savedFields) {
                    var f = new FormField();
                    f.form_id = r.id;
                    f.field_id = savedFields[i].id;
                    f.default_value = requiredFields[savedFields[i].title].default_value;
                    f.is_required = requiredFields[savedFields[i].title].required;
                    f.is_formula = requiredFields[savedFields[i].title].is_formula;
                    f.is_multiple = requiredFields[savedFields[i].title].is_multiple;
                    f.seq = requiredFields[savedFields[i].title].seq;
                    form_fields.push(f.$save());
                }

                $q.all(form_fields).then(function (formfield) {
                    for (let formu in $scope.fields) {
                        if ($scope.fields[formu].formula) {

                            for (let x in $scope.fields[formu].formula) {
                                let formula = new Formformula();
                                formula.form_id = r.id;
                                // var formulafield = formfield.filter(e => e.is_formula);
                                let formulafield = formfield.findIndex(x => x.field.title == $scope.fields[formu].title);
                                formula.form_field_id = formfield[formulafield].id;
                                formula.question = $scope.fields[formu].formula[x].question;
                                formula.type = $scope.fields[formu].formula[x].type;
                                formula.value = $scope.fields[formu].formula[x].addvalue;
                                formula.operator = $scope.fields[formu].formula[x].operator;
                                formula.formulasing = $scope.fields[formu].formula[x].formulasing;
                                formula.$save();
                            }

                        }
                    }



                    R.get('form_fields').query({
                        form_id: $scope.formId
                    }, function (r) {
                        for (var i in r) {



                            if (r[i] && r[i].field) {
                                var val = $scope.fieldSources[r[i].field.title];

                                if (val) {
                                    for (var j in val) {
                                        var fs = new FieldSourceItem();
                                        fs.form_id = $scope.formId;
                                        fs.form_field_id = r[i].id;
                                        fs.title = val[j];
                                        form_field_ds.push(fs.$save());
                                    }
                                }
                            }
                        }

                        $q.all(form_field_ds).then(function (r) {
                            $scope.showFormSavedModal();
                        })
                    }, function (e) {
                        console.log(e);
                        $scope.launchErrorModal();

                    });
                },
                    function (e) {
                        $scope.launchErrorModal();
                    });
            }, function (e) {
                console.log(e);
            });

        });
        $scope.selectedFieldType = '';
    }
});
app.controller('formControllerBase', ControllerFactory('fields'));

app.controller('formsEditController', function ($scope, $routeParams, R, $controller, S, $rootScope, $q, $timeout, $location) {

    $controller('formsControllerBase', {
        $scope: $scope
    });
    $scope.remaningfields = []
    $scope.disabled = false;
    $scope.mode = 'edit';
    $scope.Columns = [{
        id: 'col s6',
        title: 'Double Column'
    }, {
        id: 'col s12',
        title: 'Single Column'
    }]
    $scope.selectedPerson = "";
    $scope.selectedPeople = [];
    $scope.selectedField = [];
    $scope.allPeople = [];
    $scope.fields = [];
    $scope.questiontype;
    $scope.userid = [];
    $scope.groupid = [];
    $scope.existingFields;
    $scope.deletefield;
    $scope.defaultEdit = {};
    $scope.existingFormfields = [];
    $scope.data = {};
    $scope.peopleremain = {};
    $scope.peopleimg = [];
    $scope.IsVisible = false;
    $scope.f = [];
    $scope.formuladata = [];
    $scope.formuladata1 = [];
    $scope.formuladatacopy = [];
    $scope.Questions = [];
    $scope.Questions = [];
    $scope.formulas = ['+', '-', '/', '*']
    $scope.formula = {};
    $scope.addformula = [];
    $scope.addformulacopy = [];
    $scope.Formula = [];
    $scope.formuladata1 = [];
    $scope.selectedGroup = [];
    $scope.usertype;
    $scope.userType = ['User', 'User Group'];
    $scope.tmparray=[] //for prvent duplicat master title 
    $scope.groupImg = [];
    $scope.groupData = [];
    $scope.active = true;
    $scope.active1 = true;
    $scope.ShowHide = function () {
        //If DIV is visible it will be hidden and vice versa.
        $scope.IsVisible = $scope.chkdefault_value;
    }
    $scope.default_value = "";
    $scope.editdata = []
    var fieldSavePromises = [];
    $scope.fieldchoose;
    $scope.choose = ['Choose Questions from Question Bank', 'Create Question'];
    $scope.id = $routeParams.id;
    $scope.query({}, function (r) { });

    $scope.categories = [];
    $scope.masters = [];
    $scope.default_fields = [];
    $scope.form_default_fields = [];

    $scope.MasterFormFieldSource = []
    $scope.MasterExistingFormField = []
    $scope.masterSeleted = []

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

    $scope.modalOptions = {};

    $scope.deleteObject = function (obj) {

        $scope.delete(obj, function (r) {
            if (r.status && r.status == 405) {
                $scope.modalOptions.open($scope.errorModalOptions);
            }
            $scope.query();
        });
    };


    $scope.load = function () {

        R.get('forms/' + $scope.id).get(function (res) {

            $scope.data = res;
            $scope.data.categoryId = res.categoryId.id;
            $scope.data.numberofColumn = res.numberofColumn;
            $scope.data.autoIncrement = res.autoIncrement;
            $scope.data.masterEnableUpadte = res.masterEnableUpadte;
            if(res.masterEnableList && res.masterEnableList.includes(',')){
                $scope.data.masterEnableList =res.masterEnableList.split(",")
            }else if(res.masterEnableList &&  !res.masterEnableList.includes(',')){
                $scope.data.masterEnableList =new Array(res.masterEnableList);
            }

            $scope.usertype = res.is_group ? "User Group" : "User";
            if (res.UserId) {
                $scope.userid = res.UserId.split(',');
            }
            if (res.GroupId) {
                $scope.groupid = res.GroupId.split(',');
            }
        }, function (e) {
            console.log(e);
        });

        R.get('users').query({}, function (records) {
            for (let x in $scope.userid) {
                if (x == '$promise') {
                    break;
                }
                // $timeout(function () {
                $scope.selectedPeople.push(records.filter(function (obj) { return obj.id == $scope.userid[x] }));
                // }, 100);
            }
        });

        R.get('user_groups').query({ status: 1 }, function (res) {

            for (let x in $scope.groupid) {
                if (x == '$promise') {
                    break;
                }
                $scope.selectedGroup.push(res.filter(function (obj) { return obj.id == $scope.groupid[x] }));
            }
        });


        R.get('category').query({ is_active: 1 }, function (categories) {
            $scope.categories = categories;
        });

        R.get('form_default_fields').query({ form_id: $scope.id }, function (r) {
            $scope.form_default_fields = r;

            $scope.MasterExistingFormField = r;

            for (i = 0; i < r.length; i++) {
                $scope.masterSeleted.push(r[i].master)
            }

        }, function (e) { });


        R.get('master').query({}, function (r) {
            $scope.masters = r;
        }, function (e) { });

        $scope.selectedParentMasterChanged = function (m_id) {

            $scope.isMasterClicked = true
            //console.log(m_id)

            R.get('default_fields').query({ master_id: m_id }, function (r) {
                //console.log(r);
                for (let i = 0; i < r.length; i++) {
                    for (j = 0; j < r.length; j++) {
                        if (r[i].id == r[j].title) {
                            r[j].title = r[i].title
                        }
                    }
                }
                $scope.default_fields = r;
            }, function (e) { });
           $scope.data.default_field_id=[];
        }

        var fieldSourceItem = [];

        $scope.addMasterFieldSource = function (fieldTitle, fieldSourceItem) {

            $scope.isCollectionMasterDisabled = true

            var op;
            if ($scope.MasterExistingFormField != undefined) {
                for (let i in $scope.MasterExistingFormField) {
                    if (i == '$promise') {
                        break;
                    }
                    op = $scope.MasterExistingFormField[i].default_field.id

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

            if ($scope.MasterFormFieldSource != undefined) {
                for (let i in $scope.MasterFormFieldSource) {
                    op = $scope.MasterFormFieldSource[i][0].id

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

            for (i = 0; i < fieldSourceItem.length; i++) {
                $scope.MasterFormFieldSource.push($scope.default_fields.filter(e => e.master.id == fieldTitle && e.id == fieldSourceItem[i]));

                // if ($scope.default_fields.filter(e => e.master.id == fieldTitle && e.id == fieldSourceItem[i])) {
                //     $scope.masterSeleted.push($scope.default_fields[i].master)
                // }
                if ($scope.default_fields.filter(e => e.master.id == fieldTitle && e.id == fieldSourceItem[i])) {
                    let title=$scope.default_fields[i].master.title
                      if(!$scope.tmparray.includes(title)){
                         $scope.tmparray.push($scope.default_fields[i].master.title)
                          $scope.masterSeleted.push($scope.default_fields[i].master)
                     }
                     
                  }
            }

            $scope.data.default_field_id = ''
        }

        $scope.existingMastreFieldsOptions = {
            header: 'This Master Field is already used',
            text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
            showOk: true,
            okText: 'Ok',
            showCancel: false
        }

        $scope.masterExisingFieldDelete = function (id) {
            
            $scope.deletefield = id.id
            R.get('form_default_fields/' + id.id).get(function (r) {
                $scope.deleteCandidate = r;
                $scope.modalOptions.open($scope.deleteMastreFieldsOptions);
            })

            $scope.masterSeleted.splice(id.master,1)
           
        }

        $scope.checkNewEntryGroup = function (name) {
            R.get('user_groups').query({ status: 1 }, function (results) {
                // let data = {};
                //let x = {};
                if(name == '') {
                    return;
                }
                if($scope.countSelectedGroup != $scope.prevCountGroup) {
                    $scope.prevCountGroup++;
                    return;
                }
                for (let i = 0; i < results.length; i++) {
                    if((name == results[i].title)) {
                        
                    } else {
                        $scope.showErrorModalNewEntry();
                        $scope.group = '';	
                    }
                }
    
                
    
            });
         };	

        $scope.deleteMastreFieldsOptions = {
            header: 'Are you sure you want to delete this Master Field?',
            text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
            showOk: true,
            okText: 'Yes, Please!',
            onOkClick: function () {
                
                var i = $scope.MasterExistingFormField.indexOf($scope.deletefield);
                $scope.MasterExistingFormField.splice(i, 1);
                $scope.deleteObject($scope.deleteCandidate);
            },
            showCancel: true,
            cancelText: 'No!',
            onCancelClick: function () {
                $scope.cancelDelete();
            }
        }

        $scope.masterDelete = function (id) {
            for (i = 0; i <= $scope.MasterFormFieldSource.length; i++) {
                return $scope.MasterFormFieldSource.splice(i, 1);
            }
            $scope.data.default_field_id = []
            $scope.data.master_id = []

        }

        R.get('form_fields').query({
            form_id: $scope.id
        }, function (data) {
            var f = [];
            var formulafield = data.filter(e => e.is_formula);
            for (let a in formulafield) {
                f.push(formulafield[a].id);
            }
            R.get('form_formulas').query({}, function (d) {

                for (let x in data) {
                    if (x == '$promise') {
                        break;
                    }
                    if (d == '$promise') {
                        break;
                    }
                    var d1 = d.filter(function (formula) {
                        if (formula && formula.form_field && formula.form_field.field)
                            return formula.form_field.field.id == data[x].field.id
                        else
                            return null;
                    });

                    $scope.existingFormfields.push({
                        id: data[x].field.id,
                        title: data[x].field.title,
                        formula: f.includes(data[x].id) ? d1 : null,
                        field_type_id: data[x].field.field_type.id,
                        is_required: data[x].is_required,
                        is_multiple: data[x].is_multiple,
                        seq: data[x].seq,
                        fieldtitle: data[x].field.field_type.title,
                        defaultvalue: data[x].default_value

                    });
                }
            }, function (res) {
                if (res.status && res.status == 404) {
                    for (var x in data) {
                        if (x == '$promise') {
                            break;
                        }
                        $scope.existingFormfields.push({
                            id: data[x].field.id,
                            title: data[x].field.title,
                            field_type_id: data[x].field.field_type.id,
                            is_required: data[x].is_required,
                            is_multiple: data[x].is_multiple,
                            seq: data[x].seq,
                            fieldtitle: data[x].field.field_type.title,
                            defaultvalue: data[x].default_value

                        });
                    }
                }
            });

        });

        R.get('question_bank_fields').query({}, function (results) {
            let data = {};
            let x = {};
            for (let i = 0; i < results.length; i++) {
                data[results[i].title] = null;
                x[results[i].title] = results[i]
            }

            $('#field').autocomplete({
                data: data,
                onAutocomplete: function (r) {
                    $scope.defaultEdit = x[r];
                    $scope.questiontype = x[r].field_type.id;

                    if ($scope.selectedField.indexOf(x[r]) >= 0) {

                    } else {
                        $scope.selectedField.push(x[r]);
                        $scope.$apply();
                        delete data[r];

                    }
                }
            });
        });
    };

    $scope.unselectfield = function (v) {

        var f = $scope.selectedField.indexOf(v);
        if (f >= 0) {
            data[$scope.selectedField[f].title] = $scope.selectedField[f];
            $scope.selectedField.splice(f, 1);
        }
    }

    angular.element(document).ready(function () {
        $("#title").focus();
        activate();
    });

    function activate() {
        $('.fixed-action-btn').floatingActionButton({

        });
        R.get('users').query({}, function (results) {

            //for user filter in edit by sahin
            var idsB = $scope.selectedPeople.map(function (x) {
                if (x[0] && x[0].id) {
                    return x[0].id
                } else if (x && x.id) {
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
                    $scope.peopleremain[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = "images/user.png";
                    $scope.peopleimg[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = results[i];
                }
            }
            if ($scope.selectedPeople.length) {
                for (let i in filtered) {
                    $scope.peopleremain[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role + ')'] = "images/user.png";
                    $scope.peopleimg[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role + ')'] = filtered[i];
                }

            }
            //end
            $('#people').autocomplete({
                data: $scope.peopleremain,
                onAutocomplete: function (r) {
                    $scope.selectedPeople.push($scope.peopleimg[r]);
                    $scope.$apply();
                    delete $scope.peopleremain[r];
                    delete $scope.peopleimg[r]
                    document.getElementById('people').value = '';
                }
            });

        });

        R.get('user_groups').query({ status: 1 }, function (results) {


            var idsB = $scope.selectedGroup.map(function (x) {
                if (x[0].id) {
                    return x[0].id
                } else if (x.id) {
                    return x.id;
                }
            }).sort()
            var filteredGroup = results.filter(
                function (e) {
                    return this.indexOf(e.id) < 0;
                },
                idsB
            );
            if (!$scope.selectedGroup.length) {
                for (let i = 0; i < results.length; i++) {
                    $scope.groupImg[results[i].title] = "images/user-group.png";
                    $scope.groupData[results[i].title] = results[i];
                }
            }
            if ($scope.selectedGroup.length) {
                for (let i in filteredGroup) {
                    $scope.groupImg[filteredGroup[i].title] = "images/user-group.png";
                    $scope.groupData[filteredGroup[i].title] = filteredGroup[i];
                }

            }

            $('#group').autocomplete({
                data: $scope.groupImg,
                onAutocomplete: function (r) {
                    $scope.selectedGroup.push($scope.groupData[r]);
                    $scope.$apply();
                    delete $scope.groupImg[r];
                    delete $scope.groupData[r];
                    document.getElementById('group').value = '';
                }
            });

        });

        R.get('field_types').query({}, function (results) {

            $('select').formSelect();

        });
    }

    $scope.addformulaModalOptions = {
        header: 'An error occured ...',
        text: 'Please configur formula',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () { },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }
    $scope.addFieldModalOptions = {
        header: 'An error occured ...',
        text: 'Please Enter Field Name',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () { },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }
    $scope.addFieldTypeModalOptions = {
        header: 'An error occured ...',
        text: 'Please Select Field Type',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () { },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }
    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Forms.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            $location.path('forms');
        },
        showCancel: true,
        cancelText: 'Cancel',
        onCancelClick: function () { }
    }

    $scope.savedModalOptions = {
        header: 'Updated!',
        text: 'Your form has been updated successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function () {
            $location.path('forms');
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function () {
            document.getElementById('title').value = '';
            $scope.selectedPeople = [];
            $scope.selectedField = [];
            $scope.existingFields = '';
            $scope.fields = [];
            $scope.fieldchoose = '';
            $scope.fieldSources = '';
            $scope.fieldSourceItem = '';
            $scope.selectedPerson = "";
            $scope.allPeople = [];
            $scope.data.categoryId = '';
            $scope.existingFormfields = [];
            $scope.defaultAdd = {};
            $scope.IsVisible = false;
            document.getElementById('opt').value = false;
            activate();
        }
    }

    $scope.cancelForm = function () {
        $scope.modalOptions.open($scope.cancelModalOptions);
    }

    $scope.launchErrorModal = function () {
        $scope.modalOptions.open($scope.errorModalOptions);
    }

    $scope.showFormSavedModal = function () {
        $scope.modalOptions.open($scope.savedModalOptions);
    }

    $scope.addQuestion = function () {

        $scope.addField($scope.defaultEdit.title, $scope.defaultEdit.field_type.id, $scope.data1.is_required, $scope.data1.default_value, $scope.data1.is_multiple)
        if ($scope.defaultEdit.field_type.id == 3 || $scope.defaultEdit.field_type.id == 4 || $scope.defaultEdit.field_type.id == 5) {
            $scope.addFieldSource($scope.defaultEdit.title, $scope.defaultEdit.id)
            document.getElementById('field').value = '';
        }
        $scope.selectedField = '';
        $scope.data1.is_required = false;
        $scope.data1.is_multiple = false;
        $scope.data1.default_value = '';
        $scope.selectedFieldType = '';
        $scope.data1.selectedField = '';
        $scope.chkdefault_value = ''
        $scope.IsVisible = $scope.chkdefault_value;
    }

    $scope.addField = function (field, fieldType, is_required, default_value, is_multiple) {
        if ($scope.data1.selectedFieldType == 10) {
            if (!$scope.addformula.length && !$scope.formuladatacopy.length) {
                return $scope.modalOptions.open($scope.addformulaModalOptions);
            } else {
                $scope.addformulafield('end');
            }
        }
        if(field == "" || field == undefined){
            $scope.modalOptions.open($scope.addFieldModalOptions);
        }
        if(fieldType == null || fieldType == "") {
        	$scope.modalOptions.open($scope.addFieldTypeModalOptions);
        }
        
        if (field && fieldType) {
        	if((fieldType == 3 || fieldType == 4 || fieldType == 5) && ($scope.fieldSources[field] == undefined || $scope.fieldSources[field].length == 0)) {
        		$scope.showErrorModalFields();
        	} else {
        		var r = $scope.fieldTypes.find(function (f) {
	                return f.id == fieldType;
	            });
	
	            $scope.fields.push({
	                title: angular.copy(field),
	                field_type_id: angular.copy(fieldType),
	                field_type: r,
	                formula: r.id == 10 ? $scope.addformula : null,
	                default_value: (default_value ? default_value : null),
	                is_required: (is_required ? 1 : 0),
	                is_multiple: (is_multiple ? 1 : 0)
	            });
        	}
            
        }
        $scope.selectedField = '';
        $scope.data1.is_required = false;
        $scope.data1.is_multiple = false;
        $scope.data1.default_value = '';
        $scope.selectedFieldType = '';
        $scope.data1.selectedField = '';
        $scope.chkdefault_value = ''
        $scope.IsVisible = $scope.chkdefault_value;
        $scope.data1.selectedFieldType = '';
        $scope.formula = [];
        $scope.Formula = [];
        $scope.formuladatacopy = [];
        $scope.f = [];
        $scope.formuladata1 = [];
        $scope.addformula = [];

        clearFieldType();
    }

    $scope.fieldSources = {};

    $scope.addFieldSource = function (fieldTitle, fieldSourceItem) {
        
        if (typeof fieldSourceItem == 'number') {
            R.get('question_bank_field_datasource').query({
                question_bank_field_id: fieldSourceItem
            }, function (r) {
                r.forEach(element => {
                    fieldSourceItem = element.title
                    if (!$scope.fieldSources[fieldTitle]){ $scope.fieldSources[fieldTitle] = [];}
                    $scope.fieldSources[fieldTitle].push(fieldSourceItem);
                });
            })

        } else {
        	$scope.isSame = false;
        	if($scope.fieldSources[fieldTitle] == null) {
        		if (!$scope.fieldSources[fieldTitle]) $scope.fieldSources[fieldTitle] = [];
            	$scope.fieldSources[fieldTitle].push(fieldSourceItem);
        	} else {
        		for(i = 0; i < $scope.fieldSources[fieldTitle].length; i++) {
					if($scope.fieldSources[fieldTitle][i] == fieldSourceItem) {
						$scope.isSame = true;
						break;
					}
				}
				if(!$scope.isSame) {
					if (!$scope.fieldSources[fieldTitle]) $scope.fieldSources[fieldTitle] = [];
	            	$scope.fieldSources[fieldTitle].push(fieldSourceItem);
				} else {
					$scope.showErrorModalDuplicate();
				}
        	}
        	
            
        }
        clearFieldSourceItem();
        $scope.fieldSourceItem = '';
    }
    $scope.formulaModalOptions = {
        header: 'To configure formula please add at least one Number type of question.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            // $location.path('forms');
        },
        showCancel: true,
        cancelText: 'Cancel',
        onCancelClick: function () { }
    }

    $scope.deleteModalOptions = {

        header: 'Are you sure you want to delete this form?',
        text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
        showOk: true,
        okText: 'Yes, Please!',
        onOkClick: function () {
            var i = $scope.existingFormfields.indexOf($scope.deletefield);
            if (i >= 0) {
                $scope.existingFormfields.splice(i, 1);
            }
            $scope.deleteObject($scope.deleteCandidate);
            // $scope.data.list.length = " ";
        },
        showCancel: true,
        cancelText: 'No!',
        onCancelClick: function () {
            $scope.cancelDelete();
        }
    }

    $scope.swapField = function (x, y, item) {

        var len, lenexist;
        len = $scope.fields.length;
        lenexist = $scope.existingFormfields.length;

        if (x >= 0 && y >= 0 && x < len && y < len && $scope.fields.length && item == 'fields') {
            var t;
            len = $scope.fields.length;
            t = $scope.fields[x];
            $scope.fields[x] = $scope.fields[y];
            $scope.fields[y] = t;
        }
        if ($scope.existingFormfields.length && x >= 0 && y >= 0 && x < lenexist && y < lenexist && item == 'existingFormfields') {
            t = $scope.existingFormfields[x];
            $scope.existingFormfields[x] = $scope.existingFormfields[y];
            $scope.existingFormfields[y] = t;
        }

    }

    $scope.selectedFieldTypeChanged = function () {
    
        if ($scope.data1.selectedFieldType == 10) {
            var x = $scope.fields.map(f => f.field_type.id)
            var y = $scope.existingFormfields.map(m => m.field_type_id)
            if (!$scope.existingFormfields.length == 0 || !$scope.fields.length == 0) {
                if (y.includes(2)) {
                    return;
                }
                else if (x.includes(2)) {
                    return
                }
                else {
                    $scope.modalOptions.open($scope.formulaModalOptions);
                    clearFieldType();
                    $scope.data1.selectedFieldType = '';
                    return;
                }
            }

        }
        $scope.data1.is_required = false;
        $scope.data1.is_multiple = false;
        $scope.data1.default_value = '';
        $scope.selectedFieldType = '';
        $scope.chkdefault_value = '';
        // $scope.fieldSources = {};
        $scope.IsVisible = $scope.chkdefault_value;
        $scope.formula = [];
        $scope.Formula = [];
        $scope.f = [];
        $scope.addformula = [];
    }

    $scope.displayVals = function (confirmedradio) {

        // Above code commented by Karan

        // Start 12th june - Added by Karan
        if ($scope.data1.selectedFieldType == 4 || $scope.data1.selectedFieldType == 3) {
            $scope.data1.default_value = confirmedradio;
        }
        else {
            var hobbies = $('input:checked').map(function () {
                if (this.value != 'on' && this.value !='1') {
                    return this.value;
                }
            }).get();
            $scope.data1.default_value = hobbies.join(",");
        }
        
        // End 12th june
    }

    $scope.changeusertype = function () {
        $scope.selectedGroup = [];
        $scope.selectedPeople = [];
        activate();

    }
    $scope.unselectPerson = function (p) {
        var i = $scope.selectedPeople.indexOf(p);
        if (i >= 0) {
            $scope.selectedPeople.splice(i, 0);
            delete $scope.selectedPeople[i]
        }
        if (p[0]) {
            $scope.peopleremain[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = "images/user.png";
            $scope.peopleimg[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = p[0];
        } else if (p.first_name) {
            $scope.peopleremain[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = "images/user.png";
            $scope.peopleimg[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = p;

        }
    }

    $scope.unselectGroup = function (p) {

        var i = $scope.selectedGroup.indexOf(p);
        if (i >= 0) {

            $scope.selectedGroup.splice(i, 0);
            delete $scope.selectedGroup[i];

        }
        if (p[0]) {
            $scope.groupImg[p[0].title] = "images/user-group.png";
            $scope.groupData[p[0].title] = p[0];
        } else if (p.title) {
            $scope.groupImg[p.title] = "images/user-group.png";
            $scope.groupData[p.title] = p;
        }
    }
    $scope.editFormula = function (f) {
        $scope.editmode = false;
        $scope.fieldchoose = 'Create Question';
        $scope.data1.selectedFieldType = 10;
        delete f[0].form;
        delete f[0].form_field;
        delete f[0].id;
        delete f.value

        $scope.formula.question = f[0].question
        $scope.formula.formulasing = f[0].formulasing
        $scope.formula.value = f[0].type == 1 ? 'Value' : 'Question'
        $scope.formula.question1 = f[0].type != 1 ? f[0].value : null;
        $scope.formula.addvalue = Number(f[0].value)

    }

    $scope.deleteformula = function (index) {

        if (typeof index != "number") {
            $scope.Formula = [];
            $scope.formula = [];
            $scope.f = [];
            $scope.formuladata1 = [];
            $scope.formuladatacopy = [];
            $scope.data1.selectedFieldType = '';
        } else {
            if ($scope.Formula.length != $scope.addformula.length) {
                $scope.addformula.splice(index + 1, 1);
                $scope.formuladata1.splice(index + 1, 1);
            }
            $scope.Formula.splice(index, 1);
            $scope.f = [];
        }

        if (!$scope.Formula.length) {
            $scope.data1.selectedField = '';
            clearFieldType();
        }

    }
    $scope.onblur = function (type, fromula) {

        if (fromula) {
            if (type == 'question') {
                let q1 = $scope.formuladata.findIndex(x => x.question);
                if (q1 != -1) {
                    $scope.formuladata.splice(q1, 1);
                    $scope.formuladata1.splice(q1, 1);
                    $scope.formuladata.splice(q1, 0, { question: fromula });
                    $scope.formuladata1.splice(q1, 0, { question: fromula });
                } else {
                    $scope.formuladata.push({ question: fromula });
                    $scope.formuladata1.push({ question: fromula })
                }
            } else if (type == 'addvalue') {
                let q1 = $scope.formuladata.findIndex(x => x.addvalue);
                if (q1 != -1) {
                    $scope.formuladata.splice(q1, 1);
                    $scope.formuladata1.splice(q1, 1);
                }
                $scope.formuladata.push({ addvalue: fromula })
                $scope.formuladata1.push({ addvalue: fromula })

            } else if (type == 'formulasing') {
                let q1 = $scope.formuladata.findIndex(x => x.formulasing);
                if (q1 != -1) {
                    $scope.formuladata.splice(q1, 1);
                    $scope.formuladata1.splice(q1, 1);
                    $scope.formuladata.splice(q1, 0, { formulasing: fromula });
                    $scope.formuladata1.splice(q1, 0, { formulasing: fromula });
                } else {
                    $scope.formuladata.push({ formulasing: fromula })
                    $scope.formuladata1.push({ formulasing: fromula })
                }


            } else if (type == 'operator') {
                let q1 = $scope.formuladata.findIndex(x => x.operator);
                if (q1 != -1) {
                    $scope.formuladata.splice(q1, 1);
                    $scope.formuladata1.splice(q1, 1);
                    $scope.formuladata.splice(q1, 0, { operator: fromula });
                    $scope.formuladata1.splice(q1, 0, { operator: fromula });
                } else {
                    $scope.formuladata.push({ operator: fromula })
                    $scope.formuladata1.push({ operator: fromula })
                }

            } else if (type == 'question1') {
                let q1 = $scope.formuladata.findIndex(x => x.question1);
                if (q1 != -1) {
                    $scope.formuladata.splice(q1, 1);
                    $scope.formuladata1.splice(q1, 1);
                    $scope.formuladata.splice(q1, 0, { question1: fromula });
                    $scope.formuladata1.splice(q1, 0, { question1: fromula });
                } else {
                    $scope.formuladata.push({ question1: fromula })
                    $scope.formuladata1.push({ question1: fromula })
                }

            } else if (type == 'type') {
                $scope.formuladata.push({ type: fromula })
                $scope.formuladata1.push({ type: fromula })
            }
            if ($scope.formula) {
                if (type == 'formula.question') {
                    let q1 = $scope.formuladatacopy.findIndex(x => x.question);
                    if (q1 != -1) {
                        $scope.formuladatacopy.splice(q1, 1);
                        $scope.formuladatacopy.splice(q1, 0, { question: fromula });
                    } else {
                        $scope.formuladatacopy.push({ question: fromula })
                    }
                } else if (type == 'formula.addvalue') {
                    let q1 = $scope.formuladatacopy.findIndex(x => x.addvalue);
                    if (q1 != -1) {
                        $scope.formuladatacopy.splice(q1, 1);
                        $scope.formuladatacopy.splice(q1, 0, { addvalue: fromula });
                    } else {
                        $scope.formuladatacopy.push({ addvalue: fromula })
                    }
                } else if (type == 'formula.formulasing') {
                    let q1 = $scope.formuladatacopy.findIndex(x => x.formulasing);
                    if (q1 != -1) {
                        $scope.formuladatacopy.splice(q1, 1);
                        $scope.formuladatacopy.splice(q1, 0, { formulasing: fromula });
                    } else {
                        $scope.formuladatacopy.push({ formulasing: fromula })
                    }
                } else if (type == 'formula.question1') {
                    let q1 = $scope.formuladatacopy.findIndex(x => x.question1);
                    if (q1 != -1) {
                        $scope.formuladatacopy.splice(q1, 1);
                        $scope.formuladatacopy.splice(q1, 0, { question1: fromula });
                    } else {
                        $scope.formuladatacopy.push({ question1: fromula })
                    }
                } else if (type == 'formula.value"') {
                    $scope.formuladatacopy.push({ type: fromula })
                }
            }
        }
    }

    $scope.addformulafield = function (formuls) {

        if ($scope.formuladata.length) {
            let q = $scope.formuladata.findIndex(x => x.question);
            let f = $scope.formuladata.findIndex(x => x.formulasing);
            let a = $scope.formuladata.findIndex(x => x.addvalue ? x.addvalue : x.question1);
            let o = $scope.formuladata.findIndex(x => x.operator);
            let t = $scope.formuladata.findIndex(x => x.type);
            $scope.addformula.push({
                question: $scope.formuladata[q] ? $scope.formuladata[q].question : '',
                formulasing: $scope.formuladata[f] ? $scope.formuladata[f].formulasing : '',
                addvalue: $scope.formuladata[a] ? $scope.formuladata[a].addvalue ? $scope.formuladata[a].addvalue || '' : $scope.formuladata[a].question1 || '' : '',
                operator: $scope.formuladata[o] ? $scope.formuladata[o].operator : '',
                type: $scope.formuladata[t] ? $scope.formuladata[t].type == 'Value' ? 1 : 0 : 0
            });
            $scope.formuladata = [];
        } else if ($scope.formula) {
            $scope.addformula.push({
                question: $scope.formula.question || '',
                addvalue: $scope.formula.addvalue ? $scope.formula.addvalue || '' : $scope.formula.question1 || '',
                formulasing: $scope.formula.formulasing ? $scope.formula.formulasing : '',
                type: $scope.formula.value == 'Value' ? 1 : 0
            });
        }

        if (formuls != 'end') {
            $scope.Formula.push(formuls);
        }
    }
    $scope.save = function () {

        var Form = R.get('forms');

        var Field = R.get('fields');
        var FormField = R.get('form_fields');
        var FieldSourceItem = R.get('form_field_datasource');
        var Formformula = R.get('form_formulas');
        var fieldSavePromises = [];
        var savedFields = [];
        var form_fields = [];
        var form_field_ds = [];
        var requiredFields = {};

        var FormDefaultFields = R.get('form_default_fields');
        var form_default_fields = [];
       

        var formdata = R.get('forms/').query({}, function (data) {

            var p = [];
            var groupids = [];
            delete $scope.existingFormfields;


            if ($scope.usertype == "User") {
                for (var people in $scope.selectedPeople) {
                    if ($scope.selectedPeople[people][0]) {
                        p.push($scope.selectedPeople[people][0].id);
                    } else {
                        p.push($scope.selectedPeople[people].id);
                    }
                }
            } else {
                for (var group in $scope.selectedGroup) {

                    if ($scope.selectedGroup[group][0]) {
                        p.push($scope.selectedGroup[group][0].userId);
                        groupids.push($scope.selectedGroup[group][0].id);
                    }
                    else {
                        p.push($scope.selectedGroup[group].userId);
                        groupids.push($scope.selectedGroup[group].id);
                    }


                }
            }
            
            $scope.data.is_group = $scope.usertype == "User" ? 0 : 1;
            $scope.data.UserId = p.join(',');
            $scope.data.GroupId = groupids.join(',');
            delete $scope.data.list;
            $scope.data.default_field_id=$scope.data.default_field;
            if($scope.data.master && $scope.data.master.id){
                $scope.data.master_id=$scope.data.master.id;
            }
            if($scope.data.masterEnableList){
                $scope.data.masterEnableList = $scope.data.masterEnableList.join(",")
            }
            delete $scope.data.default_field;
            delete $scope.data.master;
            formdata = $scope.data;
            formdata.$save();
        }, function (e) {
            console.log(e);
        });

        for (var i in $scope.fields) {
            var field = new Field();
            field.title = $scope.fields[i].title;
            field.field_type_id = $scope.fields[i].field_type_id;
            requiredFields[$scope.fields[i].title] = {
                required: $scope.fields[i].is_required,
                default_value: $scope.fields[i].default_value,
                is_multiple: $scope.fields[i].is_multiple,
                is_formula: $scope.fields[i].formula ? 1 : 0,
                seq: i
            };
            fieldSavePromises.push(field.$save());
        }
        $q.all(fieldSavePromises).then(function (r) {
            savedFields = r;

            $scope.formId = $scope.id;


            for (var i in $scope.MasterFormFieldSource) {
                var formMasterFields = new FormDefaultFields();
                formMasterFields.form_id = $scope.formId;
                formMasterFields.default_field_id = $scope.MasterFormFieldSource[i][0].id
                formMasterFields.master_id = $scope.MasterFormFieldSource[i][0].master.id
                form_default_fields.push(formMasterFields.$save());
            }

            for (var i in savedFields) {
                var f = new FormField();
                f.form_id = Number($scope.id);
                f.field_id = savedFields[i].id;
                f.default_value = requiredFields[savedFields[i].title].default_value;
                f.is_required = requiredFields[savedFields[i].title].required;
                f.is_formula = requiredFields[savedFields[i].title].is_formula;
                f.is_multiple = requiredFields[savedFields[i].title].is_multiple;
                f.seq = Number(requiredFields[savedFields[i].title].seq);
                form_fields.push(f.$save());
            }

            $q.all(form_fields).then(function (r) {

                for (let formu in $scope.fields) {
                    if ($scope.fields[formu].formula) {

                        for (let x in $scope.fields[formu].formula) {
                            let formula = new Formformula();
                            formula.form_id = $scope.id;
                            let formulafield = r.filter(e => e.is_formula);
                            formula.form_field_id = formulafield[0].id;
                            formula.question = $scope.fields[formu].formula[x].question
                            formula.type = $scope.fields[formu].formula[x].type
                            formula.value = $scope.fields[formu].formula[x].addvalue
                            formula.operator = $scope.fields[formu].formula[x].operator
                            formula.formulasing = $scope.fields[formu].formula[x].formulasing
                            formula.$save();
                        }

                    }
                }
                R.get('form_fields').query({
                    form_id: $scope.formId
                }, function (r) {
                    
                    for (let i in r) {

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

                    $q.all(form_field_ds).then(function (r) {
                        $scope.showFormSavedModal();
                    })
                }, function (e) {
                    // $scope.launchErrorModal();

                });
            },
                function (e) {
                    $scope.launchErrorModal();
                });
        });
        $scope.selectedFieldType = '';

        // $q.all(fieldSavePromises).then(function (res) {
        //     savedFields = res;
        //     // form.$save().then(function (r) {
        //     // $scope.formId = res.id;
        //     for (var i in savedFields) {
        //         var f = new FormField();
        //         f.form_id = r.id;
        //         f.field_id = savedFields[i].id;
        //         f.is_required = requiredFields[savedFields[i].title].required;
        //         f.default_value = requiredFields[savedFields[i].title].default_value;
        //         f.is_multiple = requiredFields[savedFields[i].title].is_multiple;
        //         f.seq = requiredFields[savedFields[i].title].seq;
        //         form_fields.push(f.$save());
        //     }

            // $q.all(form_fields).then(function (r) {

            //   
            //     R.get('form_fields').query({
            //         form_id: $scope.formId
            //     }, function (r) {

            //         for (var i in r) {

            //             if (r[i] && r[i].field) {
            //                 var val = $scope.fieldSources[r[i].field.title];

            //                 if (val) {
            //                     for (var j in val) {
            //                         var fs = new FieldSourceItem();
            //                         fs.form_id = $scope.formId;
            //                         fs.form_field_id = r[i].id;
            //                         fs.title = val[j];
            //                         form_field_ds.push(fs.$save());
            //                     }
            //                 }
            //             }
            //         }

            //         $q.all(form_field_ds).then(function (r) {
            //             $scope.showFormSavedModal();
            //         })
            //     },
            //         function (e) {
            //             //$scope.launchErrorModal();
            //         }
            //     );
            // },
            //     function (e) {
            //         $scope.showFormSavedModal();
            //     });
            // }, function (e) {
            //     console.log(e);
            // });

        // });
        $scope.selectedFieldType = '';
        activate();
    }

    $scope.launchDelete = function (obj) {
        $scope.deletefield = obj
        R.get('fields/' + obj.id).get(function (r) {
            $scope.deleteCandidate = r;
            $scope.modalOptions.open($scope.deleteModalOptions);
        })



    }

});
