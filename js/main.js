$(document).ready(function() {

	generateRects(25);
	initSpaces();
	initPlacement();
	remainingPlacement();
	convertCoords();
	drawPixi();

});

// Global variables
var globalWidth = 600;
var rect_array = [];
var spaces = [];

rectangle = function(width, height, x, y) {

	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;

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

	var r2 = rect_array[1];
	r2.x = - r2.width / 2;
	r2.y = r1.y + r1.height;
	updateSpaces(r2);

}

remainingPlacement = function() {
	for (var i=2; i<rect_array.length; i++) {
		var r = rect_array[i];

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
			console.log(contains);
			// if the rectangle fits in the space, break the space loop and continue. otherwise keep looping through spaces.
			if (contains == 'r1') {
				break;
			}
		}

		updateSpaces(r);
	}
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
	//removeRedundantSpaces();

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

	// remove the contained spaces from space array
	for (var i=0; i<containedIndices.length; i++) {
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

generateRects = function(n) {

	for (var i=0; i<n; i++) {
		var w = 40 + Math.round(Math.random() * 100);
		var h = 40 + Math.round(Math.random() * 100);
		var r = new rectangle(w, h);
		rect_array.push(r);
	}

}

convertCoords = function() {
	for (var i=0; i<rect_array.length; i++) {
		var r = rect_array[i];
		r.x = r.x + globalWidth / 2;
		r.y = - r.y + globalWidth / 2 - r.height;
	}

	for (var i=0; i<spaces.length; i++) {
		var r = spaces[i];
		r.x = r.x + globalWidth / 2;
		r.y = - r.y + globalWidth / 2 - r.height;
	}

}


drawPixi = function() {

  renderer = new PIXI.WebGLRenderer(globalWidth, globalWidth);
  document.body.appendChild(renderer.view);
  stage = new PIXI.Container();
  var graphics = new PIXI.Graphics();

  graphics.lineStyle(2, 0xFFFF00);
  graphics.beginFill(0x1099bb);
//  graphics.beginFill(0xFFFF00);

  var x_origin = renderer.width / 2;
  var y_origin = renderer.height / 2;

  graphics.moveTo(x_origin, 0);

  graphics.lineTo(x_origin, renderer.height);
  graphics.moveTo(0, y_origin);

  graphics.lineTo(renderer.width, y_origin);

  stage.addChild(graphics);

  for (var i=0; i<rect_array.length; i++) {
  	var r = rect_array[i];
  	if (r.x) {
  		graphics.drawRect(r.x, r.y, r.width, r.height);
  	}
  }
/*
  for (var i=0; i<spaces.length; i++) {
  	graphics.beginFill(0xFFC3A0);
  	var r = spaces[i];
  	graphics.drawRect(r.x, r.y, r.width, r.height);
  }
*/
  animate();

}

animate = function() {

  requestAnimationFrame(animate);
  renderer.render(stage);

}
