/*global app*/
app.controller('homeController', function ($scope, $rootScope, $location, H, R, $http, S) {

	// $controller('homeControllerBase', {
	// 	$rootScope:$rootScope
	// });

    $('.collapsible').collapsible();
    
	$scope.H = H;
	$scope.M = H.M;

	$scope.data = {
		counters: {
			formsCounter: {
				title: 'Forms',
				value: '...',
				icon: 'assignment_turned_in',
				background: 'bg-purple',
				color: 'white-text',
				action: 'forms',
				allowedRoles: ['user', 'admin', 'editor', 'creator', 'viewer']
			},
			proceduresCounter: {
				title: 'Procedures',
				value: '...',
				icon: 'event_note',
				background: 'bg-brown',
				color: 'white-text',
				action: 'forms-procedures',
				allowedRoles: ['user', 'admin', 'editor', 'creator', 'viewer']
			},
			display_chartsCounter: {
				title: 'Reports',
				value: '...',
				icon: 'pie_chart',
				background: 'bg-green',
				color: 'white-text',
				action: 'reporthome',
				allowedRoles: ['user', 'admin', 'editor', 'creator', 'viewer']
			},
			/* groupsCounter: {
				title: 'Search & Reports',
				value: '...',
				icon: 'group',
				background: 'bg-pink',
				color: 'white-text',
				action: 'forms-search',
				allowedRoles: ['admin']
			}, */
			organizationsCounter: {
				title: 'Organizations',
				value: '...',
				icon: 'people_outline',
				background: 'bg-green',
				color: 'white-text',
				action: 'organizations',
				allowedRoles: ['superadmin']
			}
		},
		bgColors: [
			"bg-blue",
			"bg-red",
			"bg-teal",
			"bg-orange",
			"bg-cyan",
			"bg-brown",
			"bg-pink",
			"bg-purple",
			"bg-green"
			// "bg-light-blue",
			// "bg-amber",
			// "bg-lime",
			// "bg-yellow",
			// "bg-indigo",
			// "bg-grey",
		]

	};
	
	function getNextNumber(n) {
		var m = n % $scope.data.bgColors.length;
		return m;
	}
	
	function randomizeTileColors() {
		var count = 0;
		for(var key in $scope.data){
			if($scope.data.hasOwnProperty(key)){
				var val = $scope.data[key];
				if(val.hasOwnProperty('background')){
					val.background = $scope.data.bgColors[getNextNumber(count)];
				}
				count++;
			}
		}
	}
	
	function setCount(resourceName, counterName) {
		R.count(resourceName, function (result) {
			$scope.data.counters[counterName].value = result;
		});
	}
	
	function setCounts(resources) {
		for (var i = 0; i < resources.length; i++) {
			var resourceName = resources[i];
			if(resources[i] == 'forms-procedures') {
				resourceName = 'procedures';	
			} else if(resources[i] == 'reporthome') {
				resourceName = 'display_charts';
			}	
			var counterName = resourceName + 'Counter';
			if($rootScope.currentUser.role != 'admin' && resourceName == 'forms') {
				setCountForms(resourceName, counterName);
			} else if($rootScope.currentUser.role != 'admin' && resourceName == 'display_charts') {
				setCountReports(resourceName, counterName);
			} else if($rootScope.currentUser.role != 'admin' && resourceName == 'procedures') {
				setCountProcedures(resourceName, counterName);
			} else {
				setCount(resourceName, counterName);	
			}
			
		}
	}
	
	function setCountProcedures(resourceName, counterName) {
		$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
			$scope.user_groups = r.data;
			$http.get(H.SETTINGS.baseUrl + '/procedure_forms').then(function(response) {
				var count = 0;
		        $scope.procedure_ids = [];
		        for(var i = 0; i < response.data.length; i++) {
		        	if((response.data[i].form.UserId != undefined && response.data[i].form.UserId.split(',').includes($rootScope.currentUser.id.toString())) || (response.data[i].form.GroupId != undefined && checkGroups(response.data[i].form.GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
		        		if(!$scope.procedure_ids.includes(response.data[i].procedure.id)) {
		        			$scope.procedure_ids.push(response.data[i].procedure.id);
		        			count++;
		        		}
		        	}
		        }
		        $scope.data.counters[counterName].value = count;
		    });
		});    
	}
	
	function setCountReports(resourceName, counterName) {
		$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
			$scope.user_groups = r.data;
			$http.get(H.SETTINGS.baseUrl + '/report_data').then(function(response) {
				var count = 0;
		        $scope.data_report_ids = [];
		        for(var i = 0; i < response.data.length; i++) {
		        	if((response.data[i].data_source.UserId != undefined && response.data[i].data_source.UserId.split(',').includes($scope.currentUser.id.toString())) || (response.data[i].data_source.GroupId != undefined && checkGroups(response.data[i].data_source.GroupId.split(',')))) {
		        		if(!$scope.data_report_ids.includes(response.data[i].charts.id)) {
		        			$scope.data_report_ids.push(response.data[i].charts.id);
		        			count++;
		        		}
		        	}
		        }
				$scope.data.counters[counterName].value = count;
		    });
		});    
	}
	
	function setCountForms(resourceName, counterName) {
		$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
			$scope.user_groups = r.data;
			$http.get(S.baseUrl + '/' + resourceName).then(function(response) {
				var count = 0;
				for(var i = 0; i < response.data.length; i++) {
					if(response.data[i].UserId != undefined && response.data[i].UserId.split(',').includes($rootScope.currentUser.id.toString()) || (response.data[i].GroupId != undefined && checkGroups(response.data[i].GroupId.split(',')))) {
						count++;
					}
				}
				$scope.data.counters[counterName].value = count;
			});
		});	
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
		return userIdsOfGroupsString.join().split(',').includes($rootScope.currentUser.id.toString());
		
	}
	
	$scope.home = function(){
		$location.path('/');
		console.log("in Home function")
	}
	
	function setCountsDefault(){
		var resources = [];
		for (var k in $scope.data.counters) {
			var v = $scope.data.counters[k];
			if(v.allowedRoles.indexOf($rootScope.currentUser.role) > -1){
				resources.push(v.action);
			}
		}
		setCounts(resources);
	}
	
	$rootScope.currentPage = 1;
	
	
	//Random colors for each tile
	//randomizeTileColors();
	
	//Set counts for each tile
	//setCounts(["tasks", "users"]);
	
	//Set counts for each tile automatically, considering the name of the action and the path of the API is same
	setCountsDefault();


});
