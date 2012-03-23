var c;
var ctx;
var width = 100;
var height = 100;
var canvasScaleFactor = 1.0;
var fontScaleFactor = 0.75;
var patcher = new MaxPatcher();

var maxWidth = 100;
var maxHeight = 100;

function loadMaxpat(filename) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', filename, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4) {
            var jsonData = xobj.responseText;
            processMaxpatData(jsonData);
			c.width = width = (maxWidth + 20) * canvasScaleFactor;
			c.height = height = (maxHeight + 20) * canvasScaleFactor;
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
			case 'rect':
				// c.width = width = value[2];
				// c.height = height = value[3];
				break;
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
		ctx.fillStyle = '#737373';
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
	this.drawInOutlets = true;
	this.init = function() {
		this.buildInlets();
		this.buildOutlets();
		if ((this.x() + this.width()) > maxWidth) {
			maxWidth = (this.x() + this.width());
			console.log('set new max width of ' + maxWidth);
		}
		if ((this.y() + this.height()) > maxHeight) {
			maxHeight = (this.y() + this.height());
			console.log('set new max height of ' + maxHeight);
		}

		//
		if (		this.maxclass() == 'comment'
				|| 	this.maxclass() == 'message'
				|| 	this.maxclass() == 'led'
				||	this.maxclass() == 'multislider'
				||	this.maxclass() == 'textedit') {
			this.drawInOutlets = false;
		}
	}
	this.customDraw = function() {
		coords = this.attrs["patching_rect"];
		ctx.translate(coords[0], coords[1]);

		//var found = false;
		var result = drawSpecialComponent(this);
		if (!result.done) {
			if (result.needsText !== false) {
				ctx.fillStyle = 'black';
				// Draw Text
				var lineHeight = 12;
				if(this.attrs['fontname'] && this.attrs['fontsize']) {
					ctx.font = (this.attrs['fontsize'] * fontScaleFactor) + 'pt '
						+ this.attrs['fontname'];
					lineHeight = this.attrs['fontsize'];
				} else {
					ctx.font = "10pt Courier";
				}
				if(typeof this.attrs['text'] != 'undefined'){
					if (this.attrs['textcolor']){
						console.log('changing text color to ' + hexify(this.attrs['textcolor']));
						ctx.fillColor = hexify(this.attrs['textcolor']);
					}
					lines = getLines(ctx, this.attrs['text'], (this.width()), ctx.font);
					for (var l = 0; l < lines.length; l++) {
						ctx.fillText(lines[l], 2, (lineHeight * (l + 1)) + 1 );
					}
				} else {
					ctx.fillText(this.attrs['maxclass'], 5, 15);
				}
			}
			if (result.needsBox !== false) {
				// Draw the box outline
				ctx.strokeStyle = '#cbd5b8';
				ctx.lineWidth = 2.5;
				roundRect(ctx, 0, 0, coords[2], coords[3], 6);
			}
		}

		if (this.drawInOutlets) {
			// Draw the inlets and outlets
			for (var k = 0; k < this.inlets.length; k++) {
				this.inlets[k].drawRelative();
			}
			for (var k = 0; k < this.outlets.length; k++) {
				this.outlets[k].drawRelative();
			}
		}
	}
	this.maxclass = function() {
		return this.attrs['maxclass'];
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
		// move line to starting point (outlet of source object)
		ctx.moveTo(start_outlet.abs_x(), start_outlet.abs_y());
		mp = this.attrs['midpoints'];
		// draw line to each of midpoints before end point
		for (var m = 0; m < mp.length; m+=2) {
			//TODO: implement quadratic curves in lines...
			//ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
			ctx.lineTo(mp[m], mp[m+1]);
		}
		// draw line to endpoint (inlet of destination object)
		ctx.lineTo(end_inlet.abs_x(), end_inlet.abs_y());
		ctx.stroke();
	}
}

 $(document).ready(function() {
	c = document.getElementById('c');
	ctx = c.getContext('2d');
	c.width = width;
	c.height = height;
	loadMaxpat(maxpat_file);
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

function drawSpecialComponent(c) {
	maxclass = c.maxclass();
	switch(maxclass) {
		// Toggle
		case 'toggle':
			ctx.strokeStyle = 'black';
			roundRect(ctx, 0, 0, c.width(), c.height(), 3, false, true);
			//ctx.strokeRect(0, 0, c.width(), c.height());
			// Don't necessarily want the X
			// ctx.lineWidth = 1;
			// ctx.beginPath();
			// ctx.moveTo(0, 0);
			// ctx.lineTo(c.width(), c.height());
			// ctx.moveTo(c.width(), 0);
			// ctx.lineTo(0, c.height());
			// ctx.closePath();
			// ctx.stroke();
			// what is still needed
			return {done: true};
		// Button
		case 'button':
			ctx.fillStyle = '#eeeeee';
			roundRect(ctx, 0, 0, c.width(), c.height(), 5, true, false);
			ctx.fillStyle = '#b7b7b7';
			ellipse((c.width()/2), (c.height()/2), c.width()*0.4);
			ctx.fillStyle = 'white';
			ellipse((c.width()/2), (c.height()/2), c.width()*0.3);
			return {done: true};
		case 'led':
			// ctx.fillStyle = '#eeeeee';
			// roundRect(ctx, 0, 0, c.width(), c.height(), 5, true, false);
			ctx.fillStyle = 'black';
			ellipse((c.width()/2), (c.height()/2), c.width()*0.4);
			ctx.fillStyle = hexify(c.attrs['offcolor']);
			ellipse((c.width()/2), (c.height()/2), c.width()*0.3);
			return {done: true};
		case 'comment':
			// ctx.strokeStyle = 'lightgray';
			// ctx.lineWidth = 0.5;
			// ctx.strokeRect(0, 0, c.width(), c.height());
			return {done: false, needsBox: false, needsText: true};
		case 'panel':
			if (c.attrs['grad1']) {
				ctx.strokeStyle = hexify(c.attrs['grad1']);
			} else if (c.attrs['color']) {
				ctx.strokeStyle = hex(c.attrs['color']);
			}
			ctx.strokeRect(0, 0, c.width(), c.height());
			return {done: true};
		case 'matrixctrl':
			ctx.fillStyle = 'lightgray';
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 0.5;
			ctx.fillRect(0, 0, c.width(), c.height());
			ctx.strokeRect(0, 0, c.width(), c.height());
			ctx.lineWidth = 1;
			ctx.beginPath();
			for (var i = 0; i < 8; i++) {
				var h = (i * (c.width()/8))+(c.width()/16);
				ctx.moveTo(h, 0);
				ctx.lineTo(h, c.height());
			}
			for (var j = 0; j < 5; j++) {
				var v = (j * (c.height()/5) + (c.height()/10));
				ctx.moveTo(0, v);
				ctx.lineTo(c.width(), v);
			}
			//ctx.closePath();
			ctx.stroke();
			return {done: true};
		case 'dial':
			ctx.fillStyle = 'lightgray';
			roundRect(ctx, 0, 0, c.width(), c.height(), 5, true, false);
			ctx.fillStyle = 'white';
			ellipse((c.width()/2), (c.height()/2), c.width()*0.45);
			ctx.fillStyle = 'gray';
			ellipse((c.width()/2), (c.height()/2), 4);
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'gray';
			ctx.beginPath();
			ctx.moveTo(c.width()/2, c.height()/2);
			ctx.lineTo((c.width()*0.15), (c.height()*0.8));
			//ctx.closePath();
			ctx.stroke();
			return {done: true};
		case 'number':
		case 'flonum':
			ctx.strokeStyle = 'gray';
			ctx.lineWidth = 1.5;
			roundRect(ctx, 0, 0, c.width(), c.height(), 5, false, true);
			ctx.fillStyle = 'lightgray';
			ctx.beginPath();
			ctx.moveTo(4, 4);
			ctx.lineTo(4, c.height()-4);
			ctx.lineTo(10, c.height()/2);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = 'black';
			ctx.font = "12pt Arial";
			if (c.maxclass() == 'flonum') {
				ctx.fillText('0.', 15, 15);
			} else {
				ctx.fillText('0', 15, 15);
			}
			return {done: true};
		case 'message':
			ctx.fillStyle = 'lightgray';
			roundRect(ctx, 0, 0, c.width(), c.height(), 8, true, false);
			return {done: false, needsBox: false, needsText: true};
		case 'inlet':
			ctx.fillStyle = '#a4a4a4';
			roundRect(ctx, 0, 0, c.width(), c.height(), 5, true, false);
			ctx.fillStyle = '#6c5f46';
			roundRect(ctx, (c.width()*0.15), (c.height()*0.15), (c.width()*0.7), (c.width()*0.7), 5, true, false);
			ctx.fillRect((c.width()*0.38), 0, (c.width()*0.24), (c.height()*0.2));
			ctx.fillStyle = 'white';
			ctx.font = "10pt Arial";
			ctx.fontWeight = 'bold';
			ctx.fillText('i', c.width()*0.45, c.height()*0.65);
			return {done: true};
		case 'outlet':
			ctx.fillStyle = '#a4a4a4';
			roundRect(ctx, 0, 0, c.width(), c.height(), 5, true, false);
			ctx.fillStyle = '#00747f';
			roundRect(ctx, (c.width()*0.15), (c.height()*0.15), (c.width()*0.7), (c.width()*0.7), 5, true, false);
			ctx.fillRect((c.width()*0.38), c.height()*0.8, (c.width()*0.24), (c.height()*0.2));
			ctx.fillStyle = 'white';
			ctx.font = "10pt Arial";
			ctx.fontWeight = 'bold';
			ctx.fillText('o', c.width()*0.35, c.height()*0.65);
			return {done: true};
		case 'multislider':
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 0.5;
			ctx.strokeRect(0, 0, c.width(), c.height());
			ctx.fillStyle = hexify(c.attrs['slidercolor']);
			if (c.attrs['orientation'] == 0) {
				ctx.fillRect(0, 0, 2, c.height());
			} else {
				ctx.fillRect(0, c.height()-2, c.width(), 2);
			}
			return {done: true};
		case 'meter~':
			ctx.strokeStyle = '#333333';
			ctx.fillStyle = '#686868';
			ctx.lineWidth = 2;
			roundRect(ctx, 0, 0, c.width(), c.height(), 5, true, false);
			roundRect(ctx, 0, 0, c.width(), c.height(), 5, false, true);
			return {done: true};
		case 'textedit':
			ctx.strokeStyle = '#808080';
			ctx.lineWidth = 2;
			roundRect(ctx, 0, 0, coords[2], coords[3], 6);
			return {done: true};
		default:
			return false;
	}
}

var ellipse = function(x, y, r){
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2, true);
	ctx.closePath();
	ctx.fill();
}


/**
From mizar and Paul Woolcock via StackOverflow
* Divide an entire phrase in an array of phrases, all with the max pixel length given.
* The words are initially separated by the space char.
* @param phrase
* @param length
* @return
*/
function getLines(ctx,phrase,maxPxLength,textStyle) {
    var wa=phrase.split(" "),
        phraseArray=[],
        lastPhrase="",
        l=maxPxLength,
        measure=0;
    ctx.font = textStyle;
    for (var i=0;i<wa.length;i++) {
        var w=wa[i];
        measure=ctx.measureText(lastPhrase+w).width;
        if (measure<l) {
            lastPhrase+=(" "+w);
        }else {
            phraseArray.push(lastPhrase);
            lastPhrase=w;
        }
        if (i===wa.length-1) {
            phraseArray.push(lastPhrase);
            break;
        }
    }
    return phraseArray;
}

function RGBtoHex(r, g, b) {
var hex = (parseInt(r * 255) << 16) | (parseInt(g * 255) << 8) | parseInt(b * 255);
return '#' + hex.toString(16);
}

function hexify(rgb) {
	r = rgb[0]; g = rgb[1]; b = rgb[2];
	var hex = (parseInt(r * 255) << 16) | (parseInt(g * 255) << 8) | parseInt(b * 255);
	return '#' + hex.toString(16);
}