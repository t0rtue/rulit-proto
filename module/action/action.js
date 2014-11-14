angular.module('ri.module.action', [])

.service('ri.actions', function() {
    /*
        TODO
        list of allowed dest. e.g tile and corner
    */
    var actions = {
        all : [
            {
                name  : 'put a pawn on a tile',
                type  : 'put',
                dest  : {type:'tile'},
                token : {type:'pawn'}
            },
            {
                name : 'put a wall on a border',
                type:'put',
                token : {type : 'wall'},
                dest : {type:'border'}
            },
            {
                name : 'move a pawn',
                type:'move',
                token : {type : 'pawn'},
                dest : {type:'tile', dist:2}
            },
            {
                name : 'get 10 gold',
                type:'get',
                property : {name : 'gold'}, quantity : 10
            },
            {
                name : 'link 2 token',
                type:'link'
            }
        ],
        free : {type:'free', dest : {type:'tile'}}
    };

    actions.select = function(action) {
        if (actions.current) {
            actions.current.selected = false;
        }
        action.selected = true;
        actions.current = action;
    }

    actions.cancel = function() {
        actions.current && (actions.current.selected = false);
        actions.current = null;
    }

    actions.freeAction = function() {
        actions.select(actions.free);
    }

    return actions;
})

.directive('riActionEdit', function() {
    return {
        restrict : 'E',
        scope : {
            'action' : '=',
            'tokens' : '='
        },
        templateUrl : 'module/action/action.edit.html',
        link: function (scope, element) {

            scope.$watch('tokens', function(tok) {
                scope.tokenTypes = scope.tokens.map(function(e){return e.type});
              }, true);
        }
    };
})

.directive('riInputToken', function() {
    return {
        restrict : 'E',
        scope : {
            token : '=',
            types : '=',
        },
        templateUrl : 'module/action/input/token.html'
    };
})

.directive('riInputNeighbors', function() {
    return {
        restrict : 'E',
        scope : {
            selector : '=',
        },
        templateUrl : 'module/action/input/neighbors.html'
    };
})

;