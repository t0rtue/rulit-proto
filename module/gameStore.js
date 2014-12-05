/*
    Game Store
    A service to manage game storage.
    Load available games list from public Gists and from local storage.
    Load required game definition.
    Allow to save game on local storage.

*/
angular.module('ri.gameStore', ['ngResource'])

.factory('gameStore', ['$resource', '$q', function($resource, $q) {

    var gistStore = $resource('https://api.github.com/gists/:id');
    var localGames = [];

    function _gameID(name) {
        return "rulitGames-" + name;
    }

    var store = {

        games : [],
        // game  : {},

        /*
            Load games list into store.games from public (gist) and local storage
            Games list do not contains all games data but only game metadata (name, source)
        */
        loadGamesList : function(gamesGistID) {
            // Public from gist
            var gamesGist = gistStore.get({ id: gamesGistID }, function() {
                var publicGames = angular.fromJson( gamesGist.files['games.json'].content );
                angular.forEach(publicGames, function(v,k) {
                    store.games.push({name:k, source:'public', id:v});
                });
            });

            // Locals
            localGames = localStorage.rulitGames ? angular.fromJson(localStorage.rulitGames) : [];
            angular.forEach(localGames, function(g) {
                store.games.push({name:g.name, source:'local', id:1});
            });
        },

        /*
            Get a specific game by name
            Return a promise
        */
        get : function(name) {

            var deferred = $q.defer();

            var gameInfo = $.grep(
                                store.games,
                                function(g) {return g.name == name}
                            )[0];

            if(gameInfo) { // Existing game
                if (gameInfo.source == 'public') {
                    var gist = gistStore.get({ id: gameInfo.id }, function() {
                        game = angular.fromJson( gist.files['game-definition.json'].content );
                        deferred.resolve(game);
                    });
                } else {
                    game = angular.fromJson(localStorage[_gameID(gameInfo.name)]);
                    deferred.resolve(game);
                }
            } else { // New game
                // create game
            }

            return deferred.promise;
        },

        /*
            Save a game on localStorage
            If not existing game then store it and update games list and stored games index
        */
        save : function(name, game) {
            var gameID = _gameID(name);

            if (localStorage[gameID]) { // existing game
                localStorage[gameID] = angular.toJson(game);
            } else { // new game
                // Store the new game
                localStorage[gameID] = angular.toJson(game);

                // Update and store local games list
                localGames.push({name:name});
                localStorage.rulitGames = angular.toJson(localGames);

                // Update available games list
                store.games.push({name:name, source:'local'});
            }
        },

        /*
            Remove a game by name
            Update game list and stored games index
        */
        remove : function(name) {
            var gameID = _gameID(name);

            if (localStorage[gameID]) { // existing game
                // Remove from storage
                localStorage.removeItem(gameID);

                // Update and store local games list
                var idx = localGames.map(function(e) {return e.name}).indexOf(name);
                localGames.splice(idx, 1);
                localStorage.rulitGames = angular.toJson(localGames);

                // Update available games list
                idx = store.games.map(function(e) {return e.name}).indexOf(name);
                store.games.splice(idx, 1);
            }
        }

    };

    return store;
}])

;
