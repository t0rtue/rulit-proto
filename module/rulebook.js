angular.module('ri.module.rulebook', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {


    // $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('game.edit.material', {
            url : "#material",
        })
        .state('game.edit.goal', {
            url : "#goal",
        })
        .state('game.edit.actions', {
            url : "#actions",
        })
        .state('game.edit.turn', {
            url : "#turn",
        })
        .state('game.edit.setup', {
            url : "#setup",
        })
        .state('game.edit.theming', {
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