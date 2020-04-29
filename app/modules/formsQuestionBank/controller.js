app.controller('questionBankControllerBase', ControllerFactory('question_bank_fields'));

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




});