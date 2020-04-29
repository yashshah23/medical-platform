(function () {

    angular
        .module('app')
        .factory('fileUploadService', fileUploadService);
 
    fileUploadService.$inject = ['$http','S'];
 
    /* @ngInject */
    function fileUploadService($http,S) {
        var service = {
            uploadFile: uploadFile
        };
 
        return service;
 
        function uploadFile(file, callback) {
            //console.log("Entered uploadFile");
            var uploadUrl = S.baseUrl + '/files';
            var fd = new FormData();
            fd.append('file', file, file.name);
            //console.log(fd);
            $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).then(function (r) {
                callback(null,r.data.file)
            }, function (error) {
                callback(error,null)
            });
        }
    }
 })();