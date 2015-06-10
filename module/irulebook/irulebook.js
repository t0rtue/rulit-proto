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
        .state('game.rb.strategy', {
            url : "#strategy",
        })
        .state('game.rb.example', {
            url : "#example",
        })
        .state('game.rb.qref', {
            url : "#qref",
        })
        .state('game.rb.theme', {
            url : "#theme",
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
        type = "Type " + (game.tokens.all.length + 1);
        game.tokens.all.push({
            'type'       : type,
            'properties' : [],
            'view':{
                    layers:[{size:0.5}],
                    kernel:{}
                }
        });
    }

    this.addTile = function(type) {
        type = "Type " + (game.tiles.length + 1);
        game.tiles.push({
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
            <div class={{layout}}> \
                <div class="alert alert-info" role="alert"> \
                    <span  title="info" class="glyphicon glyphicon-info-sign"></span> \
                    <span ng-transclude></span> \
                </div> \
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
        templateUrl : 'module/irulebook/partials/grid.html'
    }
}])

/* rbList
    Not working as expected.
    Objective is to Transclude custom list item
    TODO change to a version of angular > 1.2
    Will allow to create a clean and customizable rb-list directive
*/
.directive('rbList', [function() {
    return {
        restrict : 'E',
        // bindToController: false,
        controllerAs : 'list',
        controller : function($scope) {
            this.data = $scope.data;
        },
        transclude : true,
        scope : {
            'data' : '=',
        },
        templateUrl : 'module/irulebook/partials/list.html'
    }
}])
.directive('rbRow', [function() {
      return {
        // controllerAs : 'row',
        // controller : ['$attrs', '$scope', function($attrs, $scope) {
        //   this.elem = $scope.$eval($attrs.elem);
        //   console.log(this.elem);
        // }],
        scope : {
            elem : "="
        },
        link : function(scope, element, attrs, ctrl, transclude) {
                    transclude(scope.$parent, function(clone, scope) {
                        element.append(clone);
                      });
        }
      }
}])
// END rbList

.directive('rbTokenQuantityList', [function() {
    return {
        restrict : 'E',
        scope : {
            'data' : '=',
            'tokens': '=',
            'type' : '@'
        },
        templateUrl : 'module/irulebook/partials/tokenQuantityList.html'
    }
}])

.directive('rbTokenList', [function() {
    return {
        restrict : 'E',
        scope : {
            'tokens' : '=',
            'add' : '&',
            'parent' : '@',
            'size' : '@',
            'shape' : '='
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

.directive('rbGoal', [function() {
    return {
        restrict : 'E',
        scope : {
            'conditions' : '=',
            'tokens' : '=',
            'editMode' : '@'
        },
        templateUrl : 'module/irulebook/partials/goal.html'
    }
}])

.directive('rbGameWindow', [function() {
    return {
        restrict : 'E',
        scope : {
            theme : '=',
            height : '@',
            label : '@'
        },
        replace : true,
        templateUrl : 'module/irulebook/partials/gameWindow.html'
    }
}])

.directive('rbTokenSelect', [function() {
    return {
        restrict : 'E',
        scope : {
            'tokens' : '=',
            'model' : '='
        },
        template : '<select ng-model="model" class="form-control input-sm" ng-options="type for type in tokenTypes" class="form-control"></select>',
        link: function (scope, element) {
            scope.$watch('tokens', function(tok) {
                scope.tokenTypes = tok.map(function(e){return e.type});
                scope.model = scope.model || scope.tokenTypes[0];
              }, true);
        }
    }
}])

;