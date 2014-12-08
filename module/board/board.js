/*
    Grids services, ri.board directive, neighbors selector
*/
angular.module('ri.module.board', [])


.service('ri.grid.square', function() {
    var maps = {
        'tile'   : {},
        'corner' : {},
        'border' : {}
    };

    maps.shape = 'square';

    function init(size) {
        maps.tile = {};
        maps.corner = {};
        maps.border = {};

        // Create grids (tiles, corners and borders)
        for (var u=0; u<size; u++) {
            maps['tile'][u] = {};
            maps['corner'][u] = {};
            maps['border'][u] = {};
            for (var v=0; v<size; v++) {
                maps['tile'][u][v] = {
                    'X' : {u:u, v:v}
                };
                maps['corner'][u][v] = {
                    'X' : {u:u, v:v}
                };
                maps['border'][u][v] = {
                    'W' : {u:u, v:v, side:'W'},
                    'N' : {u:u, v:v, side:'N'}
                }
            }
        }
        // South border
        for (var u=0; u<size; u++) {
            maps['corner'][u][size] = { 'X' : {u:u, v:size} };
            maps['border'][u][size] = {
                'N' : {u:u, v:size, side:'N'}
            }
        }
        // East border
        maps['corner'][size] = {};
        maps['border'][size] = {};
        for (var v=0; v<size; v++) {
            maps['corner'][size][v] = { 'X' : {u:size, v:v} };
            maps['border'][size][v] = {
                'W' : {u:size, v:v, side:'W'}
            }
        }
    }


    // Neighbour for each types
    // See http://www-cs-students.stanford.edu/~amitp/game-programming/grids/
    var neighborsOffsets = {
        'tile' : {
            'tile' : [          // Neighbors
                [ 0, 1],
                [ 1, 0],
                [ 0,-1],
                [-1, 0]
            ],
            'corner' : [        // Touches
                [ 0,  0],
                [ 0, -1],
                [-1, -1],
                [-1,  0]
            ],
            'border' : {        // Joins
                'N' : [
                    [0,  0],
                    [0, -1]
                ],
                'W' : [
                    [ 0, 0],
                    [-1, 0]
                ]
            }
        },
        'corner' : {
            'tile' : [          // Corners
                [1, 1],
                [1, 0],
                [0, 0],
                [0, 1]
            ],
            'corner' : [        // Adjacent
                [ 0,  1],
                [ 1,  0],
                [ 0, -1],
                [-1,  0]
            ],
            'border' : {        // Endpoints
                'N' : [
                    [1, 0],
                    [0, 0]
                ],
                'W' : [
                    [0, 1],
                    [0, 0]
                ]
            }
        },
        'border' : {
            'tile' : [          // Borders
                [0, 1, 'N'],
                [1, 0, 'W'],
                [0, 0, 'N'],
                [0, 0, 'W']
            ],
            'corner' : [        // Protrudes
                [ 0,  0, 'W'],
                [ 0,  0, 'N'],
                [ 0, -1, 'W'],
                [-1,  0, 'N']
            ],
            'border' : {        // Continues
                'N' : [
                    [ 1, 0, 'N'],
                    [-1, 0, 'N']
                ],
                'W' : [
                    [0,  1, 'W'],
                    [0, -1, 'W']
                ]
            }
        }
    };

    return {
        maps : maps,
        neighborsOffsets : neighborsOffsets,
        init : init
    };
})

.service('ri.grid.hexa', function() {
    var maps = {
        'tile'   : {},
        'corner' : {},
        'border' : {}
    };

    maps.shape = 'hexa';

    function init(size) {
        maps.tile = {};
        maps.corner = {};
        maps.border = {};

        // Create grids (tiles, corners and borders)
        for (var u=-size/2; u<size; u++) {
            // var u = - u;

            maps['tile'][u] = {};
            maps['corner'][u] = {};
            maps['border'][u] = {};
            for (var v=0; v<size; v++) {

                if (u+v/2 < 0 || u+v/2 >= size) continue;

                maps['tile'][u][v] = {
                    'X' : {u:u, v:v}
                };
                maps['corner'][u][v] = {
                    'L' : {u:u, v:v, side:'L'},
                    'R' : {u:u, v:v, side:'R'}
                };
                maps['border'][u][v] = {
                    'W' : {u:u, v:v, side:'W'},
                    'N' : {u:u, v:v, side:'N'},
                    'E' : {u:u, v:v, side:'E'}
                }
            }
        }
        // TODO
        // South border
        // for (var u=0; u<10; u++) {
        //     maps['corner'][u][10] = { 'R' : {u:u, v:10, side:'R'} };
        //     maps['border'][u][10] = {
        //         'N' : {u:u, v:10, side:'N'}
        //     }
        // }
        // East border
        // maps['corner'][10] = {};
        // maps['border'][10] = {};
        // for (var v=0; v<10; v++) {
        //     maps['corner'][10][v] = { 'L' : {u:10, v:v, side:'R'} };
        //     maps['border'][10][v] = {
        //         'W' : {u:10, v:v, side:'W'}
        //     }
        // }
    }


    // Neighbour for each types (neighbor type => elem type => coords)
    // See http://www-cs-students.stanford.edu/~amitp/game-programming/grids/
    var neighborsOffsets = {
        'tile' : {
            'tile' : [          // Neighbors
                [ 0, 1],
                [ 1, 0],
                [ 1,-1],
                [ 0,-1],
                [-1, 0],
                [-1, 1]
            ],
            'corner' : {        // Touches
                'L' : [
                    [ 0, 0],
                    [-1, 0],
                    [-1, 1],
                ],
                'R' : [
                    [ 1, 0],
                    [ 1,-1],
                    [ 0, 0],
                ]
            },
            'border' : {        // Joins
                'N' : [
                    [0,  0],
                    [0, -1]
                ],
                'W' : [
                    [ 0, 0],
                    [-1, 0]
                ],
                'E' : [
                    [ 0, 0],
                    [ 1, -1]
                ]
            }
        },
        'corner' : {
            'tile' : [          // Corners
                [ 1,  0, 'L'],
                [ 0,  0, 'R'],
                [ 1, -1, 'L'],
                [-1,  0, 'R'],
                [ 0,  0, 'L'],
                [-1,  1, 'R']
            ],
            'corner' : {         // Adjacent
                'L' : [
                    [ -1, 1, 'R'],
                    [ -1, 0, 'R'],
                    [ -2, 1, 'R']
                ],
                'R' : [
                    [ 2, -1, 'L'],
                    [ 1, -1, 'L'],
                    [ 1,  0, 'L']
                ]
            },
            'border' : {        // Endpoints
                'N' : [
                    [1, -1, 'L'],
                    [-1, 0, 'R']
                ],
                'W' : [
                    [-1, 0, 'R'],
                    [0, 0, 'L']
                ],
                'E' : [
                    [1, -1, 'L'],
                    [0, 0, 'R']
                ]
            }
        },
        'border' : {
            'tile' : [          // Borders
                [0, 0, 'N'],
                [0, 0, 'E'],
                [0, 0, 'W'],
                [0, 1, 'N'],
                [-1,+1, 'E'],
                [1,0, 'W'],
            ],
            'corner' : {        // Protrudes
                'L' :   [
                    [-1, 1, 'N'],
                    [ 0, 0, 'W'],
                    [-1, 1, 'E']
                ],
                'R' :   [
                    [ 1,  0, 'N'],
                    [ 1,  0, 'W'],
                    [ 0, 0, 'E'],
                ],
            },
            'border' : {        // Continues
                'W' : [
                    [ 0, 0, 'N'],
                    [-1, 0, 'E'],
                    [-1, 1, 'N'],
                    [-1, 1, 'E']
                ],
                'N' : [
                    [0,  0, 'E'],
                    [1, -1, 'W'],
                    [0, 0, 'W'],
                    [-1, 0, 'E']
                ],
                'E' : [
                    [1,  0, 'W'],
                    [1,  0, 'N'],
                    [0, 0, 'N'],
                    [1, -1, 'W']
                ]
            }
        }
    };

    return {
        maps : maps,
        neighborsOffsets : neighborsOffsets,
        init : init
    };
})

.service('ri.board.selector.neighbor', function() {
    // this.maps = grid.maps;
    // this.neighborsOffsets = grid.neighborsOffsets;

    // Generic management of out of bounds elems
    function getNeighbors(grid, elem, elemType, neighbourType) {
        var nOffsets = grid.neighborsOffsets[neighbourType][elemType];
        if (elem.side) {
            nOffsets = nOffsets[elem.side];
        }
        var neighbour = [];
        for (c in nOffsets) {
            var offset = nOffsets[c];
            var col = grid.maps[neighbourType][elem.u + offset[0]];
            var cell = col && col[elem.v + offset[1]];
            var e = cell && (offset[2] ? cell[offset[2]] : cell['X']);
            if (e) {
                neighbour.push(e);
            }
        }
        return neighbour;
    }

    // Generic management of neighbour distance
    function getDistNeighbors(grid, e, elemType, neighbourType, dist) {
        var elemOrig = e;
        elemOrig.visited = true;
        var neighbour = _distNeighbour(grid, elemOrig,elemType,neighbourType,dist,0,elemOrig);
        elemOrig.visited = false;
        elemOrig.dist = null;
        setProp(neighbour, 'visited', false);
        setProp(neighbour, 'dist', null);
        return neighbour;
    }

    function _distNeighbour(grid, elem, elemType, neighbourType, dist, distOrig, elemOrig) {

        // Check conditions
        // ex : cond on coords, on distance, on elem attribute
        //if (elem.u != elemOrig.u && elem.v != elemOrig.v) {
        //if (elem.u == 4 && elem.v == 4) {
        // if (distOrig && elem.token) {
        if (false) {
            return [];
        }

        var ret = [];
        if (!elem.visited) {
            ret.push(elem);
            elem.visited = true;
        }

        if (elem.dist == null || elem.dist >= distOrig) {
            elem.dist = distOrig;

            if (dist > 0) {
                var neighbour = getNeighbors(grid, elem,elemType, neighbourType);
                for (n in neighbour) {
                    var current = neighbour[n];
                    ret = ret.concat(_distNeighbour(
                        grid, current, neighbourType, neighbourType, dist-1, distOrig+1, elemOrig));
                }
            }
        }

        return ret;
    }

    function setProp(elems, attr, value) {
        for (e in elems) {
            elems[e][attr] = value;
        }
    }

    return {
        getNeighbors : getNeighbors,
        getDistNeighbors : getDistNeighbors
    }

})

.directive('riBoard', function() {
    return {
        restrict : 'E',
        scope : {
            'data' : '=',
            'onClickElem' : '&',
            'onOverElem' : '&'
        },
        templateUrl : 'module/board/board.html'
    };
})

;