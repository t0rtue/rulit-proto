angular.module('ri.module.token', [])

// Workaround to allow dynamic svg element adding
.value('createSVGNode', function(name, element, settings) {
  var namespace = 'http://www.w3.org/2000/svg';
  var node = document.createElementNS(namespace, name);
  for (var attribute in settings) {
     var value = settings[attribute];
     if (value !== null && !attribute.match(/\$/) && (typeof value !== 'string' || value !== '')) {
        node.setAttribute(attribute, value);
     }
  }
  return node;
})

.directive('riToken', ['createSVGNode', function(createSVGNode) {
    return {
        restrict : 'E',
        scope : {
            'data' : '=',
            'view' : '=' // {kernel:{}, layers:[]}
        },
        //templateUrl : 'piece-view.html',
        link:  function(scope, element, attrs) {

            var relSize = 50;
            var shapeToTag = {'circle':'circle', 'rect':'polygon', 'square':'rect', 'hexa':'polygon'};

            var svg = createSVGNode('g', element, attrs);

            //var elemTemplate = (new DOMParser).parseFromString(element[0].childNodes, 'application/xml');
            //angular.element(svg).append(elemTemplate);

            //angular.element(svg).append(element[0].childNodes);

            /* Layers */
            var layersElem = [];
            scope.view && scope.view.layers.forEach(addLayer);

            function addLayer(layer) {
                var shape = _addShape(layer);
                layersElem.push(angular.element(shape));
            }

            function removeLayer(idx) {
                layersElem[idx].remove();
                layersElem.splice(idx, 1);
            }

            function changeLayer(idx, layer) {
                layersElem[idx].remove();
                var shape = _addShape(layer);
                layersElem[idx] = angular.element(shape)
            }

            function _addShape(layer) {
                var shape = createSVGNode(shapeToTag[layer.shape || 'circle']);
                angular.element(svg).append(shape);
                return shape;
            }

            function _updateShape(elem, size, shape) {

                switch (shape) {
                    case 'circle':
                    default:
                        elem.attr('r', size * relSize);
                        break;
                    case'square':
                        elem.attr('x', size * (-relSize/2));
                        elem.attr('y', size * (-relSize/2));
                        elem.attr('width', size * relSize);
                        elem.attr('height', size * relSize);
                        break;
                    case 'rect':
                        var points = (-relSize) + ",0 "
                                     + (10-relSize) + "," + (-30*size) + " "
                                     + (relSize-10) + "," + (-30*size) + " "
                                     + (relSize) + ",0 "
                                     + (relSize-10) + "," + (30*size) + " "
                                     + (10-relSize) + "," + (30*size) + " ";
                        elem.attr('points', points);
                        break;
                    case 'hexa':
                        size = size/2;
                        var points = (-64.5*size) + ",0 "
                                     + (-32.5*size) + "," + (-54*size) + " "
                                     + (32.5*size) + "," + (-54*size) + " "
                                     + (64.5*size) + ",0 "
                                     + (32.5*size) + "," + (54*size) + " "
                                     + (-32.5*size) + "," + (54*size) + " ";
                        elem.attr('points', points);
                }
            }

            if (scope.view.kernel) {
                _addShape(scope.view.kernel);
            }
            /* Kernel */
            var kernelLabel = createSVGNode('text');
            angular.element(kernelLabel).attr('dy', '0.3em');
            angular.element(svg).append(kernelLabel);


            element.replaceWith(svg);


            function update() {
                if (!scope.view) return;
                var props = scope.data.properties;

                function computeValue(layer, attr, def) {
                    var attrInfo = layer[attr];
                    var value =  attrInfo ? attrInfo.bindToAttr && props
                                           ? props[attrInfo.bindToAttr]
                                           : attrInfo
                                           : def;
                    return value;
                }

                function computeColor(colorDef) {
                    return colorDef && colorDef.on
                        && ((colorDef.bind == 'color' && colorDef.color)
                        || (colorDef.bind == 'player' && ((scope.data.player && scope.data.player.color) || 'lightgrey')));
                }

                function shapeChanged(idx) {
                    return layersElem[idx][0].tagName != shapeToTag[scope.view.layers[idx].shape];
                }

                var l;
                for (l in scope.view.layers) {
                    var layer = scope.view.layers[l];

                    var width = computeValue(layer, 'width', 1);
                    var size = computeValue(layer, 'size', 1);
                    var color = computeColor(layer.stroke);
                    var fill = computeColor(layer.fill);

                    if (!layersElem[l]) {
                        addLayer(layer);
                    }
                    else if (shapeChanged(l)) {
                        changeLayer(l, layer);
                    }

                    var css = {
                        'stroke-width'  : width
                    };
                    css['stroke'] = color ? color : 'none';
                    if (fill) {
                        css['fill'] = fill;
                        css['fill-opacity'] = 1;
                    };

                    layersElem[l].css(css);

                    _updateShape(layersElem[l], size, layer.shape);
                    // layersElem[l].attr('r', size);
                }

                for (l++;l<layersElem.length;l++) {
                    removeLayer(l);
                }

                if (scope.view.kernel) {
                    var label = computeValue(scope.view.kernel, 'label', '');
                    angular.element(kernelLabel).text(label).css({
                        "fill": (scope.view.kernel.color || "inherit")
                    });
                }

            }

            scope.$watch('data.properties', update, true);
            scope.$watch('data.player', update, true);

            // TODO only watch if mode == editing
            scope.$watch('view', update, true );


            scope.$on('$destroy', function() {
                angular.element(svg).remove();
            });
         }
    };
}])

;