angular.module('rulit', ['ui.bootstrap', 'ui.router', 'ri.gameStore', 'ri.module.irulebook', 'ri.module.token', 'ri.module.board', 'ri.module.game'])

.value('gameListGistID', 'a4fad8d36b6acfb39835')

.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

    // $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('main', {
            url : "/",
            templateUrl : 'partials/home.html'
        })
        .state('sandbox', {
            url : "/sandbox",
            templateUrl : 'partials/game.edit.html',
            resolve: {
                riGame : function(gameStore, $stateParams) { return {} }
            }
        })
        .state('game', {
            url : "/:name",
            abstract: true,
            template: '<ui-view/>',
            resolve: {
                riGame : function(gameStore, $stateParams) { return gameStore.get($stateParams.name) }
            }
        })
        .state('game.rb', {
            url : "/rulebook",
            templateUrl  : 'module/irulebook/interactive-rulebook.html',
            controller   : 'ri.interactiveRulebook.controller',
            controllerAs : 'rulebook'
        })
        .state('game.play', {
            url : "/play",
            templateUrl : 'partials/gamewindow/gamelayout.html',
            controller  : 'ri.game.controller',
            controllerAs: 'game'
        })
        .state('game.def', {
            url : "/def",
            template : '{{game | json}}',
            controller : ['$scope', 'riGame', function($scope, game) {
                $scope.game = game;
            }]
        })
})

.controller('rulit.controller', ['gameStore', 'gameListGistID', function(gameStore, gameListGistID) {
    this.layout = {
        mode : 2
    };

    this.bootstrapTheme='standard';

    this.games = gameStore.games;
    gameStore.loadGamesList(gameListGistID);

    this.createGame = function(name) {
        gameStore.save(name, {
            introduction : "This game will be a fantastic game soon!",
            gridType : 'square',
            gridSize : 10,
            tokens : {
                all: []
            },
            turnPhases : []
        });
    }

    this.removeGame = function(name) {
        gameStore.remove(name);
    }

}])

.directive('riGamesList', [function() {
    return {
        restrict : 'E',
        scope : {
            'games'  : '=',
            'source' : '@',
            'remove' : '&',
            'canRemove' : '@'
        },
        template : ' \
            <div class="list-group"> \
                <a ng-repeat="game in games | filter:{source:source}" \
                   class="list-group-item game-item"> \
                    <p> \
                        {{game.name}}\
                        <button ng-if="canRemove" type="button" class="pull-right close" ng-click="remove({name:game.name})"> \
                            <span aria-hidden="true">&times;</span><span class="sr-only">Close</span> \
                        </button> \
                        <span ui-sref="game.play({name:game.name})" title="play" class="pull-right glyphicon glyphicon-play" ></span> \
                        <span ui-sref="game.rb({name:game.name})" title="edit rules" class="pull-right glyphicon glyphicon-cog" ></span> \
                    </p> \
                </a> \
            </div>'
    }
}])

;
