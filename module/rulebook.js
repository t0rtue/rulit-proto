angular.module('ri.module.rulebook', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {


    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('gameEdit.material', {
            url : "#material",
        })
        .state('gameEdit.goal', {
            url : "#goal",
        })
        .state('gameEdit.actions', {
            url : "#actions",
        })
        .state('gameEdit.turn', {
            url : "#turn",
        })
        .state('gameEdit.setup', {
            url : "#setup",
        })
        .state('gameEdit.theming', {
            url : "#theming",
        })
})

.controller('TokenEditModalCtrl', function ($scope, $modal, $log) {

  $scope.openModal = function (token) {

    var modalInstance = $modal.open({
      templateUrl: 'module/token/tokenEditor.html',
      controller: 'TokenEditModalInstanceCtrl',
      size : 'lg',
      resolve: {
        token: function() {return token}
      }
    });

    modalInstance.result.then(function (tokenview) {
      token.view = tokenview;
    }, function () {
    });
  };
})

.controller('TokenEditModalInstanceCtrl', function ($scope, $modalInstance, token) {

  $scope.token = token;
  $scope.tokenView = angular.copy(token.view);


  $scope.ok = function (tokenview) {
    $modalInstance.close(tokenview);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})

.directive('rbTodo', function() {
    return {
        restrict : 'E',
        scope : {
            'type' : '@'
        },
        transclude : true,
        template :  '<div class="panel panel-info"><div class="panel-heading">TODO {{type}}</div><div class="panel-body" ng-transclude></div></div>',
    }
})

;