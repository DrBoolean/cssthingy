var _ = require('lodash');

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
      pushAnon(parent, box);
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

var nodeToString = function(node) {
  if(!node) return '?'
  var sels = node.selectors;
  var desc = _.compact([sels.tag, sels.id, sels.classes.join('')]).join('');
  return desc || node.type;
}


var printBox = function(acc, box) {
  switch(box.type) {
    case 'block' :
      acc += '\n  block.'+nodeToString(box.node) + JSON.stringify(box.dimensions);
      break;
    case 'anonymous':
      acc += '\n  anon'+ JSON.stringify(box.dimensions);
      break;
    case 'inline':
      acc += '\n   inline.'+nodeToString(box.node) + JSON.stringify(box.dimensions);
      break;
    case 'inline-block':
      acc += '\n inline-block.'+nodeToString(box.node) + JSON.stringify(box.dimensions);
      break;
    default:
      acc += '\n   '+box.type+'.'+nodeToString(box.node) + JSON.stringify(box.dimensions);
  }

  if(box.children) {
    return box.children.reduce(printBox, acc);
  } else {
    return acc;
  }
}

var getBoxStyle = function(box) {
  return (box.node && box.node.style) || {};
}

module.exports = {
  createLayout: function(stylized_tree) {
    var initial = Box(null, 'block');
    return stylized_tree.map(function(t){ return makeBox(initial, t); });
  },
  print: function(layout) {
    return layout.reduce(printBox, "");
  }
}
