angular.module('ri.module.game', ['ri.module.tokens', 'ri.module.action', 'ri.module.board'])

.service('ri.game',[ 'ri.tokens', function(tokens) {
    return {
        tokens : tokens
    };
}])

.value('match', function match(entity, attrCond) {
    if (!entity || !attrCond) return false;
    var match = attrCond.type && (attrCond.type == entity.type);
    for (c in attrCond.properties) {
        match = match && (entity.properties[c] == attrCond.properties[c]);
    }
    return match;
})

.filter('tokenActions', ['match', function(match) {
    return function(actions, token) {
        res = [];
        for (var i = 0; i < actions.length; ++i) {
            if (actions[i].type == 'move' && match(token, actions[i].token)) {
                res.push(actions[i]);
            }
        }
        return res;
    }
}])

.directive('riTokenWindow', function() {
    return {
        restrict : 'E',
        scope : {
            'token' : '='
        },
        //templateUrl : 'piece-view.html'
        templateUrl : 'partials/gamewindow/token.html'
    };
})

.controller(
    'ri.game.controller',
    ['$injector', '$timeout', 'ri.actions', 'ri.board.selector.neighbor' ,'match', 'ri.game',
    function($injector, $timeout, actions, neighborSelector, match, game) {

    this.theme = {
        background : '#002'
    };

    // Dynamic dependency injection...
    // TODO better and configurable
    var grid;
    this.gridType = 'hexa';
    this.gridSize = 10;
    this.reloadGrid = function(type, size) {
        // if (grid) delete grid;
        grid = $injector.get('ri.grid.' + type);
        grid.init(size);
        this.board = grid.maps;
    };

    this.reloadGrid(this.gridType, this.gridSize);

    this.tokens = game.tokens;

    this.actions = actions;
    this.selectedElem = null;


    this.player = {
        properties : {
            'gold' : 0,
            'victory point' : 0,
        }
    };

    this.propertyView = {
        'gold' : {
            layers: [{size:0.6, width:12, shape:'square'}]
        },
        'victory point' : {
            layers: [{size:0.4, width:12, shape:'circle'}]
        }
    };

    this.turn = 1;
    this.turnPhases = [
        {name:'deployment', actions:[actions.all[0], actions.all[1], actions.all[2]]},
        {name:'income', actions:[actions.all[3]]}
    ];
    this.currentPhaseIdx = 0;
    this.pouet = 0;

    this.message = "Select an action";

    function setProp(elems, attr, value) {
        for (e in elems) {
            elems[e][attr] = value;
        }
    }

    this.nextTurn = function() {

        actions.cancel();
        this.currentPhaseIdx++;
        this.currentPhaseIdx %= this.turnPhases.length;
        this.turn += (this.currentPhaseIdx == 0);
        this.phaseStart = 1;
        var that = this;
        $timeout(function() {
            that.phaseStart=0;
        }, 1000);

         // $( "#phase-info" ).fadeIn( "slow", function() {
         //    // Animation complete.
         //    });
    }

    this.selectElem = function(elem, type) {
        this.selectedElem && (this.selectedElem.selected = false);
        this.selectedElem = elem;
        this.selectedElemType = type;
        this.selectedElem.selected = true;
    }

    function selection(elem, type, selector) {
        var dist = parseInt(selector.dist)
                   ? selector.dist
                   : elem.token.properties[selector.dist];

        var elems = neighborSelector.getDistNeighbors(
                            grid,
                            elem,
                            type,
                            selector.type,
                            dist
                        );

        return elems;
    }

    this.setMessage = function(msg) {
        this.message = msg;
    }

    this.selectBoardElem = function(elem, type) {


        function _getToken(type, tokens) {
            for (t in tokens.all) {
                if (tokens.all[t].type == type) {
                    return tokens.all[t];
                }
            }
            console.log("No token of type '" + type + "'");
        }

        this.setMessage("");

        // TODO put this (resolve action) in actions service
        var action = actions.current;
        if (action) {

            if (action.type == "put") {
                if (!elem.token) {
                    if (type == action.dest.type) {

                        var model = $.grep(
                            this.tokens.all,
                            function(e) {return action.token.type == e.type}
                        )[0];

                        elem.token = angular.copy(model);
                        //elem.token.view = model.view;

                        this.selectElem(elem, type);
                    }
                } else {
                    this.selectElem(elem, type);
                }
            }

            if (action.type == "move") {
                if (elem.token) {
                    if (match(elem.token, action.token)) {
                        setProp(this.targets, 'highlight', false);
                        this.targets = selection(elem, type, action.dest);
                        setProp(this.targets, 'highlight', true);
                        this.setMessage("Select destination");
                    } else {
                        setProp(this.targets, 'highlight', false);
                        actions.cancel();
                        this.message = "Action not possible with the selected token";
                    }
                    this.selectElem(elem, type);
                } else if (elem.highlight && this.selectedElem && this.selectedElem.token) {
                    elem.token = this.selectedElem.token;
                    this.selectedElem.token = null;
                    this.selectElem(elem, type);
                    setProp(this.targets, 'highlight', false);
                }
            }

            if (action.type == "interact") {
                if (elem.token) {
                    if (match(elem.token, action.token)) {
                        setProp(this.targets, 'highlight', false);
                        var targets = selection(elem, type, action.target.area);
                        this.targets = $.grep(
                            targets,
                            function(e) {return match(e.token, action.target)}
                        );
                        setProp(this.targets, 'highlight', true);
                    } else {
                        setProp(this.targets, 'highlight', false);
                        actions.cancel();
                        this.message = "Action not possible with the selected token";
                    }
                    this.selectElem(elem, type);
                } else if (elem.highlight && this.selectedElem && this.selectedElem.token) {
                    // elem.token = this.selectedElem.token;
                    // this.selectedElem.token = null;
                    // this.selectElem(elem, type);
                    setProp(this.targets, 'highlight', false);
                }
            }

        } else {
            this.selectElem(elem, type);
        }

    }

    this.overBoardElem = function(elem) {
        this.overedElem && (this.overedElem.overed = false);
        this.overedElem = elem;
        this.overedElem.overed = true;
    }

    this.selectAction = function(action) {
        actions.select(action);

        if (action.type == "get") {
            if (action.property) {
                var props = this.player.properties;
                props[action.property.name] || (props[action.property.name] = 0);
                props[action.property.name] += action.quantity;
            }
        }

        if (this.selectedElem) {
            this.selectBoardElem(this.selectedElem, this.selectedElemType);
        }

    }

    this.freeAction = function(type, token) {
        actions.freeAction();
        actions.current.type = type;
        actions.current.token = token;
    }

    this.addToken = function(type) {
        this.tokens.all.push({
            'type' : type,
            'view':{
                    layers:[{size:0.5}],
                    kernel:{}
                }
        });
    }

    this.tokenTypes = function() {
        // return this.tokens.all.map(function(e){return e.type});
        return ['toto','pawn'];
    }

}])

;