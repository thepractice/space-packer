$(document).ready(function() {

	drawPixi();
	initPinterestSDK();
// loadSampleImages();

});

// Global variables
var globalWidth = 40000;
var rect_array = [];
var spaces = [];
var image_array = [];
var initialScale = 0.1;
var main_layer_zoom_scalemax = 10;
var main_layer_zoom_scalemin = 0.05;
var pages = 5;
var hiRes = 0;

/*
 * Checks for pinterest session.
 * If pinterest session is set, calling this function starts chain that ends in full rendering.
 */
initPinterestSDK = function() {
  window.pAsyncInit = function() {
      PDK.init({
          appId: "4794481293328913447", // Change this
          cookie: true
      });

      var session = JSON.parse(localStorage.getItem('session'));

      PDK.setSession(session, function(response) {
        if (!response || !response.session) {
          alert('Session was not set. Please log in.');
        } else {
          // session has been set
          console.log('session set');
          getPins(session);
        }
      })

  };

  (function(d, s, id){
      var js, pjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "//assets.pinterest.com/sdk/sdk.js";
      pjs.parentNode.insertBefore(js, pjs);
  }(document, 'script', 'pinterest-jssdk'));

}

/**
 *  Login to Pinterest
 *  Successullly loggin in results in chain that ends in full display.
 */
pinterestLogin = function() {
  PDK.login({scope : 'read_public, write_public'}, function(session) {
    if (!session) {
      alert('The user chose not to grant permissions or closed the pop-up');
    } else {
      console.log('Thanks for authenticating. Getting your information...');
      PDK.me(function(response) {
        if (!response || response.error) {
          alert('Oops, there was a problem getting your information');
        } else {
          console.log('Welcome,  ' + response.data.first_name + '!');
          pinterestLoginSuccess();
        }
      });
    }
  });

}

pinterestLoginSuccess = function() {
  var session = PDK.getSession();
  if (!session) {
    alert('No session has been set.');
  } else {
    // save session to server
    localStorage.setItem('session', JSON.stringify(session));
  }
  getPins(session);

}

getPins = function(session) {

  // pagination Method
  var pins = [];
  var counter = 0;
  PDK.request('/me/pins/', {
    access_token: session.accessToken,
    fields: 'id,creator,color,board,image[original,medium,large,small]'
  }, function (response) {

    if (!response || response.error) {
      alert('Error occurred');
    } else {
      pins = pins.concat(response.data);
      counter += 1;

      if (response.hasNext && counter < pages) {
        response.next(); // this will recursively go to this same callback
      }

      if (!response.hasNext || counter >= pages) {

        addPins(pins, pinCallbackFunction);

      }

    }

  });

/* //// Alternate method to get pins using pinterest js sdk
  PDK.me('pins', {
      access_token: session.accessToken, // Change this
      limit: 100,
      fields: 'id,creator,color,board,image[original,medium,large,small]'
    }, function(response) {
    if (!response || response.error) {
      alert('Error occurred');
    } else {
      var pins = response.data;
      addPins(pins, pinCallbackFunction);
      console.log(pins);
    }
  });
*/

}

/**
 *  Pushes pins to rect_array.
 */
addPins = function(pins, pinCallback) {

  for (var i=0; i<pins.length; i++) {
  	var image = pins[i].image.original;
  	var width = image.width;
  	var height = image.height;
  	var url = image.url;
  	var r = new rectangle(width, height);
  	r.url = url;
  	rect_array.push(r);
  }

  pinCallback();
}

/**
 *  Packs rectangles.
 *  Called after rect_array has been fully loaded.
 */
pinCallbackFunction = function() {
	initSpaces();
	initPlacement();
	processRects(rect_array);
}

/**
 *  Rectangle Object
 */
rectangle = function(width, height, x, y, url) {

	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
  this.url = url;

  this.left = this.x;
  this.top = this.y + this.height;;
  this.right = this.x + this.width;
  this.bottom = this.y;

}

updateRect = function(r) {

  r.left = r.x;
  r.top = r.y + r.height;;
  r.right = r.x + r.width;
  r.bottom = r.y;

}

/**
 *  Creates first 'Space', which is giant rectangle.
 */
initSpaces = function() {

	var firstSpace = new rectangle(globalWidth, globalWidth, - globalWidth / 2, - globalWidth / 2);
	firstSpace.corner = getClosestCorner(firstSpace);
	firstSpace.distance = getDistance(firstSpace.corner);
	spaces.push(firstSpace);

}

/**
 * Places the first 2 rectangles.
 */
initPlacement = function() {

	var r1 = rect_array[0];
	r1.x = - r1.width / 2;
	r1.y = - r1.height / 2;
  updateRect(r1);
	updateSpaces(r1);

  var r2 = rect_array[1];
  r2.x = - r2.width / 2;
  r2.y = r1.y + r1.height;
  updateRect(r2);
  updateSpaces(r2);

  var firstTwo = [r1, r2];

  for (var i=0; i<firstTwo.length; i++) {

    var rDraw = convertCoord(firstTwo[i]);
    var sprite = PIXI.Sprite.fromImage(rDraw.url);
    sprite.position.x = rDraw.x;
    sprite.position.y = rDraw.y;
    graphicLayer.addChild(sprite);

  }

	renderer.render(stage);

}

/**
 *  Places the remaining rectangles synchronously.
 */
function processRects(rect_array, completionCallback) {
  // starting index
	var processed = 2;

  /**
   * Places a single rectangle, using the index 'processed'.
   */
	function placeRect() {

    var r = rect_array[processed];

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
      updateRect(r);
      var contains = checkContainment(r, space);

      // if the rectangle fits in the space, break the space loop and continue. otherwise keep looping through spaces.
      if (contains == 'r1') {
        break;
      }
    }

    rDraw = convertCoord(r);

    var img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = rDraw.url;
    image_array.push(img);
    imagesLoaded(img, function() {

      var texture = getTextureFromCanvas(rDraw, img);
      var sprite = new PIXI.Sprite(texture);

      sprite.position.x = rDraw.x;
      sprite.position.y = rDraw.y;
      sprite.hiRes = 0;

      sprite.width = rDraw.width;
      sprite.height = rDraw.height;

      graphicLayer.addChild(sprite);

      renderer.render(stage);
      updateSpaces(r);

      processed++;

      if (processed < rect_array.length) {
        // not finished, schedule another block.
        setTimeout(placeRect, 0);
      } else {
        // processing complete... inform caller
        var timer = performance.now() / 1000;
        console.log(timer);

        renderer.render(stage);
      }

    });

	}

	//Schedule computation start.
	setTimeout(placeRect, 0);
}

/**
 * Produces a texture from an image-rectangle, via Canvas.
 */
getTextureFromCanvas = function(rDraw, img) {

  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');

  var p = rDraw.width / 20;
  var q = rDraw.height / 20;

  canvas.width = p;
  canvas.height = q;
  canvas.style.width = rDraw.width + 'px';
  canvas.style.height = rDraw.height + 'px';

  context.drawImage(img, 0, 0, p, q);

  var texture = new PIXI.Texture.fromCanvas(canvas);

  return texture;

}

/**
 * Updates sprites after zoom or pan.
 */
updateDisplay = function() {
  var scale = main_layer_zoom_scale;
  var viewTop = - mainLayer.position.y / scale;
  var viewLeft = -mainLayer.position.x / scale;
  var viewWidth = renderer.width /scale;
  var viewHeight = renderer.height /scale;

  var view = new rectangle(viewWidth, viewHeight, viewLeft, viewTop);

  // If zoomed in, make visible sprites hi-res and make off-screen sprites not visible.
  if (scale > 0.15){

    var sprites = graphicLayer.children;

    for (var i=0; i<sprites.length; i++) {

      var sprite = sprites[i];

      var rDraw = convertCoord(rect_array[i]);
      // If in View
      if (checkIntersection(view, rDraw)) {
        sprite.visible = true;
        if (sprite.hiRes == 0) {

          var hiResTexture = new PIXI.Texture.fromImage(rDraw.url);

          sprite.texture = hiResTexture;
          sprite.hiRes = 1;

          hiResTexture.on('update', function() {
            requestAnimationFrame(animate);
          });

        }
      // If not in View
      } else sprites[i].visible = false;

    }
    hiRes = 1;
  // If zoomed out and displaying some hi-res sprites, display all sprites in low-res.
  } else if (scale <= 0.15 && hiRes == 1) {

    var sprites = graphicLayer.children;

    for (var j=0; j<sprites.length; j++) {
      var sprite = sprites[j];

      sprite.visible = true;

      if (sprite.hiRes) {

        var rDraw = convertCoord(rect_array[j]);
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = rDraw.url;
        var texture = getTextureFromCanvas(rDraw, img);
        sprite.texture = texture;
        sprite.hiRes = 0;

      }

    }
  hiRes = 0;
  }

  requestAnimationFrame(animate);
}

/**
 * Update the global 'spaces' array.
 */
updateSpaces = function(rectangle) {
	var newSpaces = [];
	for (var i=0; i<spaces.length; i++) {
    var space = spaces[i];
		// if rectangle intersects space
		if (checkIntersection(rectangle, space)) {
			// generate new spaces
			var freshSpaces = getNewSpaces(rectangle, space);
			for (var j=0; j<freshSpaces.length; j++) {
				newSpaces.push(freshSpaces[j]);
			}
		} else {
			newSpaces.push(space);
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

	//top
	if (r1.top < r2.top) {
		var spaceX = r2.x;
		var spaceY = r1.top;
		var spaceWidth = r2.width;
		var spaceHeight = r2.top - r1.top;
		var newSpace = new rectangle(spaceWidth, spaceHeight, spaceX, spaceY);
		newSpace.corner = getClosestCorner(newSpace);
		newSpace.distance = getDistance(newSpace.corner);
		newSpaces.push(newSpace);
	}

	//right
	if (r1.right < r2.right) {
		var spaceX = r1.right;
		var spaceY = r2.y;
		var spaceWidth = r2.right - r1.right;
		var spaceHeight = r2.height;
		var newSpace = new rectangle(spaceWidth, spaceHeight, spaceX, spaceY);
		newSpace.corner = getClosestCorner(newSpace);
		newSpace.distance = getDistance(newSpace.corner);
		newSpaces.push(newSpace);
	}

	//bottom
	if (r1.bottom > r2.bottom) {
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
	if (r1.left > r2.left) {
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

	if (r1.left < r2.right && r1.right > r2.left && r1.bottom < r2.top && r1.top > r2.bottom) {
		return true;
	} else {
		return false;
	}
}

// returns the contained rectangle
checkContainment = function(r1, r2) {

	if (r1.left >= r2.left && r1.top <= r2.top && r1.right <= r2.right && r1.bottom >= r2.bottom) {
		return 'r1';
	} else if (r1.left <= r2.left && r1.top >= r2.top && r1.right >= r2.right && r1.bottom <= r2.bottom) {
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

/**
 * Converts rectangle object to new object with converted coordinates for use with Pixi.
 */
convertCoord = function(r) {
	var rDraw = {};
	rDraw.x = r.x + globalWidth / 2;
	rDraw.y = - r.y + globalWidth / 2 - r.height;
	rDraw.width = r.width;
	rDraw.height = r.height;
	rDraw.url = 'https://crossorigin.me/' + r.url;
  rDraw.color = r.color;
	return rDraw;
}


drawPixi = function() {

  renderer = new PIXI.autoDetectRenderer($(window).width(), $(window).height());
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
  graphicLayer = new PIXI.Container();
 // graphics = new PIXI.Graphics();

 // graphics.lineStyle(2, 0xFFFF00);
 // graphics.beginFill(0x1099bb);

 // var x_origin = renderer.width / 2;
 // var y_origin = renderer.height / 2;

 // graphicLayer.addChild(graphics);
  mainLayer.addChild(graphicLayer);
  stage.addChild(mainLayer);

	mainLayer.scale.set(initialScale, initialScale);
	mainLayer.position.set(posX, posY);

}

animate = function () {
	renderer.render(stage);
}

/*
 * Fills rect_array with sample images
 */
loadSampleImages = function() {

  var r1 = new rectangle(391, 643, null, null, 'https://s-media-cache-ak0.pinimg.com/736x/39/7b/f4/397bf45d28d37011bc9b28fb2a80decd.jpg');
  var r2 = new rectangle(498, 643, null, null, 'https://s-media-cache-ak0.pinimg.com/736x/6d/06/7a/6d067a9f36274c620d8a0186fa14a411.jpg');
  var r3 = new rectangle(477, 643, null, null, 'https://s-media-cache-ak0.pinimg.com/736x/cf/51/e0/cf51e0b9d6b208ac944f48c649cbb109.jpg');
  rect_array.push(r1, r2, r3);

  pinCallbackFunction();
}

/**
 *  Loads rect_array with random rectangles, without urls.
 */
generateRects = function(n) {

  for (var i=0; i<n; i++) {
    var w = 40 + Math.round(Math.random() * 500);
    var h = 40 + Math.round(Math.random() * 500);
    var r = new rectangle(w, h);
    rect_array.push(r);
  }

}
