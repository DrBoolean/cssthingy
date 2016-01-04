var _ = require('lodash');

var nodeToString = function(node) {
  if(!node) return '?'
  var sels = node.selectors;
  var desc = _.compact([sels.tag, sels.id, sels.classes.join('')]).join('');
  return desc || node.type;
}

var hasAllInlineKids = function(box) {
  return _.all(box.children, function(k) { return k.node.style.display.match(/inline/i) });
}


module.exports = {nodeToString: nodeToString, hasAllInlineKids: hasAllInlineKids}
