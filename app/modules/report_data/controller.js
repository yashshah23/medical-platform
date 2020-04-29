/*global app*/

/* app.component('outerComp',{
    binding:{},
    controller:["report_dataController"],
    template: '<h1>Hello World!</h1>'
    
}) */

app.controller('report_dataController', function ($scope, $route, $rootScope, $http, $location, H, R, $routeParams, $timeout) {
	$('.collapsible').collapsible();
	$scope.H = H;
	$scope.M = H.M;
	$scope.data = {};
	$scope.showChart = [];
	$scope.report_data_chart_type = [];
	$scope.choices = [];
	$scope.number_of_charts = [0];
	$scope.currentUserId = $rootScope.currentUser.id;
	$scope.CurrentUserAdmin = false;
	if($rootScope.currentUser.role == 'admin') {
		$scope.CurrentUserAdmin = true;
	}
	$scope.report_data_data_source = [];
	$scope.report_data_scale_x = [];
	$scope.report_data_name = [];
	$scope.myJson = [];
	$scope.charts_id = [0];
	$scope.multiple_choices = [];
	$scope.multiple_aggregations = [];
	$scope.form_name = [];
	$scope.database = [];
	$scope.result = [];
	$scope.modalOptions = {};
	//Get Tables Name From tabase
	R.get('forms').query({}, function(r){
		$scope.tables = r;
		//console.log(r)
	}); 
	
	//GET all Chart Type
 $scope.load = function(){
	
 }

	$http({
		method : 'GET',
		url : H.SETTINGS.baseUrl + '/bar_type'
	}).then(function(response){
		$scope.bar_data = response.data;
	});

	$scope.selecct_feald = function(x){
		 var table_id = $scope.report_data_data_source[x];
		//Get Tables Column Name From Table
		R.get('form_fields').query({form_id: table_id}, function(r){
			$scope.database[x] =  r;
			if(r[0] != null) {
				$scope.form_name[x] = r[0].form.title;
			}
		});
	};
	$scope.change_bar = function(x){
		var chart_type = $scope.report_data_chart_type[x];
		if(chart_type == 'pie' && $scope.report_data_scale_x[x] != undefined) {
			const result = $scope.database[x].filter(word => word.field.field_type.title == "Number");
			var x_scale = $scope.report_data_scale_x[x];
			const result1 =  result.filter(word => word.field.title != x_scale);
			$scope.multiple_choices[x] = [];
			$scope.multiple_aggregations[x] = [];
			$scope.multiple_choices[x].push(result1[0].field.title);
			$scope.multiple_aggregations[x].push('no_aggr');
			$scope.result[x] = result1;
		}
	};
	$scope.change_x = function(x){
		const result = $scope.database[x].filter(word => word.field.field_type.title == "Number");
		var x_scale = $scope.report_data_scale_x[x];
		const result1 =  result.filter(word => word.field.title != x_scale);
		$scope.multiple_choices[x] = [];
		$scope.multiple_aggregations[x] = [];
		$scope.multiple_choices[x].push(result1[0].field.title);
		$scope.multiple_aggregations[x].push('no_aggr');
		$scope.result[x] = result1;
	};

	
	//Back To Dashboard
	$scope.back = function(){
		$location.path('/reporthome');
	};
 
	$scope.addNewChart = function(x){

		var m =	$scope.number_of_charts;
		m.push(m[m.length - 1] + 1);
		//$scope.choices = [];
		
		// $scope.scale_y = $scope.multiple_choices[x].join(); 
		// //$scope.multiple_choices = []
		// $scope.multiple_choices[x].push($scope.scale_y);
		// console.log($scope.multiple_choices);
	};

	$scope.lastValueDisplay = function(inx) {
		return inx === $scope.number_of_charts.length - 1;
	};

	$scope.removeNewForm = function(idx){
		if ( idx == 0 && $scope.number_of_charts.length == 1) {
			//Do nothing here
		} else {
			$scope.number_of_charts.splice(idx, 1);
			$scope.report_data_chart_type.splice(idx, 1);
			$scope.report_data_data_source.splice(idx, 1);
			$scope.report_data_scale_x.splice(idx, 1);
			$scope.report_data_name.splice(idx, 1);
			$scope.multiple_choices.splice(idx, 1);
			$scope.multiple_aggregations.splice(idx, 1);
			$scope.myJson.splice(idx, 1);
			$scope.database.splice(idx, 1);
			$scope.result.splice(idx, 1);
			for(var i = 0; i < $scope.number_of_charts.length; i++) {
				$scope.number_of_charts[i] = i;
			}
			
		}
	}

	//Show The Chart
	$scope.showData = function(x){
		if($scope.form_name[x] != undefined) {
			$scope.showChart[x] = true;
		}
		var table_name = $scope.report_data_data_source[x];
		var bar_type = $scope.report_data_chart_type[x];
		var x_scale = $scope.report_data_scale_x[x];
		var y_scale = $scope.multiple_choices[x];
		var aggregation = $scope.multiple_aggregations[x];
		
		R.get('entry_values').query({
			form_id: table_name
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
					//console.log(	"grid")
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
				//console.log(seriesArray.length)
				if(bar_type == 'pie') {
					$scope.myJson[x] = {
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
							"text" : "Reports of " + $scope.form_name[x]
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
				} else if(bar_type == 'grid'){
					console.log($scope.multiple_choices.length)
					console.log(seriesArray[0].values.length)
					console.log($scope.multiple_choices)
					console.log(seriesArray)
					
					//if($scope.multiple_choices.length == seriesArray[0].values.length){
					$scope.multiple_choice_altered = []
					$scope.multiple_choice_altered = $scope.multiple_choices;
	
	
					if($scope.multiple_choice_altered[0][0] != x_scale){
	
						for (i=0; i<seriesArray.length; i++){
								seriesArray[i].values.unshift(data_x[i])
						}
						$scope.multiple_choice_altered[0].unshift(x_scale)
					}
					
					//console.log($seriesArray.length)
					//console.log($scope.multiple_choice_altered[0].values.length)
					//console.log(seriesArray);
					//console.log($scope.multiple_choice_altered[0]);
					
					$scope.myJson[x] = {
	
						type : bar_type,
	
						"options":{
							"col-labels": $scope.multiple_choice_altered[0],
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
					
					};//}

				} else {
					$scope.myJson[x] = {
						type : bar_type,
						"globals" : {
							"font-family" : "Roboto, Arial, Tahoma, sans-serif"
						},
						title : {
							"text" : "Reports of " + $scope.form_name[x]
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
	
		}, function (e) { });
		
	};
	
	$scope.showErrorModalReportTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsReportTitle);
    }
    
	$scope.errorModalOptionsReportTitle = {
	        header: '',
	        text: "Please enter the Report's Name!",
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}
	
	$scope.showErrorModalWidgitTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsWidgitTitle);
    }
    
	$scope.errorModalOptionsWidgitTitle = {
	        header: '',
	        text: "Please enter the Widgit's Name!",
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}
	
	$scope.showErrorModalDataSource = function() {
        $scope.modalOptions.open($scope.errorModalOptionsDataSource);
    }
    
	$scope.errorModalOptionsDataSource = {
	        header: '',
	        text: "Please select the Form!",
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}
	
	$scope.showErrorModalChartType = function() {
        $scope.modalOptions.open($scope.errorModalOptionsChartType);
    }
    
	$scope.errorModalOptionsChartType = {
	        header: '',
	        text: "Please select the Chart Type!",
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}
	
	$scope.showErrorModalDataX = function() {
        $scope.modalOptions.open($scope.errorModalOptionsDataX);
    }
    
	$scope.errorModalOptionsDataX = {
	        header: '',
	        text: "Please select the column for X-Axis!",
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}
	
	$scope.saveData =  function() {
		
		if($scope.module_name == '' || $scope.module_name == ' ' || $scope.module_name == undefined) {
			$scope.showErrorModalReportTitle();
			return;
		}
		
		for(var j = 0; j < $scope.number_of_charts.length; j++) {
			if($scope.report_data_name[j] == '' || $scope.report_data_name[j] == ' ' || $scope.report_data_name[j] == undefined) {
				$scope.showErrorModalWidgitTitle();
				return;
			} else if($scope.report_data_data_source[j] == '' || $scope.report_data_data_source[j] == ' ' || $scope.report_data_data_source[j] == undefined){
				$scope.showErrorModalDataSource();
				return;
			} else if($scope.report_data_chart_type[j] == '' || $scope.report_data_chart_type[j] == ' ' || $scope.report_data_chart_type[j] == undefined){
				$scope.showErrorModalChartType();
				return;
			} else if($scope.report_data_scale_x[j] == '' || $scope.report_data_scale_x[j] == ' ' || $scope.report_data_scale_x[j] == undefined){
				$scope.showErrorModalDataX();
				return;
			}
		}

		$http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/display_charts',
			data : {
				"module_name" : $scope.module_name
			}
		}).then(function(response) {
			
			$scope.c_id = response.data.id;

			for(var i = 0; i < $scope.report_data_name.length; i++) {
				var scale_y = $scope.multiple_choices[i].join();
				var aggregations = $scope.multiple_aggregations[i].join();
				$http({
					method : "POST",
					url : H.SETTINGS.baseUrl + '/report_data',
					data : {
						"name" : $scope.report_data_name[i],
						"data_source" : $scope.report_data_data_source[i],
						"chart_type" : $scope.report_data_chart_type[i],
						"scale_x" : $scope.report_data_scale_x[i],
						"scale_y" : scale_y,
						"aggregations": aggregations,
						"charts_id" : $scope.c_id
					},
					header : 'Content-Type: application/json; charset=UTF-8'
				}).then(function(response){
					var isvalid = response.status;
					if(isvalid == 201) {
						$location.path('/reporthome');
					} else {
						alert("Enter a Valid Data");
					}
				});	
			}
		});

			
		//$scope.max_value = $scope.max_value + 1
	//})
	};
   
	$scope.addNewChoice = function(x) {
		$scope.multiple_choices[x].push($scope.result[x][0].field.title);
		$scope.multiple_aggregations[x].push('no_aggr');
	  };
	   
	$scope.removeNewChoice = function(x, idx) {
		if ( idx == 0 && $scope.multiple_choices[x].length == 1) {
    		//Do nothing here
    	} else {
    		$scope.multiple_choices[x].splice(idx, 1);
    		$scope.multiple_aggregations[x].splice(idx, 1);
    	}
	};
	   
	$scope.showAddChoice = function(choice, x) {
		return (choice === $scope.multiple_choices[x].length - 1 && choice < 9);
	};
	
});
