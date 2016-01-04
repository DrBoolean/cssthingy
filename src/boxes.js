var _ = require('lodash');
var types = require('./types');
var u = require('./util');
var Box = types.Box;
var Rect = types.Rect;
var EdgeSizes = types.EdgeSizes;
var Dimensions = types.Dimensions;


var pushAnon = function(parent, box) {
  var prev_box = _.last(parent.children);
  if(prev_box && prev_box.type == 'anonymous') {
    prev_box.children.push(box);
  } else {
    var anon = Box(parent.node, 'anonymous');
    anon.children.push(box);
    parent.children.push(anon);
  }
}

var makeBox = function(parent, node) {
  var box;
  switch(node.style.display) {
    case 'block' :
      box = Box(node, 'block');
      parent.children.push(box);
      break;
    case 'inline':
      box = Box(node, 'inline');
      u.hasAllInlineKids(parent) ? parent.children.push(box) : pushAnon(parent, box);
      break;
    case 'inline-block':
      box = Box(node, 'inline-block');
      pushAnon(parent, box);
      break;
    default:
      box = Box(node, '['+node.style.display+']');
      parent.children.push(box);
  }
  if(node.children) node.children.map(function(n){ makeBox(box, n); });
  return box;
}


var dimensionsToString = function(dims) {
  return '('+dims.content.x+':'+dims.content.y+' '+dims.content.width+':'+dims.content.height+')';
}

var printBox = function(acc, box) {
  var indent = Array(acc.indent).join(' ');
  var str = acc.str;

  switch(box.type) {
    case 'block' :
      str += '\n'+indent+'block.'+u.nodeToString(box.node) + dimensionsToString(box.dimensions);
      break;
    case 'anonymous':
      str += '\n'+indent+'anon'+ dimensionsToString(box.dimensions);
      break;
    case 'inline':
      str += '\n'+indent+'inline.'+u.nodeToString(box.node) + dimensionsToString(box.dimensions);
      break;
    case 'inline-block':
      str += '\n'+indent+'inline-block.'+u.nodeToString(box.node) + dimensionsToString(box.dimensions);
      break;
    default:
      str += '\n'+indent+box.type+'.'+u.nodeToString(box.node) + dimensionsToString(box.dimensions);
  }

  if(box.children.length) {
    return box.children.reduce(printBox, {str: str, indent: acc.indent+2});
  } else {
    var new_indent = (acc.indent-2) < 0 ? 0 : acc.indent-2;
    return {str: str, indent: new_indent};
  }
}

module.exports = {
  createLayout: function(stylized_tree) {
    var initial = Box(null, 'block');
    return stylized_tree.map(function(t){ return makeBox(initial, t); });
  },
  print: function(layout) {
    return layout.reduce(printBox, {str: "", indent: 0}).str;
  },
  makeViewport: function(dims) {
    var viewport = Box();
    viewport.dimensions.content = _.extend({x: 0, y: 0, width: 1440, height: 0}, (dims||{}));
    return viewport;
  }
}
