angular.module('ri.module.rulebook', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {


    // $urlRouterProvider.otherwise("/");

    $stateProvider
        .state('game.edit.top', {
            url : "#",
        })
        .state('game.edit.intro', {
            url : "#intro",
        })
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



;