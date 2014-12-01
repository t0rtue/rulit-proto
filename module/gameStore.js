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

    var store = {

        games : [],
        // game  : {},

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
                    game = angular.fromJson(localStorage["rulitGames-"+gameInfo.name]);
                    deferred.resolve(game);
                }
            } else { // New game
                // create game
            }

            return deferred.promise;
        },

        save : function(name, game) {
            var gameID = "rulitGames-"+name;

            if (localStorage[gameID]) { // existing game
                localStorage[gameID] = angular.toJson(game);
            } else { // new game
                // Store the new game
                localStorage["rulitGames-"+name] = angular.toJson(game);

                // Update and store local games list
                localGames.push({name:name});
                localStorage.rulitGames = angular.toJson(localGames);

                // Update available games list
                store.games.push({name:name, source:'local'});
            }
        }

    };

    return store;
}])

;
