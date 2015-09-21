var _ = require('lodash');
var types = require('./types');
var ua = require('./user_agent');
var u = require('./util');
var Rect = types.Rect;

var getBoxStyle = function(box) {
  return (box.node && box.node.style) || {};
}

//block only
var calcWidth = function(parent, box) {
  var parent_width = parent.dimensions.content.width;
  var style = getBoxStyle(box);
  var width = style['width'] || 'auto';

  var pxWidth = function(x) {
    return toPx(x, parent_width); //Q: border/margin/padding % is of width?
  }

  var margin_left = pxWidth(style['margin-left']);
  var margin_right = pxWidth(style['margin-right']);
  var border_left = pxWidth(style['border-left-width']);
  var border_right = pxWidth(style['border-right-width']);
  var padding_left = pxWidth(style['padding-left']);
  var padding_right = pxWidth(style['padding-right']);

  var sum_width = width == "auto" ? 0 : width;

  var total = _.sum([margin_left, margin_right, border_left, border_right, padding_left, padding_right, sum_width]);

  if(width != "auto" && total > parent_width) {
    if(margin_left == "auto") {
      margin_left = 0;
    }
    if(margin_right == "auto") {
      margin_right = 0;
    }
  }

  var underflow = parent_width - total;

  if(margin_left == "auto" && !(margin_right == "auto" || width == "auto") ) {
    margin_left = underflow;
  }
  if(margin_right == "auto" && !(margin_left == "auto" || width == "auto") ) {
    margin_right = underflow;
  }
  if(width == "auto") {
    if(margin_right == "auto") margin_right = 0;
    if(margin_left == "auto") margin_left = 0;
  }

  if(underflow >= 0) {
    width = underflow;
  } else {
    width = 0;
    margin_right = margin_right + underflow;
  }

  if(width != "auto" && (margin_left == "auto" && margin_right == "auto")) {
    margin_left = underflow / 2;
    margin_right = underflow / 2;
  }

  var d = box.dimensions;

  d.content.width = width;

  d.padding.left = padding_left;
  d.padding.right = padding_right;

  d.border.left = border_left;
  d.border.right = border_right;

  d.margin.left = margin_left;
  d.margin.right = margin_right;
}

var expandedBy = function(rect, edge) {
  return Rect({x: rect.x - edge.left,
               y: rect.y - edge.top,
               width: rect.width + edge.left + edge.right,
               height: rect.height + edge.top + edge.bottom});
}

var paddingBox = function(d) {
  return expandedBy(d.content, d.padding);
}

var borderBox = function(d) {
  return expandedBy(paddingBox(d), d.border);
}

var marginBox = function(d) {
  return expandedBy(borderBox(d), d.margin);
}

var toPx = function(str, container_size) {
  str = (str || '');
  var result;
  var BASE_PX_SIZE = 16;
  if(str.match(/px$/i)) result = parseInt(str);
  if(str.match(/em$/i)) result = (parseInt(str) * BASE_PX_SIZE);
  if(str.match(/%$/)) result = (parseInt(str) * container_size) / 100;
  if(str.match(/thin/)) result = ua.thin;
  if(str.match(/medium/)) result = ua.medium;
  if(str.match(/thick/)) result = ua.thick;
  if(str.match(/normal/)) result = ua.normal;
  return result || 0;
}

var calcPosition = function(parent, box) {
  var pd = parent.dimensions;
  var d = box.dimensions;
  var style = getBoxStyle(box);

  var pxHeight = function(x) {
    return toPx(x, pd.content.height); //Q: border/margin/padding % is of height?
  }

  d.margin.top = pxHeight(style['margin-top'])
  d.margin.bottom = pxHeight(style['margin-bottom'])

  d.border.top = pxHeight(style['border-top-width']);
  d.border.bottom = pxHeight(style['border-bottom-width']);

  d.padding.top = pxHeight(style['padding-top']);
  d.padding.bottom = pxHeight(style['padding-bottom']);

  d.content.x = pd.content.x + d.margin.left + d.border.left + d.padding.left;

  // Position the box below all the previous boxes in the container.
  d.content.y = (pd.content.height||0) + pd.content.y + d.margin.top + d.border.top + d.padding.top;
}

var calcHeight = function(parent, box) {
  var style = getBoxStyle(box);
  if(style.height) box.dimensions.content.height = toPx(style.height, parent.dimensions.content.height);
}

var layoutChildren = function(box) {
  var d = box.dimensions;
  box.children.map(function(child){
    addDimensions(box, child);
    d.content.height = d.content.height + marginBox(child.dimensions).height;
  });
}

var calcIHeight = function(parent, box) {
  //console.log('box.node.style', box.node.style);
  box.dimensions.content.height = toPx(box.node.style['line-height']);
}

var addDimensions = function(parent, box) {
  switch(box.type) {
    case 'block' :
      calcWidth(parent, box);
      calcPosition(parent, box);
      layoutChildren(box);
      calcHeight(parent, box);
      break;
    case 'inline' :
      calcWidth(parent, box);
      calcPosition(parent, box);
      layoutChildren(box);
      calcIHeight(parent, box);
      break;
    default :
      calcWidth(parent, box);
      calcPosition(parent, box);
      if(box.children) box.children = box.children.map(function(x){ return addDimensions(box, x) });
  }
 //console.log('box', nodeToString(box.node), box.dimensions);
  return box;
}

module.exports = function(viewport, layout_boxes) {
    return layout_boxes.map(function(b) { return addDimensions(viewport, b); })
}

