angular.module('ri.module.irulebook', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {


    // $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('game.rb.top', {
            url : "#",
        })
        .state('game.rb.intro', {
            url : "#intro",
        })
        .state('game.rb.material', {
            url : "#material",
        })
        .state('game.rb.goal', {
            url : "#goal",
        })
        .state('game.rb.turn', {
            url : "#turn",
        })
        .state('game.rb.setup', {
            url : "#setup",
        })
        .state('game.rb.theming', {
            url : "#theming",
        })
})

.controller('ri.interactiveRulebook.controller', [ '$stateParams', 'gameStore', 'riGame', function($stateParams, gameStore, game) {
    this.name = $stateParams.name;
    this.game = game;
    this.modified = true;

    this.save = function() {
        gameStore.save(this.name, game);
        this.modified = false;
    }

    this.addToken = function(type) {
        game.tokens.all.push({
            'type'       : type,
            'properties' : [],
            'view':{
                    layers:[{size:0.5}],
                    kernel:{}
                }
        });
    }
}])

.directive('autoGrow', function() {
    return {
        restrict : 'A',
        link : function(scope, elem) {
            function update() {
                var ctx = elem.context;
                if (ctx.scrollHeight > ctx.clientHeight) {
                    ctx.style.height = ctx.scrollHeight + "px";
                }
            }
            elem.css({'overflow':'hidden'});
            elem.bind('keyup keydown keypress change', update);
            setTimeout(function() {update()}, 100);
        }
    }
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

.directive('rbInfo', function() {
    return {
        restrict : 'E',
        scope : {
          layout : '@'
        },
        transclude : true,
        template : ' \
            <div class="{{layout}} alert alert-info" role="alert"> \
                <span  title="info" class="glyphicon glyphicon-info-sign"></span> \
                <span ng-transclude></span> \
            </div>'
    }
})

.directive('rbGrid', [function() {
    return {
        restrict : 'E',
        scope : {
            'type' : '=',
            'size' : '='
        },
        template : ' \
          <div class="form-inline"> \
              The game is played on a grid of type \
              <select ng-model="type" class="form-control" ng-options="type for type in [\'square\', \'hexa\']"></select> \
              with a size of <input ng-model="size" class="form-control" type="number"></input> \
          </div>'
    }
}])

.directive('rbTokenList', [function() {
    return {
        restrict : 'E',
        scope : {
            'tokens' : '=',
            'add' : '&'
        },
        templateUrl : 'module/irulebook/partials/tokenList.html'
    }
}])

.directive('rbTurn', [function() {
    return {
        restrict : 'E',
        scope : {
            'phases' : '=',
            'tokens' : '='
        },
        templateUrl : 'module/irulebook/partials/turn.html'
    }
}])

;