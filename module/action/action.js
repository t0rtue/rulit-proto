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
            'tokens' : '=',
            'tiles'  : '='
        },
        templateUrl : 'module/action/action.edit.html',
        link: function (scope, element) {
            scope.$watch('tokens', function(tok) {
                scope.tokenTypes = tok.map(function(e){return e.type});
                scope.tokenByType = {};
                for (t in tok) {scope.tokenByType[tok[t].type] = tok[t]};

            }, true);
            scope.$watch('tiles', function(tok) {
                scope.tileTypes = tok.map(function(e){return e.type});
                scope.tileByType = {};
                for (t in tok) {scope.tileByType[tok[t].type] = tok[t]};
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
            typeMap : '='
        },
        templateUrl : 'module/action/input/token.html'
    };
})

.directive('riInputNeighbors', function() {
    return {
        restrict : 'E',
        scope : {
            selector : '=',
            filter : '=',
            tileTypes : '='
        },
        templateUrl : 'module/action/input/neighbors.html'
    };
})

.directive('riInputElemSelector', function() {
    return {
        restrict : 'E',
        scope : {
            selector : '=',
            tileTypes : '=',
            tileTypeMap : '=',
            tokenTypes : '=',
            context : '='
        },
        templateUrl : 'module/action/input/elemSelector.html'
    };
})

// .directive('riSelectorCondition', function() {
//     return {
//         restrict : 'E',
//         scope : {
//         },
//         templateUrl : function(e,a) {
//             return 'module/action/input/condition/' + a.type + '.html';
//         }
//     };
// })

;