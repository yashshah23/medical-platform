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
