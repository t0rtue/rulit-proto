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
                riGame : function($stateParams, gameStore) { return {} }
            }
        })
        .state('game', {
            url : "/:name",
            abstract: true,
            templateUrl: 'module/game/gameView.html',
            resolve: {
                riGame : function($stateParams, gameStore) {
                    return gameStore.get($stateParams.name).then(function(g) {
                                // Retro compatibility
                                // i.e update loaded game data with newly needed properties
                                g.goal = g.goal || {end:[], win:[], lose:[]};
                                g.minPlayer = g.minPlayer || 1;
                                g.maxPlayer = g.maxPlayer || 1;

                                return g;
                            })
                }
            },
            controller : function($scope, $stateParams) {
                $scope.gameName = $stateParams.name;
            }
        })
        .state('game.rb', {
            url : "/rulebook",
            templateUrl  : 'module/irulebook/interactive-rulebook.html',
            controller   : 'ri.interactiveRulebook.controller',
            controllerAs : 'rulebook'
        })
        .state('game.menu', {
            url : "/menu",
            templateUrl  : 'module/game/partials/menu.html',
            controller   : 'ri.gameMenu.controller',
            controllerAs : 'menu'
        })
        .state('game.play', {
            url : "/play",
            templateUrl : 'module/game/partials/gamelayout.html',
            controller  : 'ri.game.controller',
            controllerAs: 'game',
            resolve: {
                riGrid : function($injector, riGame) {
                    var grid = $injector.get('ri.grid.' + riGame.gridType);
                    grid.init(riGame.gridSize);
                    return grid;
                }
            }
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
            turnPhases : [],
            theme : {
                background : '#002'
            }
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
        templateUrl : 'partials/game.list.html'
    }
}])

.directive('riRemoveButton', [function() {
    return {
        restrict : 'E',
        scope : {},
        template : '\
            <button  type="button" class="pull-right close"> \
                <span aria-hidden="true">&#215;</span> \
                <span class="sr-only">Close</span> \
            </button>'
    }
}])
;
