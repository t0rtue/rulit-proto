angular.module('ri.module.condition', [
    'ri.module.board' // for ri.board.selector.neighbor
])

.service('ri.conditions', function() {

})

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

;