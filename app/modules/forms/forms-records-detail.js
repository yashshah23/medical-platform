app.controller('formRecordsControllerBase', ControllerFactory('entry_values'));
app.controller('formsRecordsEditController', function ($scope, $controller, $http, R, S, $location, $timeout, $q, $routeParams, $mdDialog) {

    $controller('formRecordsControllerBase', {
        $scope: $scope
    });
    $scope.disabled = false;
    $scope.mode = 'edit';
    var entryId = $routeParams.id;
    $scope.EntryID;
    $scope.data = {};
    $scope.entrydata = {}
    $scope.data.entries = {};
    $scope.oldEntries = {};
    $scope.newEntry = [];
    $scope.oldMasterentry = [];
    $scope.newmasterEntry = [];
    $scope.data.entrieIds = {};
    $scope.data.entry_default_valueIds = {};
    $scope.data.default_entries = {};
    $scope.data.masterDataSource = {};
    $scope.data.fieldDataSource = {};
    $scope.validDate;
    $scope.Entry_valueid;
    $scope.formID;
    $scope.editmod = true
    $scope.column;
    $scope.autoIncre;
    $scope.newEntryId
    $scope.savedEntries = [];
    $scope.textarea = [];
    $scope.textAreadata = [];
    $scope.fileselected = [];
    $scope.photoselected =[]
    $scope.textdata = [];
    $scope.filedata = [];
    $scope.numberdata = [];
    $scope.textfields = [];
    $scope.numberfields = [];
    $scope.filefields = [];
    $scope.textareaitem;
    $scope.textitem;
    $scope.numberitem;
    $scope.fileitem = [];
    $scope.count = 0;
    $scope.count1 = 0;
    $scope.count2 = 0;
    $scope.count3 = 0;
    $scope.textareadata = [];
    $scope.entries = [];
    $scope.version = 1;
    $scope.selection = [];
    $scope.selectionMaster = [];
    $scope.modeaction = `/forms/${entryId}/records/edit` == $location.$$url;
    $scope.countEntries;
    $scope.formulas = [];
    $scope.total;
    $scope.profilesrc = [];
    $scope.photo = [];
    $scope.profilePicMul = [];
    $scope.profilePic = [];
    $scope.captureData = [];
    $scope.prewive = [];
    $scope.flag = [];
    $scope.addnew;
    $scope.arraycount = [];
    $scope.reason;
    $scope.formUsers = [];

    $scope.data.parentMasterArray = {};
    $scope.parendMasterId;

    $scope.masterValues = {}
    $scope.defaultAdd = {};
    $scope.selectedValue = [];
    $scope.data2 = {}

    $scope.load = function () {

        R.get('master_entry_versions').query({

        }, function (resu) {
            $scope.versions = [];
            for (let i = 0; i < resu.length; i++) {
                if (!$scope.versions[resu[i].master_entry.id]) {
                    $scope.versions[resu[i].master_entry.id] = [];
                    $scope.versions[resu[i].master_entry.id].push(resu[i].id);
                } else {
                    $scope.versions[resu[i].master_entry.id] =[]
                    $scope.versions[resu[i].master_entry.id].push(resu[i].id);
                }

            }
        }, function (e) {

        });

        var entryupdate = R.get('entries/' + entryId).get(function (reasponce) {
            //$scope.EntryID = r.display_id;
            $scope.countEntries = reasponce.display_id;
            $scope.version = reasponce.version
            $scope.data.reasonUpdate = reasponce.reason
            $scope.updatereason = reasponce;
        }, function (e) {
            console.log(e);
        });

        R.get('entry_versions').query({ entry_id: entryId }, function (result) {

            var maxVersion = Math.max.apply(Math, result.map(function (o) { return o.version; }));
            $scope.entryVersion = result.filter(entry => entry.version == maxVersion);

            if ($scope.entryVersion) {
                R.get('entry_values').query({
                    entry_version_id: $scope.entryVersion[0].id
                }, function (r) {



                    $scope.formID = r[0].form.id;
                    $scope.reason = r[0].form.reasonForUpdate;
                    for (let i = 0; i < r.length; i++) {
                        if (r[i].form_field.field.field_type.id == 6 || r[i].form_field.field.field_type.id == 7 || r[i].form_field.field.field_type.id == 8 || r[i].form_field.field.field_type.id == 11) {
                            r[i].entry_value = r[i].entry_value;
                        } else {
                            /*$http.post(S.baseUrl + '/encrypt/data', { dec: r[i].entry_value })
                                .then(function (res) {
                                    if (res) {
                                        r[i].entry_value = res.data.trim();
                                    }
                                    //console.log(res)
                                }, function (e) { });*/
                            
                            $scope.Entry_valueid = r[0].id
			                            $scope.data.entry_values = r;
			                            $scope.oldEntries = r;
			                            var d = [];
			                            var x = [];
			                            for (let i = 0; i < r.length; i++) {
			                                if (r[i].form_field.field.field_type.id == 10) {
			                                    r[i].entry_value = Number(r[i].entry_value);
			                                }
			
			
			                                if (!d[r[i].form_field.id]) d[r[i].form_field.id] = [];
			                                if (!x[r[i].form_field.id]) x[r[i].form_field.id] = [];
			
			                                if (r[i].form_field && r[i].form_field.field && r[i].form_field.field.field_type && r[i].form_field.field.field_type.type && (r[i].form_field.field.field_type.type == 'date' || r[i].form_field.field.field_type.type == 'time')) {
			                                    // let str =r[i].entry_value.toISOString();
			                                    // let result = str.slice(10);
			                                    // str.replace(result, '')
			                                    r[i].entry_value = new Date(r[i].entry_value);
			                                }
			                                d[r[i].form_field.id] = r[i].entry_value;
			                                x[r[i].form_field.id]['id'] = r[i].id;
			                                x[r[i].form_field.id]['entry_id'] = r[i].entry.id;
			                                console.log(r[i].form_field.id);
			                                $scope.selection[r[i].form_field.id] = [];
			                                if (r[i].form_field.field.field_type.id == 5) {
			
			                                    if (r[i].entry_value && r[i].entry_value.includes(',')) {
			                                        $scope.selection[r[i].form_field.id] = r[i].entry_value.split(',');
			                                    } else if (r[i].entry_value) {
			                                        $scope.selection[r[i].form_field.id] = new Array(r[i].entry_value);
			                                    }
			                                }
			                                if (r[i].form_field.field.field_type.id == 9) {
			                                    $scope.textarea = r[i].entry_value.split(',');
			                                    $scope.textareaitem = r[i].entry_value.split(',');
			                                    $scope.count = $scope.textareaitem.length;
			                                }
			                                if (r[i].form_field.field.field_type.id == 1) {
			                                    $scope.textfields = r[i].entry_value.split(',');
			                                    $scope.textitem = r[i].entry_value.split(',');
			                                    $scope.count1 = $scope.textitem.length;
			                                }
			                                if (r[i].form_field.field.field_type.id == 2) {
			                                    $scope.numberfields = r[i].entry_value.split(',');
			                                    $scope.numberitem = r[i].entry_value.split(',');
			                                    $scope.count2 = $scope.numberitem.length;
			                                }
			
			                                if (r[i].form_field.field.field_type.id == 8) {
			                                    $scope.filefields = new Array('data')
			                                    if (r[i].entry_value && r[i].entry_value.includes(',')) {
			                                        // $scope.filefields =r[i].entry_value.split(',');    
			                                        $scope.fileitem = r[i].entry_value.split(',');
			                                        $scope.remanfile = r[i].entry_value.split(',');
			                                        $scope.count3 = 1;
			                                    } else if (r[i].entry_value && !r[i].entry_value.includes(',')) {
			                                        // $scope.filefields =new Array(r[i].entry_value);  
			                                        $scope.fileitem = new Array(r[i].entry_value);
			                                        $scope.remanfile = r[i].entry_value.split(',');
			                                        $scope.count3 = 0;
			                                    }
			                                    // $scope.filefields = r[i].entry_value ? r[i].entry_value.includes(',') ? r[i].entry_value.split(',') : r[i].entry_value : null;
			                                    // $scope.fileitem = r[i].entry_value ? r[i].entry_value.includes(',') ? r[i].entry_value.split(',') : r[i].entry_value : null;
			                                    // $scope.count3= $scope.fileitem ? $scope.fileitem.includes(',') ? $scope.fileitem.length : 1 : 0;
			                                }
			                                if (r[i].form_field.field.field_type.id == 11 && r[i].entry_value) {
			
			                                    $scope.profilesrc[r[i].form_field.field.title] = r[i].entry_value;
			                                }
			
			                            }
			                            $scope.data.entries = d
			                            // $scope.oldEntries =d.join('');
			                            //  d.replace(/,/g,'');
			
			                            $scope.captureData.push($scope.arraycount);
			                            $scope.profilesrc.push($scope.arraycount);
			                            $scope.data.entrieIds = x;
                                            
                        }

                        $timeout(function () {
                            $scope.Entry_valueid = r[0].id
                            $scope.data.entry_values = r;
                            $scope.oldEntries = r;
                            var d = [];
                            var x = [];
                            for (let i = 0; i < r.length; i++) {
                                if (r[i].form_field.field.field_type.id == 10) {
                                    r[i].entry_value = Number(r[i].entry_value);
                                }


                                if (!d[r[i].form_field.id]) d[r[i].form_field.id] = [];
                                if (!x[r[i].form_field.id]) x[r[i].form_field.id] = [];

                                if (r[i].form_field && r[i].form_field.field && r[i].form_field.field.field_type && r[i].form_field.field.field_type.type && (r[i].form_field.field.field_type.type == 'date' || r[i].form_field.field.field_type.type == 'time')) {
                                    // let str =r[i].entry_value.toISOString();
                                    // let result = str.slice(10);
                                    // str.replace(result, '')
                                    r[i].entry_value = new Date(r[i].entry_value);
                                }
                                d[r[i].form_field.id] = r[i].entry_value;
                                x[r[i].form_field.id]['id'] = r[i].id;
                                x[r[i].form_field.id]['entry_id'] = r[i].entry.id;
                                $scope.selection[r[i].id] = [];
                                if (r[i].form_field.field.field_type.id == 5) {

                                    if (r[i].entry_value && r[i].entry_value.includes(',')) {
                                        $scope.selection[r[i].id] = r[i].entry_value.split(',');
                                    } else if (r[i].entry_value) {
                                        $scope.selection[r[i].id] = new Array(r[i].entry_value);
                                    }
                                }
                                if (r[i].form_field.field.field_type.id == 9) {
                                    $scope.textarea = r[i].entry_value.split(',');
                                    $scope.textareaitem = r[i].entry_value.split(',');
                                    $scope.count = $scope.textareaitem.length;
                                }
                                if (r[i].form_field.field.field_type.id == 1) {
                                    $scope.textfields = r[i].entry_value.split(',');
                                    $scope.textitem = r[i].entry_value.split(',');
                                    $scope.count1 = $scope.textitem.length;
                                }
                                if (r[i].form_field.field.field_type.id == 2) {
                                    $scope.numberfields = r[i].entry_value.split(',');
                                    $scope.numberitem = r[i].entry_value.split(',');
                                    $scope.count2 = $scope.numberitem.length;
                                }

                                if (r[i].form_field.field.field_type.id == 8) {
                                    $scope.filefields = new Array('data')
                                    if (r[i].entry_value && r[i].entry_value.includes(',')) {
                                        // $scope.filefields =r[i].entry_value.split(',');    
                                        $scope.fileitem = r[i].entry_value.split(',');
                                        $scope.remanfile = r[i].entry_value.split(',');
                                        $scope.count3 = 1;
                                    } else if (r[i].entry_value && !r[i].entry_value.includes(',')) {
                                        // $scope.filefields =new Array(r[i].entry_value);  
                                        $scope.fileitem = new Array(r[i].entry_value);
                                        $scope.remanfile = r[i].entry_value.split(',');
                                        $scope.count3 = 0;
                                    }
                                    // $scope.filefields = r[i].entry_value ? r[i].entry_value.includes(',') ? r[i].entry_value.split(',') : r[i].entry_value : null;
                                    // $scope.fileitem = r[i].entry_value ? r[i].entry_value.includes(',') ? r[i].entry_value.split(',') : r[i].entry_value : null;
                                    // $scope.count3= $scope.fileitem ? $scope.fileitem.includes(',') ? $scope.fileitem.length : 1 : 0;
                                }
                                if (r[i].form_field.field.field_type.id == 11 && r[i].entry_value) {

                                    $scope.profilesrc[r[i].form_field.field.title] = r[i].entry_value;
                                }

                            }
                            $scope.data.entries = d
                            // $scope.oldEntries =d.join('');
                            //  d.replace(/,/g,'');

                            $scope.captureData.push($scope.arraycount);
                            $scope.profilesrc.push($scope.arraycount);
                            $scope.data.entrieIds = x;


                        }, 1000);
                    }


                    R.get('form_fields').query({ form_id: $scope.formID }, function (data) {
                        if (data)
                            $scope.data.form_fields = (data || []).map(function (item) {
                                if (item && item.field && item.field.field_type && item.field.field_type.type && (item.field.field_type.type == 'date' || item.field.field_type.type == 'time')) {
                                    item.default_value = new Date(item.default_value);
                                }
                                return item;
                            });

                    });


                    R.get('form_field_datasource').query({ form_id: $scope.formID }, function (source) {
                        for (var e in source) {
                            var i = source[e];
                            if (i.form_field) {
                                if (!$scope.data.fieldDataSource[i.form_field.id]) $scope.data.fieldDataSource[i.form_field.id] = [];
                                $scope.data.fieldDataSource[i.form_field.id].push(i.title);
                            }
                        }
                        $(function () {
                            $('.dropdown-trigger').dropdown();
                        });

                    }, function (e) { });

                    R.get('forms/' + $scope.formID).get(function (r) {
                        $scope.data.form = r;
                        $scope.column = r.numberofColumn;
                        $scope.autoIncre = r.autoIncrement;
                    }, function (e) {
                        console.log(e);
                    });
                    R.get('form_formulas').query({ form_id: $scope.formID }, function (d) {
                        $scope.formulas = d;
                    });

                    R.get('form_default_fields').query({  }, function (r) {
                        for (let i = 0; i < r.length; i++) {
                            for (j = 0; j < r.length; j++) {
                                if (r[i].default_field.id == r[j].default_field.title) {
                                    r[j].default_field.title = r[i].default_field.title
                                }
                            }
                        }
                        $scope.data.form_default_fields = r.filter(e =>  e.form.id == $scope.formID);
                    }, function (e) { });

                    R.get('master').query({}, function (r) {
                        $scope.data.master = r;
                    }, function (e) { });

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


                    R.get('entry_default_values').query({
                        entry_version_id: $scope.entryVersion[0].id
                    }, function (r) {
                        $scope.oldMasterentry = r
                        var d = [];
                        var x = [];
                        for (let i = 0; i < r.length; i++) {

                            if (!d[r[i].form_default_field.id]) d[r[i].form_default_field.id] = [];
                            if (!x[r[i].form_default_field.id]) x[r[i].form_default_field.id] = [];

                            // if ((r[i].form_default_field.default_field.field_type.type == 'date' || r[i].form_default_field.default_field.field_type.type == 'time')) {
                            //     r[i].entry_value = new Date(r[i].entry_value);
                            // }

                            if (r[i].form_default_field.default_field.field_type.id == 2) {
                                r[i].entry_value = Number(r[i].entry_value);
                            }

                            // if (r[i] && r[i].form_default_field.default_field && r[i].form_default_field.default_field.field_type && r[i].form_default_field.default_field.field_type.id && r[i].form_default_field.default_field.field_type.id == 12) {

                            //     let k = r[i].entry_value;

                            //     if (k && k != undefined || k != null) {

                            //         let a = []

                            //         let mE = $scope.data.master_entry_values;

                            //         for (i1 = 0; i1 < mE.length; i1++) {

                            //             if (mE[i1].master_entry.id == k) {
                            //                 a.push(mE[i1])
                            //             }
                            //         }

                            //         let d = [];
                            //         for (let i2 = 0; i2 < a.length; i2++) {
                            //             if (!d[a[i2].master_entry.id]) d[a[i2].master_entry.id] = [];
                            //             if (!d[a[i2].master_entry_version.master_entry.id][a[i2].master_entry_version.id]) d[a[i2].master_entry_version.master_entry.id][a[i2].master_entry_version.id] = [];
                            //             d[a[i2].master_entry_version.master_entry.id][a[i2].master_entry_version.id] = a[i2];
                            //         }

                            //         let d1 = [];

                            //         for (let j in d) {
                            //             let len = d[j].length - 1;
                            //             if (len >= 0) d1[j] = d[j][len];
                            //         }

                            //         r[i].entry_value = d1[k].master_entry_value;
                            //     }

                            // }

                            d[r[i].form_default_field.id] = r[i].entry_value;

                            x[r[i].form_default_field.id] = r[i].id;

                        }
                        $scope.data.default_entries = d;
                        $scope.data.entry_default_valueIds = x;

                    }, function (e) { });




                }, function (e) { });
            }
        });

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

        // $scope.masterTypeChanged = function (formData, typeId, mValue, id) {

        //     if (formData.form.masterEnableList) {

        //         var a = formData.form.masterEnableList.includes(formData.master.id)

        //     }

        //     if (a) { }
        //     else {
        //         var mv = Object.keys($scope.masterValues[typeId])
        //         if (mValue && mValue.length > 0) {
        //             if (mv.includes(mValue)) { }
        //             else {
        //                 $scope.showFormMasterEntryErrorModal();
        //                 document.getElementById(id).value = '';
        //                 $scope.data.default_entries[id] = [];
        //             }
        //         }
        //     }
        // }

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

        // }
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
    }


    $scope.testFileUrl = "Not Yet Available";
    $scope.uploadedFiles = {};
    $scope.uploadFile = function (file, id) {


        if (typeof file == "string") {
            $scope.fileselected.push(file)
            // $scope.uploadedFiles[id] = $scope.fileselected.join(',');
        } else {

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

                    $scope.uploadedFiles[id] =  $scope.photoselected.join(',');
                     $scope.photoselected = [];
                }, function () {
                });
        }

    }
    $scope.deletefile = function (index, id) {
        $scope.remanfile.splice(index, 1);
    }
    validDate();
    $scope.toggleSelection = function (checkitem, id) {
    	console.log(id);

        var idx = $scope.selection[id].indexOf(checkitem);

        // Is currently selected
        if (idx > -1) {
            $scope.selection[id].splice(idx, 1);
        }

        // Is newly selected
        else {
            $scope.selection[id].push(checkitem);
        }
    };

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
            // $scope.textAreadata.push(x);
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
            // $scope.textdata.push(x);
        }
    }
    $scope.addnumber = function (type, item) {

        $scope.numberfields.push(type)

    }
    $scope.onblurenumber = function (item) {
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

    $scope.fileopen = function (file) {

        window.open('http://localhost:8080/api/' + file);
    }

    //open camera
    $scope.opencamera = function (title, edit) {

        if (edit == 'edit') {
            $scope.profilesrc[title] = '';
        }
        var video = document.getElementById(`video${title}`);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
                video.src = window.URL.createObjectURL(stream);
                video.play();
            });
        }

    }

    $scope.takepic = function (title) {

        $scope.canvas = document.getElementById(`canvas${title}`);
        $scope.context = $scope.canvas.getContext(`2d`);
        $scope.video = document.getElementById(`video${title}`);
        $scope.context.drawImage($scope.video, 0, 0, 200, 200);
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
                $scope.profilePic[title] = file;

                var confirm = $mdDialog.alert()
                    .title('Photo Uploaded')
                    .ok('Ok')
                $mdDialog.show(confirm).then(function (result) {

                },
                    function () {
                    });
            })
    }

    $scope.uploadField = function () {
        var uploadField = document.getElementById("file");
        if (uploadField.files[0] && uploadField.files[0].size > 4000000) {
            $scope.msg = "Maximum allowed file size is 4 MB.";
        } else if (!uploadField.accept.includes(uploadField.files[0].name.split(".").pop())) {
            $scope.msgType = "Invalid file type. Allowed extensions are: pdf, doc/docx, xls/xlsx, ppt/pptx, csv, jpg/jpeg, png";
        } else {
            $scope.msg = '';
            $scope.msgType = '';
        }
    }
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

        // var formulatype = $scope.data.form_fields.map(function (element) {
        //     if (element.field.field_type.id == 2) {
        //         return element.field.title;
        //     }
        // });
        // formulatype = formulatype.filter(function (element) {
        //     return element !== undefined;
        // });
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
                R.get('form_formulas').query({ form_id: $scope.formID }, function (d) {
                    $scope.formulas = d;
                });
                var data1 = '';
                var db = $scope.formulas.filter(e => {
                    if (e.form_field.field.title == filedtital[i].field.title) {
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
                $scope.total = eval(p);
                document.getElementById(filedtital[i].field.title).value = $scope.total.toFixed(2);

            };
        }
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
    $scope.save = function (formBuilder) {

        if (formBuilder.$invalid) {

            return $scope.showErrorMendodaryFieldsModel();
        }
        if ($scope.updatereason.form) {
            $scope.updatereason.form_id = $scope.updatereason.form.id
            delete $scope.updatereason.form;
        }

        $scope.updatereason.reason = $scope.data.reasonUpdate;
        entryupdate = $scope.updatereason;
        entryupdate.$save();

        if ($scope.photo.length) {
            for (let pic = 0; pic < $scope.photo.length; pic++) {
                $scope.photoselected.push($scope.photo[pic]);
            }

        }


        var Entry = R.get('entries');
        var Value = R.get('entry_values');
        var DefaultValue = R.get('entry_default_values');
        var EntryVersion = R.get('entry_versions');

        var masterEntryValue = R.get('master_entry_values');
        var masterEntry = R.get('master_entries');
        var masterEntryVersions = R.get('master_entry_versions');

        var entry = new Entry();
        entry.form_id = $scope.formID;
        entry.reason = $scope.data.reasonUpdate;
        entry.display_id = $scope.countEntries ? $scope.countEntries : null;
        var values = [];
        var entryvalues = [];

        entry.$save().then(function (r) {


            var fileValues = [];
            R.get('entry_versions').query({ entry_id: entryId }, function (ver) {
                var vdata = new EntryVersion();
                var versionnumber = []
                vdata.entry_id = entryId;
                for (var v in ver) {
                    if (v == '$promise') {
                        break;
                    }
                    versionnumber.push(ver[v].version);
                }

                vdata.version = Math.max.apply(null, versionnumber) + 1;

                vdata.$save().then(function (verfinaldata) {

                    for (let i = 0; i < $scope.data.form_fields.length; i++) {
                        let x = $scope.data.form_fields[i];
                        let evvalue = new Value();

                        evvalue.form_id = r.form.id;
                        evvalue.entry_id = r.id;
                        evvalue.entry_version_id = verfinaldata.id;
                        evvalue.form_field_id = x.id;

                        if (x.field.field_type.id == 5) {
                            $scope.data.entries[x.id] = $scope.selection[x.id].join(',');
                        }
                        if ($scope.textfields.length && x.field.field_type.id == 1 && x.is_multiple) {
                            for (var text = 0; text < $scope.textfields.length; text++) {
                                $scope.textdata.push($scope.textitem[text]);
                            }
                        }
                        if ($scope.numberfields.length && x.field.field_type.id == 2 && x.is_multiple) {
                            for (var number = 0; number < $scope.numberfields.length; number++) {
                                $scope.numberdata.push($scope.numberitem[number]);
                            }
                        }

                        if ($scope.filefields.length && x.field.field_type.id == 8 && x.is_multiple) {

                            for (var filed = 0; filed < $scope.filefields.length; filed++) {
                                var f = $scope.fileitem[filed];
                                fileValues.push($scope.uploadFile(f, x.id));
                            }
                        }

                        if (x && x.field && x.field.field_type && x.field.field_type.id == 8 && !x.is_multiple) {
                            var file = $scope.data.entries[x.id];
                            fileValues.push($scope.uploadFile(file, x.id));
                        }

                        if ($scope.textarea.length && x.field.field_type.id == 9 && x.is_multiple) {
                            for (var area = 0; area < $scope.textarea.length; area++) {
                                $scope.textAreadata.push($scope.textareaitem[area]);
                            }
                        }

                        if (x.field.field_type.id == 9 && x.is_multiple) {
                            $scope.data.entries[x.id] = $scope.textAreadata.join(',');
                        }
                        if (x.field.field_type.id == 1 && x.is_multiple) {
                            $scope.data.entries[x.id] = $scope.textdata.join(',');
                        }
                        if (x.field.field_type.id == 2 && x.is_multiple) {
                            $scope.data.entries[x.id] = $scope.numberdata.join(',');
                        }
                        if (x.field.field_type.id == 10) {
                            $scope.data.entries[x.id] = String(document.getElementById(x.field.title).value);
                        }

                        // if (x.field.field_type.id == 8 && x.is_multiple) {
                        //     
                        //     $scope.filedata.push($scope.data.entries[x.id]);
                        //     for (let filed = 0; filed < $scope.filedata.length; filed++) {
                        //         let f = $scope.filedata[filed];
                        //         fileValues.push($scope.uploadFile(f, x.id));
                        //     }
                        // }
                        if (x.field.field_type.id == 11 && $scope.profilePic[x.field.title]) {
                            fileValues.push($scope.photoupload($scope.profilePic[x.field.title], x.id));
                        }
                        if (typeof evvalue.entry_value == 'object' && x && x.field && x.field.field_type && (x.field.field_type.type == 'date' || x.field.field_type.type == 'time')) {
                            $scope.data.entries[x.id] = evvalue.entry_value.toISOString();
                        }




                        // var flag = false;
                        if (x.field.field_type.id == 6 || x.field.field_type.id == 7 || x.field.field_type.id == 8 || x.field.field_type.id == 11) {
                            evvalue.entry_value = $scope.data.entries[x.id];
                            evvalue.$save();
                        } else {
                            /*$http.post(S.baseUrl + '/encrypt/data', { val: $scope.data.entries[x.id] })
                                .then(function (encrData) {
                                    console.log(encrData)
                                    if (encrData) {
                                        // $scope.newEntry=[];
                                        evvalue.entry_value = encrData.data;
                                        evvalue.form_field_id = x.id
                                        // entryvalues.push(evvalue);
                                        evvalue.$save();
                                        // flag = true
                                        // });
                                    }
                                }, function (e) { });*/
                                
                            evvalue.entry_value = $scope.data.entries[x.id];
                            evvalue.form_field_id = x.id;
                            evvalue.$save();    
                        }
                        if (x.field.field_type.id == 8) {
                            $scope.newEntry[x.field.title] = []

                        } else if (x.field.field_type.id == 11) {
                            $scope.newEntry[x.field.title] = []
                        } else {
                            $scope.newEntry[x.field.title] = []
                            $scope.newEntry[x.field.title].push($scope.data.entries[x.id])
                        }

                    }


                    for (let i = 0; i < $scope.data.form_default_fields.length; i++) {

                        let x = $scope.data.form_default_fields[i];
                        let evdvalue = new DefaultValue();
                        evdvalue.form_id = r.form.id;
                        evdvalue.entry_id = r.id;
                        evdvalue.entry_version_id = verfinaldata.id;
                        evdvalue.form_default_field_id = x.id;

                        if (typeof evdvalue.entry_value == 'object' && x && x.field_type && (x.field_type.type == 'date' || x.field_type.type == 'time')) {
                            $scope.data.default_entries[x.id] = evdvalue.entry_value.toISOString();
                        }
                        // if (x.default_field.field_type.id == 12) {

                        //     let k;

                        //     let k2

                        //     k = $scope.data.default_entries[x.id];

                        //     if (k && k != undefined || k != null) {

                        //         let w = []

                        //         let r1 = $scope.data.master_entry_values

                        //         for (let k1 = 0; k1 < r1.length; k1++) {
                        //             if (r1[k1].master_entry_value == k) {
                        //                 k2 = r1[k1].master_entry.id
                        //             }
                        //         }

                        //         for (j = 0; j < r1.length; j++) {

                        //             if (r1[j].master_entry.id == k2) {
                        //                 w.push(r1[j])
                        //             }
                        //         }

                        //         let d1 = [];
                        //         for (let m = 0; m < w.length; m++) {
                        //             if (!d1[w[m].master_entry.id]) d1[w[m].master_entry.id] = [];
                        //             if (!d1[w[m].master_entry_version.master_entry.id][w[m].master_entry_version.id]) d1[w[m].master_entry_version.master_entry.id][w[m].master_entry_version.id] = [];
                        //             d1[w[m].master_entry_version.master_entry.id][w[m].master_entry_version.id] = w[m];
                        //         }

                        //         let d2 = [];

                        //         for (let p in d1) {
                        //             let len = d1[p].length - 1;
                        //             if (len >= 0) d2[p] = d1[p][len];
                        //         }

                        //         evdvalue.entry_value = d2[k2].master_entry.id;
                        //     }

                        // }
                        // else {
                            evdvalue.entry_value = $scope.data.default_entries[x.id];
                        // }


                        evdvalue.entry_value = $scope.data.default_entries[x.id];
                        values.push(evdvalue.$save());

                        $scope.newmasterEntry[x.default_field.title] = [];
                        $scope.newmasterEntry[x.default_field.title].push($scope.data.default_entries[x.id]);

                    }

                    $q.all(fileValues).then(function () {

                        for (let i = 0; i < $scope.data.form_fields.length; i++) {
                            let x = $scope.data.form_fields[i];
                            if ($scope.uploadedFiles[x.id]) {
                                if (x && x.field && x.field.field_type && (x.field.field_type.id == 8 || x.field.field_type.id == 11) && x.is_multiple) {
                                    let value = new Value();
                                    value.form_id = x.form.id;
                                    value.entry_version_id = verfinaldata.id
                                    value.entry_id = r.id;
                                    value.form_field_id = x.id;

                                    value.entry_value = $scope.uploadedFiles[x.id];
                                    $scope.newEntry[x.field.title].push($scope.uploadedFiles[x.id])
                                    values.push(value.$save());
                                }
                                if (x && x.field && x.field.field_type && (x.field.field_type.id == 8 || x.field.field_type.id == 11) && !x.is_multiple) {
                                    let value = new Value();
                                    value.form_id = x.form.id;
                                    value.entry_version_id = verfinaldata.id
                                    value.entry_id = r.id;
                                    value.form_field_id = x.id;

                                    value.entry_value = $scope.uploadedFiles[x.id];
                                    $scope.newEntry[x.field.title].push($scope.uploadedFiles[x.id])
                                    values.push(value.$save());
                                }
                            }
                        }
                        
                        var fDefaultFields = {}
                        var vl = {}
            
                        fDefaultFields = $scope.data.form_default_fields;
            
                        for (let a = 0; a < fDefaultFields.length; a++) {
                            if ($scope.data.master_entry_values) {
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
                        for (let i = 0; i < fDefaultFields.length - 1; i++) {
            
                            let x = fDefaultFields[i];
                          
                            var mEntry = new masterEntry();
                            mEntry.master_id = x ? x.master.id : null;
            
                            if (x && x.default_field.field_type.id != 12 && $scope.data.default_entries[x.id] && $scope.data.default_entries[x.id] != null) {
            
                                var mvalues = $scope.masterValues[x.default_field.id] || null;
            
                                if ($scope.data.default_entries[x.id] && $scope.data.default_entries[x.id] != undefined && mvalues) {
                                    if (mvalues.includes(String($scope.data.default_entries[x.id]))) { }
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
                                                    mastervalue.master_entry_value = $scope.data.default_entries[x.id];
                                                }
            
                                                values.push(mastervalue.$save());
                                            });
                                        });
                                    }
                                }
                            }
                        }
                        $timeout(function () {

                            if ($scope.data.form.sendEmailAlert) {
                            	
                            	$scope.userid = [];
                                // if(flag){
                                var changed = [];
                                let flag = false;
                                // var changedMaster=[];

                                for (let i = 0; i < $scope.oldEntries.length; i++) {
                                    if ($scope.oldEntries[i] && $scope.oldEntries[i].entry_value != $scope.newEntry[$scope.oldEntries[i].form_field.field.title][0] && $scope.newEntry[$scope.oldEntries[i].form_field.field.title][0] != undefined) {
                                        flag = true
                                        changed[$scope.oldEntries[i].form_field.field.title] = []
                                        changed[$scope.oldEntries[i].form_field.field.title].push($scope.newEntry[$scope.oldEntries[i].form_field.field.title][0])
                                    } else {
                                        // flag=false
                                        console.log('no def');
                                    }

                                }
                                for (let i = 0; i < $scope.oldMasterentry.length; i++) {

                                    if ($scope.oldMasterentry[i] && $scope.oldMasterentry[i].entry_value != $scope.newmasterEntry[$scope.oldMasterentry[i].form_default_field.default_field.title] && $scope.newmasterEntry[$scope.oldMasterentry[i].form_default_field.default_field.title] != undefined) {
                                        flag = true
                                        changed[$scope.oldMasterentry[i].form_default_field.default_field.title] = [];
                                        changed[$scope.oldMasterentry[i].form_default_field.default_field.title].push($scope.newmasterEntry[$scope.oldMasterentry[i].form_default_field.default_field.title]);
                                    } else {
                                        console.log('no def');
                                    }
                                }

                                // }
                                if (flag && changed) {
                                    if ($scope.data.form.UserId) {
                                        $scope.userid = $scope.data.form.UserId.split(',');
                                    }
									
									if($scope.userid.length > 0) {
										R.get('users').query({}, function (results) {

	                                        for (let i = 0; i < $scope.userid.length; i++) {
	                                            $scope.formUsers.push(results.filter(
	                                                function (e) {
	                                                    return e.id == $scope.userid[i];
	                                                }
	
	                                            ));
	
	                                        }
	                                        console.log($scope.formUsers);
	                                        var output = "<table border='1' width='500' cellspacing='0'cellpadding='5'> <tr><th>Field</th><th>Value</th></tr>";
	                                        for (let i in changed) {
	                                            output = output + "<tr>";
	                                            output = output + "<td>" + i + "</td>" + "<td>" + changed[i] + "</td>";
	                                            output = output + "</tr>";
	                                        }
	                                        output = output + "</table>";
	
	                                        for (let i = 0; i < $scope.formUsers.length; i++) {
	                                        	if($scope.formUsers[i].length != 0) {
	                                        		$http.post(S.baseUrl + '/send/mail', { to: $scope.formUsers[i][0].email, subject: 'A record has been changed', template: 'record_change', first_name: $scope.formUsers[i][0].first_name, last_name: $scope.formUsers[i][0].last_name, from_name: $scope.data.form.title, signature: 'Forms Team', content: output })
	                                                	.then(function (r) {
	
	                                                	}, function (e) { });
	                                        	}
	                                            
	                                        }
	
	                                    });
									}
									
                                    
                                }



                            }
                        }, 1);
                    }, function (e) { });
                    // }


                });

                $q.all(values).then(function (r) {

                    $scope.showFormSavedModal();
                }, function (e) {
                    $scope.showErrorModal();
                });

            });

        });

        $q.resolve(entryvalues).then(function (res) {
            // console.log("entryvalues", res);


        });

    }

    $scope.savedModalOptions = {
        header: 'Updated!', // changed by sanjoli from saved to updated
        text: 'Your entry has been updated successfully!', // changed by sanjoli from saved to updated
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function () {
            $location.path('forms/' + $scope.formID + '/records');
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function () { }
    }


    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of forms.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            $location.path('forms/' + $scope.formID + '/records');
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

    $scope.showCancelFormModal = function () {
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
