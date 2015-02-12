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

// It looks like a factory not a service. TODO clarify
.service('ri.game.state', function() {

    var state = {
        players : {
            all : [
                {
                    name:'Player1',
                    color:'green',
                    properties : {},
                    // properties : {
                    //     'gold' : 0,
                    //     'victory point' : 0,
                    // }
                }
            ],
            current : null,
            idx: 0,
        },
        turn : 1,
        currentPhaseIdx : 0,

        nextTurn : function() {
            state.currentPhaseIdx++;
            state.currentPhaseIdx %= state.gameDesc.turnPhases.length;
            if (state.currentPhaseIdx == 0) {
                state.nextPlayer();
                if (state.players.idx == 0) {
                    state.turn++;
                }
                state.turnStart = 1;
            }
            state.phaseStart = 1;
        },

        nextPlayer : function() {
            state.players.idx++;
            state.players.idx %= state.players.all.length;
            var currentPlayer= state.players.all[state.players.idx];
            if (currentPlayer.lose) {
                state.nextPlayer();
            } else {
                state.players.current = currentPlayer;
            }
        },

        init : function(gameDesc) {
            state.gameDesc = gameDesc;

            state.turn = 1;
            state.currentPhaseIdx = 0;

            for (p in state.players.all) {
                var player = state.players.all[p];
                player.lose = player.win = false;
                // Init player properties
                player.properties = {};
                for (p in gameDesc.init.playerProps) {
                    var prop = gameDesc.init.playerProps[p];
                    player.properties[prop.name] = prop.value;
                }
            }
            state.players.idx = 0;
            state.players.current = state.players.all[0];
        }
    }

    return state;
})

.controller(
    'ri.game.controller',
    ['$timeout', '$stateParams', 'ri.actions', 'ri.condition', 'ri.board.selector.neighbor' ,'match', 'riGame', 'riGrid', 'ri.game.state',
    function($timeout, $stateParams, actions, condition, neighborSelector, match, game, grid, gameState) {

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

    this.message = "Select an action";

    function setProp(elems, attr, value) {
        for (e in elems) {
            elems[e][attr] = value;
        }
    }

    this.initActionsState = function() {
        var phaseIdx = gameState.currentPhaseIdx;
        var phaseActions = game.turnPhases[phaseIdx] && game.turnPhases[phaseIdx].actions;
        // Trick to unselect actions due to save/load selected state (TODO clean)
        for (a in phaseActions) {
            phaseActions[a].selected = false;
        }
        // Auto select the first action
        phaseActions && actions.select(phaseActions[0]);
        // Disable unpayable actions
        this.updateActionsState();
    }

    this.startGame = function() {
        gameState.init(game);
        this.initActionsState();
    }

    this.nextTurn = function() {

        actions.cancel();
        setProp(this.targets, 'highlight', false);

        gameState.nextTurn();

        $timeout(function() {
            gameState.phaseStart=0;
            gameState.turnStart=0;
        }, 1000);

        this.initActionsState();

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


    // Is the player win or lose
    // Return true if player over
    this.updatePlayerState = function() {
        // TODO service GameState
        var _gameState = {
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
                res[type] = res[type] || condition.eval(cond, _gameState);
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

    /*
        Deactivate not payable actions
    */
    this.updateActionsState = function() {
        // Disable action if cost > player resources
        var phaseActions = game.turnPhases[gameState.currentPhaseIdx].actions;
        for (a in phaseActions) {
            var action = phaseActions[a];
            action.payable = true;
            for (t in action.cost) {
                var transac = action.cost[t];
                if (transac.source == "player") {
                    if ( !player().properties[transac.property] || (player().properties[transac.property] < transac.quantity)) {
                        transac.over = true;
                        action.payable = false;
                        action.selected && actions.cancel();
                    } else {
                        transac.over = false;
                    }
                }
            }
        }
    }

    /*
        Check and manage current player state.
        Is the player over ?
        Is the player turn finished ?
    */
    this.manageEnd = function() {

        // Decrease resources according to played action cost
        for (t in actions.current.cost) {
            var transac = actions.current.cost[t];

            if (transac.source == "player") {
                // Player level
                player().properties[transac.property] ?
                    player().properties[transac.property]-= transac.quantity :
                    player().properties[transac.property] = -transac.quantity;
            } else {
                // Selected token level
                this.selectedElem.token.properties || (this.selectedElem.token.properties = []);
                var prop = $.grep(this.selectedElem.token.properties, function(e) {return e.name == transac.property})[0];
                if (prop) {
                    prop.value -= transac.quantity;
                } else {
                    this.selectedElem.token.properties.push({name:transac.property, value:-transac.quantity});
                }
            }
        }

        // Deactivate not more payable actions
        this.updateActionsState();

        // Manage end game
        this.playerOver = this.updatePlayerState();

        if (!this.playerOver) {
            // Auto next phase if player can not play
            if (this.checkEndPhase(gameState.currentPhaseIdx)) {
                this.nextTurn();
            }
        }
    }

    /*
        Manage the next step after a player is over (win or lose)
        Either the game continue (no winner and still players)
        or game over (a player win)
    */
    this.continueGame = function() {
        this.playerOver = false;
        var inGamePlayers = $.grep(
                                gameState.players.all,
                                function(e) {return (!e.lose && !e.win)}
                            );

        this.gameOver = (player().win || inGamePlayers.length < 2);
        if (!this.gameOver) {
            this.nextTurn();
        } else {
            // Set the win state of remaining players
            for (i in inGamePlayers) {
                inGamePlayers[i].win = !player().win;
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

        if (!action.payable) {
            this.message = "Not enough resources for this action";
            return;
        }

        actions.select(action);

        if (action.type == "get") {
            if (action.property) {
                player().properties || (player().properties = {});
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

    /*
        Start game
    */
    this.startGame();

}])

.controller(
    'ri.gameMenu.controller',
    ['$stateParams', 'riGame', 'ri.game.state', function($stateParams, game, gameState) {

    this.name = $stateParams.name;
    this.game = game;
    // this.state = gameState;
    var players = gameState.players.all;
    this.players = players;

    this.addPlayer = function() {
        players.push({
            name : 'Player' + (players.length+1),
            color: ['green', 'yellow', 'blue', 'red', 'pink', 'white', 'black'][players.length],
            properties : {}
        });
    }

    this.init = function() {
        if (players.length > game.maxPlayer) {
            players.splice(game.maxPlayer, players.length - game.maxPlayer);
        } else {
            for (var i = players.length; i < game.minPlayer; i++) {
                this.addPlayer();
            }
        }
    }

    this.init();

}])
;