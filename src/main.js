var fs = require('fs');
var _ = require('lodash');
var styles = require('./styles');
var boxes = require('./boxes');
var layout = require('./layout');
var parsing = require('./parsing');


module.exports = {
  stylize: function(htmlpath, csspath, cb) {
    var raw_html = fs.readFileSync(htmlpath, 'utf-8');
    var raw_css = fs.readFileSync(csspath, 'utf-8');
    var raw_mozilla = fs.readFileSync(__dirname+'/mozilla.css', 'utf-8');
    parsing(raw_html, raw_css, raw_mozilla, _.compose(cb, styles))
  },
  createLayout: boxes.createLayout,
  print: boxes.print,
  calculateDimensions: layout,
  viewport: boxes.makeViewport
}

