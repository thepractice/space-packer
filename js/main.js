

$(document).ready(function() {



	generateRects(300);
	initSpaces();
	initPlacement();
	remainingPlacement();

	convertCoords();
	drawPixi();




	/**
	 *  EVENT LISTENERS
	 */

	var interaction = new PIXI.interaction.InteractionManager(renderer);

	stage.mousedown = function(e){
	    //Reset clientX and clientY to be used for relative location base panning
	    clientX = -1;
	    clientY = -1;
	    mousedown = true;
	};

	stage.mouseup = function(e){
	    mousedown = false;
	};

	stage.mousemove = function(e){

	    e.clientX = e.data.global.x;
	    e.clientY = e.data.global.y;
	    // Check if the mouse button is down to activate panning
	    if(mousedown) {


	        // If this is the first iteration through then set clientX and clientY to match the inital mouse position
	        if(clientX == -1 && clientY == -1) {
	            clientX = e.clientX;
	            clientY = e.clientY;
	        }


	        // Run a relative check of the last two mouse positions to detect which direction to pan on x
	        if(e.clientX == clientX) {
	            xPos = 0;
	        } else if(e.clientX < clientX) {
	            xPos = -Math.abs(e.clientX - clientX);
	        } else if(e.clientX > clientX) {
	            xPos = Math.abs(e.clientX - clientX);
	        }


	        // Run a relative check of the last two mouse positions to detect which direction to pan on y
	        if(e.clientY == clientY) {
	            yPos = 0;
	        } else if(e.clientY < clientY) {
	            yPos = -Math.abs(e.clientY - clientY);
	        } else if(e.clientY > clientY) {
	            yPos = Math.abs(clientY - e.clientY);
	        }

	        // Set the relative positions for comparison in the next frame
	        clientX = e.clientX;
	        clientY = e.clientY;

	        // Change the main layer zoom offset x and y for use when mouse wheel listeners are fired.
	        main_layer_zoom_offset_x = mainLayer.position.x + xPos;
	        main_layer_zoom_offset_y = mainLayer.position.y + yPos;

	        // Move the main layer based on above calucalations
	        mainLayer.position.set(main_layer_zoom_offset_x, main_layer_zoom_offset_y);

	        // Animate the stage
	        requestAnimationFrame(animate);
	    }
	};

	//Attach cross browser mouse wheel listeners
	if (body.addEventListener){
	    body.addEventListener( 'mousewheel', zoom, false );     // Chrome/Safari/Opera
	    body.addEventListener( 'DOMMouseScroll', zoom, false ); // Firefox
	}else if (body.attachEvent){
	    body.attachEvent('onmousewheel',zoom);                  // IE
	}



	/**
	 *  METHODS
	 */

	/**
	 * Detect the amount of distance the wheel has traveled and normalize it based on browsers.
	 * @param  event
	 * @return integer
	 */
	function wheelDistance(evt){
	  if (!evt) evt = event;
	  var w=evt.wheelDelta, d=evt.detail;
	  if (d){
	    if (w) return w/d/40*d>0?1:-1; // Opera
	    else return -d/3;              // Firefox;         TODO: do not /3 for OS X
	  } else return w/120;             // IE/Safari/Chrome TODO: /3 for Chrome OS X
	};

	/**
	 * Detect the direction that the scroll wheel moved
	 * @param event
	 * @return integer
	 */
	function wheelDirection(evt){
	  if (!evt) evt = event;
	  return (evt.detail<0) ? 1 : (evt.wheelDelta>0) ? 1 : -1;
	};

	/**
	 * Zoom into the DisplayObjectContainer that acts as the stage
	 * @param event
	 */
	function zoom(evt){

	    // Find the direction that was scrolled
	    var direction = wheelDirection(evt);

	    // Find the normalized distance
	    var distance = wheelDistance(evt);

	    // Set the old scale to be referenced later
	    var old_scale = main_layer_zoom_scale

	    // Find the position of the clients mouse
	    x = evt.clientX;
	    y = evt.clientY;

	    // Manipulate the scale based on direction
	    main_layer_zoom_scale = old_scale + direction / 3;

	    //Check to see that the scale is not outside of the specified bounds
	    if (main_layer_zoom_scale > main_layer_zoom_scalemax) main_layer_zoom_scale = main_layer_zoom_scalemax
	    else if (main_layer_zoom_scale < main_layer_zoom_scalemin) main_layer_zoom_scale = main_layer_zoom_scalemin

	    // This is the magic. I didn't write this, but it is what allows the zoom to work.
	    main_layer_zoom_offset_x = (main_layer_zoom_offset_x - x) * (main_layer_zoom_scale / old_scale) + x
	    main_layer_zoom_offset_y = (main_layer_zoom_offset_y - y) * (main_layer_zoom_scale / old_scale) + y

	    //Set the position and scale of the DisplayObjectContainer
	    mainLayer.scale.set(main_layer_zoom_scale, main_layer_zoom_scale);
	    mainLayer.position.set(main_layer_zoom_offset_x, main_layer_zoom_offset_y);

	    //Animate the stage
	    requestAnimationFrame(animate);

	}




});


// Global variables
var globalWidth = 10000;
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
	maxX = 0;

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

			// if the rectangle fits in the space, break the space loop and continue. otherwise keep looping through spaces.
			if (contains == 'r1') {
				break;
			}
		}

		//keep track of width of circle
		if (r.x > maxX) {
			maxX = r.x;
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

generateRects = function(n) {

	for (var i=0; i<n; i++) {
		var w = 40 + Math.round(Math.random() * 100);
		var h = 40 + Math.round(Math.random() * 100);
		var r = new rectangle(w, h);
		rect_array.push(r);
	}
/*
	rect_array.sort(function(a, b) {
		return b.width - a.width;
	})
*/
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

  renderer = new PIXI.WebGLRenderer($(window).width(), $(window).height());
  document.body.appendChild(renderer.view);
  stage = new PIXI.Container();

  body = document.body;

	var posX = - ( globalWidth / 2 - renderer.width / 2);
	var posY = - (globalWidth / 2 - renderer.height / 2);

  main_layer_zoom_scale = 1;
  main_layer_zoom_scalemax = 10;
  main_layer_zoom_scalemin = 0.25;
  main_layer_zoom_offset_x = posX;
  main_layer_zoom_offset_y = posY;

  mousedown = false;

  mainLayer = new PIXI.Container;
  stage.interactive = true;
  stage.hitArea = new PIXI.Rectangle(0, 0, renderer.width, renderer.height);
  var graphicLayer = new PIXI.Container;

  graphics = new PIXI.Graphics();

  graphics.lineStyle(2, 0xFFFF00);
  graphics.beginFill(0x1099bb);
//  graphics.beginFill(0xFFFF00);

  var x_origin = renderer.width / 2;
  var y_origin = renderer.height / 2;
/*
  graphics.moveTo(x_origin, 0);

  graphics.lineTo(x_origin, renderer.height);
  graphics.moveTo(0, y_origin);

  graphics.lineTo(renderer.width, y_origin);
*/
  graphicLayer.addChild(graphics);

  mainLayer.addChild(graphicLayer);
  stage.addChild(mainLayer);

  requestAnimationFrame(animate);

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


	mainLayer.scale.set(1, 1);



	mainLayer.position.set(posX, posY);

	requestAnimationFrame(animate);

  animate();

}

animate = function() {

//  requestAnimationFrame(animate);
  renderer.render(stage);

}



