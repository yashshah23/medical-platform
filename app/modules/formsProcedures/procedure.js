app.directive('dynamicModel', ['$compile', function ($compile) {
    return {
        'link': function (scope, element, attrs) {
            scope.$watch(attrs.dynamicModel, function (dynamicModel) {
                if (attrs.ngModel == dynamicModel || !dynamicModel) return;

                element.attr('ng-model', dynamicModel);
                if (dynamicModel == '') {
                    element.removeAttr('ng-model');
                }

                // Unbind all previous event handlers, this is necessary to remove previously linked models.
                element.unbind();
                $compile(element)(scope);
            });
        }
    };
}]);

app.controller('procedureController', function ($scope, $timeout, $http, R, S, H, $location, $q, $routeParams, $compile, $mdDialog, $rootScope) {

    $scope.data = {};
    $scope.data.entries = {};
    $scope.data.default_entries = {};
    $scope.data.masterDataSource = {};
    $scope.data.fieldDataSource = {};
    $scope.validDate;
    $scope.column;
    $scope.isMultiple;
    $scope.newversionId;
    $scope.selection = [];
    $scope.selectionMaster = [];
    $scope.textarea = [];
    $scope.textAreadata = [];
    $scope.textdata = [];
    $scope.filedata = [];
    $scope.fileselected = [];
    $scope.photoselected = [];
    $scope.numberdata = [];
    $scope.textfields = [];
    $scope.numberfields = [];
    $scope.captureData = [];
    $scope.filefields = [];
    $scope.textareaitem;
    $scope.textitem;
    $scope.numberitem;
    $scope.fileitem;
    $scope.temp;
    $scope.countEntries = 1;
    $scope.count = 0;
    $scope.count1 = 0;
    $scope.count2 = 0;
    $scope.count3 = 0;
    $scope.testvalue = 'data.foo';
    $scope.autoIncre;
    $scope.formulas = [];
    $scope.total;
    $scope.oldquestion;
    $scope.formulabider = '';
    $scope.valueFields = []
    $scope.msg = '';
    $scope.msgType = '';
    $scope.isDisabled = false;
    $scope.profilePic = [];
    $scope.profilePicMul = []
    $scope.demo;
    $scope.entrys = [];
    $scope.data.parentMasterArray = [];
    $scope.parendMasterId = [];
    $scope.defaultAdd = {};
    $scope.selectedValue = [];

    $scope.masterValues = {}
    $scope.data2 = {}
    $scope.able_to_see = false;
    $scope.activeBtn;
    $scope.item;
    $scope.buttonlist = [];
    $scope.procedure = [];

    var procedureId = $routeParams.id;
    //$scope.data = {};
    $scope.formIds = [];
    $scope.selectform = '';
    $scope.formId;
    $scope.formtitle;
    $scope.indexnumber = 0;
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
        $scope.id_form = $scope.formIds[0];
      $scope.selectformbyid($scope.id_form,$scope.indexnumber);
      $scope.formtitle = $scope.procedure[0].form.title;
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
    
    $scope.selectformbyid = function (form_id,index) {
        $scope.selectform = form_id;
        $scope.formId = form_id;
        $scope.able_to_see = true;
        // formdata($scope.formId, form_id);
        formmoredata(form_id);
        
        document.getElementById("item-"+ index).style.backgroundColor = '#2196F3';
         for(var s=0; s<$scope.formIds.length; s++) {
          if(s != index)
          { 
            document.getElementById("item-"+ s).style.backgroundColor = 'rgb(173, 171, 171)';
                         
           }   
        }

        for(var f=0; f < $scope.formIds.length; f++) {
          var l = $scope.procedure[f];
            if(l.form.id == form_id)
            { 
                $scope.formtitle = '';
                $scope.formtitle = l.form.title;         
             }   
          }
    }
     

    $scope.unselectfield = function (v) {

        var f = $scope.selectedValue.indexOf(v);
        if (f >= 0) {
            data[$scope.selectedValue[f].title] = $scope.selectedValue[f];
            $scope.selectedValue.splice(f, 1);
        }
    }

    //function formdata(idform, form_id) {


    R.get('master_entry_versions').query({

    }, function (resu) {
        $scope.versions = [];
        for (let i = 0; i < resu.length; i++) {
            if (!$scope.versions[resu[i].master_entry.id]) {
                $scope.versions[resu[i].master_entry.id] = [];
                $scope.versions[resu[i].master_entry.id].push(resu[i].id);
            } else {
                $scope.versions[resu[i].master_entry.id] = []
                $scope.versions[resu[i].master_entry.id].push(resu[i].id);
            }

        }
    }, function (e) {

    });

    R.get('entries/').query({ form_id: $scope.formId }, function (res) {
        $scope.entrys = res.map(e => e.display_id)
        let max = Math.max.apply(null, $scope.entrys)
        if ($scope.entrys.length) {
            $scope.countEntries = Number(max) + 1;
        } else {
            $scope.countEntries = 1;
        }
    }, function (e) {
        console.log(e);
    });


    R.get('master_entry_values').query({}, function (r) {

        for (let i = 0; i < r.length; i++) {
            for (j = 0; j < r.length; j++) {
                if (r[i].master_entry.id == r[j].master_entry_value && r[i].default_field.id == r[j].default_field.title) {
                    r[j].master_entry_value = r[i].master_entry_value
                }
            }
        }


        $scope.data.master_entry_values = r;
        var data3 = []
        for (let i = 0; i < r.length; i++) {
            if ($scope.versions[r[i].master_entry.id].includes(r[i].master_entry_version.id)) {
                if (!data3[r[i].default_field.id]) data3[r[i].default_field.id] = []
                if (r[i].default_field.field_type.id == 7 || r[i].default_field.field_type.id == 6) {
                    if (r[i].default_field.field_type.id == 6) {
                        let date = new Date(r[i].master_entry_value);
                        let day = date.getDate();
                        let month = date.getMonth();
                        let year = date.getFullYear();
                        date = day + "/" + month + "/" + year;
                        data3[r[i].default_field.id].push(date);

                    } else {
                        let date = new Date(r[i].master_entry_value);
                        let hours = date.getHours();
                        let min = date.getMinutes();
                        date = hours + ":" + min;
                        data3[r[i].default_field.id].push(date);
                    }
                } else {
                    data3[r[i].default_field.id].push(r[i].master_entry_value);
                }
            }

        }

        $scope.masterValues = data3;
        for (let i in data3) {
            var d = []
            for (let j in data3[i]) {
                if (!d[data3[j]]) d[data3[i][j]] = null
            }
            setAutoComplete($('.m' + i), d);
        }

    }, function (e) { });

    // }

    function setAutoComplete(elem, data) {
        $(elem).autocomplete({
            data: data,
            onAutocomplete: function (r1) {
                $scope.defaultAdd = $scope.data2[r1];
                if ($scope.selectedValue.indexOf($scope.data2[r1]) >= 0) {
                } else {
                    $scope.selectedValue.push($scope.data2[r1]);
                    $scope.$apply();
                    delete data[r1];
                }
            }
        });
    }

    $scope.masterTypeChanged = function (formData, typeId, mValue, id) {
        

        if (formData && typeId && mValue && id) {
            if (formData.form.masterEnableList) {
                // formData.form.masterEnableList = new Array(formData.form.masterEnableList);
                var a = formData.form.masterEnableList.includes(formData.master.id)

            }

            if (a) { }
            else {
                // var mv = $scope.masterValues[typeId] ? Object.keys($scope.masterValues[typeId]) : null;
                if (!$scope.masterValues[typeId].includes(mValue)) {
                    $scope.showFormMasterEntryErrorModal();
                    document.getElementById(id).value = '';
                    $scope.data.default_entries[id] = [];
                }
            }
        }

    }

    $scope.errorFormMasterEntry = {
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

    $scope.showFormMasterEntryErrorModal = function () {
        $scope.modalOptions.open($scope.errorFormMasterEntry);
    }

    function formmoredata(form_id) {
        
 
        R.get('forms/' + $scope.formId).get(function (r) {
            $scope.data.form = r;
            $scope.column = r.numberofColumn;
            $scope.autoIncre = r.autoIncrement;
        }, function (e) {
            console.log(e);
        });

        // $(function () {
        //     $("#divDate").datetimepicker({
        //         pickTime: false,
        //         orientation: "left",
        //     });
        // });

        R.get('default_fields').query({}, function (r) {

            $scope.data.default_fields = r;
        }, function (e) { });


        R.get('form_default_fields').query({}, function (r) {
            $scope.formdefaultfields =r;
            for (let i = 0; i < r.length; i++) {
                for (j = 0; j < r.length; j++) {
                    if (r[i].default_field.id == r[j].default_field.title) {
                        r[j].default_field.title = r[i].default_field.title
                    }
                }
            }
            $scope.data.form_default_fields = r.filter(e => e.form.id == $scope.formId);
            // $scope.data.form_default_fields = r;
           
        }, function (e) { });

        R.get('master').query({}, function (r) {
            $scope.data.master = r;
        }, function (e) { });




        R.get('form_fields').query({}, function (r) {
            
            $scope.formfields = r;
            $scope.data.form_fields = r.filter(e => e.form.id == $scope.formId);
            
            // remember var d = [];
            // var x = [];
            // for (var i = 0; i < r.length; i++) {
            //     if (r[i].field.field_type.type == 'time' || r[i].field.field_type.type == 'date') {
            //         d[r[i].id] = new Date(r[i].default_value);
            //     } else {
            //         d[r[i].id] = r[i].default_value;
            //     }
            //     if (r[i].field.field_type.id == 5) {
            //         if (r[i].default_value && r[i].default_value.includes(',')) {
            //             $scope.selection = r[i].default_value.split(',');
            //         } else if (r[i].default_value) {
            //             $scope.selection = r[i].default_value;
            //         }
            //     }
            // }

            // $scope.data.entries = d;

        }, function (e) { });


        R.get('default_field_datasource').query({}, function (r) {

            for (var e in r) {
                var i = r[e];
                if (i.default_field) {
                    if (!$scope.data.masterDataSource[i.default_field.id]) $scope.data.masterDataSource[i.default_field.id] = [];
                    $scope.data.masterDataSource[i.default_field.id].push(i.title);
                }
            }
            $(function () {
                $('.dropdown-trigger').dropdown();
            });

        }, function (e) { });


        R.get('form_formulas').query({ form_id: $scope.formId }, function (d) {
            $scope.formulas = d;
        });
       

    }
    R.get('form_field_datasource').query({
        form_id: $scope.formId
    }, function (r) {

        for (var e in r) {
            var i = r[e];
            if (i.form_field) {
                if (!$scope.data.fieldDataSource[i.form_field.id]) $scope.data.fieldDataSource[i.form_field.id] = [];
                $scope.data.fieldDataSource[i.form_field.id].push(i.title);
            }
        }
        $(function () {
            $('.dropdown-trigger').dropdown();
        });

    }, function (e) { });

    validDate();
    // $scope.calculatFormula();
    $scope.uploadedFiles = {};
    $scope.uploadFile = function (file, id) {

        if (file) {
            var uploadUrl = S.baseUrl + '/files';
            var fd = new FormData();
            fd.append('file', file, file.name);

            return $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            })
                .then(function (r) {
                    $scope.fileselected.push(r.data.file)

                    $scope.uploadedFiles[id] = $scope.fileselected.join(',');
                    // $scope.fileselected = [];
                }, function () {
                });
        }

    }

    $scope.photoupload = function (file, id) {

        if (file) {
            var uploadUrl = S.baseUrl + '/files';
            var fd = new FormData();
            fd.append('file', file, file.name);

            return $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            })
                .then(function (r) {
                    $scope.photoselected.push(r.data.file)

                    $scope.uploadedFiles[id] = $scope.photoselected.join(',');
                    $scope.photoselected = [];
                }, function () {
                });
        }

    }

    $scope.toggleSelection = function (checkitem) {

        var idx = $scope.selection.indexOf(checkitem);

        // Is currently selected
        if (idx > -1) {
            $scope.selection.splice(idx, 1);
        }

        // Is newly selected
        else {
            $scope.selection.push(checkitem);
        }
    };

    $scope.calculatFormula = function (val, id, fieldtitle) {
        let fourmulafiled = [];
        for (let i = 0; i < $scope.formulas.length; i++) {
            if ($scope.formulas[i].question) {
                fourmulafiled.push($scope.formulas[i].question);
            }
            if (typeof $scope.formulas[i].value != 'number') {
                fourmulafiled.push($scope.formulas[i].value);
            }
        }


        var filedtital = $scope.data.form_fields.filter(e => e.is_formula)
 
        var x = false;
        for (let inorder = 0; inorder < fourmulafiled.length; inorder++) {
            if (!document.getElementById(fourmulafiled[inorder]).value) {
                x = true;
            }
        }
        var findlastnum = fourmulafiled.slice(-1)[0];
        if (x) {
            return;
        } else {
            for (let i = 0; i < filedtital.length; i++) {
                R.get('form_formulas').query({ form_id: $scope.formId }, function (d) {
                    $scope.formulas = d;
                });
                var data1 = '';
                // var formulafield;
                // $timeout(function () {
                var db = $scope.formulas.filter(e => {
                    if (e.form_field && e.form_field.field.title == filedtital[i].field.title) {
                        return e;
                    }
                });

                var str = db.map(function (elem) {
                    if (elem.operator == undefined) {

                        if (elem.question) {
                            elem.question = document.getElementById(elem.question).value;
                        }

                        if (elem.type == 0 && elem.value) {
                            elem.value = document.getElementById(elem.value).value;
                        }
                        return (elem.question != undefined ? elem.question : '') + '' + (elem.formulasing != undefined ? elem.formulasing : '') + '' + (elem.value != undefined ? elem.value : '');
                    } else {
                        if (elem.question) {
                            elem.question = document.getElementById(elem.question).value;
                        }

                        if (elem.type == 0 && elem.value) {
                            elem.value = document.getElementById(elem.value).value;
                        }
                        return (elem.operator != undefined ? elem.operator : '') + '' + (elem.question != undefined ? elem.question : '') + '' + (elem.formulasing != undefined ? elem.formulasing : '') + '' + (elem.value != undefined ? elem.value : '');
                    }
                }).join("");
                var p = data1.concat(str);
                // formulafield = $scope.formulas[0].form_field.field.title;
                $scope.total = eval(p);
                document.getElementById(filedtital[i].field.title).value = $scope.total.toFixed(2);
                // },1000)
            }
            ;

        }

    }

    $scope.toggleSelectionmaster = function (checkitem) {

        var idx = $scope.selectionMaster.indexOf(checkitem);

        // Is currently selected
        if (idx > -1) {
            $scope.selectionMaster.splice(idx, 1);
        }

        // Is newly selected
        else {
            $scope.selectionMaster.push(checkitem);
        }
    };

    $scope.addtextArea = function (type, item) {

        $scope.textarea.push(type)

    }
    $scope.onblurearea = function (item) {
        if (item) {
            var s = 'textarea' + $scope.count
            var x = document.getElementById(s).value;
            $scope.count = $scope.count + 1;
            $scope.textAreadata.push(x);
        }
    }

    $scope.addtext = function (type, item) {
        $scope.textfields.push(type)

    }
    $scope.onbluretext = function (item) {
        if (item) {
            var s = 'text' + $scope.count1
            var x = document.getElementById(s).value;
            $scope.count1 = $scope.count1 + 1;
            $scope.textdata.push(x);
        }
    }
    $scope.addnumber = function (type, item) {

        $scope.numberfields.push(type)

    }
    $scope.addCapture = function (id) {
        $scope.captureData.push(id);
    }
    $scope.onblurenumber = function (item) {

        if (item) {
            var s = 'number' + $scope.count2
            var x = document.getElementById(s).value;
            $scope.count2 = $scope.count2 + 1;
            $scope.numberdata.push(x);
        }
    }
    $scope.addfile = function (type, item) {

        $scope.filefields.push(type)

    }
    $scope.onblurefile = function (item) {

        // if (item) {
        var s = 'file' + $scope.count3
        var x = document.getElementById(s).files[0];
        $scope.count3 = $scope.count3 + 1;
        if (x) {
            $scope.filedata.push(x);
        }
        // }
        // $scope.uploadField();
    }

    //open camera
    $scope.opencamera = function (title) {

        var video = document.getElementById(`video${title}`);
        // Get access to the camera!
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Not adding `{ audio: true }` since we only want video now
            navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
                video.src = window.URL.createObjectURL(stream);
                video.play();
            });
        }
        // }

    }

    //user take pic 
    $scope.takepic = function (title) {

        $scope.canvas = document.getElementById(`canvas${title}`);
        $scope.context = $scope.canvas.getContext(`2d`);
        $scope.video = document.getElementById(`video${title}`);

        // document.getElementById("snap").addEventListener("click", function () {
        $scope.context.drawImage($scope.video, 0, 0, 200, 200);
        // });
        // }
    }

    $scope.save2 = function (title) {
        var link = document.createElement('a');
        $scope.canvas = document.getElementById(`canvas${title}`);
        link.download = "download.png";
        link.href = $scope.canvas.toDataURL("image/png");
        $scope.urltoFile = function (url, filename, mimeType) {
            return (fetch(url)
                .then(function (res) { return res.arrayBuffer(); })
                .then(function (buf) { return new File([buf], filename, { type: mimeType }); })
            );
        }
        var mypic = 'userProfile' + Math.floor((Math.random() * 100) + 1) + '.png';
        //Usage example:
        $scope.urltoFile(link.href, mypic, 'image/png')
            .then(function (file) {
                // $scope.profilePic.push(file);
                $scope.profilePic[title] = file;
                //popup
                // if (x != 'save') {
                var confirm = $mdDialog.alert()
                    .title('Photo Uploaded')
                    .ok('Ok')
                $mdDialog.show(confirm).then(function (result) {

                },
                    function () {
                    });
                // }
            })
        // }
    }

    //end
    $scope.uploadField = function () {

        var uploadField = document.getElementById("file");
        // var FileSize = ; // in MB
        if (uploadField.files[0] && uploadField.files[0].size > 4000000) {
            $scope.msg = "Maximum allowed file size is 4 MB.";
        } else if (uploadField.files[0] && !uploadField.accept.includes(uploadField.files[0].name.split(".").pop())) {
            $scope.msgType = "Invalid file type. Allowed extensions are: pdf, doc/docx, xls/xlsx, ppt/pptx, csv, jpg/jpeg, png";
        } else {
            $scope.msg = '';
            $scope.msgType = '';
        }
    }

    $scope.deletefile = function (id) {

        document.getElementById("file").value = '';
        //remember $scope.data.entries[$scope.formId][id] = '';
    }

    $scope.saveData = function (formBuilder) {

        // if ($scope.profilePic.length) {
        //     for (let Ppic = 0; Ppic < $scope.profilePic.length; Ppic++) {
        //         $scope.profilePicMul.push($scope.profilePic[Ppic]);
        //     }
        // }

        $scope.isDisabled = true;
        if (formBuilder.$invalid || $scope.msg != '' || $scope.msgType != '') {
            return $scope.showErrorMendodaryFieldsModel();
        }
        var Entry = R.get('entries');
        var Value = R.get('entry_values');
        var DefaultValue = R.get('entry_default_values');
        var entryVersions = R.get('entry_versions');

        var masterEntryValue = R.get('master_entry_values');
        var masterEntry = R.get('master_entries');
        var masterEntryVersions = R.get('master_entry_versions');

        for (let k = 0; k < $scope.formIds.length; k++) {
            
            var entry = new Entry();
            debugger
            entry.form_id = $scope.formIds[k];
            entry.display_id = $scope.countEntries;

            var values = [];

            entry.$save().then(function (r) {
                var fileValues = [];
                var versionentry = new entryVersions();
                versionentry.entry_id = r.id;
                versionentry.version = 1;
                 
                versionentry.$save().then(function (versiondata) {
                    //$scope.data.form_fields
                    var formfieldsdata = {};
                    formfieldsdata = $scope.formfields.filter(e => e.form.id == $scope.formIds[k]);

                    for (let i = 0; i < formfieldsdata.length; i++) {
                      
                        let x = formfieldsdata[i];
                        let value = new Value();

                        value.form_id = r.form.id;
                        value.entry_id = r.id;
                        value.form_field_id = x.id;
                        //console.log(value.form_field_id)
                        value.entry_version_id = versiondata.id

                        if (x && x.field && x.field.field_type && x.field.field_type.id == 8 && !x.is_multiple) {

                            var file = $scope.data.entries[x.form_id][x.id];
                            fileValues.push($scope.uploadFile(file, x.id));
                        }

                        if (x.field.field_type.id == 5) {
                            $scope.data.entries[x.form_id][x.id] = $scope.selection.join(',');
                            $scope.data.entries[x.form_id][x.id] = $scope.data.entries[x.form_id][x.id].trim();
                        }
                        if (x.field.field_type.id == 9 && x.is_multiple) {
                            $scope.textAreadata.push($scope.data.entries[x.form_id][x.id]);
                            $scope.data.entries[x.form_id][x.id] = $scope.textAreadata.join(',');
                        }
                        if (x.field.field_type.id == 1 && x.is_multiple) {
                            $scope.textdata.push($scope.data.entries[x.form_id][x.id]);
                            $scope.data.entries[x.form_id][x.id] = $scope.textdata.join(',');
                        }
                        if (x.field.field_type.id == 2 && x.is_multiple) {
                            $scope.numberdata.push($scope.data.entries[x.form_id][x.id]);
                            $scope.data.entries[x.form_id][x.id] = $scope.numberdata.join(',');
                        }
                        if (x.field.field_type.id == 10) {
                            $scope.data.entries[x.form_id][x.id] = String(document.getElementById(x.field.title).value);
                        }
                        if (x.field.field_type.id == 8 && x.is_multiple) {

                            $scope.filedata.push($scope.data.entries[x.form_id][x.id]);
                            for (let filed = 0; filed < $scope.filedata.length; filed++) {
                                var f = $scope.filedata[filed];
                                fileValues.push($scope.uploadFile(f, x.id));
                            }
                        }

                        if (x.field.field_type.id == 11 && x.is_multiple && $scope.profilePicMul.length) {
                            for (let pic = 0; pic < $scope.profilePic.length; pic++) {
                                if ($scope.profilePic[pic][x.field.title]) {
                                    $scope.profilePicMul.push({ [x.field.title]: $scope.profilePic[pic][x.field.title] });
                                }
                            }
                            for (let camera = 0; camera < $scope.profilePicMul.length; camera++) {
                                fileValues.push($scope.photoupload($scope.profilePicMul[camera][x.field.title], x.id));
                            }
                        }
                        else {
                            if ($scope.profilePic[x.field.title]) {
                                fileValues.push($scope.photoupload($scope.profilePic[x.field.title], x.id));
                            }
                        }


                        if (x.field.field_type.id == 6 || x.field.field_type.id == 7 || x.field.field_type.id == 8 || x.field.field_type.id == 11) {
                            value.entry_value = $scope.data.entries[x.form_id][x.id];
                            values.push(value.$save());
                        } else {
                            /*$http.post(S.baseUrl + '/encrypt/data', { val: $scope.data.entries[x.id] })
                                .then(function (res) {
                                    console.log(res)
                                    if (res) {
                                        $timeout(function () {
                                            value.entry_value = res.data;
                                            values.push(value.$save());
                                        }, 300);
                                    }
                                }, function (e) { });*/
                            value.entry_value = $scope.data.entries[x.form_id][x.id];
                            values.push(value.$save());
                        }



                    }
                     // $scope.data.form_default_fields
                     var fdefaultfield = {};
                     fdefaultfield = $scope.formdefaultfields.filter(e => e.form.id == $scope.formIds[k]);
                    for (let i = 0; i < fdefaultfield.length ; i++) {

                        let x = fdefaultfield[i];
                        var value = new DefaultValue();
                        value.form_id = r.form.id;
                        value.entry_id = r.id;
                        value.form_default_field_id = x.id;
                        value.entry_version_id = versiondata.id

                        value.entry_value = $scope.data.default_entries[x.form_id][x.id];

                        values.push(value.$save());
                    }
                    $q.all(fileValues).then(function () {
                        var formfieldsdata4 = {};
                        formfieldsdata4 = $scope.formfields.filter(e => e.form.id == $scope.formIds[k]);

                        for (let i = 0; i <  formfieldsdata4.length; i++) {
                            var x =  formfieldsdata4[i];
                            if (x && x.field && x.field.field_type && (x.field.field_type.id == 8 || x.field.field_type.id == 11) && x.is_multiple) {
                                var value = new Value();
                                value.form_id = x.form.id;
                                value.entry_version_id = versiondata.id
                                value.entry_id = r.id;
                                value.form_field_id = x.id;
                                value.entry_value = $scope.uploadedFiles[x.id]
                                values.push(value.$save());
                            }
                            if (x && x.field && x.field.field_type && (x.field.field_type.id == 8 || x.field.field_type.id == 11) && !x.is_multiple) {
                                var value = new Value();
                                value.form_id = x.form.id;
                                value.entry_version_id = versiondata.id
                                value.entry_id = r.id;
                                value.form_field_id = x.id;
                                value.entry_value = $scope.uploadedFiles[x.id];
                                values.push(value.$save());
                            }
                        }
                    }, function (e) { });
                });

              debugger
               
                var fDefaultFields = {};
                var vl = {};
                // $scope.data.form_default_fields
                fDefaultFields = $scope.formdefaultfields.filter(e => e.form.id == $scope.formIds[k]);
                
                for (let a = 0; a < fDefaultFields.length; a++) {
                    if ($scope.data.master_entry_values && fDefaultFields[a] != undefined) {
                        vl = $scope.data.master_entry_values.filter(e => (e.master.id == fDefaultFields[a].master.id && e.default_field.is_autoIncrement))
                    } else {
                        vl = 0
                    }
                }
            

                if (vl) {
                    fDefaultFields.push(vl[0])
                }

                var idsofmaster = [];
                var entryid;
                var versionid;

                for (let i = 0; i < fDefaultFields.length ; i++) {

                    let x = fDefaultFields[i];
                    // idsofmaster.push(x.master.id);
                    var mEntry = new masterEntry();
                    mEntry.master_id = x ? x.master.id : null;

                    if (x && x.default_field.field_type.id != 12 && $scope.data.default_entries[x.form_id][x.id] && $scope.data.default_entries[x.form_id][x.id] != null) {

                        var mvalues = $scope.masterValues[x.default_field.id] || null;

                        if ($scope.data.default_entries[x.form_id][x.id] && $scope.data.default_entries[x.form_id][x.id] != undefined && mvalues) {
                            if (mvalues.includes($scope.data.default_entries[x.form_id][x.id])) { }
                            else {
                                mEntry.$save().then(function (mEnt) {

                                    var masterVersionEntry = new masterEntryVersions();
                                    masterVersionEntry.master_entry_id = mEnt.id;
                                    masterVersionEntry.version = 1;
                                    masterVersionEntry.$save().then(function (versiondata) {

                                        var mastervalue = new masterEntryValue();
                                        mastervalue.master_id = x.master.id;
                                        if (idsofmaster.includes(x.master.id)) {
                                            mastervalue.master_entry_id = entryid ? entryid : null;
                                            mastervalue.master_entry_version_id = versionid ? versionid : null;
                                        } else {
                                            idsofmaster.push(x.master.id);
                                            entryid = mEnt.id;
                                            versionid = versiondata.id
                                            mastervalue.master_entry_id = mEnt.id;
                                            mastervalue.master_entry_version_id = versiondata.id
                                        }
                                        mastervalue.default_field_id = x.default_field.id;


                                        if (x.default_field.is_autoIncrement == 1) {
                                            var versionnumber = []

                                            if (vl[v].master_entry_value == undefined) {
                                                versionnumber.push(0);
                                            }
                                            else {

                                                versionnumber.push(vl[v].master_entry_value);
                                            }
                                            mastervalue.master_entry_value = Math.max.apply(null, versionnumber) + 1;
                                        }
                                        else {
                                            mastervalue.master_entry_value = $scope.data.default_entries[x.form_id][x.id];
                                        }

                                        values.push(mastervalue.$save());
                                    });
                                });
                            }
                        }
                    }
                }


                $q.all(values).then(function (r) {
                    $scope.showFormSavedModal();
                }, function (e) {
                    console.log(e);
                    $scope.showErrorModal();
                });

            }, function (e) {
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
        onCancelClick: function () {
            $scope.data.default_entries = [];
            $scope.data.entries = [];
            $scope.textfields = [];
            $scope.numberfields = [];
            $scope.filefields = [];
            $scope.textarea = [];
            $scope.numberfields = [];
            $scope.isDisabled = false;
            //$scope.load();
            //$location.path('forms/value.form_field_id');
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
        onCancelClick: function () { $scope.isDisabled = false; }
    }

    $scope.errorModalOptions = {
        header: 'An error occured ...',
        text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
        showOk: true,
        okText: 'Ok',
        onOkClick: function () { $scope.isDisabled = false; },
        showCancel: false,
        cancelText: '',
        onCancelClick: function () { }
    }

    $scope.modalOptions = {};

    $scope.showCancelFormModal = function () {
        $scope.modalOptions.open($scope.cancelModalOptions);
    }

    $scope.showErrorModal = function () {
        $scope.modalOptions.open($scope.errorModalOptions);
    }

    $scope.showFormSavedModal = function () {
        $scope.modalOptions.open($scope.savedModalOptions);
    }

    $scope.showErrorMendodaryFieldsOptions = {

        header: 'Warning!',
        text: 'Please fill mandatory fields!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () { $scope.isDisabled = false; }
    }

    $scope.showErrorMendodaryFieldsModel = function () {
        $scope.modalOptions.open($scope.showErrorMendodaryFieldsOptions);
    }


    $(function () {
        $('.fixed-action-btn').floatingActionButton({});
    });

});
