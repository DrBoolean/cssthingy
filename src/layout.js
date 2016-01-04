var _ = require('lodash');
var types = require('./types');
var ua = require('./user_agent');
var u = require('./util');
var Rect = types.Rect;
var Box = types.Box;

var getBoxStyle = function(box) {
  return (box.node && box.node.style) || {};
}

//block only
var calcWidth = function(parent, box) {
  var parent_width = parent.dimensions.content.width;
  var style = getBoxStyle(box);

  var pxWidth = function(x) {
    return toPx(x, parent_width); //Q: border/margin/padding % is of width?
  }

  var width = pxWidth(style['width']) || 'auto';
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


  if(margin_right != "auto" && margin_left != "auto" && width != "auto") {
    margin_right = margin_right + underflow;
  }

  if(margin_right == "auto" && margin_left != "auto" && width != "auto") {
    margin_right = underflow;
  }

  if(margin_right != "auto" && margin_left == "auto" && width != "auto") {
    margin_left = underflow;
  }

  if(width == "auto") {
    if(margin_right == "auto") margin_right = 0;
    if(margin_left == "auto") margin_left = 0;

    if(underflow >= 0) {
      width = underflow;
    } else {
      width = 0;
      margin_right = margin_right + underflow;
    }
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
  if(typeof str == "number") return str;
  if(str.match(/px$/i)) result = parseInt(str);
  if(str.match(/em$/i)) result = (parseInt(str) * BASE_PX_SIZE);
  if(str.match(/%$/)) result = (parseInt(str) * container_size) / 100;
  if(str.match(/thin/)) result = toPx(ua.thin, container_size);
  if(str.match(/medium/)) result = toPx(ua.medium, container_size);
  if(str.match(/thick/)) result = toPx(ua.thick, container_size);
  if(str.match(/normal/)) result = toPx(ua.normal, container_size);
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
  console.log("1)", u.nodeToString(box.node), d.content, "PARENT", u.nodeToString(parent.node), pd.content);
}

var calcCoords = function(parent, box) {
  var pd = parent.dimensions;
  var d = box.dimensions;
  console.log("CC CHILDREN", u.nodeToString(box.node), box.children.map(function(b){ return u.nodeToString(b.node) +' ' + JSON.stringify(b.dimensions.content) }));
  console.log("=============pd.content.height", pd.content.height);
  // //d.content.x = pd.content.x + d.margin.left + d.border.left + d.padding.left;
  // // Position the box below all the previous boxes in the container.
  // console.log("1111)", u.nodeToString(box.node), d.content, "PARENT", u.nodeToString(parent.node), pd.content);
  // if(box.type === "block" && pd.content && d.content) pd.content.y = (d.content.height||0) + d.content.y + d.margin.top + d.border.top + d.padding.top;
  // console.log("2)", u.nodeToString(box.node), d.content, "PARENT", u.nodeToString(parent.node), pd.content);
}

var calcHeight = function(parent, box) {
  var style = getBoxStyle(box);
  var height = toPx(style.height, parent.dimensions.content.height);

  // here we force the height. This will tell us if it overflows
  if(height) {
    box.dimensions.content.height = height;
    console.log("SET HEIGHT TO ", u.nodeToString(box.node), height);
  }
}

var calcIHeight = function(parent, box) {
  var style = box.node.style
  var topx = toPx(style['line-height'], parent.dimensions.content.height);
  var fontsize = Math.ceil(topx * toPx(style['font-size'], parent.dimensions.content.height));
  box.dimensions.content.height = fontsize
  console.log("SET IHEIGHT TO ", u.nodeToString(box.node), fontsize);
}

var layoutChildren = function(box) {
  var d = box.dimensions;
  console.log("Layout kids", u.nodeToString(box.node));
  box.children.forEach(function(child){ addDimensions(box, child); }); // this recurses

  if(box.type === "block" && u.hasAllInlineKids(box)) {
    var b = Box(box.node, 'line');
    var kids = box.children;
    b.children = kids;
    var kids_heights = kids.map(function(c){ return c.dimensions.content.height })
    if(kids_heights.length) b.dimensions.content.height = _.max(kids_heights);
    console.log("LC SET HEGHT", u.nodeToString(box.node), b.dimensions.content.height);
    box.children = [b]; // place all of them in a linebox. Should it be 1 line box per kid?
  }

  if(box.type !== 'line') {
    box.dimensions.content.height = box.children.reduce(function(h, c){
      return h + marginBox(c.dimensions).height;
    }, d.content.height);
    console.log("LC SET iHEGHT", u.nodeToString(box.node), box.dimensions.content.height);
  }
}

var addDimensions = function(parent, box) {
  console.log("------ADD DIMS", u.nodeToString(box.node))
  switch(box.type) {
    case 'block' :
      console.log("------BLOCK", u.nodeToString(box.node))
      calcWidth(parent, box);
      calcPosition(parent, box);
      layoutChildren(box);
      console.log('----DONE KIDS---', u.nodeToString(box.node))
      calcHeight(parent, box);
      calcCoords(parent, box);
      break;
    case 'inline' :
      console.log("------INLINE", u.nodeToString(box.node))
      calcWidth(parent, box);
      calcPosition(parent, box);
      layoutChildren(box);
      calcIHeight(parent, box);
      calcCoords(parent, box);
      break;
    default :
      console.log("------DEFAULT", u.nodeToString(box.node))
      calcWidth(parent, box);
      calcPosition(parent, box);
      //no height here because it's probably title/meta stuff
      if(box.children) box.children = box.children.map(function(x){ return addDimensions(box, x) });
      calcCoords(parent, box);
  }
  return box;
}

module.exports = function(viewport, layout_boxes) {
  return layout_boxes.map(function(b) { return addDimensions(viewport, b); })
}

