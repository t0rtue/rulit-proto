angular.module('rulit', ['ui.bootstrap', 'ri.module.rulebook', 'ri.module.token', 'ri.module.board', 'ri.module.game'])

.controller('rulit.controller', function() {
    this.layout = {
        mode : 2
    };

    this.bootstrapTheme='standard';
})

;