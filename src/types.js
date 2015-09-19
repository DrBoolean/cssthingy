var Rect = function(r) {
  return r || {x: 0, y: 0, width: 0, height: 0};
}

var EdgeSizes = function() {
  return {left: 0, right: 0, top: 0, bottom: 0};
}

var Dimensions = function() {
  return {content: Rect(), padding: EdgeSizes(), border: EdgeSizes(), margin: EdgeSizes() };
}

var Box = function(n, t) { return {type: t, node: n, children: [], dimensions: Dimensions() } }

module.exports = {
  Rect: Rect,
  EdgeSizes: EdgeSizes,
  Dimensions: Dimensions,
  Box: Box
}
