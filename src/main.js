var fs = require('fs');
var _ = require('lodash');
var styles = require('./styles');
var boxes = require('./boxes');
var layout = require('./layout');
var parsing = require('./parsing');


module.exports = {
  stylize: function(htmlpath, csspath, cb) {
    var h = fs.readFileSync(htmlpath, 'utf-8');
    var c = fs.readFileSync(csspath, 'utf-8');
    var m = fs.readFileSync(__dirname+'/mozilla.css', 'utf-8');
    parsing(h, c, m, _.compose(cb, styles))
  },
  createLayout: boxes.createLayout,
  print: boxes.print,
  calculateDimensions: layout,
  viewport: boxes.makeViewport
}

