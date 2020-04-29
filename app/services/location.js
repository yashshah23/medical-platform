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
