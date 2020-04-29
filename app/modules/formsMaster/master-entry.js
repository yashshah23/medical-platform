//app.controller('masterEntryControllerBase', ControllerFactory('master_entry_values'));

app.controller('formsMasterEntryController', function ($scope, $rootScope, $timeout, $http, R, S, $location, $q, $routeParams) {

    var masterId = $routeParams.id;
    $scope.data = {};
    $scope.data.entries = {};
    $scope.data.default_entries = {};
    $scope.countEntries = 1;
    $scope.data.masterDataSource = {};
    $scope.data.parentMasterArray = {};

    $scope.load = function () {

        R.get('master/' + masterId).get(function (r) {
            $scope.data.master = r;
        }, function (e) {
            console.log(e);
        });


        R.get('master_entries/').query({}, function (r) {
            $scope.data.master_entries = r;
            for (let i = 0; i <= r.length; i++) {
                $scope.countEntries = r.length + 1;
            }
        }, function (e) {
            console.log(e);
        });

        R.get('default_fields').query({
            // master_id: masterId 
        }, function (r) {

            for (let i = 0; i < r.length; i++) {
                for (j = 0; j < r.length; j++) {
                    if (r[i].id == r[j].title) {
                        r[j].title = r[i].title
                    }
                }
            }

            $scope.data.default_fields = r.filter(e => e.master.id == masterId)


        }, function (e) { });

        R.get('default_field_datasource').query({ master_id: masterId }, function (r) {
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
        }, function (e) {

        });
        R.get('master_entry_values').query({}, function (r) {
            
            $scope.data.master_entry_values = r

            for (i = 0; i < r.length; i++) {
                if ($scope.data.parentMasterArray[r[i].default_field.title] == undefined) $scope.data.parentMasterArray[r[i].default_field.title] = [];
                if (r[i].master_entry_version.id == $scope.versions[r[i].master_entry.id][0]) {
                    $scope.data.parentMasterArray[r[i].default_field.title].push(r[i].master_entry_value)
                }
            }
        }, function (e) { });

    }

    $scope.checkIsPrimaryExist = function (value, fieldTitle, fieldId) {

        var a = {};
        console.log(fieldId);

        a = $scope.data.master_entry_values.filter(e => e.master.id == masterId)

        for (i = 0; i < a.length; i++) {
            if (a[i].default_field.is_primary == 1 && a[i].default_field.title == fieldTitle) {
                if (a[i].master_entry_value == value) {
                    $scope.IsPrimaryExistModal();
                }
            }
        }
       // $scope.data.default_entries[fieldId] = '';
    }

    $scope.IsPrimaryExistModalOptions = {
        header: 'Warning!',
        text: 'Value of Entered Fields Already Exists!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            //$location.path('forms-master');
            //$location.path('forms-master/' + masterId + '/entry/list');
            $scope.load();

        },
        showCancel: false
        
    }

    $scope.IsPrimaryExistModal = function () {
        $scope.modalOptions.open($scope.IsPrimaryExistModalOptions);
    }


    $scope.saveData = function (formBuilder) {

        // if (formBuilder.$invalid || $scope.msg != '' || $scope.msgType != '') {
        //     return $scope.showErrorMendodaryFieldsModel();
        // }

        $scope.checkIsPrimaryExist()

        var Entry = R.get('master_entries');
        var Value = R.get('master_entry_values');
        var entryVersions = R.get('master_entry_versions');
        var entry = new Entry();
        entry.master_id = masterId;
        entry.display_id = $scope.countEntries;

        var values = [];

        entry.$save().then(function (r) {

            var versionentry = new entryVersions();
            versionentry.master_entry_id = r.id;
            versionentry.version = 1;

            versionentry.$save().then(function (versiondata) {
                
                // $scope.data.master_entry_values = $scope.data.master_entry_values.filter(e => e.master.id == masterId)
                for (let i = 0; i < $scope.data.default_fields.length; i++) {

                    var x = $scope.data.default_fields[i];

                    var value = new Value();
                    value.master_id = r.master.id;
                    value.master_entry_id = r.id;
                    value.default_field_id = x.id;
                    value.master_entry_version_id = versiondata.id

                    if ($scope.data.default_fields[i].field_type.id == 12) {
                        for (j = 0; j < $scope.data.master_entry_values.length; j++) {
                            if ($scope.data.default_entries[x.id] == $scope.data.master_entry_values[j].master_entry_value) {
                                value.master_entry_value = $scope.data.master_entry_values[j].master_entry.id

                            }
                        }
                    }
                    else {

                        if ($scope.data.master_entry_values) {
                            vl = $scope.data.master_entry_values.filter(e => (e.master.id == r.master.id && e.default_field.is_autoIncrement))
                        } else {
                            vl = 0
                        }

                        if ($scope.data.default_fields[i].is_autoIncrement) {

                            var versionnumber = []

                            if (vl.length > 0) {
                                for (var v in vl) {
                                    if (v == '$promise') {
                                        break;
                                    }
                                    if (vl[v].default_field.is_autoIncrement) {
                                        if (vl[v].master_entry_value == undefined) {
                                            versionnumber.push(0);
                                        }
                                        else {

                                            versionnumber.push(vl[v].master_entry_value);
                                        }
                                    }
                                }

                                value.master_entry_value = Math.max.apply(null, versionnumber) + 1;
                            }
                            else {
                                value.master_entry_value = 1
                            }
                        }
                        else {
                            value.master_entry_value = $scope.data.default_entries[x.id];
                        }

                        // value.master_entry_value = $scope.data.default_entries[x.id];
                    }
                    values.push(value.$save());
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


        });

        $scope.load()
        console.log("hello")

    }

    $scope.savedModalOptions = {
        header: 'Saved!',
        text: 'Your entry has been saved successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function () {
            //$location.path('forms-master');
            $location.path('forms-master/' + masterId + '/entry/list');
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function () {
            //entry.$save()
            clearFieldType();
            // $scope.incrementdata();
          
            $scope.data.default_entries = {};
            $scope.data.entries = {};
            $scope.load();
            // $location.path('forms-master/' + masterId + '/entry');
        }
    }

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


app.controller('formsMasterEntryEditController', function ($scope, $rootScope, $timeout, $http, R, S, $location, $q, $routeParams, $timeout) {

    var entryId = $routeParams.id;
    $scope.data = {};
    $scope.data.entries = {};
    $scope.data.default_entries = {};
    $scope.countEntries = 1;
    $scope.Entry_valueid;
    $scope.masterId;
    $scope.data.entrieIds = {};
    $scope.data.masterDataSource = {};
    $scope.data.parentMasterArray = {};
    $scope.modeaction = `/forms-master/${entryId}/entry/edit` == $location.$$url;

    $scope.load = function () {

        R.get('master_entries').query({}, function (r) {
            $scope.data.masterEntries = r;
            $scope.data.master_entries = r.filter(e => e.id == entryId);
            $scope.countEntries = $scope.data.master_entries[0].display_id;
            $scope.version = $scope.data.master_entries[0].version
            $scope.masterId = $scope.data.master_entries[0].master.id;
        }, function (e) {
            console.log(e);
        });


        R.get('master_entry_versions').query({
        }, function (resu) {
            
            $scope.versions = [];
            // resu.filter(e=> e.master_entry.id == $scope.data.master_entries[0][0].id);
            for (let i = 0; i < $scope.data.masterEntries.length; i++) {
                for (let j = 0; j < resu.length; j++) {
                    if (resu[j].master_entry.id == $scope.data.masterEntries[i].id) {
                        $scope.versions[resu[j].master_entry.id] = [];
                        $scope.versions[resu[j].master_entry.id].push(resu[j].id);
                        if ($scope.versions[resu[j].master_entry.id] == resu[j].master_entry.id) {
                            $scope.versions[resu[j].master_entry.id] = [];
                            $scope.versions[resu[j].master_entry.id].push(resu[j].id);
                        }
                    }
                }
            }
        }, function (e) {

        });

        R.get('master/' + $scope.masterId).get(function (r) {
            $scope.data.master = r;
            $scope.column = r.numberofColumn;
            $scope.autoIncre = r.autoIncrement;
        }, function (e) {
            console.log(e);
        });

        R.get('default_field_datasource').query({ master_id: $scope.masterId }, function (r) {
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

        R.get('default_fields').query({
            //master_id: $scope.masterId 
        }, function (r) {
            for (let i = 0; i < r.length; i++) {
                for (j = 0; j < r.length; j++) {
                    if (r[i].id == r[j].title) {
                        r[j].title = r[i].title
                    }
                }
            }
            $scope.data.default_fields = r.filter(e => e.master.id == $scope.masterId)

        }, function (e) { });



        // $timeout(function () {

            R.get('master_entry_values').query({}, function (r) {

                //r = $scope.data.master_entry_values
                //$rootScope.y = r
                
                for (let i = 0; i < r.length; i++) {
                    for (j = 0; j < r.length; j++) {
                        if (r[i].master_entry.id == r[j].master_entry_value && r[i].default_field.id == r[j].default_field.title && $scope.versions[r[i].master_entry.id][0] == r[i].master_entry_version.id) {
                            r[j].master_entry_value = r[i].master_entry_value
                        }
                    }
                }
                $scope.filtermaster=[];
                for (let i = 0; i < r.length; i++) {
                }

                $scope.data.master_entry_values = r.filter(e => e.master.id == $scope.masterId && e.master_entry.id == entryId );
        
                for (let i = 0; i < $scope.data.master_entry_values.length; i++) {
                    $scope.data.default_entries[$scope.data.master_entry_values[i].default_field.id] = [];
                    $scope.data.default_entries[$scope.data.master_entry_values[i].default_field.id] = $scope.data.master_entry_values[i].master_entry_value;
                }
        
        
                for (let i = 0; i < r.length; i++) {
                    if ($scope.data.parentMasterArray[r[i].default_field.title] == undefined) $scope.data.parentMasterArray[r[i].default_field.title] = [];
                    // $scope.data.parentMasterArray[r[i].default_field.title].push(r[i].master_entry_value)
                    if (r[i].master_entry_version.id == $scope.versions[r[i].master_entry.id][0]) {
                        $scope.data.parentMasterArray[r[i].default_field.title].push(r[i].master_entry_value)
                    }
                }
        
            }, function (e) { });

            R.get('master_entry_values').query({}, function (r) {
            
                $scope.data.entry_values_data = r
    
                for (i = 0; i < r.length; i++) {
                    if ($scope.data.parentMasterArray[r[i].default_field.title] == undefined) $scope.data.parentMasterArray[r[i].default_field.title] = [];
                    if (r[i].master_entry_version.id == $scope.versions[r[i].master_entry.id][0]) {
                        $scope.data.parentMasterArray[r[i].default_field.title].push(r[i].entry_values_data)
                    }
                }
            }, function (e) { });
        // }, 1000);

    }
   
    $scope.checkIsPrimaryExist = function (value, fieldTitle, fieldId) {

        var a = {}

        a = $scope.data.entry_values_data.filter(e => e.master.id == $scope.masterId)

        for (i = 0; i < a.length; i++) {
            if (a[i].default_field.is_primary == 1 && a[i].default_field.title == fieldTitle) {
                if (a[i].master_entry_value == value) {
                    $scope.IsPrimaryExistModal();
                }
            }
        }
        //$scope.data.default_entries[fieldId] = '';
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
    }

    $scope.save = function () {
        if (formBuilder.$invalid) {
            return $scope.showErrorMendodaryFieldsModel();
        }

        var Entry = R.get('master_entries');
        var Value = R.get('master_entry_values');
        var EntryVersion = R.get('master_entry_versions');
        var entry = new Entry();
        entry.master_id = $scope.masterId;

        var values = [];

        //entry.$save().then(function (r) {


        R.get('master_entry_versions').query({ master_entry_id: entryId }, function (ver) {

            var vdata = new EntryVersion();
            var versionnumber = []
            vdata.master_entry_id = entryId;
            for (var v in ver) {
                if (v == '$promise') {
                    break;
                }
                versionnumber.push(ver[v].version);
            }
            vdata.version = Math.max.apply(null, versionnumber) + 1;

            R.get('master_entry_values').query({}, function (result) {

                vdata.$save().then(function (verfinaldata) {

                    for (let i = 0; i < $scope.data.default_fields.length; i++) {

                        var x = $scope.data.default_fields[i];
                        var evdvalue = new Value();
                        evdvalue.master_id = verfinaldata.master_entry.master.id;
                        evdvalue.master_entry_id = verfinaldata.master_entry.id;
                        evdvalue.master_entry_version_id = verfinaldata.id;
                        evdvalue.default_field_id = x.id;

                        if (typeof evdvalue.entry_value == 'object' && x && x.field_type && (x.field_type.type == 'date' || x.field_type.type == 'time')) {
                            $scope.data.default_entries[x.id] = evdvalue.master_entry_value.toISOString();
                        }

                        if ($scope.data.default_fields[i].field_type.id == 12) {
                            for (let i = 0; i < result.length; i++) {
                                    if ($scope.data.default_entries[x.id] == result[i].master_entry_value) {
                                        evdvalue.master_entry_value = result[i].master_entry.id;
                                        
                                        break;
                                    } else {
                                    }                                
                            }
                        }
                        else {
                            evdvalue.master_entry_value = $scope.data.default_entries[x.id];
                        }

                        values.push(evdvalue.$save());

                    }
                });

                $q.all(values).then(function (r) {
                    $scope.showFormSavedModal();
                }, function (e) {
                    $scope.showErrorModal();
                });
            });
        });
    }

    $scope.savedModalOptions = {
        header: 'Updated!',
        text: 'Your entry has been updated successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function () {
            $location.path('forms-master/' + $scope.masterId + '/entry/list');
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function () {
            //$location.path('forms-master/' + $scope.masterId + '/entry');
            //versionentry.$save()
        }
    }

    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Masters.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function () {
            $location.path('forms-master/' + $scope.masterId + '/entry/list');
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