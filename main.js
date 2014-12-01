angular.module('rulit', ['ui.bootstrap', 'ui.router', 'ri.gameStore', 'ri.module.rulebook', 'ri.module.token', 'ri.module.board', 'ri.module.game'])

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
            templateUrl : 'partials/game.edit.html'
        })
        .state('game', {
            url : "/:name",
            abstract: true,
            template: '<ui-view/>',
            resolve: {
                riGame : function(gameStore, $stateParams) { return gameStore.get($stateParams.name) }
            }
        })
        .state('game.edit', {
            url : "/rulebook",
            templateUrl : 'partials/rulebook/rulebook.html'
        })
        .state('game.play', {
            url : "/play",
            templateUrl : 'partials/gamewindow/gamelayout.html'
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
        gameStore.save(name, {});
    }

}])


.directive('riGamesList', [function() {
    return {
        restrict : 'E',
        scope : {
            'games' : '=',
            'source' : '@'
        },
        template : ' \
            <div class="list-group"> \
                <a ng-repeat="game in games | filter:{source:source}" \
                   class="list-group-item game-item"> \
                    <p> \
                        {{game.name}} \
                        <span ui-sref="game.play({name:game.name})" title="play" class="pull-right glyphicon glyphicon-play" ></span> \
                        <span ui-sref="game.edit({name:game.name})" title="edit rules" class="pull-right glyphicon glyphicon-cog" ></span> \
                        <!-- <button type="button" class="close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button> --> \
                    </p> \
                </a> \
            </div>'
    }
}])

;
