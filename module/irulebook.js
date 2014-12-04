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
        templateUrl : 'partials/irulebook/tokenList.html'
    }
}])

.directive('rbTurn', [function() {
    return {
        restrict : 'E',
        scope : {
            'phases' : '=',
            'tokens' : '='
        },
        templateUrl : 'partials/irulebook/turn.html'
    }
}])

;