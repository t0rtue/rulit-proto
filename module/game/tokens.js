angular.module('ri.module.tokens', [])

.service('ri.tokens', function() {
    var tokens = {
        all : [
            {
                'type':'pawn',
                'view':{
                    layers:[{size:0.5}, {shape:'circle', size:0.8, width:5}],
                    kernel:{}
                }
            },
            {
                'type':'wall',
                'view':{
                    layers:[{size:0.4, shape:'rect', width:4}],
                    kernel:{}
                }
            }
        ]
    };

    return tokens;
})

;