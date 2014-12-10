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

            if (!gamestate.selectedElem) return false;


            var lines = neighborSelector.getLines(
                gamestate.grid,
                gamestate.selectedElem,
                gamestate.selectedElemType,
                cond.quantity - 1,
                {token:true},
                ['row','col','diag']
            );

            for (l in lines) {

                if (lines[l].length >= cond.quantity-1) {
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