var _ = require('lodash');
var spec = require('./spec');
var m_rules;
// tr: tagname(node) == tr
// table > tr: tagname(node) == tr  && tagname(parent) == table) //  Direct des
// table a: tagname(node) == a  && recurse(tagname(parent) == table)) //  Desc
// a.blah: tagname(node) == a  && class == blah //  Desc // .yadda: _.contains(class, yadda) //  Desc
// table a.blah: tagname(node) == a  && class == blah && recurse(tagname(parent) == table))//  Desc
//
var matchesClass = function(node, rule) {
  if(rule.selectors) {
    return node.selectors.classes[0] === rule.selectors[0];
  }
}

var matchesTag = function(node, rule) {
  if(rule.selectors) {
    return node.selectors.tag === rule.selectors[0];
  }
}

var matchingSelector = function(node, rule) {
  return matchesClass(node, rule) || matchesTag(node, rule);
}

var getTag = function(node) {
  if(node.type === "tag") return node.name;
}

var selectors = function(parent, node) {
  var _selectors = {id: null, classes: [], tag: getTag(node), parentSelectors: parent.selectors};

  if(node.attribs){
    if(node.attribs['class']) _selectors.classes = node.attribs['class'].split(' ').map(function(x){ return '.'+_.trim(x) })
    if(node.attribs['id']) _selectors.id = node.attribs['id'];
  }
  return _selectors;
}

var getInheritedStyles = function(node) {
  return Object.keys(node.style).reduce(function(acc, k) {
    if(spec[k] && spec[k].inherit) {
      acc[k] = node.style[k];
    }
    return acc;
  }, {});
}

var getDefaultStyle = function(node) {
  return m_rules[getTag(node)] || [];
}

var declarationToStyle = function(d) {
  var o = {};
  o[d.property] = d.value;
  return o;
}

var isClockwiseShortHand = function(name) {
  return _.contains(['margin', 'padding'], name);
}

var colors = ['red', 'white', 'yellow', 'green', 'blue', 'orange', 'purple', 'black', 'grey', 'gray', 'brown'];
var isColor = function(x) {
  return x.match(/^\#/) || _.contains(colors, x);
}

var border_styles = ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'];
var parseBorderShortHand = function(key, val) {
  var vals = val.split(/\s+/);
  var categorized = vals.reduce(function(acc, x){
    if(_.contains(border_styles, x)) {
      acc['border-style'] = x;
      return acc;
    }
    if(x.match(/\d+/)) {
      acc['border-width'] = x;
      return acc;
    }
    if(isColor(x)) {
      acc['border-color'] = x;
      return acc;
    }
  },{});
  return [key, val];
}

 // TODO: font, background http://www.dustindiaz.com/css-shorthand/
var expandShortHand = function(key, value) {
  if(isClockwiseShortHand(key)) {
    var shorthand_keys = ['top', 'right', 'bottom', 'left'];
    var names = shorthand_keys.map(function(k){ return [key, k].join('-'); });
    var vals = value.split(/\s+/);
    switch(vals.length){
      case 4: return _.zip(names, vals);
      case 2: return _.zip(names, [vals[0], vals[1], vals[0], vals[1]]);
      case 1: return names.map(function(n) { return [n, vals[0]]; })
    }
  } else if(key === "border") {
    return parseBorderShortHand(key, value);
  } else {
    return [[key, value]];
  }
}

var convertShortHands = function(s) {
  return Object.keys(s).reduce(function(acc, x){
    expandShortHand(x, s[x]).map(function(y) { acc[y[0]] = y[1]; });
    return acc;
  }, {});
}

var toObj = function(styleString) {
  return styleString.split(';').reduce(function(acc, x) {
    var pair = x.split(':');
    acc[pair[0]] = pair[1];
    return acc;
  }, {});
}

var attachAllStyles = function(parent, node, rules) {
  var styles = getDefaultStyle(node);

  if(parent.style) { styles.push(getInheritedStyles(parent)); }

  node.selectors = selectors(parent, node);

  styles = styles.concat(_.flatten(rules.filter(function(rule) {
      return matchingSelector(node, rule);
    }).map(function(r){
      return r.declarations.map(declarationToStyle);
    })));

  //http://www.smashingmagazine.com/2010/04/css-specificity-and-inheritance/#2-1-how-to-calculate-specificity
  if(node.attribs && node.attribs['style']) styles.push(toObj(node.attribs['style']));
  node.style = styles.reduce(function(acc, s){ return _.extend(acc, convertShortHands(s)); }, {});
  node.style.display = node.style.display || 'inline'; // ! default to inline
  if(node.children) {
    node.children = node.children.map(function(c){ return attachAllStyles(node, c, rules); });
  }
  return node;
}

module.exports = function(mrules, rules, dom) {
  m_rules = mrules.reduce(function(acc, x){
      (x.selectors||[]).map(function(s){ acc[s] = x.declarations.map(declarationToStyle); });
      return acc;
    }, {});

    return dom.filter(function(n){ return n.type !== "directive"}).map(function(c){ return attachAllStyles({}, c, rules)});

}
