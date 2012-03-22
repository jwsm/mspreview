var c;
var ctx;
var width = 600;
var height = 600;
var canvasScaleFactor = 1.0;
var fontScaleFactor = 0.75;
var patcher = new MaxPatcher();

function loadMaxpat(filename) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', filename, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            var jsonData = xobj.responseText;
            processMaxpatData(jsonData);
			ctx.scale(canvasScaleFactor,canvasScaleFactor);
			patcher.draw();
        }
    }
    xobj.send(null);
}

function processMaxpatBoxes(data) {
	for(var j=0;j<data.length;j++){
		var obj = data[j];
		for(var key in obj){
			var attrName = key;
			var attrValue = obj[key];
		}
	}
}

function processMaxpatData(maxpatdata) {
	var data = jQuery.parseJSON(maxpatdata);
	$.each(data.patcher, function(key, value) {
		switch(key) {
			case 'boxes':
				break;
			default:
				break;
		}
	});
	$.each(data.patcher.boxes, function(key, value) {
		b = new MaxBox();
		b.initWithJSON(value.box);
		patcher.addItem(b);
	});
	$.each(data.patcher.lines, function(key, value) {
		l = new MaxLine();
		l.initWithJSON(value.patchline);
		patcher.addItem(l);
	});
}

function MaxPatcher() {
	this.itemCount = 0;
	this.items = [];
	this.ids = [];

	this.addItem = function(item) {
		this.items[this.itemCount] = item;
		if (item.attrs['id']) {
			//console.log(item.attrs['id']);
			this.ids[item.attrs['id']] = item;
		}
		this.itemCount++;
	}
	this.draw = function() {
		for (var j = 0; j < this.itemCount; j++) {
			if (this.items[j] != null) {
				this.items[j].draw();
			}
		}
	}

}

function MaxObject() {
	this.attrs = [];
	this.initWithJSON = function(json) {
		this.attrs = [];
		for (var key in json) {
			this.attrs[key] = json[key];
		}
		this.init();
	}
	this.init = function() {
	}
	this.draw = function() {
		ctx.save();
		this.customDraw();
		ctx.restore();
	}
}

function InOutlet() {
	this.inOutHorizPos = function(index, num, width) {
		switch(num){
			case 1:
				return 7;
			case 2:
				if (index == 0)
					return 7;
				else
					return this.parent.width()-11;
			default:
				return (((this.parent.width()+14)/num)*index+7);
		}
	}
	// this.drawAbsolute = function() {
	// 	ctx.fillStyle = 'red';
	// 	ctx.fillRect(this.abs_x()-3.5, this.abs_y()-2, 7, 3);
	// }
	this.drawRelative = function() {
		ctx.fillStyle = 'black';
		ctx.fillRect(this.x-3.5, this.y-2, 7, 3);
	}
	this.abs_x = function() {
		return this.x + this.parent.x();
	}
	this.abs_y = function() {
		return this.y + this.parent.y();
	}
}

Inlet.prototype = new InOutlet();
function Inlet(index, parent) {
	this.index = index;
	this.parent = parent;
	this.y = 0;
	this.x = this.inOutHorizPos(this.index, parent.numInlets(), parent.width());
}

Outlet.prototype = new InOutlet();
function Outlet(index, parent) {
	this.index = index;
	this.parent = parent;
	this.y = parent.height();
	this.x = this.inOutHorizPos(this.index, parent.numOutlets(), parent.width());
}

MaxBox.prototype = new MaxObject();
function MaxBox() {
	this.inlets = [];
	this.outlets = [];
	this.init = function() {
		this.buildInlets();
		this.buildOutlets();
	}
	this.customDraw = function() {
		coords = this.attrs["patching_rect"];
		ctx.translate(coords[0], coords[1]);

		// Draw Text
		if(this.attrs['fontname'] && this.attrs['fontsize']) {
			ctx.font = (this.attrs['fontsize'] * fontScaleFactor) + 'pt ' + this.attrs['fontname'];
		} else {
			ctx.font = "10pt Courier";
		}
		if(this.attrs['text']){
			ctx.fillText(this.attrs['text'], 5, 15);
		} else {
			ctx.fillText(this.attrs['maxclass'], 5, 15);
		}

		// Draw the box outline
		ctx.strokeStyle = '#cbd5b8';
		ctx.lineWidth = 2.5;
		roundRect(ctx, 0, 0, coords[2], coords[3], 6);

		// Draw the inlets and outlets
		for (var k = 0; k < this.inlets.length; k++) {
			this.inlets[k].drawRelative();
		}
		for (var k = 0; k < this.outlets.length; k++) {
			this.outlets[k].drawRelative();
		}
	}
	this.x = function() {
		return this.attrs['patching_rect'][0];
	}
	this.y = function() {
		return this.attrs['patching_rect'][1];
	}
	this.center_x = function() {
	}
	this.center_y = function() {
	}
	this.width = function() {
		return this.attrs['patching_rect'][2];
	}
	this.height = function() {
		return this.attrs['patching_rect'][3];
	}
	this.numInlets = function() {
		return this.attrs['numinlets'];
	}
	this.numOutlets = function() {
		return this.attrs['numoutlets'];
	}
	this.buildInlets = function() {
		numpos = this.attrs['numinlets'];
		for (var k = 0; k<numpos; k++) {
			this.inlets[k] = new Inlet(k, this);
		}
	}
	this.buildOutlets = function() {
		numpos = this.attrs['numoutlets'];
		for (var k = 0; k<numpos; k++) {
			this.outlets[k] = new Outlet(k, this);
		}
	}
}

MaxLine.prototype = new MaxObject();
function MaxLine() {
	this.customDraw = function() {
		start_outlet =
		patcher.ids[this.attrs['source'][0]].outlets[this.attrs['source'][1]];
		end_inlet =
		patcher.ids[this.attrs['destination'][0]].inlets[this.attrs['destination'][1]];

		ctx.lineWidth = 1.2;
		ctx.beginPath();
		ctx.moveTo(start_outlet.abs_x(), start_outlet.abs_y());
		ctx.lineTo(end_inlet.abs_x(), end_inlet.abs_y());
		ctx.closePath();
		ctx.stroke();
	}
}

 $(document).ready(function() {
	c = document.getElementById('c');
	ctx = c.getContext('2d');
	c.width = width;
	c.height = height;
	loadMaxpat('GL_Attack3Joy.maxpat');
});


// From Juan Mendes

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
 * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }
}