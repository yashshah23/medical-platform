/*global app*/
app.controller('report_showController', function ($scope, $rootScope, $http, $location, $routeParams, H, R, $timeout) {
	$('.collapsible').collapsible();
	var id = $routeParams.id;
	$scope.H = H;
	$scope.M = H.M;
	$scope.myJson = [];
	$scope.data = {};
	$scope.currentUserId = $rootScope.currentUser.id; 
	var parameters = {
        charts_id: id
    };
    var config = {
        params: parameters
    };

	$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
		$scope.user_groups = r.data;
		$http.get(H.SETTINGS.baseUrl + '/report_data', config).then(function(response) {
	        $scope.data_report = [];
	        $scope.data_report_original = response.data;
	        for(var i = 0; i < response.data.length; i++) {
	        	if((response.data[i].data_source.UserId != undefined && response.data[i].data_source.UserId.split(',').includes($scope.currentUserId.toString())) || (response.data[i].data_source.GroupId != undefined && checkGroups(response.data[i].data_source.GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
	        		$scope.data_report.push(response.data[i]);
	        	}
	        }
			//Get Data From Selected Table Name
			rec(0, $scope.data_report);
			
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
    
    function rec(l, data_report) {
	    if(l >= data_report.length) {
	    } else {
	    	var chart_name = data_report[l].name;
	    	var table_name = data_report[l].data_source;
			var bar_type = data_report[l].chart_type;
			var x_scale = data_report[l].scale_x;
			var y_scale = data_report[l].scale_y.split(',');
			var aggregation = data_report[l].aggregations.split(',');
			
			R.get('entry_values').query({
				form_id: table_name.id
			}, function (entryv) {
				var d = [];
				for (let i = 0; i < entryv.length; i++) {
					if (entryv[i].form_field.field.field_type.id == 6 || entryv[i].form_field.field.field_type.id == 7 || entryv[i].form_field.field.field_type.id == 8 || entryv[i].form_field.field.field_type.id == 11) {
						entryv[i].entry_value = entryv[i].entry_value;
					} else {
						/*$http.post(S.baseUrl + '/encrypt/data', { dec: entryv[i].entry_value })
							.then(function (res) {
								if (res) {
									entryv[i].entry_value = res.data;
									
									for (let i = 0; i < entryv.length; i++) {
										//console.log("After: ");
										//console.log(entryv[i]);
										if (!d[entryv[i].entry.id]) d[entryv[i].entry.id] = [];
										if (!d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id]) d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id] = [];
										//console.log(entryv[i].entry_value);
										d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id][entryv[i].form_field.field.title] = entryv[i].entry_value;
										if (entryv[i].form_field.field.field_type.type == "file") d[entryv[i].entry_version.entry.id][entryv[i].form_field.field.title] = entryv[i].entry_value ? entryv[i].entry_value.includes(',') ? entryv[i].entry_value.split(',') : entryv[i].entry_value : null;
										var d2 = [];
										//console.log(d);
										for (var j in d) {
											var len = d[j].length - 1;
											if (len >= 0) d2[j] = d[j][len];
										}
					
									}
									$scope.data.entry_values = d2;
									
								}
								//console.log(entryv[i]);
							}, function (e) { });*/
							
						entryv[i].entry_value = entryv[i].entry_value;
						
						for (let i = 0; i < entryv.length; i++) {
										//console.log("After: ");
										//console.log(entryv[i]);
										if (!d[entryv[i].entry.id]) d[entryv[i].entry.id] = [];
										if (!d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id]) d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id] = [];
										//console.log(entryv[i].entry_value);
										d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id][entryv[i].form_field.field.title] = entryv[i].entry_value;
										if (entryv[i].form_field.field.field_type.type == "file") d[entryv[i].entry_version.entry.id][entryv[i].form_field.field.title] = entryv[i].entry_value ? entryv[i].entry_value.includes(',') ? entryv[i].entry_value.split(',') : entryv[i].entry_value : null;
										var d2 = [];
										//console.log(d);
										for (var j in d) {
											var len = d[j].length - 1;
											if (len >= 0) d2[j] = d[j][len];
										}
					
									}
									$scope.data.entry_values = d2;
					}
					/*console.log("Before: ");
							console.log(entryv[i]);*/
		
					$timeout(function () {
		
						//var d = [];
						for (let i = 0; i < entryv.length; i++) {
							//console.log("After: ");
							//console.log(entryv[i]);
							if (!d[entryv[i].entry.id]) d[entryv[i].entry.id] = [];
							if (!d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id]) d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id] = [];
							//console.log(entryv[i].entry_value);
							d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id][entryv[i].form_field.field.title] = entryv[i].entry_value;
							if (entryv[i].form_field.field.field_type.type == "file") d[entryv[i].entry_version.entry.id][entryv[i].form_field.field.title] = entryv[i].entry_value ? entryv[i].entry_value.includes(',') ? entryv[i].entry_value.split(',') : entryv[i].entry_value : null;
							var d2 = [];
							//console.log(d);
							for (var j in d) {
								var len = d[j].length - 1;
								if (len >= 0) d2[j] = d[j][len];
							}
		
						}
						$scope.data.entry_values = d2;
					}, 0);
		
				}
				
				
				var data_x = ($scope.data.entry_values || []).map(function(item){
						return item[x_scale];
					});
					
					var data_y = [];
					for(let i = 0; i < y_scale.length; i++) {
						data_y[i] = ($scope.data.entry_values || []).map(function(item){
							return item[y_scale[i]];
						});
					}
					
					data_x = data_x.filter(function (el) {
						return el != null;
					});
					
					for(let i = 0; i < data_y.length; i++) {
						data_y[i] = data_y[i].filter(function (el) {
							return el != null;
						});
					}
					
					if(bar_type != 'grid'){
						//console.log("not grid")
	
						for(let i = 0; i < data_y.length; i++) {
							for(let j = 0; j < data_y[i].length; j++) {
								data_y[i][j] = Number(data_y[i][j]);
							}
						}
					} else {
						//console.log("grid")
						for(let i = 0; i < data_y.length; i++) {
							for(let j = 0; j < data_y[i].length; j++) {
								data_y[i][j] = data_y[i][j];
							}
						}
					}
					
					var data_x_unique = [];
					var data_y_new = [];
					var y_scale_new = [];
					var k;
					var index;
					for(let j = 0; j < aggregation.length; j++) {
						k = 0;
						if(aggregation[j] == 'sum') {
							data_y_new[j] = [];
							for(let i = 0; i < data_x.length; i++) {
								if(!data_x_unique.includes(data_x[i])) {
									data_x_unique[k] = data_x[i];
									data_y_new[j][k] = data_y[j][i];
									k++;
								} else {
									index = data_x_unique.indexOf(data_x[i]);
									data_y_new[j][index] += data_y[j][i];
								}
							}
							y_scale_new[j] = y_scale[j] + ' (Sum)';
						} else if(aggregation[j] == 'no_aggr') {
							data_x_unique = data_x;
							data_y_new[j] = data_y[j];
							y_scale_new[j] = y_scale[j];
						} else if(aggregation[j] == 'count') {
							data_y_new[j] = [];
							for(let i = 0; i < data_x.length; i++) {
								if(!data_x_unique.includes(data_x[i])) {
									data_x_unique[k] = data_x[i];
									data_y_new[j][k] = 1;
									k++;
								} else {
									index = data_x_unique.indexOf(data_x[i]);
									data_y_new[j][index] += 1;
								}
							}
							y_scale_new[j] = y_scale[j] + ' (Count)';
						} else if(aggregation[j] == 'min') {
							data_y_new[j] = [];
							for(let i = 0; i < data_x.length; i++) {
								if(!data_x_unique.includes(data_x[i])) {
									data_x_unique[k] = data_x[i];
									data_y_new[j][k] = data_y[j][i];
									k++;
								} else {
									index = data_x_unique.indexOf(data_x[i]);
									if(data_y_new[j][index] > data_y[j][i]) {
										data_y_new[j][index] = data_y[j][i];	
									}
								}
							}
							y_scale_new[j] = y_scale[j] + ' (Minimum)';
						} else if(aggregation[j] == 'max') {
							data_y_new[j] = [];
							for(let i = 0; i < data_x.length; i++) {
								if(!data_x_unique.includes(data_x[i])) {
									data_x_unique[k] = data_x[i];
									data_y_new[j][k] = data_y[j][i];
									k++;
								} else {
									index = data_x_unique.indexOf(data_x[i]);
									if(data_y_new[j][index] < data_y[j][i]) {
										data_y_new[j][index] = data_y[j][i];	
									}
								}
							}
							y_scale_new[j] = y_scale[j] + ' (Maximum)';
						} else if(aggregation[j] == 'avg') {
							data_y_new[j] = [];
							var sumArray = [];
							var countArray = [];
							for(let i = 0; i < data_x.length; i++) {
								if(!data_x_unique.includes(data_x[i])) {
									data_x_unique[k] = data_x[i];
									sumArray[k] = data_y[j][i];
									countArray[k] = 1;
									k++;
								} else {
									index = data_x_unique.indexOf(data_x[i]);
									sumArray[index] += data_y[j][i];
									countArray[index] += 1;
								}
							}
							for(let i = 0; i < data_x_unique.length; i++) {
								data_y_new[j][i] = parseInt(sumArray[i]/countArray[i]);
							}
							y_scale_new[j] = y_scale[j] + ' (Average)';
						}
						
						if(j != aggregation.length - 1) {
							data_x_unique = [];
						}
					
					}
					
					var seriesArray = H.seriesArrayGenerator(bar_type, data_x_unique, data_y_new, x_scale, y_scale_new);
					
					if(bar_type == 'pie') {
						$scope.myJson[l] = {
							type : bar_type,
							"globals" : {
								"font-family" : "Roboto, Arial, Tahoma, sans-serif"
							},
							
						 	tooltip:{
						 		fontSize: '18',
						 	    fontFamily: "Open Sans",
						 	    padding: "5 10",
						 	    text: x_scale + ": %t\n" + y_scale_new + ": %v"
						 	},
							title : {
								"text" : "Reports of " + chart_name
							},
							series : seriesArray,
							scaleX : {
								values : data_x,
								lineColor : "red",
								lineWidth : 2,
								padding : 10,
								margin : 20,
								item : {
									padding : 5
								},
								tick : {
									lineWidth : 2,
									lineColor : "red"
								},
								label : {
									text : x_scale
								}
							},
							scaleY : {
								//maxValue : 10000,
								lineWidth : 2,
								lineColor : "red",
								item : {
									padding : "0 10 0 0"
								},
								label : {
									text : y_scale_new
								}
							},
							legend : {
								align : 'right',
								marker : {
									type : 'circle',
									size : 10,
									cursor : 'pointer'
								},
								item : {
									fontSize : 15,
									cursor : 'pointer'
								}
							},
							plot : {
								barWidth : "50%",
								valueBox: {
							 	    placement: 'out',
							 	    text: x_scale + ": %t\n" + y_scale_new + ": %v",
							 	    fontFamily: "Open Sans"
							 	}
							}
						};
					} else if(bar_type == 'grid')	{

						$scope.multiple_choice_altered = []
						$scope.multiple_choice_altered = y_scale;
						
						$scope.myJson[k] = {
		
							type : bar_type,
		
							"options":{
								"col-labels": y_scale,
								//"col-widths":["6%","21%","21%","21%","9%","22%"],
								"style":{
										".th":{
												"y":"0px",
												"background-color":"#7ca82b",
												"font-color":"#fff",
												"font-size":"18",
												"font-weight":"none",
												"height":"40px"
										}
								}
							},
							series : seriesArray,
						};
					}	else {
						$scope.myJson[l] = {
							type : bar_type,
							"globals" : {
								"font-family" : "Roboto, Arial, Tahoma, sans-serif"
							},
							title : {
								"text" : "Reports of " + chart_name
							},
							series : seriesArray,
							scaleX : {
								values : data_x_unique,
								lineColor : "red",
								lineWidth : 2,
								padding : 10,
								margin : 20,
								item : {
									padding : 5
								},
								tick : {
									lineWidth : 2,
									lineColor : "red"
								},
								label : {
									text : x_scale
								}
							},
							scaleY : {
								//maxValue : 10000,
								lineWidth : 2,
								lineColor : "red",
								item : {
									padding : "0 10 0 0"
								},
								label : {
									text : y_scale_new 
								}
							},
							legend : {
								align : 'right',
								marker : {
									type : 'circle',
									size : 10,
									cursor : 'pointer'
								},
								item : {
									fontSize : 15,
									cursor : 'pointer'
								}
							},
							plot : {
								barWidth : "50%"
							}
						};
					}
					//console.log($scope.myJson[k]);
					//console.log(k + 1);
					rec(l + 1, data_report);
			}, function (e) { });
			
	    }
	}
    
});