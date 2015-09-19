var M = require('../src/main');
var assert = require("chai").assert;
var _ = require("lodash");

describe("Parsing", function(){  
  var body, firstDiv, h1, stylized_tree;

  before(function(done) {
    var htmlpath = __dirname+'/../test.html';
    var csspath = __dirname+'/../test.css';
    M.stylize(htmlpath, csspath, function(dom) {
      stylized_tree = dom;
      body = _.last(dom[0].children[1].children);
      firstDiv = body.children[0];
      h1 = firstDiv.children[0].children[0].children[1];
      done();
    });
  });

  it('gets default styles', function(){
    assert.equal(body.style['display'], 'block');
    assert.equal(h1.style['display'], 'block');
    assert.equal(h1.style['font-weight'], 'bold');
    assert.equal(firstDiv.style['display'], 'block');
  });

  it('gives style to simple classes', function(){
    assert.equal(firstDiv.style['text-align'], 'center');
  });

  it('gives style to simple tag names', function(){
    assert.equal(h1.style['font-family'], 'metro');
  });

  it('inherits inheritable styles', function(){
    assert.equal(h1.style['color'], '#FEFDFD');
  });

  it('doesnt inherit other styles', function(){
    assert.equal(h1.style['border-style'], null);
  });

  describe("Building Layout Boxes", function(){
    var layout, bodyBox, firstDivBox, secondDivBox;

    before(function() {
      layout = M.createLayout(stylized_tree);
      bodyBox = _.last(layout[0].children[1].children);
      firstDivBox = bodyBox.children[0];
      secondDivBox = firstDivBox.children[0].children[0];
    });

    it("makes block boxes", function(){
      assert.equal(firstDivBox.type, 'block');
    });

    it("makes anonymous boxes to hold inline styles", function(){
      assert.equal(secondDivBox.children[2].type, 'anonymous');
    });

    it("places consecutive inline styles in the same anonymous box", function(){
      assert.equal(secondDivBox.children[2].children.length, 2);
      assert(_.all(secondDivBox.children[2].children, function(c){  return c.type == "inline"}));
    });

    it("wraps stranded text in an anonymous box", function(){
      assert.equal(secondDivBox.children[4].type, 'anonymous');
    });

    it("anonymous boxes inherit their properties from the containing block box", function(){
      var section = firstDivBox.children[0];
      var anon = secondDivBox.children[2];
      assert.equal(anon.node.background, section.node.background);
    });

    describe("Calculating Dimensions", function(){
      var dfirstDivBox, secondDivBox;
      beforeEach(function() {
        var dimensioned = M.calculateDimensions(layout);
        var bodyBox = _.last(dimensioned[0].children[1].children);
        firstDivBox = bodyBox.children[0]
        secondDivBox = firstDivBox.children[0].children[0];
      });

      it("calculates width", function(){
        assert.equal(secondDivBox.dimensions.content.width, 1424);
      });
    });
  });
});
