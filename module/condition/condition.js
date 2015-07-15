/*
    Enable to check a particular game state (property value, board configuration, ...)
    Each specific condition is a service with an eval() method returning a boolean.
*/
angular.module('ri.module.condition', [
    'ri.module.board' // for ri.board.selector.neighbor
])

// Entry point to eval a particular condition
.service('ri.condition', ['$injector', function($injector) {
    return {
        eval : function(cond, gamestate) {
            var checker = $injector.get('ri.condition.' + cond.type);
            return checker.eval(cond, gamestate);
        }
    }
}])

/*
    Specfic conditions
*/

.service('ri.condition.owning', function() {
    return {
        eval : function(cond, gamestate) {
            if (gamestate.player.properties[cond.propertyName] >= cond.quantity) {
                return true;
            }
            return false;
        }
    }
})

.service('ri.condition.alignment', ['ri.board.selector.neighbor', function(neighborSelector) {
    return {
        eval : function(cond, gamestate) {

            if (!gamestate.selectedElem || gamestate.selectedElem.token.type != cond.token.type) {
                return false;
            }

            var lines = neighborSelector.getLines(
                gamestate.grid,
                gamestate.selectedElem,
                gamestate.selectedElemType,
                cond.quantity,
                {
                    token : cond.token
                },
                ['row','col','diag']
            );

            var evaluators = {
                'eq'   : function(n,v) {return n == v},
                'gteq' : function(n,v) {return n >= v},
                'lteq' : function(n,v) {return n <= v},
                'gt'   : function(n,v) {return n > v},
                'lt'   : function(n,v) {return n < v},
            }

            cond.operator = cond.operator || 'eq';

            for (l in lines) {
                if (evaluators[cond.operator]( lines[l].length, cond.quantity-1)) {
                    // TODO move in a controller, it's not the job of the condition to highlight elements
                    gamestate.selectedElem.highlight = true;
                    for (e in lines[l]) {
                        lines[l][e]['highlight'] = true;
                    }
                    return true;
                }
            }

            return false;
        }
    }
}])

/*
    Blocked conditon, i.e player can not play.

    To detect blocked state we just check if the player pass his turn
    without having done any action.

    A other more complicated way to check blocked will be to check the feasibility of each action.

*/
.service('ri.condition.blocked', function() {
    return {
        eval : function(cond, gamestate) {
            return !gamestate.player.actionCount;
        }
    }
})

// Condition view with a switch allowing edition
.directive('riCondition', function () {
    return {
        restrict : 'E',
        scope : {
            'condition' : '=',
            'tokens'    : '=',
            'editMode'  : '@'
        },
        template : '<ng-include src="\'module/condition/partials/\' + condition.type + \'.html\'" />'
    }
});

;