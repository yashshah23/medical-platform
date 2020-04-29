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
