$(document).ready(function() {

	drawPixi();
	generateRects(700);
	initSpaces();
	initPlacement();
	processRects(rect_array);

});

// Global variables
var globalWidth = 10000;
var rect_array = [];
var spaces = [];
var initialScale = 0.1;
var main_layer_zoom_scalemax = 10;
var main_layer_zoom_scalemin = 0.05;

rectangle = function(width, height, x, y) {

	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;

}

generateRects = function(n) {

	for (var i=0; i<n; i++) {
		var w = 40 + Math.round(Math.random() * 500);
		var h = 40 + Math.round(Math.random() * 500);
		var r = new rectangle(w, h);
		rect_array.push(r);
	}

}

initSpaces = function() {

	var firstSpace = new rectangle(globalWidth, globalWidth, - globalWidth / 2, - globalWidth / 2);
	firstSpace.corner = getClosestCorner(firstSpace);
	firstSpace.distance = getDistance(firstSpace.corner);
	spaces.push(firstSpace);

}

initPlacement = function() {

	var r1 = rect_array[0];
	r1.x = - r1.width / 2;
	r1.y = - r1.height / 2;
	updateSpaces(r1);

	rDraw = convertCoord(r1);
	graphics.drawRect(rDraw.x, rDraw.y, rDraw.width, rDraw.height);
	renderer.render(stage);

	var r2 = rect_array[1];
	r2.x = - r2.width / 2;
	r2.y = r1.y + r1.height;
	updateSpaces(r2);

	rDraw = convertCoord(r2);
	graphics.drawRect(rDraw.x, rDraw.y, rDraw.width, rDraw.height);
	renderer.render(stage);

}

function processRects(rect_array, completionCallback) {
	var processed = 0;
	var result = [];

	function doIt() {
		// process up to 1 rectangles at a time
		placeRect(rect_array[processed]);
		processed++;

		if (processed < rect_array.length) {
			// not finished, schedule another block.
			setTimeout(doIt, 0);
		} else {
			// processing complete... inform caller
			if (completionCallback) completionCallback(result);
		}
	}

	//Schedule computation start.
	setTimeout(doIt, 0);
}

placeRect = function(r) {

	for (var j=0; j<spaces.length; j++) {

		var space = spaces[j];
		var corner = space.corner;
		if (corner.direction == 1) {
			r.x = corner.x;
			r.y = corner.y;
		} else if (corner.direction == 2) {
			r.x = corner.x - r.width;
			r.y = corner.y;
		} else if (corner.direction == 3) {
			r.x = corner.x - r.width;
			r.y = corner.y - r.height;
		} else {
			r.x = corner.x;
			r.y = corner.y - r.height;
		}

		var contains = checkContainment(r, space);

		// if the rectangle fits in the space, break the space loop and continue. otherwise keep looping through spaces.
		if (contains == 'r1') {
			break;
		}
	}

	rDraw = convertCoord(r);
	var randColor = '0x'+Math.floor(Math.random()*16777215).toString(16);
	graphics.beginFill(randColor);
//	console.log(randColor);
//	graphics.beginFill('0x1099bb');
	graphics.drawRect(rDraw.x, rDraw.y, rDraw.width, rDraw.height);
	renderer.render(stage);

	updateSpaces(r);
}

updateSpaces = function(rectangle) {

	var newSpaces = [];
	for (var i=0; i<spaces.length; i++) {
		// if rectangle intersects space
		if (checkIntersection(rectangle, spaces[i])) {
			// generate new spaces
			newerSpaces = getNewSpaces(rectangle, spaces[i]);
			for (var j=0; j<newerSpaces.length; j++) {
				newSpaces.push(newerSpaces[j]);
			}
		} else {
			newSpaces.push(spaces[i]);
		}
	}
	spaces = newSpaces;
	removeRedundantSpaces();

	spaces.sort(function(a, b) {
		return a.distance - b.distance;
	});

}

// r1 is placed rectangle. r2 is space which it overlaps
getNewSpaces = function(r1, r2) {

	var newSpaces = [];

	var left1 = r1.x;
	var top1 = r1.y + r1.height;;
	var right1 = r1.x + r1.width;
	var bottom1 = r1.y;

	var left2 = r2.x;
	var top2 = r2.y + r2.height;
	var right2 = r2.x + r2.width;
	var bottom2 = r2.y;

	//top
	if (top1 < top2) {
		var spaceX = r2.x;
		var spaceY = top1;
		var spaceWidth = r2.width;
		var spaceHeight = top2 - top1;
		var newSpace = new rectangle(spaceWidth, spaceHeight, spaceX, spaceY);
		newSpace.corner = getClosestCorner(newSpace);
		newSpace.distance = getDistance(newSpace.corner);
		newSpaces.push(newSpace);
	}

	//right
	if (right1 < right2) {
		var spaceX = right1;
		var spaceY = r2.y;
		var spaceWidth = right2 - right1;
		var spaceHeight = r2.height;
		var newSpace = new rectangle(spaceWidth, spaceHeight, spaceX, spaceY);
		newSpace.corner = getClosestCorner(newSpace);
		newSpace.distance = getDistance(newSpace.corner);
		newSpaces.push(newSpace);
	}

	//bottom
	if (bottom1 > bottom2) {
		var spaceX = r2.x;
		var spaceY = r2.y;
		var spaceWidth = r2.width;
		var spaceHeight = r1.y - r2.y;
		var newSpace = new rectangle(spaceWidth, spaceHeight, spaceX, spaceY);
		newSpace.corner = getClosestCorner(newSpace);
		newSpace.distance = getDistance(newSpace.corner);
		newSpaces.push(newSpace);
	}

	//left
	if (left1 > left2) {
		var spaceX = r2.x;
		var spaceY = r2.y;
		var spaceWidth = r1.x - r2.x;
		var spaceHeight = r2.height;
		var newSpace = new rectangle(spaceWidth, spaceHeight, spaceX, spaceY);
		newSpace.corner = getClosestCorner(newSpace);
		newSpace.distance = getDistance(newSpace.corner);
		newSpaces.push(newSpace);
	}

	return newSpaces;
}

checkIntersection = function(r1, r2) {

	var left1 = r1.x;
	var top1 = r1.y + r1.height;;
	var right1 = r1.x + r1.width;
	var bottom1 = r1.y;

	var left2 = r2.x;
	var top2 = r2.y + r2.height;
	var right2 = r2.x + r2.width;
	var bottom2 = r2.y;

	if (left1 < right2 && right1 > left2 && bottom1 < top2 && top1 > bottom2) {

		return true;
	} else {

		return false;
	}
}

// returns the contained rectangle
checkContainment = function(r1, r2) {
	var left1 = r1.x;
	var top1 = r1.y + r1.height;;
	var right1 = r1.x + r1.width;
	var bottom1 = r1.y;

	var left2 = r2.x;
	var top2 = r2.y + r2.height;
	var right2 = r2.x + r2.width;
	var bottom2 = r2.y;

	if (left1 >= left2 && top1 <= top2 && right1 <= right2 && bottom1 >= bottom2) {
		return 'r1';
	} else if (left1 <= left2 && top1 >= top2 && right1 >= right2 && bottom1 <= bottom2) {
		return 'r2';
	} else {
		return null;
	}

}

removeRedundantSpaces = function() {

	var containedIndices = [];
	for (var i=0; i<spaces.length; i++) {
		var space1 = spaces[i];
		for (var j=i+1; j<spaces.length; j++) {
			var space2 = spaces[j];
			var contained = checkContainment(space1, space2);
			if (contained == 'r1') {
				containedIndices.push(i);
			} else if (contained == 'r2') {
				containedIndices.push(j);
			}
		}
	}

	// sort the array of contained indices
	containedIndices.sort(function(a, b) {
		return b - a;
	});

	var uniqueIndices = [containedIndices[0]];
	for (var i=1; i<containedIndices.length; i++) {
		if (containedIndices[i-1] !== containedIndices[i]) {
			uniqueIndices.push(containedIndices[i]);
		}
	}
	containedIndices = uniqueIndices;


	// remove the contained spaces from space array
	for (var i=1; i<containedIndices.length; i++) {
		spaces.splice(containedIndices[i], 1);
	}

}

getClosestCorner = function(r1) {
	var left1 = r1.x;
	var top1 = r1.y + r1.height;;
	var right1 = r1.x + r1.width;
	var bottom1 = r1.y;
	var cornerX;
	var cornerY;

	var xMin = Math.min(Math.abs(left1), Math.abs(right1));
	var yMin = Math.min(Math.abs(top1), Math.abs(bottom1));

	if (xMin == Math.abs(left1) && yMin == Math.abs(top1)) {
		cornerX = left1;
		cornerY = top1;
		direction = 4;
	} else if (xMin == Math.abs(left1) && yMin == Math.abs(bottom1)) {
		cornerX = left1;
		cornerY = bottom1;
		direction = 1;
	} else if (xMin == Math.abs(right1) && yMin == Math.abs(top1)) {
		cornerX = right1;
		cornerY = top1;
		direction = 3;
	} else {
		cornerX = right1;
		cornerY = bottom1;
		direction = 2;
	}
	return { x: cornerX, y: cornerY, direction: direction };

}

getDistance = function(corner) {
	return Math.sqrt(Math.pow(corner.x, 2) + Math.pow(corner.y, 2));
}

convertCoord = function(r) {
	var rDraw = {};
	rDraw.x = r.x + globalWidth / 2;
	rDraw.y = - r.y + globalWidth / 2 - r.height;
	rDraw.width = r.width;
	rDraw.height = r.height;
	return rDraw;
}


drawPixi = function() {

  renderer = new PIXI.WebGLRenderer($(window).width(), $(window).height());
  document.body.appendChild(renderer.view);
  stage = new PIXI.Container();

  body = document.body;

	var posX = - ( (globalWidth) / 2 - (renderer.width / initialScale) / 2) * initialScale;
	var posY = - ((globalWidth) / 2 - (renderer.height / initialScale) / 2) * initialScale;

  main_layer_zoom_scale = initialScale;
  main_layer_zoom_offset_x = posX;
  main_layer_zoom_offset_y = posY;

  mousedown = false;

  mainLayer = new PIXI.Container;
  stage.interactive = true;
  stage.hitArea = new PIXI.Rectangle(0, 0, renderer.width, renderer.height);
  var graphicLayer = new PIXI.Container;
  graphics = new PIXI.Graphics();

 // graphics.lineStyle(2, 0xFFFF00);
  graphics.beginFill(0x1099bb);

  var x_origin = renderer.width / 2;
  var y_origin = renderer.height / 2;

  graphicLayer.addChild(graphics);
  mainLayer.addChild(graphicLayer);
  stage.addChild(mainLayer);

	mainLayer.scale.set(initialScale, initialScale);
	mainLayer.position.set(posX, posY);

}

animate = function () {
	renderer.render(stage);
}
