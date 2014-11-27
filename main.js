angular.module('rulit', ['ui.bootstrap', 'ui.router', 'ri.module.rulebook', 'ri.module.token', 'ri.module.board', 'ri.module.game'])

.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

    // $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('main', {
            url : "/",
            templateUrl : 'partials/home.html'
        })
        .state('gameEdit', {
            url : "/:name",
            templateUrl : 'partials/game.edit.html'
        })
})

.controller('rulit.controller', function() {
    this.layout = {
        mode : 2
    };

    this.bootstrapTheme='standard';
})

;