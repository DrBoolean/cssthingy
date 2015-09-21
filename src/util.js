var _ = require('lodash');

var nodeToString = function(node) {
  if(!node) return '?'
  var sels = node.selectors;
  var desc = _.compact([sels.tag, sels.id, sels.classes.join('')]).join('');
  return desc || node.type;
}

module.exports = {nodeToString: nodeToString}
