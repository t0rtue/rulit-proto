angular.module('ri.module.action', [])

.service('ri.actions', function() {
    /*
        TODO
        list of allowed dest. e.g tile and corner
    */
    var actions = {
        // free : {type:'free', dest : {type:'tile'}}
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
                scope.tokenTypes = tok.map(function(e){return e.type});
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