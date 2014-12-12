angular.module('ri.module.game', ['ri.module.action', 'ri.module.board', 'ri.module.condition'])

.value('match', function match(entity, attrCond) {
    if (!entity) return false;
    if (!attrCond) return true;
    var match = attrCond.type && (attrCond.type == entity.type);
    // for (c in attrCond.properties) {
    //     match = match && (entity.properties[c] == attrCond.properties[c]);
    // }
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
            'elem' : '='
        },
        templateUrl : 'module/game/partials/token.html'
    };
})

.service('ri.game.state', function() {

    var state = {
        players : {
            all : [
                {
                    name:'Tortue',
                    color:'green',
                    properties : {
                        'gold' : 0,
                        'victory point' : 0,
                    }
                }, {
                    name:'Player2',
                    color:'yellow',
                }
            ],
            current : null,
            idx: 0,
        },
        nextPlayer : function() {
            state.players.idx++;
            state.players.idx %= state.players.all.length;
            state.players.current = state.players.all[state.players.idx];
        }
    }

    state.players.current = state.players.all[0];

    return state;
})

.controller(
    'ri.game.controller',
    ['$injector', '$timeout', '$stateParams', 'ri.actions', 'ri.board.selector.neighbor' ,'match', 'riGame', 'riGrid', 'ri.game.state',
    function($injector, $timeout, $stateParams, actions, neighborSelector, match, game, grid, gameState) {

    this.name = $stateParams.name;

    // this.def = game;
    this.state = gameState;

    this.tokens     = game.tokens;
    this.turnPhases = game.turnPhases;
    this.theme      = game.theme;

    this.board = grid.maps;

    this.actions = actions;
    this.selectedElem = null;

    this.players = gameState.players;

    this.propertyView = {
        'gold' : {
            layers: [{size:0.6, width:12, shape:'square'}]
        },
        'victory point' : {
            layers: [{size:0.4, width:12, shape:'circle'}]
        }
    };

    this.turn = 1;
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
        setProp(this.targets, 'highlight', false);
        this.currentPhaseIdx++;
        this.currentPhaseIdx %= this.turnPhases.length;
        if (this.currentPhaseIdx == 0) {
            this.state.nextPlayer();
            if (this.state.players.idx == 0) {
                this.turn++;
            }
            this.turnStart = 1;
        }
        this.phaseStart = 1;
        var that = this;
        $timeout(function() {
            that.phaseStart=0;
            that.turnStart=0;
        }, 1000);

        // Auto select the first action
        var phaseActions = game.turnPhases[this.currentPhaseIdx].actions;
        phaseActions && actions.select(phaseActions[0]);

        this.selectElem(null,null);
    }

    this.selectElem = function(elem, type) {
        this.selectedElem && (this.selectedElem.selected = false);
        this.selectedElem = elem;
        this.selectedElemType = type;
        elem && (this.selectedElem.selected = true);
    }

    function getPropertyValue(elem, propname) {
        var prop = $.grep(
                        elem.properties,
                        function(e) {return propname == e.name}
                        )[0];
        return prop ? prop.value : undefined;
    }

    // TODO move in board selector
    function selection(elem, type, selector) {
        var dist = parseInt(selector.dist)
                   ? selector.dist
                   : getPropertyValue(elem.token, selector.dist);

        selector.conditions = selector.conditions || {};

        var elems = [];

        if (selector.mode == 1) {
            // ALIGNED NEIGHBORS
            var lines = neighborSelector.getLines(
                            grid,
                            elem,
                            type,
                            dist,
                            selector.conditions,
                            selector.lines
                        );

            for (l in lines) {
                elems = elems.concat(lines[l]);
            }
        } else {
            // AREA NEIGHBORS
            elems = neighborSelector.getDistNeighbors(
                        grid,
                        elem,
                        type,
                        selector.type,
                        dist,
                        null,
                        selector.conditions
                    );
        }

        return elems;
    }

    function player() {
        return gameState.players.current;
    }
    this.player = player;


    this.checkEndGame = function() {
        // TODO service GameState
        var gameState = {
            grid : grid,
            player : player(),
            turn: this.turn,
            selectedElem: this.selectedElem,
            selectedElemType : this.selectedElemType
        };

        var res = {};
        for (type in {'win':1,'lose':1}) {
            for (c in game.goal[type]) {
                var cond = game.goal[type][c];
                var checker = $injector.get('ri.condition.'+cond.type);

                res[type] = res[type] || checker.eval(cond, gameState);
            }
            player()[type] = res[type];
        }

        player().lose = player().lose && !player().win;

        return res.win || res.lose;
    }

    this.checkEndPhase = function(idx) {
        if (game.turnPhases[idx].limit == 1) {
            return true;
        }
        return false;
    }

    this.manageEnd = function() {
        // Manage end game
        this.gameover = this.checkEndGame();

        if (!this.gameover) {
            // Auto next phase if player can not play
            if (this.checkEndPhase(this.currentPhaseIdx)) {
                this.nextTurn();
            }
        }
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
                        elem.token.player = player();
                        //elem.token.view = model.view;

                        this.selectElem(elem, type);
                        this.manageEnd();
                    }
                } else {
                    this.selectElem(elem, type);
                }
            }

            if (action.type == "move") {
                if (elem.token) {
                    if ((elem.token.player.name == player().name) && match(elem.token, action.token)) {
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
                    this.manageEnd();
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
                var props = player().properties;
                props[action.property.name] || (props[action.property.name] = 0);
                props[action.property.name] += action.quantity;
                this.manageEnd();
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

.controller(
    'ri.gameMenu.controller',
    ['$stateParams', 'riGame', 'ri.game.state',
    function($stateParams, game, gameState) {

    this.name = $stateParams.name;
    this.game = game;
    // this.state = gameState;
    this.players = gameState.players.all;
}])
;