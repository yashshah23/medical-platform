/*global angular*/
//Initialize app
var app = angular.module('app', [
							'ngRoute', 
							'ngResource', 
							'ngCookies',
							'ui.bootstrap', 
							'ui.grid', 
							'ui.grid.resizeColumns', 
							'ui.grid.moveColumns', 
							'ui.grid.selection', 
							'ui.grid.exporter', 
							'ui.grid.autoResize', 
							'ngMaterial', 
							'ngMessages',
							'angular-md5',
							'zingchart-angularjs'
							]);
/*global $*/
//JQuery
$(function() {
	$('.sidenav').sidenav({
		closeOnClick: true
	});
	
	$(document).ready(function(){
    	$('.collapsible').collapsible();
	});	
	
	$('select').formSelect();
});

function clearFieldType(){
	$(function(){
		$(".select-dropdown.dropdown-trigger")[0].value = "Choose your option";
	})
}

function selectedFieldType(title){
	$(function(){
		$(".select-dropdown.dropdown-trigger")[0].value=title ;
	})

}

function clearFieldSourceItem(){
	$(function(){
		 
		$("#fieldSourceItem")[0].value = "";
	})
}

$( "#title" ).focus();

function validDate(){
	$(function(){
		var now = new Date();
		var day = ("0" + now.getDate()).slice(-2);
		var month = ("0" + (now.getMonth() + 1)).slice(-2);
		var today = now.getFullYear()+"-"+(month)+"-"+(day) ;
		$("[id$='forfuturedatesdisable']").attr('max', today);
		
		
	});
}

/*global app, RegisterRoutes*/
app.factory('httpRequestInterceptor', function ($rootScope, $q) {
    return {
        request: function (config) {
            $rootScope.loading = true;
            if ($rootScope.currentUser) {
                config.headers['api-key'] = $rootScope.currentUser.token;
                
                if($rootScope.SETTINGS.enableSaaS){
                	//console.log(config);
                    if(config.method == "GET" || config.method == "DELETE" || config.method == "PUT"){
                    	var m = config.url.match(/\.[0-9a-z]+$/i);
                    	var bypassedKeywords = ['ui-grid'];
                    	var bypassedKeywordsMatches = bypassedKeywords.filter(function(p){ return config.url.indexOf(p) > -1});
                        if((m && m.length > 0) || bypassedKeywordsMatches.length > 0){
                        }else{
                        	//console.log("1");
                        	var idx = config.url.lastIndexOf("/");
                        	var idt  = config.url.substr(idx);
	                        if(config.method == "PUT" && isNaN(idt)){
	                        	config.data.secret = $rootScope.currentUser.secret;
	                        }else{
	                        	//console.log("2");
	                            var secret = '/?secret=';
	                            if(config.url.endsWith('/')) secret = '?secret=';
	                            if(config.url.indexOf('?') > -1) secret = '&secret=';
	                            config.url = config.url + secret + $rootScope.currentUser.secret;
	                        }
                        }
                    }
                    else{
                        config.headers['secret'] = $rootScope.currentUser.secret;
                        config.data.secret = $rootScope.currentUser.secret;
                    }
                }
            }
            return config;
        },
        response: function(response){
            //if(response.headers()['content-type'] === "application/json; charset=utf-8"){
                $rootScope.loading = false;
            //}
            return response;            
        },
        responseError: function(response){
            $rootScope.loading = false;
            if(response.status === 401){
            	$rootScope.$emit('loginRequired');
            }
            if(response.status === 503){
            	$rootScope.$emit('outOfService');
            }
            return $q.reject(response);
        }
    };
});

function CustomRoutes(){
    this.routes = RegisterRoutes();
}

app.provider('customRoutes', function() {
    Object.assign(this, new CustomRoutes());

    this.$get = function() {
        return new CustomRoutes();
    };
});

app.config(function ($routeProvider, $resourceProvider, $httpProvider, customRoutesProvider) {
    var routes = customRoutesProvider.routes.customRoutes;

    var easyRoutes = customRoutesProvider.routes.easyRoutes;
    for (var i = 0; i < easyRoutes.length; i++) {
        var r = easyRoutes[i];
        routes.push({route: r, template: 'common/templates/list', controller: r});
        routes.push({route: r + '/new', template: 'common/templates/new', controller: r});
        routes.push({route: r + '/:id', template: 'common/templates/edit', controller: r});
    }

    for (var i = 0; i < routes.length; i++) {
        var r = routes[i];
        //console.log($rootScope.currentUser)
        //if(r.role == $rootScope.currentUser.role){
        $routeProvider.when('/' + r.route, { templateUrl: 'app/modules/' + r.template + '.html', controller: r.controller + 'Controller'});
       //} 
}
    

    $httpProvider.interceptors.push('httpRequestInterceptor');
});

app.run(function ($rootScope, $location, $cookies, H) {
    $rootScope.SETTINGS = H.SETTINGS;

    $rootScope.fieldTypes = H.SETTINGS.fieldTypes;
    
    $rootScope.openRoutes = H.getOpenRoutes();

    $rootScope.$on("$locationChangeStart", function (event, next, current) {
        if (!$rootScope.currentUser) {
            
            var cookie = $cookies.get(H.getCookieKey());
            if (!cookie) {
                if($rootScope.openRoutes.indexOf($location.path()) > -1){} else {
                    $location.path('/sign-in');
                }
            }
            else {
                var cu = JSON.parse(cookie);
                $rootScope.currentUser = typeof cu==='string'? JSON.parse(cu):cu;
            }
        }
    });
    
    $rootScope.$on("loginRequired", function (event, next, current) {
    	$cookies.remove(H.getCookieKey());
		delete $rootScope.currentUser;
		$location.path('/sign-in');
    });

    $rootScope.$on("outOfService", function (event, next, current) {
    	$cookies.remove(H.getCookieKey());
		delete $rootScope.currentUser;
		$location.path('/out-of-service');
    });
    
});
//ControllerFactory helps wrap basic CRUD operations for any API resource
function ControllerFactory(resourceName, options, extras) {
	return function($scope, $rootScope, $http, $routeParams, $location, $mdDialog, H, M, S, R) {
		//Get resource by name. Usually it would be you API i.e. generated magically from your database table.
		var Resource = H.R.get(resourceName);
		//console.log(Resource);
		//Scope variables
		$scope.data = {};
		$scope.data.single = new Resource();
		$scope.data.color = '';
		$scope.data.list = [];
		$scope.data.limit = 10;
		$scope.data.currentPage = 1;
		$scope.data.pages = [];
		$scope.errors = [];
		$scope.MODES = {
			'view': 'view',
			'edit': 'edit',
			'add': 'add'
		};
		$scope.mode = $scope.MODES.view;
		$scope.locked = true;
		$scope.forms = {};
		$scope.H = H;
		$scope.M = M;

		//Set currentRoute
		$scope.currentRoute = (function(){
			var route = $location.path().substring(1);
			var slash = route.indexOf('/');
			if(slash > -1){
				route = route.substring(0, slash);
			}
			return route;
		})();
		
		//console.log($scope.currentRoute);
		
		$scope.currentRouteHref = "#!" + $scope.currentRoute;
		$scope.newRouteHref = "#!" + $scope.currentRoute + "/new";
		$scope.editRouteHref = "#!" + $scope.currentRoute + "/:id";

		//Default error handler
		var errorHandler = function(error) {
			if (error && error.status) {
				switch (error.status) {
					case 404:
						$scope.errors.push({
							message: H.MESSAGES.E404
						});
						break;
					case 422:
						$scope.errors.push({
							message: H.MESSAGES.E422
						});
						break;
					case 405:
						$scope.errors.push({
							message: H.MESSAGES.E405
						});
						break;
					case 400:
						$scope.errors.push({
							message: H.MESSAGES.E400
						});
						break;
					case 500:
						$scope.errors.push({
							message: H.MESSAGES.E500
						});
						break;
					case 401:
						$rootScope.$emit('loginRequired');
					case 403:
						$location.path('unauthorized');
					default:
						$scope.errors.push({
							message: H.MESSAGES.E500
						});
						break;
				}
			}
		};

		//Initializa new single objetc
		$scope.initSingle = function() {
			$scope.data.single = new Resource();
		};

		//Get all rows from your API/table. Provide a query filter in case you want reduced dataset.
		$scope.query = function(q, callback) {debugger
			console.log(q, callback)
			if (!q) {
				q = {};
			}
			Resource.query(q, function(result) {
				if (result) {
					$scope.data.list = result;
					
				}
				if (callback) {
					callback(result);
				}
			}, function(error) {
			    errorHandler(error);
				if (callback) {
					callback(error);
				}
			});
		};
		
		//Get specific record
		$scope.count = function(query, callback) {
			query = query || {
				count: true
			};
			if(!query['count']) query['count'] = true;
			Resource.query(query, function(result) {
				$scope.data.records = result[0].count;
				//console.log("Count: " + result[0].count);
				if (callback) {
					callback(result);
				}
			}, function(error) {
			    errorHandler(error);
				if (callback) {
					callback(error);
				}
			});
		};
		

		//Get specific record
		$scope.get = function(id, callback) {
			Resource.get({
				id: id
			}, function(result) {
				$scope.data.single = result;
				if (callback) {
					callback(result);
				}
			}, function(error) {
			    errorHandler(error);
				if (callback) {
					callback(error);
				}
			});
		};

		//Delete specific record
		$scope.delete = function(obj, callback) {
			if (obj && obj.$delete) {
				if(S.legacyMode){
					$http.post(S.baseUrl + "/" + resourceName + "/delete/", obj).then(function(r){
						if (callback && r.data) {
							callback(r.data);
						}
					}, function(e){
						errorHandler(e);
						if (callback) {
							callback(e);
						}
					});
				} else {
					obj.$delete(function(r) {
						if (callback) {
							callback(r);
						}
					}, function(e) {
						errorHandler(e);
						if (callback) {
							callback(e);
						}
					});					
				}

			} else if (!isNaN(obj)) {
				$scope.get(obj, function(result) {
					if (result && result.$delete) {
						result.$delete();
						if (callback) {
							callback();
						}
					}
				});
			}
		};
		
		$scope.deleteMany = function(resource, obj, callback){
			if(obj){
				var r = resource || resourceName;
				var url = H.SETTINGS.baseUrl + "/" + r + "/";
				if(H.S.legacyMode) url = url + "delete/";
				if(Array.isArray(obj)){
					url = url + "?id=" + JSON.stringify(obj);
				} else {
					if(obj.id){
						url = url + obj.id;	
					}
				}
				if(H.S.legacyMode){
					return $http.post(url, []).then(function(r){
						if(callback){
							callback(r.data);
						}
						return r.data;
					}, function(e){
						errorHandler(e);
						if(callback){
							callback(e.data);
						}
						return e.data;
					});
				} else {
					return $http.delete(url).then(function(r){
						if(callback){
							callback(r.data);
						}
						return r.data;
					}, function(e){
						errorHandler(e);
						if(callback){
							callback(e.data);
						}
						return e.data;
					});
				}
			}

		}

		//Save a record
		$scope.save = function(obj, callback) {
			if (obj && obj.$save) {
				var promise = obj.$save();
				promise.then(function(r) {
					if (callback) {
						callback(r);
					}
				}, function(e){
					errorHandler(e);
					if (callback) {
						callback(e);
					}
				});
			} else if ($scope.data.single) {
				var promise = $scope.data.single.$save();
				promise.then(function(r) {
					if (callback) {
						callback(r);
					}
				}, function(e){
					errorHandler(e);
					if (callback) {
						callback(e);
					}
				});
			}
		};
		
		$scope.post = function(resource, arr, callback){
			var r = resource || resourceName;
			var url = H.SETTINGS.baseUrl + "/" + r;
			if(arr){
				if(H.SETTINGS.enableSaaS){
					arr.map(function(p){
						if(!p.secret) p.secret = $rootScope.currentUser.secret;
					});
				}
				return $http.post(url, arr)
				.then((function (data, status, headers, config) {
					if (callback) {
						callback(data.data);
					}
					return data.data;
	            }), (function (e) {
	            	errorHandler(e);
					if (callback) {
						callback(e.data);
					}
					return e.data;
				}));					
			}
		
		}
		
		$scope.update = function(obj, callback) {
			var url = H.SETTINGS.baseUrl + "/" + resourceName;
			
			if(H.S.legacyMode){
				return $http.post(url + "/update", obj)
				.then((function (data, status, headers, config) {
					if (callback) {
						callback(data.data);
					}
					return data.data;
	            }), (function (e) {
	            	errorHandler(e);
					if (callback) {
						callback(e.data);
					}
					return e.data;
				}));
			} else {
				return $http.put(url, obj)
				.then((function (data, status, headers, config) {
					if (callback) {
						callback(data.data);
					}
					return data.data;
	            }), (function (e) {
	            	errorHandler(e.data);
					if (callback) {
						callback(e.data);
					}
					return e.data;
				}));
				
			}
			
		};

		//Clear errors
		$scope.clearErrors = function() {
			$scope.errors = [];
		};

		//Refresh data
		$scope.refreshData = function() {
			$scope.listAll();
		};
		
		$scope.setActive = function(i){
			return ($rootScope.currentPage == i) ? 'active' : 'waves-effect';
		};
	
		//Load all entries on initialization
		$scope.listAll = function(currentPage){
			if(!$scope.beforeLoadAll) $scope.beforeLoadAll = function(query){
				return query;
			};
			var countQueryParam = {count:false};
			var countQuery = $scope.beforeLoadAll(countQueryParam) || countQueryParam;

			//$scope.loading = true;
			$scope.count(countQuery, function(){
				$scope.loading = true;
				$scope.data.pagesCount = parseInt(($scope.data.records - 1)/ $scope.data.limit) + 1;
				$scope.data.pages = [];
				for (var i = 0; i < $scope.data.pagesCount; i++) {
					$scope.data.pages.push(i + 1);
				}
				if(!currentPage){
					if(!($scope.data.pages.indexOf($rootScope.currentPage) > -1)){
						if($rootScope.currentPage > 0){
							$rootScope.currentPage = $scope.data.pages[$scope.data.pagesCount - 1];
						} else {
							$rootScope.currentPage = 1;
						}
					}
				} else {
					$rootScope.currentPage = currentPage;
				}
				var dataQueryParam = {limit: $scope.data.limit, offset: ($rootScope.currentPage - 1) * $scope.data.limit};
				var dataQuery = $scope.beforeLoadAll(dataQueryParam) || dataQueryParam;
				
			    $scope.query(dataQuery, function(r) {
			    	$scope.loading = false;
			    	if(r && r.length > 0){
				    	var headers = Object.getOwnPropertyNames(r[0]);
				    	$scope.data.listHeadersRaw = headers;
				    	if(headers.indexOf("id") > -1) headers.splice(headers.indexOf("id"), 1);
				    	if(headers.indexOf("secret") > -1) headers.splice(headers.indexOf("secret"), 1);
				    	headers = headers.filter(function(p){ return (p.slice(-3) !== "_id")});
				    	if($scope.removeListHeaders){
				    		var removeHeaders = $scope.removeListHeaders();
				    		for (var i = 0; i < removeHeaders.length; i++) {
				    			var h = removeHeaders[i];
				    			if(headers.indexOf(h) > -1) headers.splice(headers.indexOf(h), 1);
				    		}
				    	}
				    	$scope.data.listKeys = headers;
				    	headers = headers.map(function(p){ return H.toTitleCase(H.replaceAll(p, '_', ' '))});
				    	$scope.setListHeaders(headers);
			    	}
			    	if($scope.onLoadAll) $scope.onLoadAll(r);
			    });
				
			});
		};
		
		//Load entry on initialization
		$scope.loadSingle = function(callback){
			//$scope.loading = true;
		    $scope.get($routeParams.id, function(r) {
		    	if($scope.onLoad) $scope.onLoad(r);
		    	if(callback) callback(r);
		    	//$scope.loading = false;
		    });
		};
		
		
		//Toggle Visibility
		$scope.toggleVisibility = function(item){
		    item.visible = !item.visible;
		};
	
		//Toggle lock
	    $scope.toggleLock = function(){
	        $scope.locked = !$scope.locked;
	    };
	    
	    //Update a single record
	    $scope.updateSingle = function(callback){
			//$scope.loading = true;
	    	if($scope.beforeUpdate) {
	    		$scope.beforeUpdate($scope.data.single, function(r){
		    	var update = true;
		    	if($scope.beforeUpdateBase) update = $scope.beforeUpdateBase();
			    	if(update){
				        $scope.update($scope.data.single, function(r){
				            $scope.locked = true;
				            
				            if(r && r.error){
				            	if($scope.onError){
				            		$scope.onError(r.error, function(e){
										if($scope.onErrorBase) $scope.onErrorBase(e);
						            	return;
				            		});
				            		return;				            		
				            	} else {
					            	if($scope.onErrorBase) $scope.onErrorBase(r.error);
					            	return;
				            	}
				            }
				            
				            if($scope.onUpdate) {
				            	$scope.onUpdate(r, function(r){
				            		if($scope.onUpdateBase) $scope.onUpdateBase(r);		
				            	});
				            } else {
				            	if($scope.onUpdateBase) $scope.onUpdateBase(r);		
				            }
		                    
				            if(callback) callback(r);
							//$scope.loading = false;
				        });
			    	}
	    			
	    		});            
	    	} else {
		    	var update = true;
		    	if($scope.beforeUpdateBase) update = $scope.beforeUpdateBase();
		    	if(update){
				        $scope.update($scope.data.single, function(r){
				            $scope.locked = true;
				            
				            if(r && r.error){
				            	if($scope.onError){
				            		$scope.onError(r.error, function(e){
										if($scope.onErrorBase) $scope.onErrorBase(e);
						            	return;
				            		});
				            		return;				            		
				            	} else {
					            	if($scope.onErrorBase) $scope.onErrorBase(r.data.error);
					            	return;
				            	}
				            }
				            
				            if($scope.onUpdate) {
				            	$scope.onUpdate(r, function(r){
				            		if($scope.onUpdateBase) $scope.onUpdateBase(r);		
				            	});
				            } else {
				            	if($scope.onUpdateBase) $scope.onUpdateBase(r);		
				            }
		                    
				            if(callback) callback(r);
							//$scope.loading = false;
				        });
		    	}
	    	}
	    };	    
	    //Initialize a single record
	    $scope.newSingle = function(callback){
	    	$scope.locked = false;
	    	$scope.initSingle();
	    	if($scope.onInit) $scope.onInit($scope.data.single);
	    	if(callback) callback();
	    };
	    
	    //Save a new single record
	    $scope.saveSingle = function(callback){
	    	//$scope.loading = true;
	    	
	    	if($scope.beforeSave) {
	    		$scope.beforeSave($scope.data.single, function(r){
	    			var save = true;
	    			if($scope.beforeSaveBase) save = $scope.beforeSaveBase();
	    			if(save){
				        $scope.save($scope.data.single, function(r){
				            $scope.locked = true;
				            
				            if(r && r.error){
				            	if($scope.onError){
				            		$scope.onError(r.error, function(e){
										if($scope.onErrorBase) $scope.onErrorBase(e);
						            	return;
				            		});
				            		return;				            		
				            	} else {
					            	if($scope.onErrorBase) $scope.onErrorBase(r.data.error);
					            	return;
				            	}
				            }
				            
				            if($scope.onSave) {
				            	$scope.onSave(r, function(r){
				            		if($scope.onSaveBase) $scope.onSaveBase(r);
				            	});
				            } else {
				            	if($scope.onSaveBase) $scope.onSaveBase(r);	
				            }
				            
				            if(callback) callback(r);
				    		//$scope.loading = false;
				        });
	    			}
	    		});	
	    	} else {
		    	var save = true;
		    	if($scope.beforeSaveBase) save = $scope.beforeSaveBase();
		    	if(save){
			        $scope.save($scope.data.single, function(r){
			            $scope.locked = true;
			            
				            if(r && r.error){
				            	if($scope.onError){
				            		$scope.onError(r.error, function(e){
										if($scope.onErrorBase) $scope.onErrorBase(e);
						            	return;
				            		});
				            		return;
				            	} else {
					            	if($scope.onErrorBase) $scope.onErrorBase(r.data.error);
					            	return;
				            	}
				            }
			            
			            if($scope.onSave) {
			            	$scope.onSave(r, function(r){
			            		if($scope.onSaveBase) $scope.onSaveBase(r);
			            	});
			            } else {
			            	if($scope.onSaveBase) $scope.onSaveBase(r);	
			            }
			            
			            if(callback) callback(r);
			    		//$scope.loading = false;
			        });
		    	}    		
	    	}

	    };
	    
	    //Change a property in single
	    $scope.changeSingle = function(property, value){
	    	this.data.single[property] = value;
	    };
		

		/*Define options
			init:true -> Load all records when the controller loads
		*/
		if (options) {
			$scope.options = options;
			if ($scope.options.init) {
				$scope.query();
			}
		}

		//Any extra stuff you might want to merge into the data object
		if (extras) {
			for (var e in extras) {
				$scope.data[e] = extras[e];
			}
		}
		
		
		//Localized resources
		$scope.textResources = {
			title: {
				single: '',
				list: ''
			},
			templates: {
				edit: '',
				create: '',
				list: ''
			}
		};
		
		$scope.initTextResources = function(listTitle, singleTitle, listTemplate, listItemTemplate, listHeaderTemplate, listFooterTemplate, newTemplate, editTemplate, singleHeaderTemplate, singleFooterTemplate){
			$scope.textResources.title.list = listTitle;
			$scope.textResources.title.single = singleTitle;
			$scope.textResources.templates.list = listTemplate;
			$scope.textResources.templates.listItem = listItemTemplate;
			$scope.textResources.templates.listHeader = listHeaderTemplate;
			$scope.textResources.templates.listFooter = listFooterTemplate;
			$scope.textResources.templates.create = newTemplate;
			$scope.textResources.templates.edit = editTemplate;
			$scope.textResources.templates.singleHeader = singleHeaderTemplate;
			$scope.textResources.templates.singleFooter = singleFooterTemplate;
		};		
		
		$scope.initTextResourcesEasy = function(route, singular){
			if(!route || route == '') {
				route = $scope.currentRoute;
			}
			var plural = route.toUpperCase();
			if(!singular || singular == '') singular = plural.substring(0, plural.length - 1);
			var listTemplate = 'app/modules/' + route + '/list.html';
			var listItemTemplate = 'app/modules/' + route + '/list-item.html';
			var listHeaderTemplate = 'app/modules/' + route + '/list-header.html';
			var listFooterTemplate = 'app/modules/' + route + '/list-footer.html';
			var singleTemplate = 'app/modules/' + route + '/single.html';
			var singleHeaderTemplate = 'app/modules/' + route + '/single-header.html';
			var singleFooterTemplate = 'app/modules/' + route + '/single-footer.html';
		
			$scope.initTextResources(plural, singular, listTemplate, listItemTemplate, listHeaderTemplate, listFooterTemplate, singleTemplate, singleTemplate, singleHeaderTemplate, singleFooterTemplate);
		};
		
		$scope.setTitle = function(t, v){
			$scope.textResources.title[t] = v;
		};

		$scope.getTitle = function(t){
			switch (t) {
				case 'single':
					if($scope.getSingularTitle) return $scope.getSingularTitle();
					return $scope.textResources.title.single;
				case 'list':
					return $scope.textResources.title.list;
				default:
					return $scope.textResources.title.list;
			}
		};
		
		$scope.getTemplate = function(t){
			switch (t) {
				case 'edit':
					return $scope.textResources.templates.edit;	
				case 'new':
					return $scope.textResources.templates.create;	
				case 'list':
					return $scope.textResources.templates.list;	
				case 'list-item':
					return $scope.textResources.templates.listItem;	
				case 'list-header':
					return $scope.textResources.templates.listHeader;	
				case 'list-footer':
					return $scope.textResources.templates.listFooter;	
				case 'single-header':
					return $scope.textResources.templates.singleHeader;	
				case 'single-footer':
					return $scope.textResources.templates.singleFooter;	
				default:
					return '';	
			}
			
		};
		
		$scope.getTableHeaders = function(){
			var headers = [];
			if($scope.data.list && $scope.data.list.length > 0 && $scope.data.list[0]){
				headers = Object.getOwnPropertyNames($scope.data.list[0]);
			}
			return headers;
		};
		
		$scope.setListHeaders = function(headers){
			$scope.data.listHeaders = headers;
		};
		
		$scope.changeListHeaders = function(header, replacement){
			if($scope.data.listHeaders && $scope.data.listHeaders.indexOf(header) > -1){
				$scope.data.listHeaders[$scope.data.listHeaders.indexOf(header)] = replacement;
			}
		};
		
		 $scope.showDialog = function(ev, title, content, okText = "OK", cancelText = "Cancel", okHandler, cancelHandler) {
		    var confirm = $mdDialog.confirm()
		          .title(title)
		          .textContent(content)
		          .ariaLabel('')
		          .targetEvent(ev)
		          .ok(okText)
		          .cancel(cancelText);
		
		    $mdDialog.show(confirm).then(function() {
		      if(okHandler) okHandler();
		    }, function() {
		      if(cancelHandler) cancelHandler();
		    });
		  };
		  
		$scope.onErrorBase = function(obj){
	        $scope.showDialog(null, M.ERROR_TITLE, M.SAVED_ERROR, M.SAVED_OK, M.SAVED_CANCEL, function(){$scope.locked = false;}, function(){$location.path($scope.currentRoute)});			
		};

	    $scope.onSaveBase = function(obj){
	        $scope.showDialog(null, M.SAVED_TITLE, M.SAVED_MESSAGE, M.SAVED_OK, M.SAVED_CANCEL, function(){ $scope.newSingle(); }, function(){$location.path($scope.currentRoute)});
	    };

	    $scope.onUpdateBase = function(obj){
	        $scope.showDialog(null, M.SAVED_TITLE, M.SAVED_MESSAGE, M.SAVED_OK, M.SAVED_CANCEL, function(){}, function(){$location.path($scope.currentRoute)});
	    };
	    
	    $scope.beforeSaveBase = $scope.beforeUpdateBase = function(obj){
	        return (!Object.keys($scope.forms[$scope.currentRoute + "Form"].$error).length);
	    };
	    
	    $scope.goToEdit = function(){
	    	$location.path($scope.currentRoute + "/" + $scope.data.single.id);
	    };
	    
	    $scope.goToNew = function(){
	    	$location.path($scope.currentRoute + "/" + "new");
	    };
	    
	    
	    
	    
	};
}
/*global app, ControllerFactory, RegisterRoutes, RegisterData*/
function RegisterEasyController(route, headers, controller){
	app.controller(route + 'ControllerBase', ControllerFactory(route));
	
	//console.log(route + 'ControllerBase', ControllerFactory(route));
	
	app.controller(route + 'Controller', function($scope, $controller, H) {
		//Copy all scope variables from Base Controller
		$controller(route + 'ControllerBase', {
			$scope: $scope
		});
		try{
			$controller(route + 'ControllerExtension', {
				$scope: $scope
			});
		} catch (ex){
			
		}
		
		$scope.initTextResourcesEasy();
		
		//$scope.setListHeaders(headers);
		
	});
}

//Register Easy Routes
(function(){
    var easyRoutes = RegisterRoutes().easyRoutes;
    //var data = RegisterData();
    
    for (var i = 0; i < easyRoutes.length; i++) {
        RegisterEasyController(easyRoutes[i]/*, data[easyRoutes[i]].headers*/);
    }
})();function RegisterMenuItems(){
    return [
        {
            header: '',
            showHeader: false,
            showSeparator: false,
            items: [
        	    {action: '', icon: 'home', color: 'blue', text: 'Home'}
	        ],
	        allowedRoles: ['user', 'admin', 'superadmin', 'editor', 'creator', 'viewer']
        },
        {
            header: '',
            showHeader: false,
            showSeparator: false,
            items: [
        	    {action: 'forms-procedures', icon: 'event_note', color: 'brown', text: 'Procedures'},
        	    {action: 'forms', icon: 'assignment_turned_in', color: 'purple', text: 'Forms'},
        	    {action: 'forms-master', icon: 'content_copy', color: 'green', text: 'Masters'},
                {action: 'reporthome', icon: 'pie_chart', color: 'cyan', text: 'Reports'},
        	    {action: 'forms-search', icon: 'search', color: 'red', text: 'Search'}
	        ],
	        allowedRoles: ['user', 'admin', 'editor', 'creator', 'viewer']
        },
        {
            header: 'Administration',
            showHeader: true,
            showSeparator: true,
            items: [
            	{action: 'forms-category', icon: 'list', color: 'brown', text: 'Categories'},
        	    {action: 'forms-question-bank', icon: 'question_answer', color: 'orange', text: 'Question Bank'},
        	    /*{action: 'users', icon: 'person', color: 'blue', text: 'Users'},*/
        	    {action: 'forms-users', icon: 'people', color: 'red', text: 'Users'},
                {action: 'forms-usergroups', icon: 'group_add', color: 'purple', text: 'User Group'}
	        ],
	        allowedRoles: ['admin']
        },
        {
            header: 'Customer Management',
            showHeader: false,
            showSeparator: false,
            items: [
        	    {action: 'organizations', icon: 'people_outline', color: '', text: 'Organizations'}
	        ],
	        allowedRoles: ['superadmin']
        }
    ];
}/*global app*/
app.service('M', function($http) {
	return {
		"E404": "The resource you are trying to access does not exist!",
		"E422": "Invalid parameters!",
		"E405": "Invalid operation!",
		"E400": "Bad request!",
		"E500": "An error accured!",
		"OUT_OF_SERVICE": "The system is under unscheduled maintenance! We'll be back soon.",
		"LOGIN_API_UNAVAILABLE": "Please contact the administrator. It seems that the login services are not enabled!",
		"REGISTER_API_UNAVAILABLE": "Please contact the administrator. It seems that the registration services are not enabled!",
		"SAAS_API_UNAVAILABLE": "Please contact the administrator. It seems that the SaaS services are not enabled!",
		"REQUIRED": "This field is required!",
		"INVALID_EMAIL": "Invalid email!",
		"UNAUTHORIZED_AREA": "You are not authorized to access this area!",
		"NA": "N/A",
		"SAVED_TITLE": "Item Saved!",
		"SAVED_MESSAGE": "You have successfully saved this record!",
		"SAVED_OK": "Stay Here",
		"SAVED_CANCEL": "Go Back To Listing",
		"ERROR_TITLE": "Error!",
		"SAVED_ERROR": "An error occured while trying to save the object.",
		"RECOVERY_EMAIL_SENT": "We have sent instructions to your registered e-mail address. Please check your spam folder.",
		"REGISTRATION_EMAIL_SENT": "We have sent your request for approval. This usually takes upto 72 hours, but usually our approval panel is very quick to respond. You will soon get an activation email. Please keep checking your spam folder.",
		"PROFILE_SAVED": "Profile information updated successfully!",
		"PROFILE_SAVE_ERROR": "Could not save profile!",
		"PASSWORD_CHANGED": "Changed password successfully!",
		"PASSWORD_CHANGE_ERROR": "Could not change password!",
		"ADMIN_PASSWORD_REQUIRED": "Admin Password is required!",
		"PASSWORD_REQUIRED": "Password is required!",
		"PASSWORD_NOT_MATCHING": "Password and Confirm Password should match!",
		"TITLE_ADD_PREFIX": "ADD",
		"TITLE_EDIT_PREFIX": "EDIT",
		"TITLE_DASHBOARD": "DASHBOARD",
		"TITLE_LICENSE": "License",
		"TITLE_SETTINGS": "SETTINGS",
		"TITLE_ORGANIZATION_SETTINGS": "ORGANIZATION SETTINGS",
		"TITLE_MY_PROFILE": "MY PROFILE",
		"BTN_SAVE": "Save",
		"BTN_UPDATE": "Update",
		"BTN_EDIT": "Edit",
		"BTN_SUBMIT": "Submit",
		"BTN_OK": "OK",
		"BTN_CANCEL": "Cancel",
		"BTN_LOGIN": "Login",
		"BTN_RECOVER": "Recover",
		"BTN_REGISTER": "Register",
		"BTN_SHOW": "Show",
		"BTN_CHANGE_LICENSE": "Change License",
		"BTN_SET_PASSWORD": "Set Password",
		"BTN_ACTIVATE": "Activate",
		"HEADING_LOGIN": "Please, sign into your account",
		"HEADING_FORGOT_PASSWORD": "Forgot your password?",
		"HEADING_REGISTER": "Register now!",
		"LNK_REGISTER": "Register",
		"LNK_FORGOT_PASSWORD": "Forgot password?",
		"LNK_BACK_TO_LOGIN": "Back to Sign-in",
		"FIELD_EMAIL_ENTER": "Enter your email",
		"FIELD_PASSWORD_ENTER": "Enter your password",
		"FIELD_ORGANIZATION": "Organization",
		"FIELD_ROLE": "Role",
		"FIELD_EMAIL": "Email",
		"FIELD_USERNAME": "Username",
		"FIELD_PASSWORD": "Password",
		"FIELD_NEW_PASSWORD": "New Password",
		"FIELD_CONFIRM_PASSWORD": "Confirm Password",
		"FIELD_ADMIN_PASSWORD": "Admin Password",
		"FIELD_SUPERADMIN_PASSWORD": "Super Admin Password",
		"FIELD_CLIENT_SECRET": "Client Secret",
		"FIELD_VALIDITY": "Validity",
		"FIELD_LICENSE": "License",
		"FIELD_GROUPNAME": "Group Title",
		"FIELD_TITLE": "Title",
		"FIELD_DESCRIPTION": "Description",
		"FIELD_FIRST_NAME": "First Name",
		"FIELD_LAST_NAME": "Last Name",
		"FIELD_AGE": "Age",
		"FIELD_ADDR": "Address",
		"FIELD_ADDR1": "Address 1",
		"FIELD_ADDR2": "Address 2",
		"FIELD_GENDER": "Gender",
		"FIELD_ACTIVE": "Active",
		"FIELD_CATEGORY": "Category",
		"FIELD_NAME" : "Name",
		"FIELD_TABLE_NAME" : "Table Name",
		"FIELD_CHART_TYPE" : "Chart Type",
		"FIELD_X_AXIS" : "X-Axis",
		"FIELD_COUNTRY_NAME" : "Country Name",
		"FIELD_GDP" : "GDP (In Billions)",
		"FIELD_Y_AXIS" : "Y-Axis" 
	};
});function RegisterRoutes() {
    return {
        customRoutes: [
            {route: 'settings', template: 'settings/template', controller: 'settings'},
            {route: 'forms-procedures', template: 'formsProcedures/template', controller: 'formsProcedures'},
            {route: 'forms-procedures/add', template: 'formsProcedures/procedure-add', controller: 'formsProcedureAdd'},
            {route: 'forms-procedures/:id/edit', template: 'formsProcedures/procedure-add', controller: 'formsProcedureEdit'},
            {route: 'forms-procedures/:id', template: 'formsProcedures/procedure', controller:'procedure' },
            {route: 'forms-question-bank', template: 'formsQuestionBank/template', controller: 'formsQuestionBank'},
            {route: 'forms-question-bank/add', template: 'formsQuestionBank/questionBank-add', controller: 'formsQuestionBankAdd'},
            {route: 'forms-question-bank/:id/edit', template: 'formsQuestionBank/questionBank-add', controller: 'formsQuestionBankEdit'},
            {route: 'forms-master', template: 'formsMaster/template', controller: 'formsMaster'},
            {route: 'forms-master/add', template: 'formsMaster/master-add', controller: 'formsMasterAdd'},
            {route: 'forms-master/:id', template: 'formsMaster/template', controller: 'formsMaster'},
            {route: 'forms-master/:id/edit', template: 'formsMaster/master-add', controller: 'formsMasterEdit'},
            {route: 'forms-master/:id/entry/list', template: 'formsMaster/master-entry-listing', controller: 'formsMasterEntryListing'},
            {route: 'forms-master/:id/entry', template: 'formsMaster/master-entry', controller: 'formsMasterEntry'},
            {route: 'forms-master/:id/entry/edit', template: 'formsMaster/master-entry', controller: 'formsMasterEntryEdit'},
            {route: 'forms-search', template: 'formsSearch/template', controller: 'formsSearch'},
            {route: 'forms-category', template: 'formsCategories/template', controller: 'formsCategory'},
            {route: 'forms-category/add', template: 'formsCategories/category-add', controller: 'formsCategoryAdd'},
            {route: 'forms-category/:id/edit', template: 'formsCategories/category-add', controller: 'formsCategoryEdit'},
            {route: 'forms-usergroups', template: 'formsUserGroups/template', controller: 'formsUsergroups'},
            {route: 'forms-usergroups/add', template: 'formsUserGroups/usergroup-add', controller: 'formsUsergroupAdd'},
            {route: 'forms-usergroups/:id', template: 'formsUserGroups/details-disabled', controller: 'formsUsergroupEdit'},
            {route: 'forms-usergroups/:id/edit', template: 'formsUserGroups/usergroup-add', controller: 'formsUsergroupEdit'},
            {route: 'forms-users', template: 'formsUsers/template', controller: 'formsUsers'},
            {route: 'forms-users/add', template: 'formsUsers/details', controller: 'formsUsersAdd'},
            {route: 'forms-users/:id', template: 'formsUsers/details-disabled', controller: 'formsUsersDetails'},
            {route: 'forms-users/:id/edit', template: 'formsUsers/details', controller: 'formsUsersEdit'},
            {route: 'forms', template: 'forms/template', controller: 'forms'},
            {route: 'forms/add', template: 'forms/forms-add', controller: 'formsAdd'},
            {route: 'forms/:id', template: 'forms/form', controller: 'form'},
            {route: 'forms/:id/records', template: 'forms/forms-records', controller: 'formsRecords'},
            {route: 'forms-procedures/:id/records', template: 'formsProcedures/procedures-records', controller: 'proceduresRecords'},
            {route: 'forms/:id/records/edit', template: 'forms/form', controller: 'formsRecordsEdit'},
            {route: 'forms-procedures/:id/records/edit', template: 'formsProcedures/procedure', controller: 'proceduresRecordsEdit'},
            {route: 'forms/:id/edit', template: 'forms/forms-add', controller: 'formsEdit'},
            {route: 'reporthome', template: 'reporthome/template', controller: 'reporthome'},
            {route: 'report_data', template: 'report_data/template', controller: 'report_data'},
            {route: 'report_show/:id', template: 'report_show/template', controller: 'report_show'},
            {route: 'report_edit/:id', template: 'report_edit/template', controller: 'report_edit'},
            {route: '', template: 'home/template', controller: 'home' ,role:'user'},
            {route: 'sign-in', template: 'auth/sign-in', controller: 'auth', auth: false},
            {route: 'forgot-password', template: 'auth/forgot-password', controller: 'auth', auth: false},
            {route: 'register', template: 'auth/register', controller: 'register', auth: false},
            {route: 'profile', template: 'auth/profile', controller: 'profile'},
            {route: 'unauthorized', template: 'auth/unauthorized', controller: 'unauthorized'},
            {route: 'out-of-service', template: 'auth/out-of-service', controller: 'outOfService', auth: false},
            {route: 'homeopathy_service', template: 'homeopathy_service/template', controller: 'homeopathy_service',role:'user'},
            {route: 'available_doctors', template: 'available_doctors/template', controller: 'available_doctors',role:'user'},
            {route: 'cart', template: 'cart/template', controller: 'cart',role:'user'},
            {route: 'nearby_store', template: 'nearby_store/template', controller: 'nearby_store',role:'user'},
            {route: 'lab_select', template: 'lab_select/template', controller: 'lab_select',role:'user'},
            {route: 'account_setting', template: 'account_setting/template', controller: 'account_setting',role:'user'},
            {route: 'vet_service', template: 'vet_service/template', controller: 'vet_service',role:'user'},
            {route: 'available_homeo_doctors', template: 'homeopathy_service/homeodoc', controller: 'available_homeo_doctors',role:'user'},
            {route: 'available_vet_doctors', template: 'homeopathy_service/vetdoc', controller: 'available_vet_doctors',role:'user'},
            {route: 'available_vet_doctors/home_visit', template: 'homeopathy_service/vetdochome', controller: 'vetdochome',role:'user'},
            {route: 'lab_select/all_tests', template: 'lab_select/alltests', controller: 'alltests',role:'user'},
            {route: 'lab_select/prescribed_tests', template: 'lab_select/prescribedtests', controller: 'prescribedtests',role:'user'},
            {route: 'lab_select/schedule_test/:id', template: 'lab_select/scheduletest', controller: 'scheduletest',role:'user'},
            {route: 'account_setting/view_profile', template: 'account_setting/viewprofile', controller: 'viewprofile',role:'user'},
            {route: 'account_setting/mydoctors', template: 'account_setting/mydoctors', controller: 'mydoctors',role:'user'},
            {route: 'doctorhome', template: 'doctors/doctorhome', controller: 'doctorhome',role:'doctor'},
            {route: 'docnoti', template: 'doctors/docnoti', controller: 'docnoti',role:'doctor'},
            {route: 'doctorhome/:id', template: 'lab_select/alldoctest', controller: 'alldoctest',role:'doctor'},
            {route: 'patienthistory', template: 'doctors/patienthistory', controller: 'patienthistory',role:'doctor'},
            {route: 'doctorprofile', template: 'doctorprofile/template', controller: 'doctorprofile',role:'doctor'},
            {route: 'calender', template: 'doctors/calender', controller: 'calender',role:'doctor'},
            {route: 'doctorview/:id', template: 'doctorprofile/doctorview', controller: 'doctorview',role:'doctor'},
            {route: 'available_homeo_doctors/home_visit', template: 'homeopathy_service/homeodochome', controller: 'homeodochome',role:'doctor'},
            {route: 'consultation_address', template: 'consultation_address/template', controller: 'consultation_address',role:'user'},
            {route: 'technicianhome', template: 'lab_technician/template', controller: 'lab_technician',role:'doctor'},
            {route: 'alluploads', template: 'lab_technician/alluploads', controller: 'alluploads',role:'doctor'},
            {route: 'addtests', template: 'admin/addtests', controller: 'addtests',role:'doctor'},
            {route: 'addlabs', template: 'admin/addlabs', controller: 'addlabs',role:'doctor'},
            {route: 'addlabtech', template: 'lab_technician/addlabtech', controller: 'addlabtech',role:'doctor'},
            {route: 'tests_labs', template: 'cart/tests_labs', controller: 'tests_labs',role:'doctor'},
            {route: 'ongoing_transactions', template: 'cart/ongoing_transactions', controller: 'ongoing_transactions',role:'doctor'}
            
        ],
        easyRoutes: ['organizations', 'users']
    };
}/*global app*/
app.service('S', function($http) {
	return {
		"baseUrl": "../../../../../prestige/api",   // for local use
		//"baseUrl": "../../../../../prana/api", // for itatonce.in/test/prana
		"productName": "pRESTige",
		"supportEmail": "support@prestigeframework.com",
		"enableSaaS": true,
		"openRegistration": true,
		"legacyMode": false,
		"fieldTypes": [{
			"id": 1,
			"title": "Text",
			"type": "text"
		}, {
			"id": 2,
			"title": "Number",
			"type": "number"
		}, {
			"id": 3,
			"title": "Dropdown",
			"type": "list"
		}, {
			"id": 4,
			"title": "RadioButtonList",
			"type": "list"
		}, {
			"id": 5,
			"title": "CheckBoxList",
			"type": "list"
		}, {
			"id": 6,
			"title": "Date",
			"type": "date"
		}, {
			"id": 7,
			"title": "Time",
			"type": "time"
		}, {
			"id": 8,
			"title": "File",
			"type": "file"
		},{
			"id": 9,
			"title": "TextArea",
			"type": "textarea"
		}]
	}
});app.service('D', function($http, S) {
	return {
		count: function(resourceName, cb) {
			$http.get(S.baseUrl + '/' + resourceName + '/?count=true')
				.then(function(results) {
					if (results && results.data && results.data.length > 0)
						if (cb) cb(results.data[0].count);
				}, function(e) {});
		}
	}
});

/*global app, RegisterRoutes*/
app.service('H', function($location, md5, S, M, R,$rootScope, $http) {
	return {
		S: S,
		SETTINGS: S,
		M: M,
		MESSAGES: M,
		R: R,
		RESOURCES: R,
		getCookieKey: function(){
			var absUrl = $location.absUrl();
			Helper.getCookieKey(absUrl);
		},
		getHash: function(str){
    		return md5.createHash(str);
		},
		setNewNoti : function(arr){
			$rootScope.notiarr = arr
		},
		getAbsolutePath: Helper.getAbsolutePath,
		getRandomNumber: Helper.getRandomNumber,
		getUUID: Helper.getUUID,
		toDateTime: Helper.toDateTime,
		toMySQLDateTime: Helper.toMySQLDateTime,
		checkLicenseValidity: Helper.checkLicenseValidity,
		getOpenRoutes: function(){
			var openRoutes = RegisterRoutes().customRoutes.filter(function(p){ return p.auth === false});
			var openRouteNames = [];
			openRoutes.forEach(p => openRouteNames.push("/" + p.route));
			return openRouteNames;
		},
		getDocid :function(){
			R.get('doctor').query({users_id : $rootScope.currentUser.id}, function(r){
				console.log(r);
				return r
			})
		},
		searchArr : function(table, abc, val){
			var mysearch = []
			$http({
				method : "GET",
				url :  'http://localhost/prestige/api/'+table+'/?'+ abc +'[in]='+val 
		}).then(function(r){
			//console.log(r)
				Helper.setRes(r);
				console.log(Helper.getRes())
		})
	},
		setRes : Helper.setRes,
		getRes : Helper.getRes,
		toTitleCase: Helper.toTitleCase,
		replaceAll: Helper.replaceAll,
		getDatetime: Helper.getDatetime,
		seriesArrayGenerator: Helper.seriesArrayGenerator
	};
});

class Helper {
	//static  res;
	constructor() {
	}

	
	static getCookieKey(absUrl) {
		var startIndex = absUrl.indexOf("//") + 2;
		var endIndex = absUrl.indexOf("#");
		var base = absUrl.substring(startIndex, endIndex);
		var pattern = /[\s:/!@#\$%\^\&*\)\(+=.-]/g;
		var key = base.replace(pattern, "_");
		return key;
	}
	
	static setRes(r)
	{
		Helper.res = r
		console.log(Helper.res);
		//return m;
	}


   static getDatetime() {
		var m = new Date();
		var dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
		return dateTime
	};

	static getRes()
	{
		return Helper.res;
	}

	static getAbsolutePath(href) {
	    var link = document.createElement("a");
	    link.href = href;
	    return link.href;
	}

	static getRandomNumber(min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	static getUUID() {
	      var id = '', i;
	
	      for(i = 0; i < 36; i++)
	      {
	        if (i === 14) {
	          id += '4';
	        }
	        else if (i === 19) {
	          id += '89ab'.charAt(this.getRandomNumber(0,3));
	        }
	        else if(i === 8 || i === 13 || i === 18 || i === 23) {
	          id += '-';
	        }
	        else
	        {
	          id += '0123456789abcdef'.charAt(this.getRandomNumber(0, 15));
	        }
	      }
	      return id;
	}
	
	static toDateTime(str){
		// Split timestamp into [ Y, M, D, h, m, s ]
		var t = str.split(/[- :]/);
		
		// Apply each element to the Date function
		var d = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		
		return d;
	}
	
	static toMySQLDateTime(dt){
		return dt.getUTCFullYear() + "-" + Helper.twoDigits(1 + dt.getUTCMonth()) + "-" + Helper.twoDigits(dt.getUTCDate()) + " " + Helper.twoDigits(dt.getUTCHours()) + ":" + Helper.twoDigits(dt.getUTCMinutes()) + ":" + Helper.twoDigits(dt.getUTCSeconds());
	}
	
	static twoDigits(d) {
	    if(0 <= d && d < 10) return "0" + d.toString();
	    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
	    return d.toString();
	}
	
	static checkLicenseValidity(organization){
		return ((new Date() > Helper.toDateTime(organization.validity) && !(['basic', 'super'].indexOf(organization.license) > -1))  || !organization.is_active ) ? 'expired' : 'valid';
	}
	
	static toTitleCase(input){
		input = input || '';
		return input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	}
	
	static replaceAll(input, search, replacement){
		input = input || '';
		return input.replace(new RegExp(search, 'g'), replacement);
	}

	
	
	static seriesArrayGenerator(chartType, data_x, data_y, x_scale, y_scale) {
		console.log("in sag")
		var seriesArray = [];
		
		if(chartType == 'bar' || chartType == 'line') {
			for(let i = 0; i < y_scale.length; i++) {
				seriesArray[i] = { 
									values: data_y[i],
									text : y_scale[i]
								};
			}
		} else if(chartType == 'pie') {
			for(let i = 0; i < data_x.length; i++) {
				seriesArray[i] = {
									values : [data_y[0][i]],
									text : data_x[i]
								}
			}
		} else if(chartType == 'nestedpie') {
			var new_data_y = [];
			for(let i = 0; i < data_x.length; i++) {
				new_data_y[i] = [];
				for(let j = 0; j < data_y.length; j++) {
					new_data_y[i].push(data_y[j][i]);
				}
			}
			for(let i = 0; i < data_x.length; i++) {
				seriesArray[i] = {
									values : new_data_y[i],
									text : data_x[i]
								}
			}
				
		} else if(chartType =='grid') {
			var new_data_y = [];
			for(let i = 0; i < data_x.length; i++) {
				new_data_y[i] = [];
				for(let j = 0; j < data_y.length; j++) {
					new_data_y[i].push(data_y[j][i]);
				}
			}
			for(let i = 0; i < data_x.length; i++) {
				seriesArray[i] = {
									values : new_data_y[i],
									//text : data_x[i]
								}
			}
				
		}
		return seriesArray;
	}

}
app.service('L', function($location, md5, S, M, R, $http) {
    return{
        getLocation : Location.getLocation
    }
})

class Location {
    constructor(){

    } 
    static getLocation(){
        var resp 
        if ("geolocation" in navigator) {
         // check if geolocation is supported/enabled on current browser
         navigator.geolocation.getCurrentPosition(
          function success(position) {
            // for when getting location is a success
            console.log('latitude', position.coords.latitude, 
                        'longitude', position.coords.longitude);
                        
             //getAddress(position.coords.latitude,position.coords.longitude)
             
       //var API_KEY = 'AIzaSyA9kgg3xb2B8DlMpZngY2WM8KA0346mlPs'
       var API_KEY = 'NvOJcAH9ZOFRz6SnG90pPqoJ8yTfGECu'
       $.ajax('http://api.tomtom.com/search/2/reverseGeocode/' +position.coords.latitude+','+position.coords.longitude+'.json?key=' + API_KEY)
      // $.ajax('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&sensor=true&key='+ API_KEY)
       .then(
         function success (response) {
             console.log('User\'s Address Data is ', response)
             resp = response
             return resp
         },
         function fail (status) {
           console.log('Request failed.  Returned status of',status)
         }
        )
          },
         function error(error_message) {
           // for when getting location results in an error
           console.error('An error has occured while retrievinglocation', error_message)
           
       })
     } else {
         // geolocation is not supported
         // get your location some other way
         console.log('geolocation is not enabled on this browser')
       }

       console.log("outer Resp")
       return resp
     }
        
    }
/*global app*/
//Service for quickly getting the API Resource Object
app.service('R', function($resource, $http, S) {
	return {
		get: function(resourceName) {
			return $resource(S.baseUrl + '/' + resourceName + '/:id', {
				id: '@id'
			});
		},
		count: function(resourceName, cb) {
			$http.get(S.baseUrl + '/' + resourceName + '/?count=true')
				.then(function(results) {
					if (results && results.data && results.data.length > 0)
						if (cb) cb(results.data[0].count);
				}, function(e) {});
		}
	};
});/*global app*/
app.directive('focusOn', ['$timeout',
    function ($timeout) {
        var checkDirectivePrerequisites = function (attrs) {
          if (!attrs.focusOn && attrs.focusOn != "") {
                throw "FocusOn missing attribute to evaluate";
          }
        };

        return {            
            restrict: "A",
            link: function (scope, element, attrs, ctrls) {
                checkDirectivePrerequisites(attrs);

                scope.$watch(attrs.focusOn, function (currentValue, lastValue) {
                    if(currentValue == true) {
                        $timeout(function () {    
                            element.focus();
                        });
                    }
                });
            }
        };
    }
]);/*global app*/
app.directive('spinner', function($rootScope) {
  return {
    scope: {
      size: '='
    },
    restrict: 'E',
    replace: true,
    template: '<img src="images/spinner.gif" ng-if="$root.loading" style="width:13px;height:13px"></img>'
  };
});/*global app, Helper*/
app.filter('checkLicenseValidity', function() {
    return function(organization) {
        return Helper.checkLicenseValidity(organization);
        //return new Date();
    };
});/*global app*/
app.filter('lowerCase', function() {
    return function(input) {
      input = input || '';
      return input.replace(/\w\S*/g, function(txt){return txt.toLowerCase();});
    };
});  /*global app*/
app.filter('titleCase', function() {
    return function(input) {
      input = input || '';
      return input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
});/*global app, Helper*/
app.filter('toDateTime', function() {
    return function(str) {
        return Helper.toDateTime(str);
    };
});/*global app*/
app.filter('upperCase', function() {
    return function(input) {
      input = input || '';
      return input.replace(/\w\S*/g, function(txt){return txt.toUpperCase();});
    };
});/*global app*/
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);/*global app*/
app.component('infoBox', {
	templateUrl: 'app/components/infobox/template.html',
	controller: 'infoboxController',
	bindings: {
		options: '<',
	}
});

app.controller('infoboxController', function($scope){
	// $scope.options = {
	// 	title: 'options.title',
	// 	value: 'options.value',
	// 	icon: 'options.icon',
	// 	background: 'bgblueish',
	// 	color: 'white-text',
	// 	action: 'options.action'
	// };

	var self = this;
	self.$onInit = function(){
		if(self.options){
			$scope.options = self.options;
		}
	};
	
});/*global app, $, M*/
app.component('modal', {
	templateUrl: 'app/components/modal/template.html',
	controller: 'modalController',
	bindings: {
		options: '=',
	}
});

app.controller('modalController', function($scope){
	var self = this;
	self.$onInit = function(){
		if(self.options){
			$scope.options = self.options;
			$scope.options.open = openModal;
		}
		else{
			$scope.options = {};
			$scope.options.open = openModal;
		}
	};
	
	$(function(){
		self.modal = M.Modal.init(document.querySelector('#mdmodal'));
	});

	function openModal(options){
		if(options){
			$scope.options = options;
			$scope.options.open = openModal;
		}
		
		self.modal.open();
	}

});/*global app*/
app.component('time', {
	templateUrl: 'app/components/time/template.html',
	controller: 'timeController',
	bindings: {
		value: '<',
		label: '<'
	}
});

app.controller('timeController', function($scope){
	// $scope.options = {
	// 	title: 'options.title',
	// 	value: 'options.value',
	// 	icon: 'options.icon',
	// 	background: 'bgblueish',
	// 	color: 'white-text',
	// 	action: 'options.action'
	// };

	var self = this;
	self.$onInit = function(){
		if(self.value){
			$scope.value = self.value;
			$scope.hh = $scope.value.substring(1, 3);
			$scope.mm = $scope.value.substring(4);
		}
		else{
			$scope.hh = "00";
			$scope.mm = "00";
		}
		if(self.label){
			$scope.label = self.label;
		}
	};
	
});/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('account_settingController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
			
	
	$scope.load = function(){
		$scope.user = $rootScope.currentUser
		console.log($scope.user)
	}
    $scope.logout = function(){
		if ($rootScope.currentUser.role == 'doctor'){
			R.get('doctor').query({users_id : $rootScope.currentUser.id}, function(res){
				$scope.docid = res[0].id
				console.log($scope.docid)
				R.get('last_seen').query({doctor_id : $scope.docid}, function(resp){
					$scope.lastseenid = resp[0].id
					console.log(resp)
					$http({
						method : "PUT",
						url : H.SETTINGS.baseUrl + '/last_seen',
						data : {
							"id" : $scope.lastseenid,
							"doctor_id" : $scope.docid,
							"time" : H.getDatetime()
						}
					}).then(function(response) {
						console.log(response);
								
					$cookies.remove(H.getCookieKey());
					delete $rootScope.currentUser;
					$location.path('/sign-in');
						
					})
				})
			})

		} else {
			
			$timeout(function(){
			$cookies.remove(H.getCookieKey());
			delete $rootScope.currentUser;
			$location.path('/sign-in');
			}, 500)
		}

    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('mydoctorsController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
      
    $scope.load = function(){
        R.get('user_trans').query({user_id : $rootScope.currentUser.id}, function (res) {
            console.log(res)
            $scope.mydocs = res;
            
        });
    }

    $scope.initPay = function(id){
        $scope.dateTime = H.getDatetime()
        $http({
			method : "PUT",
			url : H.SETTINGS.baseUrl + '/user_trans/' + id,
			data : {
                "req_status" : 4,
                "datetime" : $scope.dateTime
			}
		}).then(function(response) {
            console.log(response)
        })
        $route.reload()
    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('viewprofileController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    
    $scope.doc_name = []
    $scope.docid = [];
    $scope.phone;
    $scope.email;
    $scope.gender;
    $scope.addr;
    $scope.lastname;
    $scope.firstname;
    $scope.editmode = false;
    $scope.names = [];
    $scope.city;
    $scope.area;
    

    $scope.load = function(){

        R.get('city').query({}, function(re){
            $scope.city = re;
            console.log(re)
        })
        
        R.get('users').query({email : $rootScope.currentUser.email}, function (res) {
            console.log(res);
            $scope.id = res[0].id
            $scope.firstname = res[0].first_name 
            $scope.lastname = res[0].last_name
            $scope.addr = res[0].addr1
            $scope.addr2 = res[0].addr2
            $scope.zip = res[0].zip
            $scope.gender = res[0].gender
            $scope.email = res[0].email
            $scope.phone = res[0].phone
            $scope.myCity = res[0].city.city_name
            $scope.myArea = res[0].are.area_name
            
        });
        
        
    }

    $scope.edit = function(){
        $scope.editmode = true;
    }

    $scope.filterArea = function(cityId){
        $scope.cityId = cityId;
        console.log(cityId);
        R.get('area').query({city_id: cityId}, function(r){
            $scope.areas = r;
            console.log($scope.city)
            console.log(r)
        })
    }

    $scope.getArea = function(ar){
        $scope.area = ar;
    }
      
    $scope.sendReq = function(area){
        console.log($scope.addr2);
        console.log($scope.area);
        console.log(area)
        

        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/users',
			data : {
                "id" : $scope.id,
                "first_name" :  $scope.firstname,
                "last_name" :  $scope.lastname,
                "gender" : $scope.gender,
                "email" : $scope.email,
                "phone" :$scope.phone,
                "addr1" : $scope.addr, 
                "addr2" : $scope.addr2,
                "zip" : $scope.zip,
                "city_id" : $scope.cityId,
                "are_id" : $scope.area
			}
		}).then(function(response) {
            $rootScope.currentUser = response.data;
            $scope.editmode = false;
            console.log($rootScope.currentUser);
            alert("Successfully Updated User Information")
            
        })
    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('addlabsController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    $scope.load = function(){
        console.log("taro bap")
    }

    $scope.addlab = function(){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/lab_organization',
			data : {
                "name" : $scope.name,
                "priority" : $scope.priority
			}
		}).then(function(response) {
            
            console.log(response)
            
        })
    }
})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('addtestsController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    $scope.load = function(){
        console.log("taro bap")
    }

    $scope.addtest = function(){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/lab_tests',
			data : {
                "test_name" : $scope.name,
                "test_details" : $scope.description
			}
		}).then(function(response) {
            
            console.log(response)
            
        })
    }
})/*global app*/
app.controller('authController', function($scope,$route, $rootScope, $http, R, $location, $cookies, H, M, S) {
	if($rootScope.currentUser){
		$location.path('/');
	}
	
	$scope.forms = {};
	
	$scope.H = H;
	$scope.M = M;
	$scope.S = S;
	
	$scope.data = {};
	$scope.forgotPasswordSuccess = false;
	
	//$scope.loading = false;

	$scope.login = function(){
		//$scope.loading = true;
		$http.post(H.SETTINGS.baseUrl + '/users/login', {email: $scope.email, password: $scope.password})
			.then(function(r){
				$scope.error = "";
				if(!r.data.token){
					$scope.error = M.E500;
					//$scope.loading = false;
					return;
				}
				$rootScope.currentUser = r.data;
				console.log(r.data);
				$cookies.putObject(H.getCookieKey(), JSON.stringify(r.data));
				if($rootScope.currentUser.role == "doctor"){
					/* R.get('doctor').query({users_id: $rootScope.currentUser.id}, function(r){
						$rootScope.currentDoctor = r
					}) */
					//$route.reload()
					$location.path('/doctorhome');
				} else if ($rootScope.currentUser.role == "technician"){
					$location.path('/technicianhome');
				} else {
					$location.path('/');
				}
			}, function(e){
				if(e && e.data && e.data.error && e.data.error.status){
					if(e.data.error.code == 404 && e.data.error.message == "Not Found"){
						$scope.error = M.LOGIN_API_UNAVAILABLE;
					} else {
						$scope.error = e.data.error.message ? e.data.error.message : e.data.error.status;	
					}
					
				}
				//$scope.loading = false;
			});
	};

	$scope.forgotPassword = function(){
		//$scope.loading = true;
		$http.post(H.SETTINGS.baseUrl + '/users/forgot-password', {email: $scope.email})
			.then(function(r){
				//console.log(r);
				$scope.forgotPasswordSuccess = true;
				$scope.error = M.RECOVERY_EMAIL_SENT;
				//$scope.loading = false;
			}, function(e){
				$scope.forgotPasswordSuccess = false;
				if(e && e.data && e.data.error && e.data.error.status){
					if(e.data.error.code == 404 && e.data.error.message == "Not Found"){
						$scope.error = M.LOGIN_API_UNAVAILABLE;
					} else {
						$scope.error = e.data.error.message ? e.data.error.message : e.data.error.status;
					}
				}
				//$scope.loading = false;
			});
	};

	$scope.register = function(){
		var route = 'users';
		var data = {username: $scope.data.username, email: $scope.data.email, password: $scope.data.password};
		if(S.enableSaaS) {
			route = 'organizations'; 
			data = {organization: $scope.data.organization, email: $scope.data.email};
		}else{
			if($scope.data.password != $scope.data.confirmPassword){
				$scope.error = "Password and Confirm Password should match!";
				return;
			}
		}
		
		$http.post(H.SETTINGS.baseUrl + '/' + route +'/register', data)
			.then(function(r){
				$scope.error = M.REGISTRATION_EMAIL_SENT;
			}, function(e){
				if(e && e.data && e.data.error && e.data.error.status){
					if(e.data.error.code == 404 && e.data.error.message == "Not Found"){
						$scope.error = M.REGISTER_API_UNAVAILABLE;
					} else {
						$scope.error = e.data.error.message ? e.data.error.message : e.data.error.status;
					}
				}
			});
	};
	
	$scope.logout = function(){
		$cookies.remove(H.getCookieKey());
		delete $rootScope.currentUser;
		$location.path('/sign-in');
	};
});


/*global app*/
app.controller('outOfServiceController', function($scope, H){
	$scope.H = H;
	$scope.M = H.M;
});
/*global app*/
app.controller('profileController', function($scope, $rootScope, $http, $cookies, H, M){
	$scope.H = H;
	$scope.M = H.M;
	
	$scope.locked = true;
	$scope.lockedClass = "hidden";
	$scope.editingClass = "";
	
	$scope.forms = {};
	$scope.userData = {};
	$scope.passwordData = {};

	$scope.disableEdit = function(){
		$scope.locked = true;
		$scope.lockedClass = "hidden";
		$scope.editingClass = "";
	}
	
	$scope.edit = function(){
		$scope.locked = false;
		$scope.editingClass = "float-left";
		$scope.lockedClass = "visible float-right formClass";
	
		$scope.userData.username = $rootScope.currentUser.username;
		$scope.userData.email = $rootScope.currentUser.email;
		$scope.userData.role = $rootScope.currentUser.role;
	};
	
	$scope.updateHandler = function(r){
				$scope.userData.message = H.M.PROFILE_SAVED;
				var user = r.data;
				user.password = $rootScope.currentUser.password;
				user.organization = $rootScope.currentUser.organization;
				$rootScope.currentUser = user;
				$cookies.putObject(H.getCookieKey(), JSON.stringify($rootScope.currentUser));
	}
	
	$scope.changingPassword = function(){
		$scope.changeingpassword = true; 
	}

	$scope.save = function(){
			if($scope.changeingpassword != true){
			$scope.userData.error = "";
			$scope.userData.message = "";
			$http.get(H.S.baseUrl + '/users/' + $rootScope.currentUser.id).then(function(res){
				var r = res.data;
				r.username = $scope.userData.username;
				r.email = $scope.userData.email;
				r.role = $scope.userData.role;
				
				if(H.S.legacyMode){
					$http.post(H.S.baseUrl + '/users/update', r).then(function(r){
						$scope.updateHandler(r);
					}, function(e){
						$scope.userData.error = H.M.PROFILE_SAVE_ERROR;
					});
				} else {
					$http.put(H.S.baseUrl + '/users', r).then(function(r){
						$scope.updateHandler(r);
					}, function(e){
						$scope.userData.error = H.M.PROFILE_SAVE_ERROR;
					});
				}
			},function(e){
				$scope.userData.error = H.M.PROFILE_SAVE_ERROR;
			});
		}
	};
	
	$scope.changePassword = function(){
		$scope.passwordData.error = "";
		$scope.passwordData.message = "";
		if($scope.passwordData.newPassword != $scope.passwordData.confirmPassword){
			$scope.passwordData.error = M.PASSWORD_NOT_MATCHING;
			return;
		}
		var data = {
			email: $rootScope.currentUser.email,
			password: $scope.passwordData.password,
			new_password: $scope.passwordData.newPassword
		};
		$http.post(H.S.baseUrl + '/users/change-password', data).then(function(res){
			$scope.passwordData.message = H.M.PASSWORD_CHANGED;
		},function(e){
			$scope.passwordData.error = H.M.PASSWORD_CHANGE_ERROR + " " + e.data.error.message;
		});
	};	
});/*global app*/
app.controller('registerController', function($scope, $rootScope, $http, R, $location, $cookies, H, M, S) {

    $scope.firstname;
    $scope.gender;
    $scope.email;
    $scope.phone;
    $scope.password;
    $scope.pass;
    $scope.lastname;

    $scope.load = function(){
        
    }

    $scope.register = function(){

        $scope.pass = H.getHash($scope.password)
        console.log($scope.pass);
        console.log($scope.password);
        
        
        $http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/allusers/registering',
            data : {
               "email" : $scope.email,
               "password" : $scope.pass,
               "first_name" : $scope.firstname,
               "last_name" :  $scope.lastname,
               "gender" : $scope.gender,
               "phone" :$scope.phone
            }
        }).then(function(res) {
            console.log(res)

       })
    }

    
});
/*global app*/
app.controller('unauthorizedController', function($scope, H){
	$scope.H = H;
	$scope.M = H.M;
});
/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('available_doctorsController', function($scope, $controller, $rootScope, $location, H, R, $http, S){


    $scope.doc_name = []

    $scope.load = function(){
        //console.log("Initialized")
        R.get('doctor_patient').query({ }, function (response) {
            $scope.doc_pat = response;

            console.log($scope.doc_pat)
            /* var arr = $scope.doc_pat
            var array = [];

            var obj = arr.reduce(function(obj, item){
                obj[item.doctor.name] = obj[item.doctor.name] || [];
                obj[item.doctor.name].push(item);
                return obj;
            },[])
            console.log(obj)
            
            
            $scope.disp = Object.keys(obj).reduce(function(array, key){
                array.push({
                    name: key,
                    data: obj[key]
                });
                return array;
            }, [])

            console.log($scope.disp) */

            for(i=0; i<$scope.doc_pat.length; i++){
                $scope.doc_name.push($scope.doc_pat[i].doctor.name);
                if($scope.doc_pat[i].patient.user.id == $rootScope.currentUser.id){
                    //console.log($scope.doc_pat[i].doctor.name);
                }
            }
            console.log($scope.doc_name)
            var uniqueItems = Array.from(new Set($scope.doc_name))
            console.log(uniqueItems)



            R.get('doctor_info').query({}, function(res){
                $scope.doctors = res
                //console.log(res)
            });

        });
    }

})    /* app.controller('DatepickerDemoController', function ($scope) {
        $scope.today = function() {
        $scope.dt = new Date();
        };
        $scope.today();
    
        $scope.clear = function() {
        $scope.dt = null;
        };
    
        $scope.options = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
        };
    
        // Disable weekend selection
        function disabled(data) {
        var date = data.date,
            mode = data.mode;
        return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
        }
    
        $scope.toggleMin = function() {
        $scope.options.minDate = $scope.options.minDate ? null : new Date();
        };
    
        $scope.toggleMin();
    
        $scope.setDate = function(year, month, day) {
        $scope.dt = new Date(year, month, day);
        };
    
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var afterTomorrow = new Date(tomorrow);
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        $scope.events = [
        {
            date: tomorrow,
            status: 'full'
        },
        {
            date: afterTomorrow,
            status: 'partially'
        }
        ];
    
        function getDayClass(data) {
        var date = data.date,
            mode = data.mode;
        if (mode === 'day') {
            var dayToCheck = new Date(date).setHours(0,0,0,0);
    
            for (var i = 0; i < $scope.events.length; i++) {
            var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);
    
            if (dayToCheck === currentDay) {
                return $scope.events[i].status;
            }
            }
        }
    
        return '';
        }
    }); *//* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('cartController', function($scope, $controller, $rootScope, $route, $route, $location, H, R, $http, S){

    $scope.tot = [];
    $scope.sum;
    $scope.m=0;
    $scope.load = function(){
        console.log("Init")
        R.get('user_tests').query({user_id : $rootScope.currentUser.id }, function (response) {
            $scope.user_tests = response;
            console.log(response);

           // $rootScope.html = [1,2,3,4,5];
            

        $scope.total = function(){
            for (i = 0; i<$scope.user_tests.length; i++){
                $scope.tot.push($scope.user_tests[i].lab_test.fees)
            }

            for(i = 0; i<$scope.tot.length; i++){
                $scope.m = $scope.m + $scope.tot[i];
            }
            console.log($scope.m);
        }
        $scope.total()
        
        });
        
    }

    $scope.delTest = function(id){
        console.log(id)
        $http({
			method : "DELETE",
			url : H.SETTINGS.baseUrl + '/user_tests/'+ id,
        })
        $route.reload()
    }

    $scope.payTest = function(){

    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('ongoing_transactionsController', function($scope, $routeParams, $controller, $rootScope, $route, $route, $location, H, R, $http, S){


    $scope.load = function(){
        
            R.get('lab_test_transaction').query({users_id : $rootScope.currentUser.id}, function(re){
                $scope.trans = re;
                console.log($scope.trans)
               // $scope.testsid = re.
            })

    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('tests_labsController', function($scope, $controller, $rootScope, $route, $route, $location, H, R, $http, S){

    $scope.tot = [];
    $scope.sum;
    $scope.m=0;
    $scope.testsids = [];

    $scope.load = function(){


        R.get('user_tests').query({user_id : $rootScope.currentUser.id }, function (response) {
            $scope.user_tests = response;
            console.log(response);

            for(i = 0; i<$scope.user_tests.length; i++){
                $scope.testsids.push($scope.user_tests[i].lab_test_id);
            }
            $scope.testsids.toString()
            console.log($scope.testsids)

           // console.log(id)
            $http({
                method : "GET",
                url : H.SETTINGS.baseUrl + '/get/lab/?test='+ $scope.testsids,

            }).then(function(rep){
                $scope.labs = rep.data
                console.log($scope.labs);

                if($scope.labs.length == undefined){
                    $scope.oneflag = true;
                }else{
                    $scope.oneflag = false;
                }
            })

           // $rootScope.html = [1,2,3,4,5];
            

        /* $scope.total = function(){
            for (i = 0; i<$scope.user_tests.length; i++){
                $scope.tot.push($scope.user_tests[i].lab_test.fees)
            }

            for(i = 0; i<$scope.tot.length; i++){
                $scope.m = $scope.m + $scope.tot[i];
            }
            console.log($scope.m);
        }
        $scope.total() */
        
        });
        
    }

    $scope.delTest = function(id){
        console.log(id)
        $http({
			method : "DELETE",
			url : H.SETTINGS.baseUrl + '/user_tests/'+ id,
        })
        $route.reload()
    }

    $scope.payTest = function(){

    }

})/*global app, RegisterMenuItems*/
app.controller('navController', function($scope) {
    var data = RegisterMenuItems();
  
    for(var k in data){
        if(data.hasOwnProperty(k) && data[k].items && data[k].items.length > 0){
            for (var i = 0; i < data[k].items.length; i++) {
                data[k].items[i].action = '#!' + data[k].items[i].action;
                if(data[k].items[i].color) data[k].items[i].color = "col-" + data[k].items[i].color;
                if(data[k].items[i].items && data[k].items[i].items.length > 0){
                    data[k].items[i].action = '';
                    for (var j = 0; j < data[k].items[i].items.length; j++) {
                        data[k].items[i].items[j].action = '#!' + data[k].items[i].items[j].action;
                        if(data[k].items[i].items[j].color) data[k].items[i].items[j].color = "col-" + data[k].items[i].items[j].color;
                    }
                }
            }
        }
    }
    $scope.data = data;
});/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('notiController', function($scope, S){
    
    console.log("Helloooooooo notiii")

})/*global app*/
app.controller('titleController', function($scope, S){
   $scope.title =  S.productName;
});
app.controller('consultation_addressControllerBase', ControllerFactory('consultation_address'))

app.controller('consultation_addressController', function($scope, $controller, $rootScope, $location, H, R, $http, S){

    $scope.load = function(){
        R.get('patient_info').query({}, function(res){
            $scope.pat_add = res;
        })
    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */
app.controller('doctorprofileController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
    
    $scope.doc_name = []
    $scope.docid = [];
    $scope.phone;
    $scope.email;
    $scope.gender;
    $scope.addr;
    $scope.lastname;
    $scope.firstname;

    $scope.drid;
    $scope.doctor_name ; 
    $scope.specialization;
    $scope.education;
    $scope.details;
    $scope.fees;
    $scope.experience;
    $scope.address;
    $scope.medical_service_id;
    $scope.users_id;
    $scope.temp=[];
//$scope.days = ["Monday", "Tuesday","Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
$scope.hours = ['1:00','2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00','11:00','12:00']


$scope.load = function(){
    //console.log($rootScope.currentUser)

    $http({
        method : "GET",
        url : H.SETTINGS.baseUrl + '/users/' + $rootScope.currentUser.id

    }).then(function(res) 
    {
        console.log(res);
        $scope.id = res.data.id
        $scope.firstname = res.data.first_name 
        $scope.lastname = res.data.last_name
        $scope.addr = res.data.addr1
        $scope.gender = res.data.gender
        $scope.email = res.data.email
        $scope.phone = res.data.phone
        //console.log(res[0].first_name);
        //console.log($scope.lastname);
       // $rootScope.currentUser = res.data;
       // console.log($rootScope.currentUser);
        //alert("Successfully Updated User Information")
        
    })

   /*  R.get('users').query({email : $rootScope.currentUser.email}, function (res) 
    {
        //console.log(res);
        $scope.id = res[0].id
        $scope.firstname = res[0].first_name 
        $scope.lastname = res[0].last_name
        $scope.addr = res[0].addr1
        $scope.gender = res[0].gender
        $scope.email = res[0].email
        $scope.phone = res[0].phone
        //console.log(res[0].first_name);
        //console.log($scope.lastname);
        
    }); */

    R.get('day_week').query({}, function (res) 
    {
        //console.log(res);
        $scope.days = res
        //console.log(res);
        //console.log($scope.lastname);
        
    });

    R.get('doctor').query({}, function (res) 
    {
        //console.log(res);
        $scope.datas = res
        //console.log(res);
        //console.log($scope.lastname);
        
    });

    R.get('doctor').query({users_id : $rootScope.currentUser.id}, function (res) {
        //console.log(res);
        $scope.drid = res[0].id
        $scope.doctor_name = res[0].doctor_name 
        $scope.specialization = res[0].specialization
        $scope.education = res[0].education
        $scope.details = res[0].details
        $scope.fees = res[0].fees
        //$scope.phone = res[0].phone
        $scope.experience = res[0].experience
        $scope.address = res[0].address
        $scope.medical_service_id = res[0].medical_service_id
        $scope.users_id = res[0].users_id
       // console.log(res[0]);
        //console.log($scope.lastname);
        R.get('available_doc_days').query({doctor_id: $scope.drid}, function (re){
           $scope.totalworkingdays = re;
           

            R.get('available_doc_time').query({}, function(resp){
                $scope.totalworkingtime = resp;
            })
     });
        
    });
    
}
  
$scope.sendReq = function()
{
    //console.log(id);
            $http({
                method : "POST",
                url : H.SETTINGS.baseUrl + '/users',
                data : {
                    "id" : $scope.id,
                    "first_name" :  $scope.firstname,
                    "last_name" :  $scope.lastname,
                    "gender" : $scope.gender,
                    "email" : $scope.email,
                    "phone" :$scope.phone,
                    "addr1" : $scope.addr 
                }
            }).then(function(response) 
            {
                console.log("cugkuahsiccjbiAjs")
                $rootScope.currentUser = response.data;
                console.log($rootScope.currentUser);
                //alert("Successfully Updated User Information")
                
            })
}
$scope.addCookie= function()
{
    for(i=0;i<$scope.datas.length;i++)
    {
       // console.log($scope.datas[i].id)
    $cookies.putObject($scope.datas[i].id, $scope.datas[i]);
    }
}
$scope.getCookie= function()
{
   // console.log("Cookkeee")
   //console.log($cookies.get("Data"))
   for(i=0;i<$scope.datas.length;i++)
   {
       //console.log(i)
    var p=$cookies.get($scope.datas[i].id)
    //console.log(p)
    var m =JSON.parse(p)
    //console.log("--------------------Bad SHAH-------------------------------------")
    //console.log(m)
   // console.log(JSON.parse(m))
    $scope.temp.push(m)
   }
  // console.log( $scope.temp)
}

$scope.sendPersonalDetails=function(){
//console.log(id);
$http({
    method : "POST",
    url : H.SETTINGS.baseUrl + '/doctor',
    data : {
        'id' : $scope.drid,
        'doctor_name' : $scope.doctor_name, 
        'specialization' : $scope.specialization,
        'education' : $scope.education,
        'details' : $scope.details,
        'fees' :$scope.fees,
        'experience' : $scope.experience,
        'address' : $scope.address,
        'medical_service_id' : $scope.medical_service_id,
        'users_id' : $scope.users_id
    }
}).then(function(response) 
{
    $rootScope.currentUser = response.data;
    //console.log($rootScope.currentUser);
    //alert("Successfully Updated User Information")
  
//   $scope.addCookie()
    $scope.getCookie()
})
}

    $scope.pusharr = function(){
    R.get('available_doc_days').query({doctor_id:$scope.drid, day_week_id: $scope.weekday    },function(res)
    {
        
        //console.log("Inside Dr Avaibility")
        //console.log(res)
        if(res.length == 0){$http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/available_doc_days',
            data : 
            {
                "doctor_id" : $scope.drid,
                "day_week_id" : $scope.weekday

            }
        }).then(function(response) 
        {
            $scope.av_day_id = response.data.id;
            $http({
                method : "POST",
                url : H.SETTINGS.baseUrl + '/available_doc_time',
                data : {
                    "available_doc_day_id" : $scope.av_day_id,
                    "fromtime" : $scope.hours1 + ' ' + $scope.fromampm,
                    "totime" :   $scope.hours2 + ' ' + $scope.toampm
    
                }
            }).then(function(response) {
                //alert("Insertedddd")
            })
        })
    } else {
        $http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/available_doc_time',
            data : {
                "available_doc_day_id" :res[0].id,
                "fromtime" : $scope.hours1 + ' ' + $scope.fromampm,
                "totime" :   $scope.hours2 + ' ' + $scope.toampm

            }
        }).then(function(response) {
            //alert("Insertedddd")
        })
    }
    $scope.load();
    })
    
    }

    $scope.delday = function(delid){
        $http({
            method : "DELETE",
            url : H.SETTINGS.baseUrl + '/available_doc_days/'+ delid

        }).then(function(ro) {
            console.log(ro)
            $scope.load()
        })
    }
})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */
app.controller('doctorviewController', function($scope, $cookies,$routeParams, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){
    
    $scope.load = function(){
        console.log($routeParams.id)
        
        $http({
            method : "GET",
            url : H.SETTINGS.baseUrl + '/doctor/' + $routeParams.id
    
        }).then(function(res) {
            $scope.d = res.data;
        })
    }
})
   app.controller('calenderController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S) {
    $scope.dateobj = {};
    $scope.ardate = [];
    $scope.load = function(){
      if($rootScope.currentUser.role =='doctor'){
        $scope.date = new Date()
        $scope.currentdate = moment($scope.date).format('DD-MM-YY');
      R.get('doctor').query({users_id: $rootScope.currentUser.id},function(r){
        console.log(r)

        R.get('user_trans').query({doc_id : r[0].id, req_status : 5}, function(re){
          $scope.calval = re
          for (i = 0; i<$scope.calval.length; i++){
            $scope.nowdate = new Date()
            var d = re[i].date_selected_usr
            var k = d.split('-')
            var dateObject = new Date(+k[2], k[1] - 1, +k[0]); 
            var day = moment(dateObject).format('dddd')
            var month = moment(dateObject).format('MMMM')
            var daydate = moment(dateObject).format('DD')
            console.log(re);

            $scope.dateobj = {
              "date" : re[i].available_doc_time,
              "day" : day,
              "dateobj" : dateObject,
              "name" : re[i].type.name,
              "daydate" : daydate,
              "month" : month,
              "address" : re[i].user.addr2,
              "typeid" : re[i].type.id,
              "phone" : re[i].user.phone,
              "usrname" : re[i].user.first_name +' '+ re[i].user.last_name,
              "fromtime" : re[i].available_doc_time.fromtime,
              "totime" : re[i].available_doc_time.totime
            }

            //if($scope.nowdate < dateObject){

              $scope.ardate.push($scope.dateobj)
           // }
          }
          $scope.ardate.sort(function(a,b){
            var c = new Date(a.dateobj);
            var d = new Date(b.dateobj);
            return c-d;
            });
          console.log($scope.ardate)
        })
        /* $http({
          method : 'POST',
          url : 'http://localhost:80/pRESTige/api/procedures/calender',
          data : {
            "dates" : $scope.currentdate,
            "doctor_id" : r[0].id
          }
        }).then(function(res){
          console.log(res)
          $scope.calval = res.data
        }) */

      })
    }
  }
  
    });

 app.controller('docnotiController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {
     //console.log("JIJIJIJIJ")
    $scope.newnoti = [];

  //  debugger
     //console.log($rootScope.currentUser);
        R.get('doctor').query({users_id : $rootScope.currentUser.id }, function (r) 
        {debugger
            $scope.curdoc = r[0].id;
            //console.log($scope.curdoc)
            R.get('last_seen').query({doctor_id : $scope.curdoc }, function (res) 
            {
                $scope.lastseen = res[0].time;
                R.get('user_trans').query({doc_id : $scope.curdoc }, function (response) 
                {
                    $scope.doctrans = response;
                    //console.log($scope.doctrans)

                    for(i = 0; i<$scope.doctrans.length; i++)
                    {
                        if($scope.doctrans[i].datetime>$scope.lastseen)
                        {
                            $scope.newnoti.push($scope.doctrans[i]);
                        }
                    }
                    console.log($scope.newnoti.length)
                    $rootScope.notiPop = $scope.newnoti.length
                })
            })
       });

    $scope.chgflg5 = function(id)
    {
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "id" : id,
                "req_status" : 5
			}
        }).then(function(response) 
        {
            console.log(response)
        })
        $route.reload();
    }

    $scope.chgflg3 = function(id)
    {
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "id" : id,
                "req_status" : 3
			}
		}).then(function(response) {
            console.log(response)
        })      
        $route.reload()
    }

})

 app.controller('doctorhomeController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.newnoti = [];
    $scope.online = [];
    $scope.home = [];
    //$scope.consultation = 1;

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('doctor').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            $scope.curdoc = r[0].id;
            console.log($scope.curdoc)
            R.get('user_trans').query({doc_id : $scope.curdoc }, function (response) 
            {
                $scope.temp = response;
                $scope.newnoti = response;
                //console.log($scope.doctrans)
                console.log($scope.newnoti)
            })
       });
    }

    $scope.chgflg5 = function(id)
    {
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "id" : id,
                "req_status" : 5
			}
        }).then(function(response) 
        {
            console.log(response)
        })
        $route.reload();
    }

    $scope.chgflg3 = function(id)
    {
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "id" : id,
                "req_status" : 3
			}
		}).then(function(response) {
            console.log(response)
        })      
        $route.reload()
    }

})

 app.controller('patienthistoryController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {
    $scope.newnoti = [];
    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('doctor').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            $scope.curdoc = r[0].id;
            console.log($scope.curdoc)
            R.get('user_trans').query({doc_id : $scope.curdoc }, function (response) 
            {
                $scope.newnoti = response;
                console.log($scope.doctrans)
                //console.log($scope.newnoti)
            })
       });
    }

})//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('formsControllerBase', ControllerFactory('forms'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD

app.controller('formsController', function ($scope, $rootScope, $controller, S, $mdDialog, $q, H, R, $location, $routeParams, $http) {

	//Copy all scope variables from Base Controller,

	$controller('formsControllerBase', {
		$scope: $scope
	});



	//$scope.roleOfCurrentUser = false;
	$scope.CurrentUserAdmin = false;
	$scope.CurrentUserEditor = false;
	$scope.CurrentUserCreator = false;
	$scope.CurrentUserViewer = false;
	$scope.copyfromid;
	$scope.autoIncre;
	$scope.countEntries = 1;
	$scope.currentUserId = $rootScope.currentUser.id;
	$scope.currentUser = $rootScope.currentUser.role;

	$scope.formcount = $rootScope.formCount;
	
	

	if ($scope.currentUser == 'admin') {
		$scope.CurrentUserAdmin = true;
	}
	else if ($scope.currentUser == 'editor') {
		$scope.CurrentUserEditor = true;
	}
	else if ($scope.currentUser == 'creator') {
		$scope.CurrentUserCreator = true;
	}
	else {
		$scope.CurrentUserViewer = true;
	}

	$scope.status = ' ';
	$scope.itemsDetails=[];
	$scope.customFullscreen = false;
	$scope.formId;
	$scope.categories = [];
	$scope.fieldSources = [];
	var formId = $routeParams.id;
	$scope.fields = [];
	$scope.totalformdata = [];
   
	//
	$scope.viewby = 5;
  // $scope.totalItems = $scope.data.length;
  $scope.currentPage = 3;
  $scope.itemsPerPage = 10;
	$scope.maxSize = 2;
	$scope.setPage = function (pageNo) {
    $scope.currentPage = pageNo;
  };

  $scope.pageChanged = function() {
    console.log('Page changed to: ' + $scope.currentPage);
  };

$scope.setItemsPerPage = function(num) {
  $scope.itemsPerPage = num;
  $scope.currentPage = 1; //reset to first page
}
	//
    ///end
	//Load all posts on initialization
	$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(response) {
		$scope.user_groups = response.data;
        $scope.query({}, function (r) {
			$scope.totalformdata=r;
			$scope.totalItems = r.length;
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
	    	$scope.validForms = [];
	    	for(var i = 0; i < r.length; i++) {
				if((r[i].UserId != undefined && r[i].UserId.split(',').includes($scope.currentUserId.toString())) || (r[i].GroupId != undefined && checkGroups(r[i].GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
	        		$scope.validForms.push(r[i]);
	        	}
	    	}	
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
			$scope.data.list.length = "";
		},
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function () { $scope.cancelDelete(); }
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
	$scope.sameformnameModalOption = {
		header: 'An error occured ...',
		text: 'Same form name are not valid',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () { },
		showCancel: false,
		cancelText: '',
		onCancelClick: function () { }
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

	R.get('category').query({ is_active: 1 }, function (categories) {
		$scope.categories = categories;
	});

	$scope.copy = function (ev, data) {

		$scope.copyfromid = data.id;
		$scope.autoIncre = data.autoIncrement;
		R.get('form_fields').query({
			form_id: $scope.copyfromid
		}, function (r) {
			$scope.data.form_fields = r;
			$scope.fields = r;
		});
		var confirm = $mdDialog.prompt()
			.title('Enter Form Name')
			.textContent('Same form name are not allowed ')
			.placeholder('Dog name')
			.ariaLabel('Dog name')
			.initialValue(data.title + ' -copy')
			.targetEvent(ev)
			.required(true)
			.ok('Copy')
			.cancel('Cancel');

		$mdDialog.show(confirm).then(function (result) {

			var title = [];
			var boll;
			var form;
			R.get('forms').query({}, function (r) {

				for (var x in r) {
					if (boll = r[x].title == result) {
						return $scope.modalOptions.open($scope.sameformnameModalOption);
					} else {
					}
				}

				form = angular.copy(data);
				form.title = result;
				$scope.data.list.push(form);
			 
				$scope.saveForm(form);
			});


		},
			function () {
				$scope.status = 'You didn\'t name your form.';
			});
	};
	///start




	$scope.saveForm = function (formdata) {

		R.get('entries/').query({ form_id: $scope.copyfromid }, function (r) {
			for (let i = 0; i <= r.length; i++) {
				$scope.countEntries = r.length + 1;
			}
		}, function (e) {
			console.log(e);
		});

		var Form = R.get('forms');
		var form = new Form();
		var Entry = R.get('entries');
		form.title = formdata.title;
		form.numberofColumn = formdata.numberofColumn;
		form.categoryId = formdata.category.id;
		form.UserId = formdata.UserId;
		form.GroupId = formdata.GroupId;
		form.is_group = formdata.is_group;
		form.autoIncrement = formdata.autoIncrement;
		form.master_id = formdata.master_id ? formdata.master_id : null;
		form.default_field_id = formdata.default_field ? formdata.default_field.id : null
		form.masterEnableUpadte = formdata.masterEnableUpadte;
		form.sendEmailAlert = formdata.sendEmailAlert;
		form.reasonForUpdate = formdata.reasonForUpdate;
		form.masterEnableList = formdata.masterEnableList;
		// var Entries = R.get('entry_values');
		var Field = R.get('fields');
		var FormField = R.get('form_fields');
		var FormDefaultFields = R.get('form_default_fields');
		var FieldSourceItem = R.get('form_field_datasource');
		// var EntriesDefault = R.get('entry_default_values');
		// var entryVersions = R.get('entry_versions');
		var Formulas = R.get('form_formulas');
		var fieldSavePromises = [];
		var savedFields = [];
		var form_fields = [];
		var form_field_ds = [];
		var requiredFields = {};
		// var entrydata = [];
		// var newverson = [];
		// var v = [];
		var formula_fields = [];

		for (let x in $scope.fields) {

			if (x == '$promise') {
				break;
			}
			var field = new Field();
			field.title = $scope.fields[x].field.title;
			field.field_type_id = $scope.fields[x].field.field_type.id;
			requiredFields[$scope.fields[x].field.title] = {
				required: $scope.fields[x].is_required,
				is_multiple: $scope.fields[x].is_multiple,
				seq: $scope.fields[x].seq,
				default_value: $scope.fields[x].default_value,
				is_formula: $scope.fields[x].is_formula,
			};
			fieldSavePromises.push(field.$save());
		}


		$q.all(fieldSavePromises).then(function (r) {
			savedFields = r;
			form.$save().then(function (r) {

				$scope.formId = r.id

				// R.get('entries').query({
				// 	form_id: $scope.copyfromid
				// }, function (entries) {
				// 	for (let i in entries) {
				// 		if (i == '$promise') {
				// 			break;
				// 		}
				// 		var entry = new Entry();
				// 		entry.form_id = $scope.formId;
				// 		entry.display_id = $scope.countEntries;
				// 		entrydata.push(entry.$save())
				// 	}
				// });
				for (let i in savedFields) {
					var f = new FormField();
					if (i == '$promise') {
						break;
					}
					f.form_id = r.id;
					f.field_id = savedFields[i].id;
					f.is_formula = requiredFields[savedFields[i].title].is_formula;
					f.default_value = requiredFields[savedFields[i].title].default_value;
					f.is_required = requiredFields[savedFields[i].title].required;
					f.is_multiple = requiredFields[savedFields[i].title].is_multiple;
					f.seq = requiredFields[savedFields[i].title].seq;
					form_fields.push(f.$save());
				}

				R.get('form_default_fields').query({
					form_id: $scope.copyfromid
				}, function (res) {
					var formdefultfield = new FormDefaultFields();
					for (let j in res) {
						if (j == '$promise') {
							break;
						}
						formdefultfield.default_field_id = res[j].default_field.id;
						formdefultfield.form_id = $scope.formId;
						formdefultfield.is_required = res[j].is_required;
						formdefultfield.master_id = res[j].master.id;
						formdefultfield.$save();
					}
				}, function (e) { })


				$q.all(form_fields).then(function (r) {


					R.get('form_fields').query({
						form_id: $scope.formId
					}, function (res) {
						$scope.data.form_fields = res;
						R.get('form_formulas').query({ form_id: $scope.copyfromid }, function (formulas) {
							// var formulafields=$scope.data.form_fields.filter(e=> e.	is_formula)

							for (let j in formulas) {
								if (j == '$promise') {
									break;
								}
								var formula = new Formulas();
								var formulafields = $scope.data.form_fields.filter(e => {
									if (e.field.title == formulas[j].form_field.field.title) {
										return e.id;
									}
								})
								formula.form_id = $scope.formId;
								formula.form_field_id = formulafields[0].id;
								formula.question = formulas[j].question;
								formula.formulasing = formulas[j].formulasing;
								formula.type = formulas[j].type;
								formula.value = formulas[j].value;
								formula.operator = formulas[j].operator;
								formula_fields.push(formula.$save());
							}
						}, function (e) { })

						$q.all(form_field_ds).then(function (r) {
							// $scope.showFormSavedModal();

							R.get('form_field_datasource').query({ form_id: $scope.copyfromid }, function (source) {
								var val = []
								for (let x in source) {
									if (x == '$promise') {
										break;
									}
									// $scope.fieldSources.push(source[x])
									// var val =source.filter(e=> e.form_field.field.title==$scope.data.form_fields.field.title )
									val.push($scope.data.form_fields.filter(function (d) {
										return d.field.title == source[x].form_field.field.title
									}));
								}
								if (source) {
									for (let j in val) {
										let fs = new FieldSourceItem();
										fs.form_id = $scope.formId;
										fs.form_field_id = val[j][0].id;
										fs.title = source[j].title;
										form_field_ds.push(fs.$save());
									}
								}

							}, function (r) {
								for (let i in r) {
									//start here
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
							});
						})
					}, function (e) {
						console.log(e);
						// $scope.launchErrorModal();

					});




				}, function (e) {
					// $scope.launchErrorModal();
				});
			}, function (e) {
				console.log(e);
			});

		});
		$scope.selectedFieldType = '';
	}

	$scope.cancel = function (obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () {
			$scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length = "";
		},
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function () { $scope.cancelDelete(); }
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

	$scope.deleteObject = function (obj) {
		$scope.delete(obj, function (r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function (obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function () {
		$scope.deleteCandidate = null;
	}

	$(function () {
		$('.fixed-action-btn').floatingActionButton({
			direction: 'left'
		});
	});

});
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

app.controller('formController', function ($scope, $timeout, $http, R, S, $location, $q, $routeParams, $compile, $mdDialog, $rootScope) {
    var formId = $routeParams.id;
    $scope.data = {};
    $scope.data.entries = {};
    $scope.data.default_entries = {};
    $scope.data.masterDataSource = {};
    $scope.data.fieldDataSource = {};
    $scope.validDate;
    $scope.column;
    $scope.isMultiple;
    $scope.newversionId;
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
    $scope.selection = [];
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

    $scope.masterValues = {};
    $scope.data2 = {}

    $scope.unselectfield = function (v) {

        var f = $scope.selectedValue.indexOf(v);
        if (f >= 0) {
            data[$scope.selectedValue[f].title] = $scope.selectedValue[f];
            $scope.selectedValue.splice(f, 1);
        }
    }

    $scope.load = function () {

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

        R.get('entries/').query({ form_id: formId }, function (res) {
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
            console.log($scope.masterValues)
            for (let i in data3) {
                var d = []
                for (let j in data3[i]) {
                    if (!d[data3[j]]) d[data3[i][j]] = null
                }
                setAutoComplete($('.m' + i), d);
            }

        }, function (e) { });
    }

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
        console.log(formData.master.id, typeId, mValue, id);
        console.log($scope.all_values);
        console.log($scope.masterValues);
        $scope.data.default_entries[id] = 25;
        R.get('master_entry_values').query({}, function (res) {
            //console.log(res);
            $scope.all_values = res;

            for(i=0; i<$scope.all_values.length; i++){

                if(formData.master.id ==  $scope.all_values[i].master_id){
                    console.log($scope.all_values[i]);
                }

            }

            for(i = 0; i<$scope.all_values.length; i++){
                if(formData.master.id == $scope.all_values[i].master.id){
                    //console.log($scope.all_values[i])
                }
            }

            if (formData && typeId && mValue && id) {
                if (formData.form.masterEnableList) {
                    // formData.form.masterEnableList = new Array(formData.form.masterEnableList);
                    var a = formData.form.masterEnableList.includes(formData.master.id)
                    //console.log(a) 
                }
    
                if (a) { 
                    //console.log(a) 
                } else {
                    console.log($scope.masterValues[typeId]);
                    // var mv = $scope.masterValues[typeId] ? Object.keys($scope.masterValues[typeId]) : null;
                    if (!$scope.masterValues[typeId].includes(mValue)) {
                        $scope.showFormMasterEntryErrorModal();
                        document.getElementById(id).value = '';
                        $scope.data.default_entries[id] = [];
                    }
                }
            }

        }, function (e) {
            console.log(e);
        });

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

    R.get('forms/' + formId).get(function (r) {
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

        for (let i = 0; i < r.length; i++) {
            for (j = 0; j < r.length; j++) {
                if (r[i].default_field.id == r[j].default_field.title) {
                    r[j].default_field.title = r[i].default_field.title
                }
            }
        }
        $scope.data.form_default_fields = r.filter(e => e.form.id == formId);
        // $scope.data.form_default_fields = r;
    }, function (e) { });

    R.get('master').query({}, function (r) {
        $scope.data.master = r;
    }, function (e) { });



    R.get('form_fields').query({
        form_id: formId
    }, function (r) {

        $scope.data.form_fields = r;
        var d = [];
        var x = [];
        for (var i = 0; i < r.length; i++) {
            $scope.selection[r[i].id] = [];
            if (r[i].field.field_type.type == 'time' || r[i].field.field_type.type == 'date') {
                d[r[i].id] = new Date(r[i].default_value);
            } else {
                d[r[i].id] = r[i].default_value;
            }
            console.log(r[i]);
            if (r[i].field.field_type.id == 5) {
                if (r[i].default_value && r[i].default_value.includes(',')) {
                    $scope.selection[r[i].id] = r[i].default_value.split(',');
                } else if (r[i].default_value) {
                    $scope.selection[r[i].id] = r[i].default_value;
                }
            }
        }

        $scope.data.entries = d;

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


    R.get('form_formulas').query({ form_id: formId }, function (d) {
        $scope.formulas = d;
    });
    R.get('form_field_datasource').query({
        form_id: formId
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

    $scope.toggleSelection = function (checkitem, id) {

        var idx = $scope.selection[id].indexOf(checkitem);

        console.log(idx);

        // Is currently selected
        if (idx > -1) {
            $scope.selection[id].splice(idx, 1);
        }

        // Is newly selected
        else {
            $scope.selection[id].push(checkitem);
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
                R.get('form_formulas').query({ form_id: formId }, function (d) {
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
        $scope.data.entries[id] = '';
    }

    $scope.saveData = function (formBuilder) {

        // if ($scope.profilePic.length) {
        //     for (let Ppic = 0; Ppic < $scope.profilePic.length; Ppic++) {
        //         $scope.profilePicMul.push($scope.profilePic[Ppic]);
        //     }
        // }
            console.log($scope.msg);
            console.log($scope.msgType);
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

        var entry = new Entry();
        entry.form_id = formId;
        entry.display_id = $scope.countEntries;

        var values = [];

        entry.$save().then(function (r) {
            var fileValues = [];
            var versionentry = new entryVersions();
            versionentry.entry_id = r.id;
            versionentry.version = 1;
            versionentry.$save().then(function (versiondata) {
                for (let i = 0; i < $scope.data.form_fields.length; i++) {
                    let x = $scope.data.form_fields[i];
                    let value = new Value();

                    value.form_id = r.form.id;
                    value.entry_id = r.id;
                    value.form_field_id = x.id;
                    //console.log(value.form_field_id)
                    value.entry_version_id = versiondata.id

                    if (x && x.field && x.field.field_type && x.field.field_type.id == 8 && !x.is_multiple) {

                        var file = $scope.data.entries[x.id];
                        console.log(file);
                        fileValues.push($scope.uploadFile(file, x.id));
                    }

                    if (x.field.field_type.id == 5) {
                        $scope.data.entries[x.id] = $scope.selection[x.id].join(',');
                        $scope.data.entries[x.id] = $scope.data.entries[x.id].trim();
                    }
                    if (x.field.field_type.id == 9 && x.is_multiple) {
                        $scope.textAreadata.push($scope.data.entries[x.id]);
                        $scope.data.entries[x.id] = $scope.textAreadata.join(',');
                    }
                    if (x.field.field_type.id == 1 && x.is_multiple) {
                        $scope.textdata.push($scope.data.entries[x.id]);
                        $scope.data.entries[x.id] = $scope.textdata.join(',');
                    }
                    if (x.field.field_type.id == 2 && x.is_multiple) {
                        $scope.numberdata.push($scope.data.entries[x.id]);
                        $scope.data.entries[x.id] = $scope.numberdata.join(',');
                    }
                    if (x.field.field_type.id == 10) {
                        $scope.data.entries[x.id] = String(document.getElementById(x.field.title).value);
                    }
                    if (x.field.field_type.id == 8 && x.is_multiple) {

                        $scope.filedata.push($scope.data.entries[x.id]);
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
                        value.entry_value = $scope.data.entries[x.id];
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
                        value.entry_value = $scope.data.entries[x.id];
                        values.push(value.$save());
                    }



                }

                for (let i = 0; i < $scope.data.form_default_fields.length - 1; i++) {

                    let x = $scope.data.form_default_fields[i];
                    var value = new DefaultValue();
                    value.form_id = r.form.id;
                    value.entry_id = r.id;
                    value.form_default_field_id = x.id;
                    value.entry_version_id = versiondata.id

                    value.entry_value = $scope.data.default_entries[x.id];

                    values.push(value.$save());
                }
                $q.all(fileValues).then(function () {

                    for (let i = 0; i < $scope.data.form_fields.length; i++) {
                        var x = $scope.data.form_fields[i];
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



            var fDefaultFields = {};
            var vl = {};

            fDefaultFields = $scope.data.form_default_fields;

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

            for (let i = 0; i < fDefaultFields.length - 1; i++) {

                let x = fDefaultFields[i];
                // idsofmaster.push(x.master.id);
                var mEntry = new masterEntry();
                mEntry.master_id = x ? x.master.id : null;

                if (x && x.default_field.field_type.id != 12 && $scope.data.default_entries[x.id] && $scope.data.default_entries[x.id] != null) {

                    var mvalues = $scope.masterValues[x.default_field.id] || null;

                    if ($scope.data.default_entries[x.id] && $scope.data.default_entries[x.id] != undefined && mvalues) {
                        if (mvalues.includes($scope.data.default_entries[x.id])) { }
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



    $scope.savedModalOptions = {
        header: 'Saved!',
        text: 'Your entry has been saved successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function () {
            $location.path('forms');
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
            $location.path('forms');
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
app.controller('formRecordsControllerBase', ControllerFactory('entry_values'));

app.controller('formsRecordsController', function ($scope, $rootScope, $controller, $http, R, S, $location, $q, $routeParams, H, $timeout) {

	$controller('formRecordsControllerBase', {
		$scope: $scope
	});

	$scope.CurrentUserAdmin = false;
	$scope.CurrentUserEditor = false;
	$scope.CurrentUserCreator = false;
	$scope.CurrentUserViewer = false;
	$scope.currentUser = $rootScope.currentUser.role;

	if ($scope.currentUser == 'admin') {
		$scope.CurrentUserAdmin = true;
	}
	else if ($scope.currentUser == 'editor') {
		$scope.CurrentUserEditor = true;
	}
	else if ($scope.currentUser == 'creator') {
		$scope.CurrentUserCreator = true;
	}
	else {
		$scope.CurrentUserViewer = true;
	}

	var formId = $routeParams.id;
	$scope.data = {};

	// localStorage.setItem("formId",formId);

	R.get('forms/' + formId).get(function (r) {
		$scope.data.form = r;
	}, function (e) {
		console.log(e);
	});


	R.get('default_fields').query({

	}, function (r) {
		$scope.data.default_fields = r;
	}, function (e) {
		console.log(e);
	});

	// R.get('form_default_fields').query({ form_id: formId }, function (r) {
	// 	$scope.data.form_default_fields = r;
	// 	console.log($scope.data.form_default_fields)
	// }, function (e) { });

	
	R.get('form_default_fields').query({ }, function (r) {
		//console.log(r)
		for (let i = 0; i < r.length; i++) {
			for (j = 0; j < r.length; j++) {
				if (r[i].default_field.id == r[j].default_field.title) {
					r[j].default_field.title = r[i].default_field.title;
				}
			}
		}
		$scope.data.form_default_fields = r.filter(e =>  e.form.id == formId);
		console.log($scope.data.form_default_fields)
	}, function (e) { });

	R.get('form_fields').query({
		form_id: formId
	}, function (r) {

		$scope.data.form_fields = r;
		//console.log($scope.data.form_fields);
	}, function (e) {
		console.log(e);
	});


	R.get('entries').query({
		form_id: formId
	}, function (res) {
		$scope.data.entries = res;
	}, function (e) {
		console.log(e);
	});

	
	R.get('entry_values').query({
		form_id: formId
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
					if (entryv[i].form_field.field.field_type.type == "file"){ d[entryv[i].entry_version.entry.id][entryv[i].form_field.field.title] = entryv[i].entry_value ? entryv[i].entry_value.includes(',') ? entryv[i].entry_value.split(',') : entryv[i].entry_value : null;}
					var d2 = [];
					//console.log(d);
					for (var j in d) {
						var len = d[j].length - 1;
						if (len >= 0) d2[j] = d[j][len];
					}

				}
				$scope.data.entry_values = d2;
			}, 1);

		}
		
		console.log($scope.data.entry_values);



	}, function (e) { });


	R.get('master_entry_values').query({

	}, function (master) {
		$scope.data.master_entry_values = master;
	}, function (e) {
		console.log(e);
	});

	R.get('entry_default_values').query({
		form_id: formId
	}, function (r) {

		for (var l = 0; l < r.length; l++) {
			var ri = r[l];
			// if (ri && ri.form_default_field.default_field && ri.form_default_field.default_field.field_type && ri.form_default_field.default_field.field_type.id && ri.form_default_field.default_field.field_type.id == 12) {

			// 	var k = r[l].entry_value;

			// 	if (k && k != undefined || k != null) {
			// 		var a = []

			// 		let mE = $scope.data.master_entry_values;

			// 		for (i = 0; i < mE.length; i++) {

			// 			if (mE[i].master_entry.id == k) {
			// 				a.push(mE[i])
			// 			}
			// 		}

			// 		var d = [];
			// 		for (var i = 0; i < a.length; i++) {
			// 			if (!d[a[i].master_entry.id]) d[a[i].master_entry.id] = [];
			// 			if (!d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id]) d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id] = [];
			// 			d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id] = a[i];
			// 		}

			// 		var d1 = [];

			// 		for (var j in d) {
			// 			var len = d[j].length - 1;
			// 			if (len >= 0) d1[j] = d[j][len];
			// 		}
			// 		r[l].entry_value = d1[k].master_entry_value;
			// 	}

			// }
			// else {
				r[l].entry_value = r[l].entry_value;
			// }

		}
		var x = [];
		for (var i = 0; i < r.length; i++) {
			if (!x[r[i].entry.id]) x[r[i].entry.id] = [];
			if (!x[r[i].entry_version.entry.id][r[i].entry_version.id]) x[r[i].entry_version.entry.id][r[i].entry_version.id] = [];
			x[r[i].entry_version.entry.id][r[i].entry_version.id][r[i].form_default_field.default_field.id] = r[i].entry_value;
		}

		var y = [];
		for (var j in x) {
			var len = x[j].length - 1;
			if (len >= 0) y[j] = x[j][len];
		}

		$scope.data.entry_default_values = y;

	}, function (e) { });


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of forms.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms');
		},
		showCancel: true,
		cancelText: 'Cancel',
		onCancelClick: function () { }
	}

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () { $scope.deleteObject($scope.deleteCandidate); },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function () { $scope.cancelDelete(); }
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
	$scope.modalOptions = {};

	$scope.deleteObject = function (obj) {
		$scope.delete(obj, function (r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function (obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function () {
		$scope.deleteCandidate = null;
	}

	$scope.showCancelFormModal = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.showErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$(function () {
		$('.fixed-action-btn').floatingActionButton({});
	});



});//An example of Angular $http

app.controller('formsCategoryAddController', function($scope, $rootScope, $http, R, S, $location, $q) {
	$scope.pageheader="CREATE A NEW CATEGORY";
	$scope.data={};
	$scope.data.is_active=true;
	$scope.isDisabled = false;
	$scope.roleOfCurrentUser = $rootScope.currentUser.role;
	 
	 
	R.get('category').query({}, function (r) {
		$scope.uniquecat = r;
        $scope.titlelist = r.map(function (data) {
            return data.title;
		});
    }, function (e) {

	});
	$scope.uiquecategory = function (t) {
		console.log(t);
		for(let x = 0; x < $scope.titlelist.length; x++){
		if($scope.titlelist[x] == t){
			$scope.showErrorModalNewEntry();
		}
	}

	}
	
	angular.element(document).ready(function() {

		$( "#title" ).focus();
		$('.fixed-action-btn').floatingActionButton({

		});

	});


	$scope.showErrorModalNewEntry = function() {
        $scope.modalOptions.open($scope.errorModalOptionsNewEntry);
    }
    
    $scope.errorModalOptionsNewEntry = {
    	header: 'Warning ...',
        text: 'Category name already exist !!',
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
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Category.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function() {
			$location.path('forms-category');
		},
		showCancel: true,
		cancelText: 'Cancel',
		onCancelClick: function() {}
	}

	$scope.savedModalOptions = {
		header: 'Saved!',
		text: 'Your entry has been saved successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function() {
			$location.path('forms-category');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function() {
			document.getElementById('title').value='';
			clearFieldType();
			$scope.fields=[];
			$scope.isDisabled = false;

		}
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
	
	$scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
	$scope.errorModalOptionsTitle = {
		    header: 'Warning ...',
	        text: 'Please enter a Title to the Question!',
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}

	$scope.modalOptions = {};

	$scope.cancelForm = function() {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.launchErrorModal = function() {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function() {
		$scope.modalOptions.open($scope.savedModalOptions);
	}

	$scope.saveCategoty = function() {
		$scope.isDisabled = true;
		var Categoty = R.get('category');
		var category = new Categoty();
		if($scope.data.title == '' || $scope.data.title == ' ' || $scope.data.title == undefined) {
			$scope.showErrorModalTitle();
			$scope.isDisabled = false;
			return;
		}
		category.title = $scope.data.title;
		 //$scope.check = 0;
		// $scope.data.is_active = ($scope.check === 1) ? 1 : 0;
		 // $scope.data.is_active == 1 ? $scope.data.is_active = 1 : $scope.data.is_active= 0;
		 
		category.is_active = $scope.data.is_active == true ? 1:0;
		category.$save();

		$q.all(category).then(function(r) {
			$scope.showFormSavedModal();
		}, function(e) {
			$scope.launchErrorModal();
		});
	}
	
});

app.controller('formsCategoryEditController', function ($http, $scope, $location, $routeParams, $timeout, $controller, R, S) {
	$scope.pageheader="EDIT CATEGORY";
	$scope.fields = [];
	$controller('categoryControllerBase', {
		$scope: $scope
	});

	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;

	$scope.load = function () {
		$( "#title" ).focus();
		R.get('category/' + $scope.id).get(function (r) {
			$scope.data = r;
			$scope.data.title = r.title
			$scope.data.is_active = r.is_active == 1? true :false;
		});
	};
	
	$scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
	$scope.errorModalOptionsTitle = {
	        header: '',
	        text: 'Please enter a Title to the Question!',
	        showOk: true,
	        okText: 'Ok',
	        onOkClick: function() {},
	        showCancel: false,
	        cancelText: '',
	        onCancelClick: function() {}
	}


	$scope.save = function () {

		if ($scope.data.id) {
			var Categoty = R.get('category/').query({}, function (data) {
				if($scope.data.title == '' || $scope.data.title == ' ' || $scope.data.title == undefined) {
					$scope.showErrorModalTitle();
					$scope.isDisabled = false;
					return;
				}
				Categoty = $scope.data;
				// $scope.data.is_active == 1 ? $scope.data.is_active = 1 : $scope.data.is_active= 0;
				Categoty.is_active =  $scope.data.is_active == true ? 1:0;
				//$scope.is_active == true;
				//$scope.is_active == !$scope.is_active;
				Categoty.$save();
				
				
	
				$scope.showFormSavedModal();
			});

		} else {
			$scope.data.$save().then(function (r) {
				$scope.showErrorModal();
			});
		}

	}

	$scope.savedModalOptions = {
		header: 'updated!',
		text: 'Your entry has been updated successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-category');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () { }
	}


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Category.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-category');
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

	$scope.cancelForm = function() {
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
});//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('categoryControllerBase', ControllerFactory('category'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD
app.controller('formsCategoryController', function($scope, $rootScope, $controller, S) {
	//Copy all scope variables from Base Controller
	$controller('categoryControllerBase', {
		$scope: $scope
	});

	$scope.roleOfCurrentUser = false;
	$scope.currentUser = $rootScope.currentUser.role;
	if($scope.currentUser == 'admin'){
		$scope.roleOfCurrentUser = true
	}
	
		//
		$scope.viewby = 5;
		// $scope.totalItems = $scope.data.length;
		$scope.currentPage = 3;
		$scope.itemsPerPage = 10;
		  $scope.maxSize = 2;
		  $scope.setPage = function (pageNo) {
		  $scope.currentPage = pageNo;
		};
	  
		$scope.pageChanged = function() {
		  console.log('Page changed to: ' + $scope.currentPage);
		};
	  
	  $scope.setItemsPerPage = function(num) {
		$scope.itemsPerPage = num;
		$scope.currentPage = 1; //reset to first page
	  }
		  //
	//Load all posts on initialization
	$scope.query({}, function(r) {
		$scope.totalformdata=r;
		$scope.totalItems = r.length;
	});

	$scope.edit = function(obj) {
		$scope.mode = $scope.MODES.edit;
		$scope.editing = obj.id;
	};

	$scope.saveSingle = function() {
		$scope.save(null, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.initSingle();
			$scope.query();
		});
	};

	$scope.saveObject = function(obj) {
		$scope.save(obj, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.query();
		});
	};

	$scope.cancel = function(obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};
	
	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ 
			$scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length = ""; 
		},
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	}

	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function(){},
		showCancel: false,
		cancelText: '',
		onCancelClick: function(){}
	}

	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$scope.delete(obj, function(r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	}

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			
		});
	});
	
});//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('mastersControllerBase', ControllerFactory('master'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD

app.controller('formsMasterController', function($scope, $rootScope, $controller, S, R) {

	//Copy all scope variables from Base Controller
	$controller('mastersControllerBase', {
		$scope: $scope
	});

	$scope.roleOfCurrentUser = false;
	$scope.currentUser = $rootScope.currentUser.role;
	if($scope.currentUser == 'admin'){
		$scope.roleOfCurrentUser = true;
	}


     //
	$scope.viewby = 5;
	// $scope.totalItems = $scope.data.length;
	$scope.currentPage = 3;
	$scope.itemsPerPage = 10;
	  $scope.maxSize = 2;
	  $scope.setPage = function (pageNo) {
	  $scope.currentPage = pageNo;
	};
  
	$scope.pageChanged = function() {
	  console.log('Page changed to: ' + $scope.currentPage);
	};
  
  $scope.setItemsPerPage = function(num) {
	$scope.itemsPerPage = num;
	$scope.currentPage = 1; //reset to first page
  }
	  //

	//Load all posts on initialization
	$scope.query({}, function(r) {
		$scope.totalItems = r.length;
	});

	$scope.edit = function(obj) {
		$scope.mode = $scope.MODES.edit;
		$scope.editing = obj.id;
	};

	$scope.saveSingle = function() {
		$scope.save(null, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.initSingle();
			$scope.query();
		});
	};

	$scope.saveObject = function(obj) {
		$scope.save(obj, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.query();
		});
	};

	$scope.cancel = function(obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};
	
	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ 
			$scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length = "";
		 },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	}

	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function(){},
		showCancel: false,
		cancelText: '',
		onCancelClick: function(){}
	}

	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$scope.delete(obj, function(r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	}

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			
		});
	});
});//An example of Angular $http

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
});app.controller('mastersEntryControllerBase', ControllerFactory('master_entry_values'));

app.controller('formsMasterEntryListingController', function ($scope, $rootScope, $controller, $http, R, S, $location, $q, $routeParams, H) {
	//function ($scope, $rootScope, $http, R, SETTINGS, $location, $q) {

	$controller('mastersEntryControllerBase', {
		$scope: $scope
	});

	$scope.CurrentUserAdmin = false;
	$scope.CurrentUserEditor = false;
	$scope.CurrentUserContributor = false;
	$scope.CurrentUserSubscriber = false;
	$scope.currentUser = $rootScope.currentUser.role;
	$scope.data.master_entry_values = [];
	
	if ($scope.currentUser == 'admin') {
		$scope.CurrentUserAdmin = true;
	}
	else if ($scope.currentUser == 'editor') {
		$scope.CurrentUserEditor = true;
	}
	else if ($scope.currentUser == 'creator') {
		$scope.CurrentUserCreator = true;
	}
	else {
		$scope.CurrentUserViewer = true;
	}

	// var masterId = $routeParams.id;
	$scope.masterId = $routeParams.id;
	$scope.data = {};
	R.get('master_entries').query({
		master_id: $scope.masterId
	}, function (r) {
		$scope.data.master_entries = r;
	}, function (e) {
		console.log(e);
	});

	R.get('default_fields').query({
		//master_id: masterId 
	}, function (r) {
		for (let i = 0; i < r.length; i++) {
			for (j = 0; j < r.length; j++) {
				if (r[i].id == r[j].title) {
					r[j].title = r[i].title
				}
			}
		}
		$scope.data.default_fields = r.filter(e => e.master.id == $scope.masterId)
	}, function (e) {
		console.log(e);
	});



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
		//console.log("data", $scope.versions);
	}, function (e) {

	});
	R.get('master_entry_values').query({

	}, function (r) {

		let tmpentry=[]
		let filterentry=[]
		tmpentry =r.map(e => e.master_entry.id);
		
		for (let i = 0; i < $scope.data.master_entries.length; i++) {
			if (tmpentry.includes($scope.data.master_entries[i].id)) {
				filterentry.push($scope.data.master_entries[i]);
			}			
		}
		$scope.data.master_entries=filterentry;

		//console.log("res"+r);
		var test = [];
		var tempr = angular.copy(r);
		var extratmp = angular.copy(r);
		$scope.scopeR = angular.copy(r);

		for (let i = 0; i < $scope.scopeR.length; i++) {
			for (j = 0; j < extratmp.length; j++) {
				if ($scope.scopeR[i].master_entry.id == extratmp[j].master_entry_value && $scope.scopeR[i].default_field.id == extratmp[j].default_field.title) {
					tempr[j].master_entry_value = $scope.scopeR[i].master_entry_value;
				}
			}
		}

		r = tempr;
		$scope.data.master_entry_values = r.filter(e => e.master.id == $scope.masterId);
		var data = [];
		for (let i = 0; i < $scope.data.master_entry_values.length; i++) {
			for (let j = 0; j < $scope.data.default_fields.length; j++) {
				if ($scope.data.default_fields[j].id == $scope.data.master_entry_values[i].default_field.id && $scope.versions.length && $scope.versions[$scope.data.master_entry_values[i].master_entry.id][0] == $scope.data.master_entry_values[i].master_entry_version.id) {
					if (data[$scope.data.default_fields[j].id] == undefined) data[$scope.data.default_fields[j].id] = [];
					if (data[$scope.data.default_fields[j].id][$scope.data.master_entry_values[i].master_entry.id] == undefined) data[$scope.data.default_fields[j].id][$scope.data.master_entry_values[i].master_entry.id] = [];
					data[$scope.data.default_fields[j].id][$scope.data.master_entry_values[i].master_entry.id].push($scope.data.master_entry_values[i].master_entry_value)
				}
			}

		}

		$scope.data.master_entry_values = data;

	}, function (e) { });

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

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () {
			
			$scope.deleteObject($scope.deleteCandidate);
			let index = $scope.data.master_entries.indexOf($scope.deleteCandidate);
			$scope.data.master_entries.splice(index, 1)
			$scope.data.list = {};
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
	$scope.modalOptions = {};

	$scope.deleteObject = function (obj) {
		
		let id = obj.id
		$scope.delete(obj, function (r) {
			
			if (r.success.code == 200) {
				R.get('master_entry_values').query({ master_entry_value: id }, function (result) {

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

	$scope.launchDelete = function (obj) {
		
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function () {
		$scope.deleteCandidate = null;
	}

	$scope.showCancelFormModal = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.showErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	// $(function() {
	// 	$('.fixed-action-btn').floatingActionButton({});
	// });


});

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
});//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('proceduresControllerBase', ControllerFactory('procedures'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD
app.controller('formsProceduresController', function($scope, $rootScope, $controller, S, R, H, $http) {
	//Copy all scope variables from Base Controller
	$controller('proceduresControllerBase', {
		$scope: $scope
	});


	
	$scope.roleOfCurrentUser = false;
		//console.log($rootScope.currentUser);
        $scope.currentUser = $rootScope.currentUser.role;
        if($scope.currentUser == 'admin'){
            $scope.roleOfCurrentUser = true;
        }
		$scope.viewby = 5;
		// $scope.totalItems = $scope.data.length;
		$scope.currentPage = 3;
		$scope.itemsPerPage = 10;
		  $scope.maxSize = 2;
		  $scope.setPage = function (pageNo) {
		  $scope.currentPage = pageNo;
		};
	  
		$scope.pageChanged = function() {
		  console.log('Page changed to: ' + $scope.currentPage);
		};
	  
	  $scope.setItemsPerPage = function(num) {
		$scope.itemsPerPage = num;
		$scope.currentPage = 1; //reset to first page
	  }
		  //
	//Load all posts on initialization
	$scope.query({}, function(r) {
		$scope.totalformdata=r;
		$scope.totalItems = r.length;
	});
	
	$scope.load = function(){
		
		$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
			$scope.user_groups = r.data;
			$http.get(H.SETTINGS.baseUrl + '/procedure_forms').then(function(response) {
		        $scope.procedure_data = [];
		        $scope.procedure_ids = [];
		        $scope.procedure_data_original = response.data;
		        for(var i = 0; i < response.data.length; i++) {
		        	if((response.data[i].form.UserId != undefined && response.data[i].form.UserId.split(',').includes($rootScope.currentUser.id.toString())) || (response.data[i].form.GroupId != undefined && checkGroups(response.data[i].form.GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
		        		if(!$scope.procedure_ids.includes(response.data[i].procedure.id)) {
		        			$scope.procedure_data.push(response.data[i].procedure);
		        			$scope.procedure_ids.push(response.data[i].procedure.id);
		        		}
		        	}
		        }
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
		return userIdsOfGroupsString.join().split(',').includes($scope.currentUserId.toString());
		
    }

	$scope.edit = function(obj) {
		$scope.mode = $scope.MODES.edit;
		$scope.editing = obj.id;
	};

	$scope.saveSingle = function() {
		$scope.save(null, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.initSingle();
			$scope.query();
		});
	};

	$scope.saveObject = function(obj) {
		$scope.save(obj, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.query();
		});
	};

	$scope.cancel = function(obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this procedure?',
		text: 'If you proceed, all your records associated with this form will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ $scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length=""
		 },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	}

	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function(){},
		showCancel: false,
		cancelText: '',
		onCancelClick: function(){}
	}

	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$scope.delete(obj, function(r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	}

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			direction: 'left'
		});
	});


});//An example of Angular $http

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
});app.directive('dynamicModel', ['$compile', function ($compile) {
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
app.controller('formRecordsControllerBase', ControllerFactory('entry_values'));

app.controller('proceduresRecordsController', function ($scope, $rootScope, $controller, $http, R, S, $location, $q, $routeParams, H, $timeout) {

	$controller('formRecordsControllerBase', {
		$scope: $scope
	});

	$scope.CurrentUserAdmin = false;
	$scope.CurrentUserEditor = false;
	$scope.CurrentUserCreator = false;
	$scope.CurrentUserViewer = false;
	$scope.currentUser = $rootScope.currentUser.role;

	if ($scope.currentUser == 'admin') {
		$scope.CurrentUserAdmin = true
	}
	else if ($scope.currentUser == 'editor') {
		$scope.CurrentUserEditor = true
	}
	else if ($scope.currentUser == 'creator') {
		$scope.CurrentUserCreator = true
	}
	else {
		$scope.CurrentUserViewer = true
	}

	var procedureId = $routeParams.id;
	$scope.data = {};
	$scope.formIds = [];
	$scope.selectform = '';
	$scope.formId;
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
	
	$scope.selectformbyid = function (form_id) {
		$scope.selectform = form_id;
		$scope.formId = form_id;
		formdata($scope.formId, form_id);
	}
	function formdata(formId, form_id) {

		$scope.formId =form_id;

	for (let z = 0; z < $scope.formIds.length; z++) {


		R.get('forms/' + $scope.formId).get(function (r) {
			$scope.data.form = r;
		}, function (e) {
			console.log(e);
		});


		R.get('default_fields').query({

		}, function (r) {
			$scope.data.default_fields = r;
		}, function (e) {
			console.log(e);
		});

		// R.get('form_default_fields').query({ form_id: formId }, function (r) {
		// 	$scope.data.form_default_fields = r;
		// 	console.log($scope.data.form_default_fields)
		// }, function (e) { });


		R.get('form_default_fields').query({}, function (r) {
			for (let i = 0; i < r.length; i++) {
				for (j = 0; j < r.length; j++) {
					if (r[i].default_field.id == r[j].default_field.title) {
						r[j].default_field.title = r[i].default_field.title;
					}
				}
			}
			$scope.data.form_default_fields = r.filter(e => e.form.id == $scope.formId);
		}, function (e) { });

		R.get('form_fields').query({
			form_id: $scope.formId
		}, function (r) {

			$scope.data.form_fields = r;
			//console.log($scope.data.form_fields);
		}, function (e) {
			console.log(e);
		});


		R.get('entries').query({
			form_id: $scope.formId
		}, function (res) {
			$scope.data.entries = res;
		}, function (e) {
			console.log(e);
		});


		R.get('entry_values').query({
			form_id: $scope.formId
		}, function (entryv) {
			var d = [];
			for (let i = 0; i < entryv.length; i++) {
				if (entryv[i].form_field.field.field_type.id == 6 || entryv[i].form_field.field.field_type.id == 7 || entryv[i].form_field.field.field_type.id == 8 || entryv[i].form_field.field.field_type.id == 11) {
					entryv[i].entry_value = entryv[i].entry_value;
				} else {
					entryv[i].entry_value = entryv[i].entry_value;
					// $http.post(S.baseUrl + '/encrypt/data', { dec: entryv[i].entry_value })
					// 	.then(function (res) {
					// 		if (res) {
					// 			entryv[i].entry_value = res.data;

					// 			for (let i = 0; i < entryv.length; i++) {
					// 				//console.log("After: ");
					// 				//console.log(entryv[i]);
					// 				if (!d[entryv[i].entry.id]) d[entryv[i].entry.id] = [];
					// 				if (!d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id]) d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id] = [];
					// 				//console.log(entryv[i].entry_value);
					// 				d[entryv[i].entry_version.entry.id][entryv[i].entry_version.id][entryv[i].form_field.field.title] = entryv[i].entry_value;
					// 				if (entryv[i].form_field.field.field_type.type == "file") d[entryv[i].entry_version.entry.id][entryv[i].form_field.field.title] = entryv[i].entry_value ? entryv[i].entry_value.includes(',') ? entryv[i].entry_value.split(',') : entryv[i].entry_value : null;
					// 				var d2 = [];
					// 				//console.log(d);
					// 				for (var j in d) {
					// 					var len = d[j].length - 1;
					// 					if (len >= 0) d2[j] = d[j][len];
					// 				}

					// 			}
					// 			$scope.data.entry_values = d2;

					// 		}
					// 		//console.log(entryv[i]);
					// 	}, function (e) { });
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
					 
				}, 1);

			}



		}, function (e) { });


		R.get('master_entry_values').query({

		}, function (master) {
			$scope.data.master_entry_values = master;
		}, function (e) {
			console.log(e);
		});

		R.get('entry_default_values').query({
			form_id: $scope.formId
		}, function (r) {

			for (var l = 0; l < r.length; l++) {
				var ri = r[l];
				// if (ri && ri.form_default_field.default_field && ri.form_default_field.default_field.field_type && ri.form_default_field.default_field.field_type.id && ri.form_default_field.default_field.field_type.id == 12) {

				// 	var k = r[l].entry_value;

				// 	if (k && k != undefined || k != null) {
				// 		var a = []

				// 		let mE = $scope.data.master_entry_values;

				// 		for (i = 0; i < mE.length; i++) {

				// 			if (mE[i].master_entry.id == k) {
				// 				a.push(mE[i])
				// 			}
				// 		}

				// 		var d = [];
				// 		for (var i = 0; i < a.length; i++) {
				// 			if (!d[a[i].master_entry.id]) d[a[i].master_entry.id] = [];
				// 			if (!d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id]) d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id] = [];
				// 			d[a[i].master_entry_version.master_entry.id][a[i].master_entry_version.id] = a[i];
				// 		}

				// 		var d1 = [];

				// 		for (var j in d) {
				// 			var len = d[j].length - 1;
				// 			if (len >= 0) d1[j] = d[j][len];
				// 		}
				// 		r[l].entry_value = d1[k].master_entry_value;
				// 	}

				// }
				// else {
				r[l].entry_value = r[l].entry_value;
				// }

			}
			var x = [];
			for (var i = 0; i < r.length; i++) {
				if (!x[r[i].entry.id]) x[r[i].entry.id] = [];
				if (!x[r[i].entry_version.entry.id][r[i].entry_version.id]) x[r[i].entry_version.entry.id][r[i].entry_version.id] = [];
				x[r[i].entry_version.entry.id][r[i].entry_version.id][r[i].form_default_field.default_field.id] = r[i].entry_value;
			}

			var y = [];
			for (var j in x) {
				var len = x[j].length - 1;
				if (len >= 0) y[j] = x[j][len];
			}

			$scope.data.entry_default_values = y;

		}, function (e) { });
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
		onCancelClick: function () { }
	}

	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function () { $scope.deleteObject($scope.deleteCandidate); },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function () { $scope.cancelDelete(); }
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
	$scope.modalOptions = {};

	$scope.deleteObject = function (obj) {
		$scope.delete(obj, function (r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function (obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function () {
		$scope.deleteCandidate = null;
	}

	$scope.showCancelFormModal = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.showErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$(function () {
		$('.fixed-action-btn').floatingActionButton({});
	});



});app.controller('questionBankControllerBase', ControllerFactory('question_bank_fields'));

app.controller('formsQuestionBankController', function ($scope, $rootScope, $controller, S, R) {

    //Copy all scope variables from Base Controller
    $controller('questionBankControllerBase', {
        $scope: $scope
    });

    // $scope.roleOfCurrentUser = false;
    // $scope.currentUser = $rootScope.currentUser.role.title;
    // if ($scope.currentUser == 'admin') {
    //     $scope.roleOfCurrentUser = true
    // }
    //$scope.roleOfCurrentUser = false;
    $scope.CurrentUserAdmin = false;
    $scope.CurrentUserEditor = false;
    $scope.CurrentUserContributor = false;
    $scope.CurrentUserSubscriber = false;
    $scope.currentUserId = $rootScope.currentUser.id;
    $scope.currentUser = $rootScope.currentUser.role;

    if ($scope.currentUser == 'admin') {
        $scope.CurrentUserAdmin = true;
    }
    else if ($scope.currentUser == 'editor') {
        $scope.CurrentUserEditor = true;
    }
    else if ($scope.currentUser == 'contributor') {
        $scope.CurrentUserContributor = true;
    }
    else {
        $scope.CurrentUserSubscriber = true;
    }
	//
	$scope.viewby = 5;
  // $scope.totalItems = $scope.data.length;
  $scope.currentPage = 3;
  $scope.itemsPerPage = 10;
	$scope.maxSize = 2;
	$scope.setPage = function (pageNo) {
    $scope.currentPage = pageNo;
  };

  $scope.pageChanged = function() {
    console.log('Page changed to: ' + $scope.currentPage);
  };

$scope.setItemsPerPage = function(num) {
  $scope.itemsPerPage = num;
  $scope.currentPage = 1; //reset to first page
}
	//
    //Load all posts on initialization
    $scope.query({}, function (r) {
        $scope.totalItems = r.length;
     });

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
        header: 'Are you sure you want to delete this item?',
        text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
        showOk: true,
        okText: 'Yes, Please!',
        onOkClick: function () {
            $scope.deleteObject($scope.deleteCandidate);
            $scope.data.list.length = "";
        },
        showCancel: true,
        cancelText: 'No!',
        onCancelClick: function () { $scope.cancelDelete(); }
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

    $scope.deleteObject = function (obj) {
        $scope.delete(obj, function (r) {
            if (r.status && r.status == 405) {
                $scope.modalOptions.open($scope.errorModalOptions);
            }
            $scope.query();
        });

    };

    $scope.launchDelete = function (obj) {
        $scope.deleteCandidate = obj;
        $scope.modalOptions.open($scope.deleteModalOptions);
        // $scope.data.list.length = "";



    }

    $scope.cancelDelete = function () {
        $scope.deleteCandidate = null;
    }

    $(function () {
        $('.fixed-action-btn').floatingActionButton({

        });
    });




});//An example of Angular $http

app.controller('formsQuestionBankAddController', function ($scope, $timeout, $route, $rootScope, $http, R, S, $location, $q) {
	$scope.selectedPerson = "";
	$scope.selectedPeople = [];
	$scope.fields = [];
	$scope.isDisabled = false;
	$scope.newFieldItem = false;

	$scope.unselectPerson = function (p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {
			data[$scope.selectedPeople[i].first_name + ' ' + $scope.selectedPeople[i].last_name] = $scope.selectedPeople[i];
			$scope.selectedPeople.splice(i, 1);
		}
	}

	angular.element(document).ready(function () {
		activate();

	});

	function activate() {
		$("#title").focus();

		$('.fixed-action-btn').floatingActionButton({

		});

		R.get('users').query({}, function (results) {
			data = {};
			for (i = 0; i < results.length; i++) {
				data[results[i].first_name + ' ' + results[i].last_name] = results[i];
				//data.push({tag: results[i].first_name + ' ' + results[i].last_name, image: null});
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

			//$scope.fieldTypes = results;
			$('select').formSelect();
		});
	}

	$scope.load = function(){
		console.log("Load Function!")
	}
	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Question Bank.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-question-bank');
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
			$location.path('forms-question-bank');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () {
			document.getElementById('title').value = '';
			clearFieldType();
			$scope.fields = [];
			$scope.isDisabled = false;
			// activate();
			// clearFieldSourceItem();
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

	$scope.modalOptions = {};

	$scope.cancelForm = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.launchErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function () {
		$scope.modalOptions.open($scope.savedModalOptions);
	}

	$scope.questionBankTypeChanged = function () {

		if ($scope.data.field_type) {
			$scope.selectedFieldTypeCategory = JSON.parse($scope.data.field_type).type;
			//$scope.selectedFieldTypeCategory = $scope.data.field_type.type;
		}
	}

	$scope.addField = function (field) {
		$scope.isSame = false;
		if (field) {
			for(i = 0; i < $scope.fields.length; i++) {
				if($scope.fields[i].title == field) {
					$scope.isSame = true;
					break;
				}
			}
			if(!$scope.isSame) {
				$scope.fields.push({
					title: field,
				});
			} else {
				$scope.showErrorModalDuplicate();
			}
			
		}
		$scope.datasource.newItem = '';
	}

	$scope.saveQuestionBank = function () {
		//$scope.isDisabled = true;
		var QuestionBank = R.get('question_bank_fields');
		var DataSource = R.get('question_bank_field_datasource');
		var questionBank = new QuestionBank();
		if($scope.data.title == '' || $scope.data.title == undefined) {
			$scope.showErrorModalTitle();
		} else {
			questionBank.title = $scope.data.title;
			// questionBank.default_value=$scope.data.default_value;
			if($scope.data.field_type == null) {
				$scope.showErrorModal();
			} else {
				if((JSON.parse($scope.data.field_type).id == 3 || JSON.parse($scope.data.field_type).id == 4 || JSON.parse($scope.data.field_type).id == 5) && $scope.fields.length == 0) {
					$scope.showErrorModalFields();
				} else {
					questionBank.field_type_id = JSON.parse($scope.data.field_type).id;
					//questionBank.field_type_id = $scope.data.field_type.id;
		
					var QuestionBanks = [];
			
			
					questionBank.$save().then(function (r) {
			
						for (var i in $scope.fields) {
							var ds = new DataSource();
							ds.title = $scope.fields[i].title;
							ds.question_bank_field_id = r.id;
							QuestionBanks.push(ds.$save());
						}
					},
						function (e) { 
							//$route.reload();
							$scope.showErrorModalDuplicate();
							$scope.statusCheck = e.status
							console.log($scope.statusCheck)
						});	

						$timeout(function () {	
							if($scope.statusCheck  != 409){
								$q.all(QuestionBanks).then(function (r) {
									let fields = [];
									$scope.showFormSavedModal();
						
								}, function (e) {
									console.log(e);
								})
							};
						}, 1500);
				
					$scope.data.field_type = '';
				}
				
			}
		}
		
		

	}
	
	$scope.showErrorModal = function() {
        $scope.modalOptions.open($scope.errorModalOptions);
    }
    
    $scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
    $scope.showErrorModalFields = function() {
        $scope.modalOptions.open($scope.errorModalOptionsFields);
    }
    
    $scope.errorModalOptions = {
        header: '',
        text: 'Please select a Question Type!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }
    
    $scope.errorModalOptionsTitle = {
        header: '',
        text: 'Please enter a Title to the Question!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
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
    
    $scope.showErrorModalDuplicate = function() {
		//$scope.load()
        $scope.modalOptions.open($scope.errorModalOptionsDuplicate);
    }
    
    $scope.errorModalOptionsDuplicate = {
        header: '',
        text: 'You are trying to enter a duplicate entry!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {$route.reload()},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }
	
});





app.controller('formsQuestionBankEditController', function ($http, $scope, $routeParams, $controller, R, S, $timeout, $location) {
	$scope.fields = [];
	$scope.remaningfields = []
	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;
	// $scope.data={};
	$controller('questionBankControllerBase', {
		$scope: $scope
	});

	$scope.load = function () {

		$("#title").focus();
		R.get('question_bank_fields/' + $scope.id).get(function (r) {
			$scope.data = r;

			$scope.data.field_type = r.field_type;
			// $scope.data.default_value=r.default_value;
			$timeout(function () {
				selectedFieldType(r.field_type.title);
				$scope.selectedFieldTypeCategory = r.field_type.type;
			}, 1);
		});
		R.get('field_types').query({}, function (results) {
			$('select').formSelect();
		});
		R.get('question_bank_field_datasource').query({ question_bank_field_id: $scope.id }, function (data) {
			//$scope.remaningfields = data;
			$scope.oldfields = data;
			for(let i = 0; i < data.length; i++) {
				$scope.fields.push({
					title: data[i].title,
				});
			}
		})


	};

	$scope.questionBankTypeChanged = function (field_type) {

		if (field_type.length) {
			let id = field_type[0].question_bank_field.id;
			R.get('question_bank_field_datasource/').query({ question_bank_field_id: id }, function (r) {

				for (var x in r) {
					$scope.deleteCandidate = r;
					$scope.modalOptions.open($scope.deleteModalOptions);
				}

			});
		}
		if ($scope.data.field_type) {
			$scope.selectedFieldTypeCategory = JSON.parse($scope.data.field_type).type;
			//$scope.selectedFieldTypeCategory = $scope.data.field_type.type;

		}
	}
	$scope.addField = function (field) {
		$scope.isSame = false;
		if (field) {
			for(i = 0; i < $scope.fields.length; i++) {
				if($scope.fields[i].title == field) {
					$scope.isSame = true;
					break;
				}
			}
			if(!$scope.isSame) {
				$scope.fields.push({
					title: field,
				});
			} else {
				$scope.showErrorModalDuplicate();
			}
			
		}
		$scope.datasource.newItem = '';
	}

	$scope.deleteObject = function (obj) {
		for (let x in obj) {
			$scope.delete(obj[x], function (r) {
				if (r.status && r.status == 405) {
					$scope.modalOptions.open($scope.errorModalOptions);
				}
				$scope.query();
			});
		}
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
	$scope.save = function () {
		if($scope.data.title == '') {
			$scope.showErrorModalTitle();
		} else {
			if($scope.data.field_type == null) {
				$scope.showErrorModalFieldType();
			} else {
				if($scope.data.field_type.id == undefined) {
					if((JSON.parse($scope.data.field_type).id == 3 || JSON.parse($scope.data.field_type).id == 4 || JSON.parse($scope.data.field_type).id == 5) && $scope.fields.length == 0) {
						$scope.showErrorModalFields();
					} else {
						console.log($scope.data);
						var DataSource = R.get('question_bank_field_datasource');
						if ($scope.data.id) {
							var QuestionBank = R.get('question_bank_fields/');
							var QuestionBank = R.get('question_bank_fields/').query({}, function (data) {
								var field_type_id = JSON.parse($scope.data.field_type).id;
								//var field_type_id = $scope.data.field_type.id;
								delete $scope.data.list;
								delete $scope.data.field_type;
								$scope.data.field_type_id = field_type_id;
								QuestionBank = $scope.data;
								QuestionBank.$save();
							});
							for(let i = 0; i < $scope.oldfields.length; i++) {
								$http.delete(S.baseUrl + '/question_bank_field_datasource/' + $scope.oldfields[i].id).then(function(response) {
									
								});
							}
				
							if ($scope.data.id) {
								var QuestionBankdata = R.get('question_bank_field_datasource/').query({}, function (data) {
									for (var i in $scope.fields) {
										var ds = new DataSource();
										if($scope.fields[i].title != '') {
											ds.title = $scope.fields[i].title;
											ds.question_bank_field_id = $scope.data.id;
											ds.$save();	
										}
										
									}
								}, function (r) {
									if (r.status && r.status == 404) {
										for (var i in $scope.fields) {
											var ds = new DataSource();
											if($scope.fields[i].title != '') {
												ds.title = $scope.fields[i].title;
												ds.question_bank_field_id = $scope.data.id;
												ds.$save();	
											}
										}
									}
								});
							}
							$scope.showFormSavedModal();
						} else {
							$scope.data.$save().then(function (r) {
								$scope.showErrorModal();
							});
						}
					}
				} else {
					$scope.showErrorJSON = ($scope.data.field_type.id == 3 || $scope.data.field_type.id == 4 || $scope.data.field_type.id == 5) && $scope.fields.length == 0;
					if(($scope.data.field_type.id == 3 || $scope.data.field_type.id == 4 || $scope.data.field_type.id == 5) && $scope.fields.length == 0) {
						$scope.showErrorModalFields();
					} else {
						console.log($scope.data);
						var DataSource = R.get('question_bank_field_datasource');
						if ($scope.data.id) {
							var QuestionBank = R.get('question_bank_fields/');
							var QuestionBank = R.get('question_bank_fields/').query({}, function (data) {
								//var field_type_id = JSON.parse($scope.data.field_type).id;
								var field_type_id = $scope.data.field_type.id;
								delete $scope.data.list;
								delete $scope.data.field_type;
								$scope.data.field_type_id = field_type_id;
								QuestionBank = $scope.data;
								QuestionBank.$save();
							});
							for(let i = 0; i < $scope.oldfields.length; i++) {
								$http.delete(S.baseUrl + '/question_bank_field_datasource/' + $scope.oldfields[i].id).then(function(response) {
									
								});
							}
				
							if ($scope.data.id) {
								var QuestionBankdata = R.get('question_bank_field_datasource/').query({}, function (data) {
									for (var i in $scope.fields) {
										var ds = new DataSource();
										if($scope.fields[i].title != '') {
											ds.title = $scope.fields[i].title;
											ds.question_bank_field_id = $scope.data.id;
											ds.$save();	
										}
										
									}
								}, function (r) {
									if (r.status && r.status == 404) {
										for (var i in $scope.fields) {
											var ds = new DataSource();
											if($scope.fields[i].title != '') {
												ds.title = $scope.fields[i].title;
												ds.question_bank_field_id = $scope.data.id;
												ds.$save();	
											}
										}
									}
								});
							}
							$scope.showFormSavedModal();
						} else {
							$scope.data.$save().then(function (r) {
								$scope.showErrorModal();
							});
						}
					}
				}	
			}
		}
	}
	
	$scope.showErrorModalFieldType = function() {
        $scope.modalOptions.open($scope.errorModalOptionsFieldType);
    }
    
    $scope.showErrorModalTitle = function() {
        $scope.modalOptions.open($scope.errorModalOptionsTitle);
    }
    
    $scope.errorModalOptionsFieldType = {
        header: '',
        text: 'Please select a Question Type!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
    }
    
    $scope.errorModalOptionsTitle = {
        header: '',
        text: 'Please enter a Title to the Question!',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {},
        showCancel: false,
        cancelText: '',
        onCancelClick: function() {}
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



		$scope.savedModalOptions = {
			header: 'updated!',
			text: 'Your entry has been updated successfully!',
			showOk: true,
			okText: 'Go to listing page!',
			onOkClick: function () {
				$location.path('forms-question-bank');


			},
			showCancel: true,
			cancelText: 'Stay on this page!',
			onCancelClick: function () {
				document.getElementById('title').value = '';
				clearFieldType();
				$scope.fields = [];
				// activate();
				// clearFieldSourceItem();
			}
		}


		$scope.cancelModalOptions = {
			header: 'Are you sure you want to leave this page?',
			text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Question Bank.',
			showOk: true,
			okText: 'Ok',
			onOkClick: function () {
				$location.path('forms-question-bank');
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

		$scope.cancelForm = function () {
			$scope.modalOptions.open($scope.cancelModalOptions);
		}

		$scope.showErrorModal = function () {
			$scope.modalOptions.open($scope.errorModalOptions);
		}

		$scope.showFormSavedModal = function () {
			$scope.modalOptions.open($scope.savedModalOptions);
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


		$(function () {
			$('.fixed-action-btn').floatingActionButton({});
		});
	});
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


});//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('usergroupsControllerBase', ControllerFactory('user_groups'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD

app.controller('formsUsergroupsController', function($scope, $rootScope, $controller, S, R) {

	//Copy all scope variables from Base Controller
	$controller('usergroupsControllerBase', {
		$scope: $scope
	});

	$scope.roleOfCurrentUser = false;
	$scope.currentUser = $rootScope.currentUser.role;
	if($scope.currentUser == 'admin'){
		$scope.roleOfCurrentUser = true;
	}

	//Load all posts on initialization

	//
	$scope.viewby = 5;
  // $scope.totalItems = $scope.data.length;
  $scope.currentPage = 3;
  $scope.itemsPerPage = 10;
	$scope.maxSize = 2;
	$scope.setPage = function (pageNo) {
    $scope.currentPage = pageNo;
  };

  $scope.pageChanged = function() {
    console.log('Page changed to: ' + $scope.currentPage);
  };

$scope.setItemsPerPage = function(num) {
  $scope.itemsPerPage = num;
  $scope.currentPage = 1; //reset to first page
}
	//
	$scope.query({}, function(r) {
		$scope.totalItems = r.length;
	});


	$scope.edit = function(obj) {
		$scope.mode = $scope.MODES.edit;
		$scope.editing = obj.id;
	};

	$scope.saveSingle = function() {
		$scope.save(null, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.initSingle();
			$scope.query();
		});
	};

	$scope.saveObject = function(obj) {
		$scope.save(obj, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.query();
		});
	};

	$scope.cancel = function(obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};
	
	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this item?',
		text: 'If you proceed, all your records associated with this item will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ 
			$scope.deleteObject($scope.deleteCandidate);
			$scope.data.list.length = "";
		 },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	}

	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function(){},
		showCancel: false,
		cancelText: '',
		onCancelClick: function(){}
	}

	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$scope.delete(obj, function(r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	}

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			
		});
	});

});//An example of Angular $http

app.controller('formsUsergroupAddController', function ($scope, $rootScope, $http, R, S, $location, $q) {
	$scope.pageheader = "CREATE A NEW CATEGORY";
	$scope.usersimg = {}; //added by sanjoli
	$scope.usersdata = [];
	$scope.selectedPeople = [];
	$scope.roleOfCurrentUser = $rootScope.currentUser.role;
	$scope.data ={};
	$scope.data.status =true;
	$scope.isDisabled = false;
	$scope.people = "";
	$scope.countSelectedPeople = 0;
	$scope.prevCount = 0;
	angular.element(document).ready(function () {

		$("#title").focus();
		$('.fixed-action-btn').floatingActionButton({

		});

	});

	$scope.load = function () {
		
		R.get('users').query({}, function (results) {
			// let data = {};
			//let x = {};
			for (let i = 0; i < results.length; i++) {
				$scope.usersimg[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = "images/user.png";
				$scope.usersdata[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = results[i];
			}

			$('#people').autocomplete({
				data: $scope.usersimg,
				onAutocomplete: function (r) {
					//  if ($scope.selectedPeople.indexOf(x[r]) >= 0) { } else 
					//  {
					$scope.selectedPeople.push($scope.usersdata[r]);
					$scope.countSelectedPeople++;
					$scope.$apply();
					delete $scope.usersimg[r];
					delete $scope.usersdata[r];
					//   }
					document.getElementById('people').value = '';
				}
			});

		});
	};
	
	 $scope.checkNewEntry = function (name) {
		R.get('users').query({}, function (results) {
			// let data = {};
			//let x = {};
			if(name == '') {
				return;
			}
			if($scope.countSelectedPeople != $scope.prevCount) {
				$scope.prevCount++;
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
	
	$scope.unselectPerson = function (p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {

			$scope.selectedPeople.splice(i, 0);
			delete $scope.selectedPeople[i];

		}
		if (p[0]) {
			$scope.usersimg[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = "images/user.png";
			$scope.usersdata[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = p[0];
		} else if (p.first_name) {
			$scope.usersimg[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = "images/user.png";
			$scope.usersdata[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = p;
		}

	}


	$scope.save = function () {
		$scope.isDisabled = true;
		var userGroup = R.get('user_groups');
		var usergroup = new userGroup();
		usergroup.title = $scope.data.title;
		usergroup.status = $scope.data.status ? 1 : 0;
		var p = [];
		for (var people in $scope.selectedPeople) {

			if ($scope.selectedPeople[people][0]) {
				p.push($scope.selectedPeople[people][0].id);
			} else {
				p.push($scope.selectedPeople[people].id);
			}
		}
		usergroup.userId = p.join();
		usergroup.$save();

		$q.all(usergroup).then(function (r) {
			$scope.showFormSavedModal();
		}, function (e) {
			$scope.launchErrorModal();
		});
	}
	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of User Group.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-usergroups');
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
			$location.path('forms-usergroups');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () {
			document.getElementById('title').value = '';
			clearFieldType();
			$scope.fields = [];
			$scope.isDisabled = false;

		}
	}
	// $scope.savedModalOptions = {
	// 	header: '',
	// 	text: 'Are you sure you want to save ?',
	// 	showOk: true,
	// 	okText: 'Yes',
	// 	onOkClick: function () {
	// 		$scope.save();
	// 	},
	// 	showCancel: true,
	// 	cancelText: 'No',
	// 	onCancelClick: function () {
	// 		document.getElementById('title').value = '';
	// 		clearFieldType();
	// 		$scope.fields = [];

	// 	}
	// }
	$scope.errorModal = {
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

	$scope.cancelForm = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.launchErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function () {
		$scope.modalOptions.open($scope.savedModalOptions);
	}
	// $scope.showsave = function () {
	// 	$scope.modalOptions.open($scope.savedModal);
	// }

});

app.controller('formsUsergroupEditController', function ($http, $scope, $location, $routeParams, $timeout, $controller, R, S) {
	// $scope.pageheader="EDIT CATEGORY";
	$scope.fields = [];
	$controller('usergroupsControllerBase', {
		$scope: $scope
	});

	$scope.disabled = false;
	$scope.mode = 'edit';
	$scope.id = $routeParams.id;
	$scope.userid = [];
	$scope.usersimg = {}; //added by sanjoli
	$scope.usersdata = [];
	$scope.selectedPeople = [];
	$scope.selectedPeopleTemp = [];
	$scope.people = "";
	$scope.countSelectedPeople = 0;
	$scope.prevCount = 0;
	$scope.load = function () {
		
		R.get('user_groups/' + $scope.id).get(function (r) {
			$scope.data = r;
			$scope.data.title = r.title
			$scope.data.status = r.status == 1 ? true :false; 
			if (r.userId) {
				$scope.userid = r.userId.split(',');
			}

		R.get('users').query({}, function (r) {
			for (var x in $scope.userid) {
				if (x == '$promise') {
					break;
				}
				$scope.selectedPeopleTemp.push(r.filter(function (obj) { return obj.id == $scope.userid[x] }));
			}
			$scope.selectedPeople = $scope.selectedPeopleTemp.filter(function (el) {
				return el.length != 0;
			});
		

		R.get('users').query({}, function (results) {

			//for user filter in edit by sahin
			var idsB = $scope.selectedPeople.map(function (x) {
				if (x[0].id) {
					return x[0].id
				} else if (x.id) {
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
					$scope.usersimg[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = "images/user.png";
					$scope.usersdata[results[i].first_name + ' ' + results[i].last_name + ' (' + results[i].role + ')'] = results[i];

				}
			}
			if ($scope.selectedPeople.length) {
				for (let i in filtered) {
					$scope.usersimg[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role + ')'] = "images/user.png";
					$scope.usersdata[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role + ')'] = filtered[i];

				}

			}
			$('#people').autocomplete({
				data: $scope.usersimg,
				onAutocomplete: function (r) {
					$scope.selectedPeople.push($scope.usersdata[r]);
					$scope.countSelectedPeople++;
					$scope.$apply();
					delete $scope.usersimg[r];
					delete $scope.usersdata[r]

					document.getElementById('people').value = '';
				}
			});

		});
		
		});
		});
	};
	
	$scope.checkNewEntry = function (name) {
		R.get('users').query({}, function (results) {
			// let data = {};
			//let x = {};
			if(name == '') {
				return;
			}
			if($scope.countSelectedPeople != $scope.prevCount) {
				$scope.prevCount++;
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

	$scope.unselectPerson = function (p) {
		var i = $scope.selectedPeople.indexOf(p);
		if (i >= 0) {
			$scope.selectedPeople.splice(i, 0);
			// Above line updated by me and commented below line

			//$scope.selectedPeople.splice(i, 1);
			delete $scope.selectedPeople[i]
		}
		if (p[0]) {
			$scope.usersimg[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = "images/user.png";
			$scope.usersdata[p[0].first_name + ' ' + p[0].last_name + ' (' + p[0].role + ')'] = p[0];
		} else if (p.first_name) {
			$scope.usersimg[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = "images/user.png";
			$scope.usersdata[p.first_name + ' ' + p.last_name + ' (' + p.role + ')'] = p;

			// $scope.peopleremain[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role.title + ')'] = "images/user.png";
			// $scope.peopleimg[filtered[i].first_name + ' ' + filtered[i].last_name + ' (' + filtered[i].role.title + ')'] = filtered[i];

		}
	}
	$scope.editGroup = function () {
		

		var userGroup = R.get('user_groups/').query({}, function (data) {
			userGroup = $scope.data;
			var p = [];
			userGroup.status = $scope.data.status == true? 1 : 0;
			for (var people in $scope.selectedPeople) {
				if ($scope.selectedPeople[people][0]) {
					p.push($scope.selectedPeople[people][0].id);
				} else {
					p.push($scope.selectedPeople[people].id);
				}

			}
			$scope.data.userId = p.join(',')
			userGroup.$save();
		});

		$scope.showFormSavedModal();
	}

	$scope.savedModalOptions = {
		header: 'updated!',
		text: 'Your entry has been updated successfully!',
		showOk: true,
		okText: 'Go to listing page!',
		onOkClick: function () {
			$location.path('forms-usergroups');
		},
		showCancel: true,
		cancelText: 'Stay on this page!',
		onCancelClick: function () { }
	}


	$scope.cancelModalOptions = {
		header: 'Are you sure you want to leave this page?',
		text: 'Any progress you have made on this page will be lost. You will be redirected to the list of User Group.',
		showOk: true,
		okText: 'Ok',
		onOkClick: function () {
			$location.path('forms-usergroups');
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

	$scope.cancelForm = function () {
		$scope.modalOptions.open($scope.cancelModalOptions);
	}

	$scope.showErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
	}

	$scope.showFormSavedModal = function () {
		$scope.modalOptions.open($scope.savedModalOptions);
	}


	$(function () {
		$("#title").focus();
		$('.fixed-action-btn').floatingActionButton({});
	});
});//An example of Angular $resource. Any Controller that calls ControllerFactory with the name of the API will get default CRUD operations.
app.controller('usersControllerBase', ControllerFactory('users'));

//Controller inheritance for any additional operation you might want apart from the deafult CRUD
app.controller('formsUsersController', function($scope, $rootScope, $controller, S, R) {
	//Copy all scope variables from Base Controller
	$controller('usersControllerBase', {
		$scope: $scope
	});

	$scope.roles;

	$scope.roleOfCurrentUser = false;
	$scope.currentUser = $rootScope.currentUser.role;
	if($scope.currentUser == 'admin'){
		$scope.roleOfCurrentUser = true;
	}
	//
	$scope.records = false;
	$scope.viewby = 5;
	// $scope.totalItems = $scope.data.length;
	$scope.currentPage = 3;
	$scope.itemsPerPage = 10;
	  $scope.maxSize = 2;
	  $scope.setPage = function (pageNo) {
	  $scope.currentPage = pageNo;
	};
  
	$scope.pageChanged = function() {
	  console.log('Page changed to: ' + $scope.currentPage);
	};
  
  $scope.setItemsPerPage = function(num) {
	$scope.itemsPerPage = num;
	$scope.currentPage = 1; //reset to first page
  }
	  //
	//Load all posts on initialization
	$scope.query({}, function(r) {
		$scope.totalItems = r.length;
		if(r.length>10){
		$scope.records = true;}
	});

	R.get('roles').query({}, function (roles) {
		$scope.roles = roles;
	});

	$scope.edit = function(obj) {
		$scope.mode = $scope.MODES.edit;
		$scope.editing = obj.id;
	};

	$scope.saveSingle = function() {
		$scope.save(null, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.initSingle();
			$scope.query();
		});
	};

	$scope.saveObject = function(obj) {
		$scope.save(obj, function() {
			$scope.mode = $scope.MODES.view;
			$scope.editing = 0;
			$scope.query();
		});
	};

	$scope.cancel = function(obj) {
		$scope.mode = $scope.MODES.view;
		$scope.editing = 0;
		$scope.initSingle();

	};
	
	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this User?',
		text: 'If you proceed, all your records associated with this user will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ $scope.deleteObject($scope.deleteCandidate); },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	}

	$scope.errorModalOptions = {
		header: 'An error occured ...',
		text: 'Could not complete the action! Please try after some time. In case you face this issue consecutively, please contact ' + S.supportEmail,
		showOk: true,
		okText: 'Ok',
		onOkClick: function(){},
		showCancel: false,
		cancelText: '',
		onCancelClick: function(){}
	}

	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$scope.delete(obj, function(r) {
			if (r.status && r.status == 405) {
				$scope.modalOptions.open($scope.errorModalOptions);
			}
			$scope.query();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	}

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	}

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			direction: 'left'
		});
	});


});app.controller('formsUsersDetailsController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, S) {

	$scope.id = $routeParams.id;
	$scope.disabled = true;
    $scope.mode = 'view';
    $scope.modeDisable = false;

    $scope.roles = [];

    $scope.role;

	$(function() {
		$('.fixed-action-btn').floatingActionButton({
			direction: 'top'
		});
	});
	
	$scope.load = function() {
		
		//$scope.id = 0;
		R.get('users/' + $scope.id).get(function(r) {
            $scope.data = r;
            $scope.data.role = r.role;
            $scope.data.is_active = r.is_active == 1? true :false;
		});
    };
    
    R.get('roles').query({}, function (roles) {
    	let j = 0;
    	for(let i =0; i < roles.length; i++) {
    		if(roles[i].id != 1) {
        		$scope.roles[j] = roles[i];
        		j++;
    		}
    	}
    });
   
    $scope.savedModalOptions = {
        header: 'Saved!',
        text: 'Your entry has been saved successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function() {
            $location.path('forms-users');
            
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function() {
            $scope.data.first_name = ''
            $scope.data.last_name = ''
            $scope.data.email = ''
            $scope.data.password = ''
            $scope.data.confirmPassword = ''
            $scope.data.role = ''
        }
    }


    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Users.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {
            $location.path('forms-users');
        },
        showCancel: true,
        cancelText: 'Cancel',
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

    $scope.cancelForm = function() {
        $scope.modalOptions.open($scope.cancelModalOptions);
    }

    $scope.showErrorModal = function() {
        $scope.modalOptions.open($scope.errorModalOptions);
    }

    $scope.showFormSavedModal = function() {
        $scope.modalOptions.open($scope.savedModalOptions);
    }


});

app.controller('formsUsersAddController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, S, H) {
	$controller('formsUsersDetailsController', {
		$scope: $scope
    });
    
    $scope.prioritiess;
	$scope.disabled = true;
    $scope.mode = 'add';
    $scope.user = {
        password: "",
        confirmPassword: ""
      };
    $scope.modeDisable = false;
    
    $scope.techlab;

    $scope.role;

    // if($scope.mode == 'add'){
    //     $scope.modeDisable = true
    // }
	
	var User = R.get('users');

	$scope.load = function() {
        $( "#title" ).focus();
        $scope.data = new User();
		
        $scope.data.is_active=true;
        
        R.get('lab_organization').query({}, function(res){
            console.log(res)
            $scope.totallabs = res
        })
        
        R.get('roles').query({}, function (roles) {
            let j = 0;
		    	for(let i =0; i < roles.length; i++) {
		    		if(roles[i].id != 1) {
		        		$scope.roles[j] = roles[i];
		        		j++;
		    		}
		    	}
        });
    };

    $scope.click = function(id){
        $scope.lab = id
        console.log($scope.lab)
    }

    $scope.priorities = function(x){
        $scope.prioritiess = x;
        
    }

    $scope.saveUser = function() {
    	$scope.data.is_active == true ? 1:0;
         if($scope.user.password !=$scope.user.confirmPassword){
            return;
        }
        $scope.data.password = H.getHash($scope.user.password);
        $scope.data.$save().then(function(r){
            console.log($scope.prioritiess)
            console.log(r);
            if(r.role == 'doctor'){
                $http({
                    method : "POST",
                    url : H.SETTINGS.baseUrl + '/doctor',
                    data : {
                        
                        "doctor_name" : r.first_name +' '+ r.last_name,
                        "users_id" : r.id,
                        "medical_service_id" : 4,
                       "priority" : $scope.prioritiess
                    }
                }).then(function(response) { 
                    $http({
                        method : "POST",
                        url : H.SETTINGS.baseUrl + '/last_seen',
                        data : {
                            "time" : H.getDatetime(),
                            "doctor_id" : response.data.id
                        }
                    }).then(function(resp) {
                        console.log(resp)
                })
            })
            } else if(r.role == 'technician'){
                $http({
                    method : "POST",
                    url : H.SETTINGS.baseUrl + '/lab_technician',
                    data : {
                        "name" :  r.first_name +' '+ r.last_name,
                        "lab_organization_id" : $scope.lab,
                        "users_id" : r.id
                    }
                }).then(function(resp) {
                    console.log(resp)
            })
            }
        }, function(e){
            $scope.showErrorModal();
        });
    }
    
});


app.controller('formsUsersEditController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, S, H) {


//app.controller('usersEditController', function($http, $scope, $location, $routeParams, $timeout, $controller, R, SETTINGS) {


    $controller('formsUsersDetailsController', {
        $scope: $scope
    });
    $scope.disabled = false;
    $scope.mode = 'edit';
    $scope.role;


    if($scope.mode == 'edit'){
        $scope.modeDisable = true
    }

    $scope.roles = [] ;

    $scope.load = function() {
        $( "#title" ).focus();
       // $scope.data = new User();
        
        R.get('users/' + $scope.id).get(function(r) {
            $scope.data = r;
            $scope.data.role = r.role;
            $scope.data.is_active = r.is_active == 1? true :false;
		});


        R.get('roles').query({}, function (roles) {
		    let j = 0;
	    	for(let i =0; i < roles.length; i++) {
	    		if(roles[i].id != 1) {
	        		$scope.roles[j] = roles[i];
	        		j++;
	    		}
	    	}

            
        });
    };
    
    $scope.save = function() {
        if($scope.data.id){
            var User = R.get('users/').query(function(data){
                delete $scope.data.role
                User=$scope.data;
                User.is_active =  $scope.data.is_active == true ? 1:0;
                User.$save();
                })
            $scope.showFormSavedModal();

        }else{
            $scope.data.$save().then(function(r) {
                $scope.showErrorModal();
            });
        }
    }

    $scope.savedModalOptions = {
        header: 'Updated!',
        text: 'Your entry has been updated successfully!',
        showOk: true,
        okText: 'Go to listing page!',
        onOkClick: function() {
            $location.path('forms-users');
        },
        showCancel: true,
        cancelText: 'Stay on this page!',
        onCancelClick: function() {
            $scope.data.first_name = ''
            $scope.data.last_name = ''
            $scope.data.email = ''
            $scope.data.password = ''
            $scope.data.confirmPassword = ''
            $scope.data.role = ''
        }
    }


    $scope.cancelModalOptions = {
        header: 'Are you sure you want to leave this page?',
        text: 'Any progress you have made on this page will be lost. You will be redirected to the list of Users.',
        showOk: true,
        okText: 'Ok',
        onOkClick: function() {
            $location.path('forms-users');
        },
        showCancel: true,
        cancelText: 'Cancel',
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

    $scope.cancelForm = function() {
        $scope.modalOptions.open($scope.cancelModalOptions);
    }

    $scope.showErrorModal = function() {
        $scope.modalOptions.open($scope.errorModalOptions);
    }

    $scope.showFormSavedModal = function() {
        $scope.modalOptions.open($scope.savedModalOptions);
    }


    $(function() {
        $('.fixed-action-btn').floatingActionButton({});
    });
});



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
/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('available_homeo_doctorsController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    
    $scope.doc_name = [];
    $scope.docid = [];
    $scope.srch;
    $scope.date;
    $scope.name  = "Myself"
    $scope.doctors = [];

    $scope.load = function(){
        //console.log($scope.dateTime)
$scope.launchErrorModal()
        $scope.now = new Date();

     var mm = moment($scope.now).format("YYYY-MM-DD");
     console.log(mm)

     document.getElementById("dateday").value = mm;

     $scope.getDate()

     $scope.getDatetime()
      
        R.get('doctor').query({ }, function (response) {
            $scope.doc_pat = response;

            R.get('user_trans').query({}, function(res){
                $scope.status = res
                //console.log($scope.status)

                for(i=0; i<$scope.status.length; i++){
                    if($rootScope.currentUser.id == $scope.status[i].user_id){
                        
                        $scope.docid.push($scope.status[i].doc_id)
                    }
                }   // console.log($scope.docid);
            });
        });
    }
    $scope.modalOptions = {};

    $scope.launchErrorModal = function () {
		$scope.modalOptions.open($scope.errorModalOptions);
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

    //console.log($scope.date)

    /* $scope.getDatetime = function() {
        var m = new Date();
        $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
        //console.log($scope.dateTime);
      }; */

    $scope.hasDoc = function(doc_id){

        var n = $scope.docid.includes(doc_id);
        if (n){
            return 1;   
        }

    }
            $scope.getStat = $timeout(function(id){
                
                for(i = 0; i<$scope.status.length; i++){
                    if($scope.status[i].id == id){
                        //console.log($scope.status[i].req_status);
                    }
                }
            }, 2000)
    
    $scope.getReq = function(o){
        //console.log(o);
        R.get('user_trans').query({doc_id : o},function(res){
        return res.req_status;
    })
}

    $scope.fiftyClicks = function(name){
        $scope.name = name
      //  console.log(name)

        
        var tablinks = document.getElementsByClassName("tablinks");
        console.log(tablinks)
		for (i = 0; i < tablinks.length; i++) {
		  if (tablinks[i].id===name) {
             // console.log("Inside Loop")
			tablinks[i].className += " active"
          }
          else
          {
            tablinks[i].className= tablinks[i].className.replace("active","")             
          }
        }

        if(name == 'Other'){
            $scope.input = true;
            $scope.name = $scope.inputname
            console.log($scope.name)
        } else {
            $scope.input = false;
        }
        
       
    }

    $scope.inpChng = function (inputname){
        $scope.name = inputname;
        console.log($scope.name)
    }
      
    $scope.sendReq = function(id){
        //console.log(id);

        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "doc_id" : id,
                "req_status" : 1,
                "date_selected_usr" : $scope.dateusr,
                "available_doc_time" : $scope.seltime,
                "datetime" : $scope.dateTime,
                "type" : 1,
                "patient" : $scope.name
			}
		}).then(function(response) {
            $scope.load()
            $scope.hasDoc(response.data.doc_id)
           // console.log(response.data.doc_id)
        })
        
    }

    $scope.searching = function(){
    $scope.xyz = [];
        /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
          //  $scope.doc_pat = setResCall.data;
           console.log(setResCall)
 
      
        }, 2000) */
        
      console.log($scope.srch)

        $scope.disp = $scope.doctors;

        for (i = 0; i<$scope.disp.length; i++){
            var lower = $scope.disp[i].name.toLowerCase()
            var o = lower.indexOf($scope.srch.toLowerCase());
            console.log(o)
            if(o != -1){
             $scope.xyz.push($scope.disp[i])   
            }
            
        }

        $scope.disp = $scope.xyz

    }
$scope.onclking = function(){
    
    var acc = document.getElementsByClassName("accordion");
    var i;
    
    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
} 

$scope.sendTime = function(id){
    $scope.seltime = id
    //console.log(id)
}

$scope.getDatetime = function() {
       var m = new Date();
       $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
       //console.log($scope.dateTime);
     };

 $scope.getDate=function(){
    //$scope.day = H.getDatetime()
    $scope.filtered = [];
    $scope.current = new Date()
    $scope.crnt = moment($scope.current).format("DD-MM-YYYY");
    console.log($scope.crnt)
    $scope.day=document.getElementById("dateday").valueAsDate;

    
    console.log($scope.day)
    $scope.dateusr = moment($scope.day).format("DD-MM-YYYY");  
    console.log($scope.dateusr)
     
    var m = moment($scope.day).format("dddd");  
    //console.log(m)

    if($scope.day < $scope.now && $scope.dateusr != $scope.crnt ){
       alert("select right date")
    }else {

    R.get('available_doc_time').query({}, function(res){
        $scope.respo = res

        for(i = 0; i<$scope.respo.length; i++){
            if($scope.respo[i].available_doc_day.day_week.day == m){
                $scope.filtered.push($scope.respo[i])
            }
        }

        var arr = $scope.filtered
            var array = [];

            var obj = arr.reduce(function(obj, item){
                obj[item.available_doc_day.doctor.doctor_name] = obj[item.available_doc_day.doctor.doctor_name] || [];
                obj[item.available_doc_day.doctor.doctor_name].push(item);
                //console.log(item)
                return obj;
            },[])
            
            
            $scope.disp = Object.keys(obj).reduce(function(array, key){
                
                array.push({
                    name: key,
                    data: obj[key]
                });
                return array;
            }, [])
            $scope.doctors = $scope.disp
            //console.log($scope.disp)
    })}

 }
    

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('homeodochomeController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    
    $scope.doc_name = [];
    $scope.docid = [];
    $scope.srch;
    $scope.date;
    $scope.name  = "Myself"
    $scope.doctors = []
    

    $scope.load = function(){
        //console.log($scope.dateTime)

        var now = new Date();

     var mm = moment(now).format("YYYY-MM-DD");
     console.log(mm)

     document.getElementById("dateday").value=mm;

     $scope.getDate()

     $scope.getDatetime()
      
        R.get('doctor').query({ }, function (response) {
            $scope.doc_pat = response;

            R.get('user_trans').query({}, function(res){
                $scope.status = res
                //console.log($scope.status)

                for(i=0; i<$scope.status.length; i++){
                    if($rootScope.currentUser.id == $scope.status[i].user_id){
                        
                        $scope.docid.push($scope.status[i].doc_id)
                    }
                }   // console.log($scope.docid);
            });
        });
    }

    //console.log($scope.date)

    /* $scope.getDatetime = function() {
        var m = new Date();
        $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
        //console.log($scope.dateTime);
      }; */

    $scope.hasDoc = function(doc_id){

        var n = $scope.docid.includes(doc_id);
        if (n){
            return 1;   
        }

    }
            $scope.getStat = $timeout(function(id){
                
                for(i = 0; i<$scope.status.length; i++){
                    if($scope.status[i].id == id){
                        //console.log($scope.status[i].req_status);
                    }
                }
            }, 2000)
    
    $scope.getReq = function(o){
        //console.log(o);
        R.get('user_trans').query({doc_id : o},function(res){
        return res.req_status;
    })
}

    $scope.fiftyClicks = function(name){
        $scope.name = name
      //  console.log(name)

        
        var tablinks = document.getElementsByClassName("tablinks");
        console.log(tablinks)
		for (i = 0; i < tablinks.length; i++) {
		  if (tablinks[i].id===name) {
             // console.log("Inside Loop")
			tablinks[i].className += " active"
          }
          else
          {
            tablinks[i].className= tablinks[i].className.replace("active","")             
          }
        }
        
       
    }
      
    $scope.sendReq = function(id){
        //console.log(id);

        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "doc_id" : id,
                "req_status" : 1,
                "date_selected_usr" : $scope.dateusr,
                "available_doc_time" : $scope.seltime,
                "datetime" : $scope.dateTime,
                "type" : 2,
                "patient" : $scope.name
			}
		}).then(function(response) {
            $scope.load()
            $scope.hasDoc(response.data.doc_id)
           // console.log(response.data.doc_id)
        })
        
    }

    $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
           // console.log(setResCall)
        }, 500)
    }
$scope.onclking = function(){
    
    var acc = document.getElementsByClassName("accordion");
    var i;
    
    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
} 

$scope.sendTime = function(id){
    $scope.seltime = id
    //console.log(id)
}

$scope.getDatetime = function() {
       var m = new Date();
       $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
       //console.log($scope.dateTime);
     };

     $scope.searching = function(){
        $scope.xyz = [];
            /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
            $timeout(function(){
                var setResCall =  H.getRes()
              //  $scope.doc_pat = setResCall.data;
               console.log(setResCall)
     
          
            }, 2000) */
            
          console.log($scope.srch)
    
            $scope.disp = $scope.doctors;
    
            for (i = 0; i<$scope.disp.length; i++){
                var lower = $scope.disp[i].name.toLowerCase()
                var o = lower.indexOf($scope.srch.toLowerCase());
                console.log(o)
                if(o != -1){
                 $scope.xyz.push($scope.disp[i])   
                }
                
            }
    
            $scope.disp = $scope.xyz
    
        }

 $scope.getDate=function(){
    //$scope.day = H.getDatetime()
    $scope.filtered = [];
    $scope.day=document.getElementById("dateday").valueAsDate;
    console.log($scope.day)
    $scope.dateusr = moment($scope.day).format("DD-MM-YYYY");  
     
    var m = moment($scope.day).format("dddd");  
    //console.log(m)

    R.get('available_doc_time').query({}, function(res){
        $scope.respo = res

        for(i = 0; i<$scope.respo.length; i++){
            if($scope.respo[i].available_doc_day.day_week.day == m){
                $scope.filtered.push($scope.respo[i])
            }
        }

        var arr = $scope.filtered
            var array = [];

            var obj = arr.reduce(function(obj, item){
                obj[item.available_doc_day.doctor.doctor_name] = obj[item.available_doc_day.doctor.doctor_name] || [];
                obj[item.available_doc_day.doctor.doctor_name].push(item);
                //console.log(item)
                return obj;
            },[])
            
            
            $scope.disp = Object.keys(obj).reduce(function(array, key){
                
                array.push({
                    name: key,
                    data: obj[key]
                });
                return array;
            }, [])
            
            $scope.doctors = $scope.disp
            //console.log($scope.disp)
    })

 }
    

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('available_vet_doctorsController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    
    $scope.doc_name = [];
    $scope.docid = [];
    $scope.srch;
    $scope.date;
    $scope.name  = "Myself"
    $scope.doctors = []
    

    $scope.load = function(){
        //console.log($scope.dateTime)

        var now = new Date();

     var mm = moment(now).format("YYYY-MM-DD");
     console.log(mm)

     document.getElementById("dateday").value=mm;

     $scope.getDate()

     $scope.getDatetime()
      
        R.get('doctor').query({ }, function (response) {
            $scope.doc_pat = response;

            R.get('user_trans').query({}, function(res){
                $scope.status = res
                //console.log($scope.status)

                for(i=0; i<$scope.status.length; i++){
                    if($rootScope.currentUser.id == $scope.status[i].user_id){
                        
                        $scope.docid.push($scope.status[i].doc_id)
                    }
                }   // console.log($scope.docid);
            });
        });
    }

    //console.log($scope.date)

    /* $scope.getDatetime = function() {
        var m = new Date();
        $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
        //console.log($scope.dateTime);
      }; */

    $scope.hasDoc = function(doc_id){

        var n = $scope.docid.includes(doc_id);
        if (n){
            return 1;   
        }

    }
            $scope.getStat = $timeout(function(id){
                
                for(i = 0; i<$scope.status.length; i++){
                    if($scope.status[i].id == id){
                        //console.log($scope.status[i].req_status);
                    }
                }
            }, 2000)
    
    $scope.getReq = function(o){
        //console.log(o);
        R.get('user_trans').query({doc_id : o},function(res){
        return res.req_status;
    })
}

    $scope.fiftyClicks = function(name){
        $scope.name = name
      //  console.log(name)

        
        var tablinks = document.getElementsByClassName("tablinks");
        console.log(tablinks)
		for (i = 0; i < tablinks.length; i++) {
		  if (tablinks[i].id===name) {
             // console.log("Inside Loop")
			tablinks[i].className += " active"
          }
          else
          {
            tablinks[i].className= tablinks[i].className.replace("active","")             
          }
        }
        
       
    }
      
    $scope.sendReq = function(id){
        //console.log(id);

        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "doc_id" : id,
                "req_status" : 1,
                "date_selected_usr" : $scope.dateusr,
                "available_doc_time" : $scope.seltime,
                "datetime" : $scope.dateTime,
                "type" : 1,
                "patient" : $scope.name
			}
		}).then(function(response) {
            $scope.load()
            $scope.hasDoc(response.data.doc_id)
           // console.log(response.data.doc_id)
        })
        
    }

    /* $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
           // console.log(setResCall)
        }, 500)
    } */
$scope.onclking = function(){
    
    var acc = document.getElementsByClassName("accordion");
    var i;
    
    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
} 

$scope.sendTime = function(id){
    $scope.seltime = id
    //console.log(id)
}

$scope.getDatetime = function() {
       var m = new Date();
       $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
       //console.log($scope.dateTime);
     };

     $scope.searching = function(){
        $scope.xyz = [];
            /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
            $timeout(function(){
                var setResCall =  H.getRes()
              //  $scope.doc_pat = setResCall.data;
               console.log(setResCall)
     
          
            }, 2000) */
            
          console.log($scope.srch)
    
            $scope.disp = $scope.doctors;
    
            for (i = 0; i<$scope.disp.length; i++){
                var lower = $scope.disp[i].name.toLowerCase()
                var o = lower.indexOf($scope.srch.toLowerCase());
                console.log(o)
                if(o != -1){
                 $scope.xyz.push($scope.disp[i])   
                }
                
            }
    
            $scope.disp = $scope.xyz
    
        }

 $scope.getDate=function(){
    //$scope.day = H.getDatetime()
    $scope.filtered = [];
    $scope.day=document.getElementById("dateday").valueAsDate;
    console.log($scope.day)
    $scope.dateusr = moment($scope.day).format("DD-MM-YYYY");  
     
    var m = moment($scope.day).format("dddd");  
    //console.log(m)

    R.get('available_doc_time').query({}, function(res){
        $scope.respo = res

        for(i = 0; i<$scope.respo.length; i++){
            if($scope.respo[i].available_doc_day.day_week.day == m){
                $scope.filtered.push($scope.respo[i])
            }
        }

        var arr = $scope.filtered
            var array = [];

            var obj = arr.reduce(function(obj, item){
                obj[item.available_doc_day.doctor.doctor_name] = obj[item.available_doc_day.doctor.doctor_name] || [];
                obj[item.available_doc_day.doctor.doctor_name].push(item);
                //console.log(item)
                return obj;
            },[])
            
            
            $scope.disp = Object.keys(obj).reduce(function(array, key){
                
                array.push({
                    name: key,
                    data: obj[key]
                });
                return array;
            }, [])

            $scope.doctors = $scope.disp
            //console.log($scope.disp)
    })

 }
    

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('vetdochomeController', function($scope, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S){

    
    $scope.doc_name = [];
    $scope.docid = [];
    $scope.srch;
    $scope.date;
    $scope.name  = "Myself"
    $scope.doctors = []
    

    $scope.load = function(){
        //console.log($scope.dateTime)

        var now = new Date();

     var mm = moment(now).format("YYYY-MM-DD");
     console.log(mm)

     document.getElementById("dateday").value=mm;

     $scope.getDate()

     $scope.getDatetime()
      
        R.get('doctor').query({ }, function (response) {
            $scope.doc_pat = response;

            R.get('user_trans').query({}, function(res){
                $scope.status = res
                //console.log($scope.status)

                for(i=0; i<$scope.status.length; i++){
                    if($rootScope.currentUser.id == $scope.status[i].user_id){
                        
                        $scope.docid.push($scope.status[i].doc_id)
                    }
                }   // console.log($scope.docid);
            });
        });
    }

    //console.log($scope.date)

    /* $scope.getDatetime = function() {
        var m = new Date();
        $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
        //console.log($scope.dateTime);
      }; */

    $scope.hasDoc = function(doc_id){

        var n = $scope.docid.includes(doc_id);
        if (n){
            return 1;   
        }

    }
            $scope.getStat = $timeout(function(id){
                
                for(i = 0; i<$scope.status.length; i++){
                    if($scope.status[i].id == id){
                        //console.log($scope.status[i].req_status);
                    }
                }
            }, 2000)
    
    $scope.getReq = function(o){
        //console.log(o);
        R.get('user_trans').query({doc_id : o},function(res){
        return res.req_status;
    })
}

    $scope.fiftyClicks = function(name){
        $scope.name = name
      //  console.log(name)

        
        var tablinks = document.getElementsByClassName("tablinks");
        console.log(tablinks)
		for (i = 0; i < tablinks.length; i++) {
		  if (tablinks[i].id===name) {
             // console.log("Inside Loop")
			tablinks[i].className += " active"
          }
          else
          {
            tablinks[i].className= tablinks[i].className.replace("active","")             
          }
        }
        
       
    }
      
    $scope.sendReq = function(id){
        //console.log(id);

        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_trans',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "doc_id" : id,
                "req_status" : 1,
                "date_selected_usr" : $scope.dateusr,
                "available_doc_time" : $scope.seltime,
                "datetime" : $scope.dateTime,
                "type" : 2,
                "patient" : $scope.name
			}
		}).then(function(response) {
            $scope.load()
            $scope.hasDoc(response.data.doc_id)
           // console.log(response.data.doc_id)
        })
        
    }

    /* $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
           // console.log(setResCall)
        }, 500)
    } */
$scope.onclking = function(){
    
    var acc = document.getElementsByClassName("accordion");
    var i;
    
    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
} 

$scope.sendTime = function(id){
    $scope.seltime = id
    //console.log(id)
}

$scope.getDatetime = function() {
       var m = new Date();
       $scope.dateTime = moment(m).format("YYYY-MM-DD HH:mm:ss");
       //console.log($scope.dateTime);
     };

     $scope.searching = function(){
        $scope.xyz = [];
            /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
            $timeout(function(){
                var setResCall =  H.getRes()
              //  $scope.doc_pat = setResCall.data;
               console.log(setResCall)
     
          
            }, 2000) */
            
          console.log($scope.srch)
    
            $scope.disp = $scope.doctors;
    
            for (i = 0; i<$scope.disp.length; i++){
                var lower = $scope.disp[i].name.toLowerCase()
                var o = lower.indexOf($scope.srch.toLowerCase());
                console.log(o)
                if(o != -1){
                 $scope.xyz.push($scope.disp[i])   
                }
                
            }
    
            $scope.disp = $scope.xyz
    
        }

 $scope.getDate=function(){
    //$scope.day = H.getDatetime()
    $scope.filtered = [];
    $scope.day=document.getElementById("dateday").valueAsDate;
    console.log($scope.day)
    $scope.dateusr = moment($scope.day).format("DD-MM-YYYY");  
     
    var m = moment($scope.day).format("dddd");  
    //console.log(m)

    R.get('available_doc_time').query({}, function(res){
        $scope.respo = res

        for(i = 0; i<$scope.respo.length; i++){
            if($scope.respo[i].available_doc_day.day_week.day == m){
                $scope.filtered.push($scope.respo[i])
            }
        }

        var arr = $scope.filtered
            var array = [];

            var obj = arr.reduce(function(obj, item){
                obj[item.available_doc_day.doctor.doctor_name] = obj[item.available_doc_day.doctor.doctor_name] || [];
                obj[item.available_doc_day.doctor.doctor_name].push(item);
                //console.log(item)
                return obj;
            },[])
            
            
            $scope.disp = Object.keys(obj).reduce(function(array, key){
                
                array.push({
                    name: key,
                    data: obj[key]
                });
                return array;
            }, [])

            $scope.doctors = $scope.disp
            //console.log($scope.disp)
    })

 }
    

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('alldoctestController', function($scope, $controller, $rootScope,$routeParams, $route, $location, H, R, $http, S){
    $scope.id;
    $scope.testid = [];


    $scope.load = function(){

        $scope.id = $routeParams.id;

        R.get('lab_tests').query({ }, function (response) {
            $scope.tests = response;
            $scope.alltests = response;

            
			R.get('doctor').query({users_id : $rootScope.currentUser.id}, function(r){
               $scope.docid = r[0].id;

                R.get('prescribed_tests').query({doctor_id : r[0].id, users_id : $scope.id}, function(res){
                    $scope.status = res
                    //console.log(res)
    
                    for(i=0; i<$scope.status.length; i++){
                          
                        $scope.testid.push($scope.status[i].lab_tests_id)
                    }
                    console.log($scope.testid)
                });
                
			})
           // console.log($scope.tests)

        });
    }

    $scope.isAdded = function(){
        
    }
    $scope.hasTest = function(test_id){

        var n = $scope.testid.includes(test_id);
        if (n){
            return 1;   
        }

    }

    $scope.searching = function(){
        $scope.xyz = [];
        $scope.tests = $scope.alltests;
        //$scope.load()
            /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
            $timeout(function(){
                var setResCall =  H.getRes()
              //  $scope.doc_pat = setResCall.data;
               console.log(setResCall)
     
          
            }, 2000) */
            
          console.log($scope.srch)
    
            for (i = 0; i<$scope.tests.length; i++){
                var lower = $scope.tests[i].test_name.toLowerCase()
                var o = lower.indexOf($scope.srch.toLowerCase());
                console.log(o)
                if(o != -1){
                 $scope.xyz.push($scope.tests[i])   
                }
                
            }
    
            $scope.tests = $scope.xyz
    
        }

    $scope.addTest = function(test){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/prescribed_tests',
			data : {
                "doctor_id" : $scope.docid,
                "users_id" : $scope.id,
                "lab_tests_id" : test
			}
		}).then(function(response) {
            //console.log(response)
        })
        $route.reload();
    }

  /*   $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
            console.log(setResCall)
        }, 500)
    } */

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('alltestsController', function($scope, $controller, $rootScope, $route, $location, H, R, $http, S){

    $scope.testid = [];
    $scope.alltests = [];

    $scope.load = function(){
        
        R.get('lab_tests').query({ }, function (response) {
            $scope.alltests = response;
            $scope.tests = response;

            console.log($scope.tests)

            R.get('user_tests').query({}, function(res){
                $scope.status = res
                console.log(res)

                for(i=0; i<$scope.status.length; i++){
                if($rootScope.currentUser.id == $scope.status[i].user_id){
                      
                    $scope.testid.push($scope.status[i].lab_test_id)
                
               
            }
        }   // console.log($scope.docid);
            });

        });
    }

    $scope.isAdded = function(){
        
    }
    $scope.hasTest = function(test_id){

        var n = $scope.testid.includes(test_id);
        if (n){
            return 1;   
        }

    }

    $scope.searching = function(){
        $scope.xyz = [];
        $scope.tests = $scope.alltests;
        //$scope.load()
            /* var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
            $timeout(function(){
                var setResCall =  H.getRes()
              //  $scope.doc_pat = setResCall.data;
               console.log(setResCall)
     
          
            }, 2000) */
            
          console.log($scope.srch)
    
            for (i = 0; i<$scope.tests.length; i++){
                var lower = $scope.tests[i].test_name.toLowerCase()
                var o = lower.indexOf($scope.srch.toLowerCase());
                console.log(o)
                if(o != -1){
                 $scope.xyz.push($scope.tests[i])   
                }
                
            }
    
            $scope.tests = $scope.xyz
    
        }

    $scope.addTest = function(test){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_tests',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "lab_test_id" : test
			}
		}).then(function(response) {
            //console.log(response)
        })
        $route.reload();
    }

   /*  $scope.searching = function(){
        
        var ser_arr = H.searchArr('doctor','doctor_name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.doc_pat = setResCall.data;
            console.log(setResCall)
        }, 500)
    } */

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('prescribedtestsController', function($scope, $controller, $rootScope, $route, $location, H, R, $http, S){


    app.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]);

   // $scope.doc_name = [];
    $scope.testid = [];
    $scope.path;

    $scope.load = function(){
        //console.log("Initialized")
        R.get('prescribed_tests').query({users_id: $rootScope.currentUser.id }, function (res) {
            $scope.prescribed_tests = res;
            //console.log(res)
            R.get('user_tests').query({}, function(res){
                $scope.status = res
                //console.log(res)

                for(i=0; i<$scope.status.length; i++){
                if($rootScope.currentUser.id == $scope.status[i].user_id){
                      
                    $scope.testid.push($scope.status[i].lab_test_id)
                    }
                }  
               // console.log($scope.test_id)
            });
        });

        var content = 'C:/xampp/htdocs/prestige/api/uploads/files/1-coursera';
        var blob = new Blob([ content ], { type : 'text/plain' });
        $scope.url = (window.URL || window.webkitURL).createObjectURL( blob );
        console.log(blob);
        console.log(window.URL);
        console.log(window.webkitURL)
        console.log($scope.url);
    }
    
    $scope.hasTest = function(test_id){
       // console.log(test_id)

        var n = $scope.testid.includes(test_id);
        if (n){
            return 1;   
        }

    }

    $scope.uploadFunction = function(){
        console.dir($scope.myFile)
       /*  $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/files',
			data : {
                "files" : $scope.myFile
			}
		}).then(function(response) {
            console.log(response)
        }) */

            var uploadUrl = S.baseUrl + '/files';
            var fd = new FormData();
            fd.append('file', $scope.myFile, $scope.myFile.name);
            //console.log(fd);
            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).then(function (r) {
                console.log(r)
                //callback(null,r.data.file)
            }, function (error) {
                //callback(error,null)
            });
    }

    $scope.addTest = function(test){
        $http({
			method : "POST",
			url : H.SETTINGS.baseUrl + '/user_tests',
			data : {
                "user_id" : $rootScope.currentUser.id,
                "lab_test_id" : test
			}
		}).then(function(response) {
            //console.log(response)
        })
        $route.reload();
    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('scheduletestController', function($scope, $routeParams, $controller, $rootScope, $route, $route, $location, H, R, $http, S){

    $scope.schid = $routeParams.id
    $scope.patient = "Myself"
    $scope.ids = [];

    $scope.load = function(){
        
        console.log($scope.schid)

        $http({
            method : "GET",
            url : H.SETTINGS.baseUrl + '/tests_in_labs/'+ $scope.schid,

        }).then(function(rep){
            $scope.labsid = rep.data.lab_organization_id
          //  console.log($scope.labsid)

            /* R.get('tests_in_labs').query({lab_organization_id:$scope.labsid}, function(re){
                console.log(re)
            }) */
            R.get('user_tests').query({user_id : $rootScope.currentUser.id}, function(re){
                $scope.usertests = re;
               // console.log(re)
                for(i = 0; i<re.length;i++){
                    $scope.ids.push(re[i].lab_test_id)
                }
                console.log($scope.ids)
            })
        })
    }

    $scope.setVal = function(i){
        console.log(i);
        $scope.patient = i;
    }

    $scope.addDate = function(){
        console.log($scope.dateday)
    }

    $scope.scheduleTest = function(){
        $scope.m = $scope.ids.toString()
        $scope.currenttime = H.getDatetime();
        var date = moment($scope.dateday).format("DD-MM-YYYY")
        console.log($scope.m)
        console.log(date);

        $http({
            method : "POST",
            url : H.SETTINGS.baseUrl + '/lab_test_transaction',
            data : {
                "lab_organization_id" : $scope.labsid,
                "tests_in_labs_id" : $scope.m,
                "datetime" : $scope.currenttime,
                "req_status" : 1,
                "date_sel_user" : date,
                "patient" : $scope.patient,
                "description" : $scope.comments,
                "users_id" : $rootScope.currentUser.id
            }

        }).then(function(resp){
            
            console.log(resp)
            //$route.reload();
            
            for(i = 0; i<$scope.usertests.length; i++){

                $http({
                    method : "PUT",
                    url : H.SETTINGS.baseUrl + '/user_tests/' + $scope.usertests[i].id,
                    data: {
                        "in_cart_status" : 1
                    }
        
                }).then(function(repo){
                    console.log(repo);
                })
            }

        })

    }

})

 app.controller('addlabtechController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.ids = [];

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('lab_technician').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            $scope.labtech = r

       R.get('lab_tests').query({},function(res){
           //console.log(res)
           $scope.avlabs = res
           
           R.get('tests_in_labs').query({lab_organization_id : $scope.labtech[0].lab_organization.id},function(re){
            $scope.orgtests = re;
            console.log(re)
                
            for(i = 0; i<$scope.orgtests.length; i++){
                $scope.ids.push($scope.orgtests[i].lab_tests_id)
            }
            console.log($scope.ids)
        })
       })
    });
    }

    $scope.addtest = function(){

        var k = $scope.ids.includes(Number($scope.labid))

       if(k == false) {
                $http({
                method : "POST",
                url : H.SETTINGS.baseUrl + '/tests_in_labs',
                data : {
                    "lab_organization_id" : $scope.labtech[0].lab_organization.id,
                    "lab_tests_id" : $scope.labid,
                    "result_time" : $scope.time,
                    "fees" : $scope.fees
                }
            }).then(function(response) {
                console.log(response);
                $route.reload();
                $location.path('/alluploads');
            })
        } else {
            alert('Test Already Entered');
            $route.reload()
        }
    }

})

 app.controller('alluploadsController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('lab_technician').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
            console.log(r);
            console.log(r[0].lab_organization.id)
            /* R.get('lab_tests').query({lab_organization : r[0].lab_organization.id},function(tests){
                $scope.tests = tests;
                console.log(tests)
            }) */

            R.get('tests_in_labs').query({lab_organization_id : r[0].lab_organization.id},function(res){
                console.log(res)
                $scope.avlabs = res
            })
       });
    }

    $scope.delTest = function(id){
        
        $http({
			method : "DELETE",
			url : H.SETTINGS.baseUrl + '/tests_in_labs/'+id
		}).then(function(response) {
            console.log(response);
            $route.reload()
        })
    }

})

 app.controller('lab_technicianController', function($scope, $cookies, $timeout, $controller, $rootScope, $location, H, R, $http, $route, S)
 {

    $scope.load = function()
    {
     //console.log($rootScope.currentUser);
        R.get('lab_technician').query({users_id : $rootScope.currentUser.id }, function (r) 
        {
           // console.log(r);
            $scope.orgname = r[0].lab_organization.name;

         R.get('lab_test_transaction').query({lab_organization_id:r[0].lab_organization.id},function(re){
            console.log(re);
            $scope.requests = re;

            R.get('user_tests').query({lab_organization_id:r[0].lab_organization.id},function(re){
               console.log(re);
               $scope.requests = re;
               
            })
         })

       });
    }

})/* app.controller('available_doctorsControllerBase', ControllerFactory('available_doctors')) */

app.controller('nearby_storeController', function($scope, L, $controller, $timeout,$rootScope, $route, $location, H, R, $http, S){

    //$scope.ser_arr = [];
    $scope.srch;

    $scope.load = function(){

        
        R.get('medical_store').query({ }, function (response) {
            $scope.stores = response;

            //console.log($scope.stores);

        });
        var m =  L.getLocation();
        
        $timeout(function(){
            
            console.log();
        },10000)
    }

    $scope.searching = function(){
        
        var ser_arr = H.searchArr('medical_store','name',$scope.srch)
        $timeout(function(){
            var setResCall =  H.getRes()
            $scope.stores = setResCall.data;
            console.log(setResCall)
        }, 500)    
        //$scope.stores = ser_arr;
        //console.log(H.res)
    }

})/*global angular, app*/
app.controller('organizationsControllerExtension', function($scope, $controller, $rootScope, $http, $location, $timeout, $mdDialog, H, M) {

    if(!(['superadmin'].indexOf($rootScope.currentUser.role) > -1)){
        $location.path('unauthorized');
    }
    
    $scope.checkLicenceValidity = function(item){return H.checkLicenseValidity(item) == 'valid' ? true : false };

    $scope.onInit = function(){
        //$scope.newSingle(function(){
            $scope.data.single.org_secret = H.getUUID();  
            $scope.data.single.license = 'basic';
            $scope.data.single.validity = '0000-00-00 00:00:00';
        //})
    };
    
    $scope.onLoadAll = function(){
        $scope.setListHeaders(['Organization', 'Email', 'License', 'Validity', 'Client Secret', 'Actions']);
    }
    
    $scope.currentOrganization = {};
    $scope.newOrganizationValues = {};
    $scope.newUserValues = {};
    
    $scope.activate = function(item, newItem) {
        if($rootScope.currentUser.role == 'superadmin') {
            //$scope.loading = true;
            var url = H.SETTINGS.baseUrl + '/organizations/activate';
            item.validity = (newItem.validity) ? H.toMySQLDateTime(newItem.validity) : item.validity;
            item.license = (newItem.license) ? newItem.license : item.license;
            //console.log(item);
            $http.post(url, item)
                .then(function(r){
                	//console.log("Entered success");
                    $scope.refreshData();
                    $scope.newOrganizationValues = {};
                    $scope.currentOrganization = {};
                    $mdDialog.cancel();   
                    //$scope.loading = false;
                },function(e){
                	//console.log("Entered error");
                    if(e && e.data && e.data.error && e.data.error.message){
                        if(e.data.error.code == 404){
                            $scope.newOrganizationValues.error =  M.SAAS_API_UNAVAILABLE;
                        } else {
                            $scope.newOrganizationValues.error = e.data.error.message;
                        }
                    }
                    //$scope.newOrganizationValues = {};
                    //$scope.currentOrganization = {};
                    //$mdDialog.cancel();   
                    //$scope.loading = false;
                });
        }
    };
    
    $scope.setPassword = function(item, newItem) {
        if($rootScope.currentUser.role == 'superadmin'){
            if(newItem.admin_password == null || newItem.admin_password == ""){
                newItem.error = "Super Admin Password is required!";
                return;
            }
            if(newItem.password == null || newItem.password == ""){
                newItem.error = "Password is required!";
                return;
            }
            if(newItem.password != newItem.confirm_password){
                newItem.error = "Password and Confirm Password should match!";
                return;
            }
            var url = H.SETTINGS.baseUrl + '/users/set-password';
            newItem.admin_email = $rootScope.currentUser.email;
            newItem.secret = item.secret;
            newItem.email = item.email;
            //$scope.loading = true;
            $http.post(url, newItem)
                .then(function(r){
                    $scope.currentOrganization = {};
                    $scope.newUserValues = {};
                    $mdDialog.cancel();   
                    //$scope.loading = false;
                },function(e){
                    if(e && e.data && e.data.error && e.data.error.status){
                        newItem.error = e.data.error.message ? e.data.error.message : e.data.error.status;    
                    }
                    //$scope.loading = false;
                    //$scope.currentOrganization = {};
                    //$scope.newUserValues = {};
                    //$mdDialog.cancel();   
                });
        }
    };  
    
    $scope.showActivationDialog = function(ev, item) {
        $scope.currentOrganization = item;
        $mdDialog.show({
          contentElement: '#activationDialog',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false
        });
    };
    
    $scope.hideActivationDialog = function(){
        $scope.newOrganizationValues = {};
        $scope.currentOrganization = {};
        
        $mdDialog.cancel();            
    };

    $scope.showSetPasswordDialog = function(ev, item) {
        $scope.currentOrganization = item;
        $mdDialog.show({
          contentElement: '#setPasswordDialog',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false
        });
    };
    
    $scope.hideSetPasswordDialog = function(){
        $scope.currentOrganization = {};
        $scope.newUserValues = {};
        
        $mdDialog.cancel();            
    };
});/* var app= angular.module('app',[])

app.component('outerComp',{
    binding:{},
    controller:["report_dataController"],
    template: '<h1>Hello World!</h1>'
    
}) *//*global app*/

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
app.controller('report_editController', function ($scope, $rootScope, $http, $location, H, R, $routeParams, $timeout) {
	$('.collapsible').collapsible();
	$scope.H = H;
	$scope.M = H.M;
	var id = $routeParams.id;
	$scope.showChart = [];
	$scope.report_data_chart_type = [];
	$scope.choices = [];
	$scope.number_of_charts = [];
	$scope.report_data_data_source = [];
	$scope.report_data_scale_x = [];
	$scope.report_data_name = [];
	$scope.myJson = [];
	$scope.multiple_choices = [];
	$scope.multiple_aggregations = [];
	$scope.form_name = [];
	$scope.database = [];
	$scope.result = [];
	$rootScope.id_edit = id;
	$scope.currentUserId = $rootScope.currentUser.id;
	$scope.CurrentUserAdmin = false;
	if($rootScope.currentUser.role == 'admin') {
		$scope.CurrentUserAdmin = true;
	}
	$scope.data = {};
	$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(response) {
		$scope.user_groups = response.data;
		R.get('forms').query({}, function(r){
			$scope.tables = r;
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
			console.log($scope.tables);
			console.log($scope.userIdsGroups);
			$http({
				method : 'GET',
				url : H.SETTINGS.baseUrl + '/bar_type'
			}).then(function(response){
				$scope.bar_data = response.data;
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
						$scope.data_report_unchanged = [];
				        $scope.data_report_original = response.data;
				        for(var i = 0; i < response.data.length; i++) {
				        	if((response.data[i].data_source.UserId != undefined && response.data[i].data_source.UserId.split(',').includes($rootScope.currentUser.id.toString())) || (response.data[i].data_source.GroupId != undefined && checkGroups(response.data[i].data_source.GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
				        		$scope.data_report.push(response.data[i]);
				        	} else {
				        		$scope.data_report_unchanged.push(response.data[i]);
				        	}
				        }
						$scope.module_name = $scope.data_report_original[0].charts.module_name;
						rec(0, $scope.data_report);
				
						//Get Tables Column Name From Table
						
					});
			    });
			});
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
	
	function rec (k, report_data) {
		if(k >= report_data.length) {
	    } else {
	    	$scope.report_data_name[k] = report_data[k].name;
			$scope.report_data_data_source[k] = report_data[k].data_source.id;
			$scope.report_data_chart_type[k] = report_data[k].chart_type;
			$scope.report_data_scale_x[k] = report_data[k].scale_x;
			$scope.multiple_choices[k] = report_data[k].scale_y.split(',');
			$scope.multiple_aggregations[k] = report_data[k].aggregations.split(',');
			$scope.number_of_charts[k] = k;
			R.get('form_fields').query({form_id: report_data[k].data_source.id}, function(r){
				$scope.database[k] =  r;
				if(r[0] != null) {
					$scope.form_name[k] = r[0].form.title;
				}
				var x_scale = $scope.report_data_scale_x[k];
				const result =  $scope.database[k].filter(word => word.field.title != x_scale);
				$scope.result[k] = result;
				$scope.showData(k);
				rec(k + 1, report_data);
			});
	    }	
	}
	
	
	//Get Tables Name From gopal Database
	

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
		const result = $scope.database[x].filter(word => (word.field.field_type.title == "Number" || word.field.field_type.title == "Dropdown" || word.field.field_type.title == "RadioButtonList" || word.field.field_type.title == "CheckBoxList"));
		var x_scale = $scope.report_data_scale_x[x];
		const result1 =  result.filter(word => word.field.title != x_scale);
		$scope.multiple_choices[x] = [];
		$scope.multiple_aggregations[x] = [];
		$scope.multiple_choices[x].push(result1[0].field.title);
		$scope.multiple_aggregations[x].push('no_aggr');
		$scope.result[x] = result1;
	};

	//GET all Chart Type
	
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
			$scope.database.splice(idx, 1);
			$scope.result.splice(idx, 1);
			$scope.myJson.splice(idx, 1);
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
				}if(bar_type != 'grid'){
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
				} else if(bar_type == 'grid')	{

					$scope.multiple_choice_altered = []
					$scope.multiple_choice_altered = y_scale;
					
					$scope.myJson[x] = {
	
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
	
	$scope.saveData =  function(){
		
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

        $http.delete(H.SETTINGS.baseUrl + '/display_charts/' + id).then(function(data) {
            $http({
                    method : "POST",
                    url : H.SETTINGS.baseUrl + '/display_charts',
                    data : {
                        module_name: $scope.module_name
                    },
                    header : 'Content-Type: application/json; charset=UTF-8'
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
	                    	if($scope.data_report_unchanged.length == 0) {
	                    		var isvalid = response.status;
				        	    if(isvalid == 201) {
				    		        $location.path('/reporthome');
				                } else {
				                    alert("Enter a Valid Data");
			                    }
	                    	}
	                    });    
                	}
                	
                	for(var i = 0; i < $scope.data_report_unchanged.length; i++) {
                		$http({
				            method : "POST",
			                url : H.SETTINGS.baseUrl + '/report_data',
			                data : {
			                    "name" : $scope.data_report_unchanged[i].name,
			                    "data_source" : $scope.data_report_unchanged[i].data_source.id,
			                    "chart_type" : $scope.data_report_unchanged[i].chart_type,
			                	"scale_x" : $scope.data_report_unchanged[i].scale_x,
			                    "scale_y" : $scope.data_report_unchanged[i].scale_y,
			                    "aggregations": $scope.data_report_unchanged[i].aggregations,
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
            });
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
	
});/*global app*/
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
    
});/*global app*/
app.controller('reportsControllerBase', ControllerFactory('report_data'));

app.controller('reporthomeController', function ($scope, $rootScope, $controller, $http, $location, $route, $window, H, R) {
    $('.collapsible').collapsible();
	$scope.H = H;
	$scope.M = H.M;
	$scope.currentUserRole = $rootScope.currentUser.role;
	$scope.currentUserId = $rootScope.currentUser.id;
	$controller('reportsControllerBase', {
		$scope: $scope
	});
	$scope.viewby = 5;
		// $scope.totalItems = $scope.data.length;
		$scope.currentPage = 3;
		$scope.itemsPerPage = 10;
		  $scope.maxSize = 2;
		  $scope.setPage = function (pageNo) {
		  $scope.currentPage = pageNo;
		};
	  
		$scope.pageChanged = function() {
		  console.log('Page changed to: ' + $scope.currentPage);
		};
	  
	  $scope.setItemsPerPage = function(num) {
		$scope.itemsPerPage = num;
		$scope.currentPage = 1; //reset to first page
	  }
		  //

	$scope.query({}, function(r) {
		$scope.totalformdata=r;
		$scope.totalItems = r.length;
	});

	$scope.load = function(){
		
		$http.get(H.SETTINGS.baseUrl + '/user_groups').then(function(r) {
			$scope.user_groups = r.data;
			$http.get(H.SETTINGS.baseUrl + '/report_data').then(function(response) {
		        $scope.chart_data = [];
		        $scope.data_report_ids = [];
		        $scope.data_report_original = response.data;
		        for(var i = 0; i < response.data.length; i++) {
		        	if((response.data[i].data_source.UserId != undefined && response.data[i].data_source.UserId.split(',').includes($scope.currentUserId.toString())) || (response.data[i].data_source.GroupId != undefined && checkGroups(response.data[i].data_source.GroupId.split(','))) || $rootScope.currentUser.role == 'admin') {
		        		if(!$scope.data_report_ids.includes(response.data[i].charts.id)) {
		        			$scope.chart_data.push(response.data[i].charts);
		        			$scope.data_report_ids.push(response.data[i].charts.id);
		        		}
		        	}
		        }
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
		return userIdsOfGroupsString.join().split(',').includes($scope.currentUserId.toString());
		
    }
	
	$scope.view = function(obj){
		var id = obj;
		//$location.path('/report_show/' + id);
		$window.location.href = '#!/report_show/' + id;
	};
	$scope.edit = function(obj){
		var id = obj;
		$window.location.href = '#!/report_edit/' + id;
	};
	
	$scope.modalOptions = {};

	$scope.deleteObject = function(obj) {
		$http.delete(H.SETTINGS.baseUrl + '/display_charts/' + obj).then(function(data) {
			$route.reload();
		});

	};

	$scope.launchDelete = function(obj) {
		$scope.deleteCandidate = obj;
		$scope.modalOptions.open($scope.deleteModalOptions);
	};

	$scope.cancelDelete = function() {
		$scope.deleteCandidate = null;
	};
	
	$scope.deleteModalOptions = {
		header: 'Are you sure you want to delete this User?',
		text: 'If you proceed, all your records associated with this user will also be deleted. Proceed with caution!',
		showOk: true,
		okText: 'Yes, Please!',
		onOkClick: function(){ $scope.deleteObject($scope.deleteCandidate); },
		showCancel: true,
		cancelText: 'No!',
		onCancelClick: function(){ $scope.cancelDelete();}
	};
	
});/*global angular, app*/
app.controller('usersControllerExtension', function($scope, $controller, $rootScope, $http, $location, $mdDialog, H, M) {
    
    
    if(!(['admin', 'superadmin'].indexOf($rootScope.currentUser.role) > -1)){
        $location.path('unauthorized');
    }

    $scope.onInit = function(){
        //$scope.newSingle(function(){
        $scope.data.single.password = H.getHash('pRESTige');    
        //});
    };
    
    $scope.onLoadAll = function(){
        $scope.setListHeaders(['Username', 'Email', 'Last Lease', 'Role', 'Actions']);
    }
    
    $scope.setPassword = function(item, newItem) {
        if(['admin', 'superadmin'].indexOf($rootScope.currentUser.role) > -1){
            if(newItem.admin_password == null || newItem.admin_password == ""){
                newItem.error = M.ADMIN_PASSWORD_REQUIRED;
                return;
            }
            if(newItem.password == null || newItem.password == ""){
                newItem.error = M.PASSWORD_REQUIRED;
                return;
            }
            if(newItem.password != newItem.confirm_password){
                newItem.error = M.PASSWORD_NOT_MATCHING;
                return;
            }
            var url = H.SETTINGS.baseUrl + '/users/set-password';
            newItem.admin_email = $rootScope.currentUser.email;
            newItem.secret = item.secret;
            newItem.email = item.email;
            //$scope.loading = true;
            $http.post(url, newItem)
                .then(function(r){
                    $scope.clickedUser = {};
                    $scope.newUserValues = {};
                    $mdDialog.cancel();   
                    //$scope.loading = false;
                },function(e){
                    if(e && e.data && e.data.error && e.data.error.status){
                        newItem.error = e.data.error.message ? e.data.error.message : e.data.error.status;    
                    }
                    //$scope.loading = false;
                });
        }
    };

    $scope.showSetPasswordDialog = function(ev, item) {
        $scope.clickedUser = item;
        $scope.newUserValues = {};        
        $mdDialog.show({
          contentElement: '#setPasswordDialog',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false
        });
    };
    
    $scope.hideSetPasswordDialog = function(){
        $scope.clickedUser = {};
        $scope.newUserValues = {};
        $mdDialog.cancel();            
    }; 
    
});/**
 * Object SideNavi
 * public methods : init
 * init param : String direction
 * init param : Object css data
 */

var SideNavi = ( function ($) {

	var container = {},
		cssElements = {},
		posStep = 30,
		posStart = null,
		posEnd = null,
		posDirection = '',
		isSlideing = false,
		isVisible = false,
		activeIndex = -1,
		changeVisibility = false;

	function getPosStart () {

		if (posStart === null) {

			switch (posDirection) {
				case 'right' :
					posStart = $(cssElements.defaultitem + ':eq(0)', container).height()*1;
					break;
				case 'left' :
					posStart = 0 - $(cssElements.data + ':eq(0)', container).width()*1;
					break;
			}
		}

		return posStart;
	}
	function getPosEnd () {

		if (posEnd === null) {

			switch (posDirection) {
				case 'right' :
					posEnd = $(cssElements.data, container).width()*1;
					break;
				case 'left' :
					posEnd = 0;
					break;
			}
		}

		return posEnd;
	}
	function getPos (){
		return container.css(posDirection).replace('px','');
	}
	function toggleIsVisible () {
		isVisible = !(isVisible);
	}
	function isActiveItem (item) {
		return item.hasClass('active');
	}
	function setActiveTab () {
		$(cssElements.tab + cssElements.active, container).removeClass(cssElements.active.replace('.',''));
		$(cssElements.tab + ':eq(' + activeIndex + ')',container).addClass(cssElements.active.replace('.',''));
	}
	function removeActiveItem () {
		$(cssElements.item + cssElements.active, container).removeClass('active');
	}
	function setActiveItem (item) {
		removeActiveItem();
		setActiveTab();
		item.addClass('active');
	}
	function setDefaultItem (item) {
		item.removeClass('active');
	}
	function slideEvent () {

		var pos = getPos()*1;

		if ( isVisible && pos < getPosEnd () || ! isVisible && pos > getPosStart ()  ) {

			pos = (isVisible) ?  pos+posStep : pos-posStep;

			if (isVisible && pos + posStep >= getPosEnd () || ! isVisible && pos - posStep <= getPosStart ()) {

				pos = (isVisible) ?  getPosEnd () : getPosStart ();
				container.css(posDirection, pos+'px');
				isSlideing = false;

			} else {
				container.css(posDirection, pos+'px');
				setTimeout(function () {slideEvent()}, 30 );
			}

		} else {
			isSlideing = false;
		}

	}
	function slide () {
		if ( ! isSlideing) {
			isSlideing = true;
			slideEvent();
		}
	}
	function setEventParam (item) {

		activeIndex = $(cssElements.item, container).index(item);

		if (isActiveItem(item)) {
			toggleIsVisible();
			setDefaultItem(item);

			changeVisibility = true;

		} else {

			setActiveItem(item);

			if ( ! isVisible) {
				toggleIsVisible();
				changeVisibility = true;
			}
		}
	}
	function eventListener () {

		$(cssElements.item, container).on('click', function (event) {

			event.preventDefault();	
			setEventParam($(this));

			if (changeVisibility) {
				slide();
			}
		});
	}
	function init (direction, conf) {

		posDirection = direction;
		cssElements = conf;
		container = $(cssElements.container);

		eventListener();
	}

	return {
		init : init
	};

})(jQuery);