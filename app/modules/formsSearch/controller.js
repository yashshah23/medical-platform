//An example of Angular $http
app.controller('formsSearchController', function ($scope, $rootScope, $http, D, R, H, S, $timeout) {
	$scope.data = {};
	$scope.data.filters = [];
	$scope.forms = [];
	$scope.selectedForm;
	$scope.selectedMaster;
	$scope.data.results = [];
	$scope.entryv = {};
	$scope.currentUserId = $rootScope.currentUser.id;
	$scope.CurrentUserAdmin = false;
	if($rootScope.currentUser.role == 'admin') {
		$scope.CurrentUserAdmin = true;
	}
	//$scope.norecord = false;
	$scope.gridOptions = {
		enableSorting: true,
		fastWatch: true,
		columnDefs: [
			],
		data: [],
		enableFiltering: true,
		enableGridMenu: true,
		enableSelectAll: true,
		exporterCsvFilename: 'myFile.csv',
		exporterPdfDefaultStyle: {
			fontSize: 9
		},
		exporterPdfTableStyle: {
			// margin: [30, 30, 30, 30]
			marginTop: 30,
			whiteSpace: 'nowrap'

		},
		exporterPdfTableHeaderStyle: {
			fontSize: 10,
			bold: true,
			italics: true,
			color: 'red',
			whiteSpace: 'nowrap'
		},
		exporterPdfHeader: {
			text: S.productName,
			style: 'headerStyle'
		},
		exporterPdfFooter: function (currentPage, pageCount) {
			return {
				text: currentPage.toString() + ' of ' + pageCount.toString(),
				style: 'footerStyle'
			};
		},
		exporterPdfCustomFormatter: function (docDefinition) {
			docDefinition.styles.headerStyle = {
				fontSize: 22,
				bold: true,
				whiteSpace: 'nowrap'

			};
			docDefinition.styles.footerStyle = {
				fontSize: 10,
				bold: true
			};
			return docDefinition;
		},
		exporterPdfOrientation: 'portrait',
		exporterPdfPageSize: 'LETTER',
		exporterPdfMaxGridWidth: 400,
		exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
		exporterExcelFilename: 'myFile.xlsx',
		exporterExcelSheetName: 'Sheet1',
		onRegisterApi: function (gridApi) {
			//$scope.gridApi = gridApi;
		}
	};

	$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(response) {
		$scope.user_groups = response.data;
        R.get('forms').query({}, function (r) {
			$scope.forms = r;
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
			console.log($scope.userIdsGroups);
		});
		
    });
	
	

	R.get('master').query({}, function (res) {
		$scope.masters = res;
	});

	R.get('default_fields').query({}, function (res) {
		$scope.default_fields = res;
	});
	// $scope.changeForm = function () {

	R.get('entry_versions').query({}, function (versions) {

		let id = versions.map(e => e.entry.id);
		id = [...new Set(id)];
		var groupBy = function (xs) {
			return xs.reduce(function (rv, x) {
				(rv[x['entry']['id']] = rv[x['entry']['id']] || []).push(x);
				return rv;
			}, {});
		};
		var v = [];
		var data = groupBy(versions);
		for (let j = 0; j < id.length; j++) {
			for (let i = 0; i < data[id[j]].length; i++) {
				if (!v[data[id[j]][i].entry.id]) {
					v[data[id[j]][i].entry.id] = [];
					v[data[id[j]][i].entry.id] = data[id[j]][i].id

				} else {
					v[data[id[j]][i].entry.id] = data[id[j]][i].id
				}
			}
		}
		$scope.entryv = v
	});
	// }



	$scope.changeMaster = function (masterid) {
		for (let i = 0; i < masterid.length; i++) {
			R.get('default_fields').query({ master_id: masterid[i] }, function (r) {
				$scope.selectedMaster
				$scope.data.masters = r;
				$scope.data.criteria = [];
				var maxCol = 3;
				var len = $scope.data.masters.length;
				var bunch = Math.ceil(len / 3);
				for (var i = 0; i < bunch; i++) {
					$scope.data.criteria[i] = [];
					for (var j = 0; j < maxCol; j++) {
						if (r[(maxCol * i) + j]) {
							$scope.data.criteria[i][j] = r[(maxCol * i) + j];
						}
					}
				}
			});

		}
	}


	$scope.search = function (searchform) {

		var maxCol = 3;
		var c = '';
		if ($scope.data.criteria) {

			for (var i = 0; i < $scope.data.criteria.length; i++) {
				var r = $scope.data.criteria[i];
				for (var j = 0; j < maxCol; j++) {
					var x = r[j];
					if (x && x.value) {
						$scope.data.filters[x.title] = x.value;
						c = c + x.title + '=' + x.value + '&';
					}
				}
			}

			//c = c.substring(0,c.length - 1);
		}


		// $http.get(S.baseUrl + '/entry_values/' + c)
		// // $http.get(SETTINGS.baseUrl + '/entry_default_values')
		// .then(function (result, e) {
		// 		 $scope.searchbyform =result.data ;
		// 		 console.log($scope.searchbyform);
		// 		$http.post(S.baseUrl + '/encrypt/data', { dec: result.data })
		// 						.then(function (res) {
		// 							if (res) {
		// 								//r.data[i].entry_value = res.data;
		// 								//console.log(res.data);
		// 							}
		// 							//console.log(res)
		// 						}, function (e) { });


		// })
		//console.log(c);
		$scope.newurl = '';
	 
		if (c != ''){
         	$scope.newurl = 'form_id=' + $scope.selectedForm + '&' + c;
		}
        else {
            $scope.newurl = 'form_id=' + $scope.selectedForm;
		}

		$http.get(S.baseUrl + '/entry_default_values/search?' + $scope.newurl)			// $http.get(SETTINGS.baseUrl + '/entry_default_values')
				.then(function (r, e) {
				  
				$scope.norecord = false;
 				 if (Number(r.data.form_id) <= 0 || r.data.length > 0 ) {
				 
				 
                    $scope.norecord = false;
					r.data = r.data.filter(e => $scope.entryv.includes(Number(e.version)));
					for (let i = 0; i < $scope.default_fields.length; i++) {
						for (let j = 0; j < r.data.length; j++) {
							if (r.data[j].field_title == $scope.default_fields[i].id) {
								r.data[j].field_title = $scope.default_fields[i].title
							}
						}
					}
					for (let i = 0; i < r.data.length; i++) {
						// r.data[i].form_default_id ||
						if (r.data[i].field_type_id == 6 || r.data[i].field_type_id == 7 || r.data[i].field_type_id == 8 || r.data[i].field_type_id == 10 || r.data[i].field_type_id == 11 || r.data[i].field_type_id == 12) {
							
							// if (r.data[i].field_type_id == 6) {
							// 	let d = new Date(r.data[i].entry_value);
							// 	r.data[i].entry_value = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
							// } else if (r.data[i].field_type_id == 7) {
							// 	let t = new Date(r.data[i].entry_value);
							// 	r.data[i].entry_value = t.getHours() + ':' + t.getMinutes()
							// }
							// else {
							r.data[i].entry_value = r.data[i].entry_value;
							// }
						} else {
							/*$http.post(S.baseUrl + '/encrypt/data', { dec: r.data[i].entry_value })
								.then(function (res) {
									if (res) {
										r.data[i].entry_value = res.data;
										//console.log(res.data);
									}
									//console.log(res)
								}, function (e) { });*/
							r.data[i].entry_value = r.data[i].entry_value;	
						}
					}
				}
				 else {

				 	$scope.norecord = true;
				 }
				$timeout(function () {
					if ($scope.selectedForm) {
						var data = [];
						if (r.data.length > 0) {
							
							for (let i = 0; i < $scope.selectedForm.length; i++) {
								data.push(r.data.filter(e => e.form_id == $scope.selectedForm[i]));
							}
							$scope.data.results = [].concat(...data);
						} else {
							$scope.data.results.push(r.data);
						}
					} else {
						$scope.data.results = r.data;
						console.log(r.data);
					}
					$scope.data.assortedResults = {};
					$scope.data.columnDefs = {};
					for (var i = 0; i < $scope.data.results.length; i++) {
						var x = $scope.data.results[i];
						if (!$scope.data.assortedResults[x.form_title]) {
							$scope.data.assortedResults[x.form_title] = {};
						}
						if (!$scope.data.assortedResults[x.form_title][x.entry_id]) {
							$scope.data.assortedResults[x.form_title][x.entry_id] = {};
						}
						$scope.data.assortedResults[x.form_title][x.entry_id][x.field_title] = x.entry_value;
						if (x.field_type_id == 8) {
							 
							$scope.data.assortedResults[x.form_title][x.entry_id][x.field_title] = x.entry_value.replace('uploads/files/', '');
						}
						$scope.data.columnDefs[x.field_title] = true;
						//$scope.gridOptions.columnDefs.push({name: x.field_title, width: x.field_title.length*2});
					}
					$scope.data.flatResults = [];
					$scope.data.columnDefArr = [];
					for (var i in $scope.data.columnDefs) {
						$scope.data.columnDefArr.push({ field: i, displayName: i, width: 120, filters: [{  
            				placeholder: 'Search'
        				}]});
					}

					for (var t in $scope.data.assortedResults) {
						for (var e in $scope.data.assortedResults[t]) {
							var v = $scope.data.assortedResults[t][e];
							// v.entry_id = e;
							v.form_title = t;
							$scope.data.flatResults.push(v);
							//$scope.gridOptions.data.push(v);
						}
					}
					$scope.gridOptions.columnDefs = $scope.data.columnDefArr;
					$scope.gridOptions.data = $scope.data.flatResults;

				}, 1);
			}, function (e) { });



	}


});