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
            ],
            current : null,
            idx: 0,
        },
        turn : 1,
        currentPhaseIdx : 0,
        gameDesc : null,

        /*
            Pass to the next phase of the turn
            If it was the last phase then pass to the next turn and trigger the update
        */
        nextTurn : function() {

            /*
            Update properties values according to defined update transactions.
            Enabled for current player and for each tokens of a specific type.

                take    : *to* player
                give    : *from* player
                add     : *to* token
                remove  : *from* token
                transfer: *from* token *to* player || *from* player *to* token

             UPDATE DEFINITION SAMPLE
                {
                    'player' : [
                        {prop :'AP', quantity : '1', to : 'player'},
                        {prop :'food', quantity : '1', from : 'player'},
                    ],
                    'tokens' : {
                        'town' : [
                            {prop :'gold', quantity : '3', to : 'town'},
                            {prop :'metal', quantity : '5', from : 'town', to : 'player'},
                            {prop :'gold', quantity : 'income', to : 'player'},
                        ],
                        'knight' : [
                            {prop : 'motivation', quantity : '1', from : 'knight'},
                            {prop : 'AP', quantity : '1', to : 'knight'}
                        ]
                    }
                }
            */
            function update() {

                var updateDef = state.gameDesc.turnUpdate;

                function _getTokenProp(token, propName) {
                    return $.grep(token.properties, function(e) {return e.name == propName})[0];
                }

                function _updateTokenProp(token, name, value) {
                    var prop = _getTokenProp(token, name);
                    if (prop) {
                        prop.value = parseInt(prop.value) + value;
                    } else {
                        token.properties.push({name:name, value:value});
                    }
                }

                function _updatePlayerProp(player, name, value) {
                    player.properties[name] = player.properties[name] || 0;
                    player.properties[name] += value;
                }

                // UPDATE for tokens
                for (type in updateDef['tokens']) {
                    // List of properties to update for this token type
                    var propsUpdate = updateDef['tokens'][type];
                    // Tokens of the current type
                    var tokens = $.grep(state.players.current.tokens, function(t){return t.type == type});

                    for (i=0; i < tokens.length; i++) { // for each token of the current type
                        for (j=0; j < propsUpdate.length; j++) { // for each updated prop of the token
                            var quantity = parseInt(propsUpdate[j].quantity);
                            if (!quantity) { // Quantity is not a number, it is the name of property
                                var prop = _getTokenProp(tokens[i], propsUpdate[j].quantity);
                                quantity = (prop && parseInt(prop.value)) || 0;
                            }

                            // GET from
                            if (propsUpdate[j].from == 'player') {
                                _updatePlayerProp(state.players.current, propsUpdate[j].prop, -quantity);
                            } else if (propsUpdate[j].from == type) {
                                _updateTokenProp(tokens[i], propsUpdate[j].prop, -quantity);
                            }

                            // TODO only add quantity we can get (for transfer case)

                            // ADD to
                            if (propsUpdate[j].to == 'player') {
                                _updatePlayerProp(state.players.current, propsUpdate[j].prop, quantity);
                            } else if (propsUpdate[j].to == type) {
                                _updateTokenProp(tokens[i], propsUpdate[j].prop, quantity);
                            }

                        }
                    }
                }

                // UPDATE for player
                for (i=0; i < updateDef['player'].length; i++) {
                    var propUpdate = updateDef['player'][i];
                    var quantity = parseInt(propUpdate.quantity);
                    if (propUpdate.from == 'player') {
                        quantity = -quantity;
                    }
                    _updatePlayerProp(state.players.current, propUpdate.prop, quantity);
                }
            }

            // Next phase and next turn
            state.currentPhaseIdx++;
            state.currentPhaseIdx %= state.gameDesc.turnPhases.length;
            if (state.currentPhaseIdx == 0) {
                state.nextPlayer();
                if (state.players.idx == 0) {
                    state.turn++;
                }
                state.turnStart = 1;
                update();
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

        /*
            Reset state variables
            Setup players
        */
        init : function(gameDesc) {
            state.gameDesc = gameDesc;

            state.turn = 1;
            state.currentPhaseIdx = 0;

            // Player setup
            state.initPlayers(gameDesc);
            for (p in state.players.all) {
                var player = state.players.all[p];
                player.lose = player.win = false;
                // Init player properties
                player.properties = {};
                for (p in gameDesc.init.playerProps) {
                    var prop = gameDesc.init.playerProps[p];
                    player.properties[prop.name] = parseInt(prop.value);
                }
                player.tokens = [];
            }
            state.players.idx = 0;
            state.players.current = state.players.all[0];
        },
        initPlayers : function(gameDesc) {
            var players = state.players.all;
            if (players.length > gameDesc.maxPlayer) {
                players.splice(gameDesc.maxPlayer, players.length - gameDesc.maxPlayer);
            } else {
                for (var i = players.length; i < gameDesc.minPlayer; i++) {
                    state.addPlayer(gameDesc);
                }
            }
        },
        addPlayer : function(gameDesc) {
            state.players.all.push({
                name : 'Player' + (state.players.all.length+1),
                color : gameDesc.theme.players[state.players.all.length].color,
                properties : {}
            });
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

    /* Build tile view table
        type => view
        sample : {
            'forest' : {color:'green'},
            'field'  : {color:'red'}
        }
    */
    this.tileView = (function() {
        var view = {};
        $.each(game.tiles, function(i,t) {view[t.type] = {color:t.color}});
        return view;
    })();

    this.message = "Select an action";

    function setProp(elems, attr, value) {
        elems = elems || [];
        for (i=0;i<elems.length;i++) {
            elems[i][attr] = value;
        }
    }

    this.initActionsState = function() {
        var phaseIdx = gameState.currentPhaseIdx;
        var phaseActions = game.turnPhases[phaseIdx] && game.turnPhases[phaseIdx].actions;
        // Trick to unselect actions due to save/load selected state (TODO clean)
        for (a in phaseActions) {
            phaseActions[a].selected = false;
        }
        // Auto select the first action if only one action
        phaseActions && (phaseActions.length==1) && this.selectAction(phaseActions[0]);
        // Disable unpayable actions
        this.updateActionsState();
    }

    function getBoardElems(type) {
        var elems = [];
        var typeGrid = grid.maps[type];
        for (u in typeGrid) {
            for (v in typeGrid[u]) {
                for (a in typeGrid[u][v]) {
                    elems.push(typeGrid[u][v][a]);
                }
            }
        }
        return elems;
    }


    /* Setup board

        Randomly put tiles and tokens on the game grid
        According to <init.boardTiles> and <init.boardTokens>

        boardTiles sample :  [
            {
                type : 'forest',
                quantity : 100
            },
            {
                type : 'field',
                quantity : 10
            },
        ];
    */
    this.setupBoard = function() {

        var draw = {
            content : null,
            total : 0,
            init : function(setup) {
                this.content = angular.copy(setup);
                this.total = 0;
                for (d in this.content) {
                    var group = this.content[d];
                    group.quantity = parseInt(group.quantity)
                    this.total += group.quantity;
                }
            },
            /*
            Get a random type from the draw
            */
            pickup : function() {
                var r = Math.floor(Math.random() * this.total)
                var thresh = 0;
                for (var d in this.content) {
                    var def = this.content[d];
                    thresh += def.quantity;
                    if (r < thresh) {
                        def.quantity--;
                        this.total--;
                        return def.type;
                    }
                }
                return null;
            }
        }

        // Get board tiles
        var tiles = getBoardElems('tile');
        // Shuffle tiles
        function shuffle(o){
            for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        }
        shuffle(tiles);

        // TILES init
        draw.init(game.init.boardTiles);
        // Randomly set the tile type
        for (t in tiles) {
            tiles[t].type = draw.pickup();
        }

        // TOKENS init
        draw.init(game.init.boardTokens);
        // Randomly set token on tile
        for (t in tiles) {
            var type = draw.pickup();
            if (!type) { break; }
            var model = this.getTokenDefinition(type);
            var token = angular.copy(model);
            tiles[t].token = token;
        }

    }

    this.startGame = function() {
        gameState.init(game);
        this.setupBoard();
        this.initActionsState();
    }

    this.nextTurn = function() {

        this.cancelAction();

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

    function computeValue(elem, input) {
        return parseInt(input)
                ? input
                : getPropertyValue(elem.token, input);
    }

    function elemSelector(elemType, conditions, context) {

        function _computeParams(params) {
            if (params.mode == 'context') {
                return {
                    type : context['type'],
                    elems: [context[params.name]]
                }
            }
            // else mode 'selection'
            return {
                type  : params.type,
                elems : elemSelector(params.type, params.conditions, context)
            }
        }

        var elemGetters = {
            type : function(params) {
                var elems = getBoardElems(elemType);
                elems = $.grep(
                    elems,
                    function(e) {
                        return !params || match(e, params);
                    }
                );
                return elems;
            },
            token : function(params) {
                var elems = getBoardElems(elemType);
                elems = $.grep(
                    elems,
                    function(e) {
                        return !params || match(e.token, params);
                    }
                );
                return elems;
            },
            area : function(params) {
                var elems = [];
                var dist = parseInt(params.dist) || 1;
                var neighbors = _computeParams(params.neighbor);

                for (n in neighbors.elems) {
                    var selec = neighborSelector.getDistNeighbors(
                        grid,
                        neighbors.elems[n],
                        neighbors.type,
                        elemType,
                        dist, // dist,
                        null,
                        params.path_conditions || {}
                    );

                    // Find the way to don't have duplicate entry
                    // elems = elems.concat(selec);
                    $.merge(elems, selec);
                }
                return elems;
            },
            lines : function(params) {
                var elems = [];
                var dist = parseInt(params.dist) || 10;
                var neighbors = _computeParams(params.neighbor);
                for (n in neighbors.elems) {
                    var lines = neighborSelector.getLines(
                        grid,
                        neighbors.elems[n],
                        neighbors.type,
                        dist,
                        params.path_conditions || {},
                        params.lines
                    );
                    for (l in lines) {
                        $.merge(elems, lines[l]);
                    }
                }
                return elems;
            },
            context : function(params) {
                return [context[params.name]];
            },
            // coordinates // relative or not. exemple : move of the knight in Chess
        }

        var allElems = getBoardElems(elemType);
        var selection = (conditions  && conditions.length) ? null : allElems;
        for (c in conditions) {
            var cond = conditions[c];
            var selectedElems = elemGetters[cond.type](cond.params);

            if (cond.not) {
                selectedElems = $(allElems).not(selectedElems).get();
            }

            if (selection) {
                switch (cond.operator) {
                    default:
                    case 'and': // AND conditions => keep elements that match both
                        selection = $(selection).filter(selectedElems);
                        break;
                    case 'or': // OR => keep all selected elements
                        $.merge(selection, selectedElems);
                        break;
                    case 'xor': // XOR => keep all - match both
                        var matchBoth = $(selection).filter(selectedElems);
                        var all = $.merge(selection, selectedElems);
                        selection = $(all).not(matchBoth).get();
                        break;
                }
            } else {
                selection = selectedElems;
            }
        }
        return selection;
    }

    // Elem selector testing
    this.highlightElems = function(elemType, conditions) {
        var elems = elemSelector(elemType, conditions, {'selected' : this.selectedElem});
        this.highlight(elems);
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
        var phaseActions = game.turnPhases[gameState.currentPhaseIdx] && game.turnPhases[gameState.currentPhaseIdx].actions;
        for (a in phaseActions) {
            var action = phaseActions[a];
            action.payable = true;
            for (t in action.cost) {
                var transac = action.cost[t];
                if (transac.source == "player") {
                    if ( !player().properties[transac.property] || (player().properties[transac.property] < transac.quantity)) {
                        transac.over = true;
                        action.payable = false;
                        action.selected && this.cancelAction();
                    } else {
                        transac.over = false;
                    }
                } else if (transac.source == "token") {
                    action.payable = false;
                    if (this.selectedElem && this.selectedElem.token) {
                        var prop = $.grep(this.selectedElem.token.properties, function(e) {return e.name == transac.property})[0];
                        if (prop && prop.value >= transac.quantity) {
                            action.payable = true;
                        }
                    }
                    !action.payable && action.selected && this.cancelAction();
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

    this.cancelAction = function(msg) {
        actions.cancel();
        this.highlightReset();
        msg && this.setMessage(msg);
    }

    this.getTokenDefinition = function(type) {
        return $.grep(
                    this.tokens.all,
                    function(e) {return type == e.type}
                )[0];
    }

    this.highlight = function(elems) {
        this.highlighting = true;
        setProp(this.highlighted, 'highlight', false);
        this.highlighted = elems;
        setProp(this.highlighted, 'highlight', true);
    }
    this.highlightReset = function() {
        this.highlighting = false;
        setProp(this.highlighted, 'highlight', false);
        this.highlighted = undefined;
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

        // Add a token to the tokens list of current player
        function addToken(token) {
            player().tokens = player().tokens || [];
            player().tokens.push(token);
        }

        this.setMessage("");

        // TODO put this (resolve action) in actions service
        var action = actions.current;
        if (action) {

            if (action.type == "put") {

                if (!elem.token && elem.highlight) {

                        var model = this.getTokenDefinition(action.token.type);
                        elem.token = angular.copy(model);
                        elem.token.player = {
                            name : player().name,
                            color: player().color
                        };
                        //elem.token.view = model.view;

                        addToken(elem.token);

                        this.selectElem(elem, type);
                        this.manageEnd();
                        this.selectAction(action);

                } else {
                    // this.cancelAction("Action not possible on this tile");
                    this.selectElem(elem, type);
                }
            }

            if (action.type == "move") {
                if (elem.token) {
                    if ((elem.token.player && elem.token.player.name == player().name) && match(elem.token, action.token)) {

                        var targets = elemSelector(action.dest.type, action.dest.conditions, {current : elem, type: type});

                        this.highlight(targets);
                        this.setMessage("Select destination");
                    } else {
                        this.cancelAction("Action not possible with the selected token");
                    }
                    this.selectElem(elem, type);
                } else if (elem.highlight && this.selectedElem && this.selectedElem.token) {
                    elem.token = this.selectedElem.token;
                    this.selectedElem.token = null;
                    this.selectElem(elem, type);
                    this.highlightReset();
                    this.manageEnd();
                    this.selectAction(action);
                }
            }

            if (action.type == "interact") {
                if (elem.token) {
                    if (match(elem.token, action.token)) {

                        var targets = elemSelector(action.target.type, action.target.conditions, {current : elem, type: type});
                        targets = $.grep(
                            targets,
                            function(e) {return match(e.token, action.target.token)}
                        );
                        this.highlight(targets);
                    } else {
                        this.cancelAction("Action not possible with the selected token");
                    }
                    this.selectElem(elem, type);
                } else if (elem.highlight && this.selectedElem && this.selectedElem.token) {
                    // elem.token = this.selectedElem.token;
                    // this.selectedElem.token = null;
                    // this.selectElem(elem, type);
                    this.highlightReset();
                }
            }

        } else {
            this.selectElem(elem, type);
        }

        this.updateActionsState();

    }

    this.overBoardElem = function(elem) {
        this.overedElem && (this.overedElem.overed = false);
        this.overedElem = elem;
        this.overedElem.overed = true;
    }

    this.onClickAction = function(action) {
        if (actions.current && (actions.current.name==action.name)) {
            this.cancelAction();
        } else {
            this.selectAction(action);
        }
    }

    this.selectAction = function(action) {

        if (!action.payable) {
            this.message = "Not enough resources for this action";
            return;
        }

        actions.select(action);

        switch (action.type) {
            case "get":
                if (action.property) {
                    player().properties || (player().properties = {});
                    var props = player().properties;
                    props[action.property.name] || (props[action.property.name] = 0);
                    props[action.property.name] += action.quantity;
                    this.manageEnd();
                }
                break;
            case "put":
                this.setMessage("=> Select a " + action.dest.type);

                var targets = elemSelector(action.dest.type, action.dest.conditions);
                this.highlight(targets);
                break;
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
        gameState.addPlayer(game);
    }

    this.init = function() {
        gameState.initPlayers(game);
    }

    this.init();

}])
;