var _ = require('lodash');
var css = require('css');
var htmlparser = require('htmlparser');

function parseHtml(html, cb) {
  var handler = new htmlparser.DefaultHandler(function (error, dom) {
    if (error) console.log('ERR', error);
    cb(dom);
  }, { verbose: false, ignoreWhitespace: true } );
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
}

module.exports = function(h, c, m, cb) {
  var m_rules = css.parse(m, {}).stylesheet.rules;
  var rules = css.parse(c, {}).stylesheet.rules;

  parseHtml(h, function(dom){ cb(m_rules, rules, dom); });
}
