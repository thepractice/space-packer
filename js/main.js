$(document).ready(function() {

	drawPixi();

	initPinterestSDK();

//loadSampleImages();

//	console.log(rect_array);
//	initSpaces();
//	initPlacement();
//	processRects(rect_array);

});

// Global variables
var globalWidth = 40000;
var rect_array = [];
var spaces = [];
var image_array = [];
var initialScale = 0.1;
var main_layer_zoom_scalemax = 10;
var main_layer_zoom_scalemin = 0.05;
var pages = 15;
var hiRes = 0;

loadSampleImages = function() {
  var w = 391;
  var h = 643;
  var url = 'https://s-media-cache-ak0.pinimg.com/736x/39/7b/f4/397bf45d28d37011bc9b28fb2a80decd.jpg';
  var r = new rectangle(w, h);
  r.url = url;
  rect_array.push(r);

  var w2 = 498;
  var h2 = 643;
  var url2 = 'https://s-media-cache-ak0.pinimg.com/736x/6d/06/7a/6d067a9f36274c620d8a0186fa14a411.jpg';
  r2 = new rectangle(w2, h2);
  r2.url = url2;
  rect_array.push(r2);

  var w3 = 477;
  var h3 = 643;
  var url3 = 'https://s-media-cache-ak0.pinimg.com/736x/cf/51/e0/cf51e0b9d6b208ac944f48c649cbb109.jpg';
  r3 = new rectangle(w3, h3);
  r3.url = url3;
  rect_array.push(r3);


  pinCallbackFunction();
}

var pictures = [ { } ]

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
/*
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

// pagination

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


}

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

pinCallbackFunction = function() {
	initSpaces();
	initPlacement();
	processRects(rect_array);
}


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
	/*
	graphics.beginFill('0x1099bb');
	graphics.drawRect(firstSpace.x, firstSpace.y, firstSpace.width, firstSpace.height);
	*/
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

	var sprite = PIXI.Sprite.fromImage(rDraw.url);
	sprite.position.x = rDraw.x;
	sprite.position.y = rDraw.y;
	graphicLayer.addChild(sprite);

	renderer.render(stage);

	var r2 = rect_array[1];
	r2.x = - r2.width / 2;
	r2.y = r1.y + r1.height;
	updateSpaces(r2);

	rDraw = convertCoord(r2);
	var sprite = PIXI.Sprite.fromImage(rDraw.url);
	sprite.position.x = rDraw.x;
	sprite.position.y = rDraw.y;
	graphicLayer.addChild(sprite);
	renderer.render(stage);

}

function processRects(rect_array, completionCallback) {
	processed = 2;
	var result = [];

	function doIt() {
		// process up to 1 rectangles at a time
		//placeRect(rect_array[processed], rectCallback);

//////////////////////////////////////////////////////////////
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

      var contains = checkContainment(r, space);

      // if the rectangle fits in the space, break the space loop and continue. otherwise keep looping through spaces.
      if (contains == 'r1') {
        break;
      }
    }

    rDraw = convertCoord(r);
  //  var randColor = '0x'+Math.floor(Math.random()*16777215).toString(16);
  //  graphics.beginFill(randColor);
  //  graphics.beginFill('0x1099bb');
  //  graphics.drawRect(rDraw.x, rDraw.y, rDraw.width, rDraw.height);

    var img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = rDraw.url;
    image_array.push(img);
    imagesLoaded(img, function() {

      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');

      var p = rDraw.width / 20;
      var q = rDraw.height / 20;

      canvas.width = p;
      canvas.height = q;
      canvas.style.width = rDraw.width + 'px';
      canvas.style.height = rDraw.height + 'px';

      context.drawImage(img, 0, 0, p, q);

      var texture5 = new PIXI.Texture.fromCanvas(canvas);

      var sprite = new PIXI.Sprite(texture5);


    //  var sprite = PIXI.Sprite.fromImage(rDraw.url);
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
        setTimeout(doIt, 0);
      } else {
        // processing complete... inform caller
        var timer = performance.now() / 1000;
        console.log(timer);


        renderer.render(stage);
        if (completionCallback) completionCallback(result);
      }


    });

  /*
    var sprite = PIXI.Sprite.fromImage(rDraw.url);
    sprite.position.x = rDraw.x;
    sprite.position.y = rDraw.y;


    graphicLayer.addChild(sprite);



    renderer.render(stage);

    updateSpaces(r);
    */

    /////////////////////////////




	}

	//Schedule computation start.
	setTimeout(doIt, 0);
}

updateRes = function() {
  var scale = main_layer_zoom_scale;
  var viewTop = - mainLayer.position.y / scale;
  var viewBottom = (- mainLayer.position.y + renderer.height ) / scale;
  var viewLeft = -mainLayer.position.x / scale;
  var viewRight = (- mainLayer.position.x + renderer.width ) /scale;
  var viewWidth = renderer.width /scale;
  var viewHeight = renderer.height /scale;

  var view = new rectangle(viewWidth, viewHeight, viewLeft, viewTop);

  if (scale > 0.15){
    console.log('making hi res');

    var sprites = graphicLayer.children;

    for (var i=0; i<sprites.length; i++) {

      var rDraw = convertCoord(rect_array[i]);
      // If in View
      if (checkIntersection(view, rDraw)) {
        sprites[i].visible = true;
        if (sprites[i].hiRes == 0) {

          var url = 'https://crossorigin.me/' + rect_array[i].url;

          var hiResTexture = new PIXI.Texture.fromImage(url);
       //  console.log(image_array[i]);
       //   var hiResTexture = new PIXI.Texture.fromImage(image_array[i].src);

          sprites[i].texture = hiResTexture;
          sprites[i].hiRes = 1;

          hiResTexture.on('update', function() {
            requestAnimationFrame(animate);
          });

        }
      // If not in View
      } else {
        sprites[i].visible = false;
      }

    }
    hiRes = 1;
  } else if (scale <= 0.15 && hiRes == 1) {
    console.log('making low res');


    var sprites = graphicLayer.children;


    for (var j=0; j<sprites.length; j++) {

      sprites[j].visible = true;

      if (sprites[j].hiRes) {

        var rDraw = convertCoord(rect_array[j]);
       // rDraw.url = 'https://crossorigin.me/' + rDraw.url;
        var img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.src = rDraw.url;


        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        var p = rDraw.width / 20;
        var q = rDraw.height / 20;

        canvas.width = p;
        canvas.height = q;
        canvas.style.width = rDraw.width + 'px';
        canvas.style.height = rDraw.height + 'px';

        context.drawImage(img, 0, 0, p, q);

        var texture5 = new PIXI.Texture.fromCanvas(canvas);

        sprites[j].texture = texture5;
        sprites[j].hiRes = 0;

      }





    }
  hiRes = 0;
  }

  requestAnimationFrame(animate);
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
//	var randColor = '0x'+Math.floor(Math.random()*16777215).toString(16);
//	graphics.beginFill(randColor);
//	graphics.beginFill('0x1099bb');
//	graphics.drawRect(rDraw.x, rDraw.y, rDraw.width, rDraw.height);

  var img = new Image();
  img.src = rDraw.url;

  imagesLoaded(img, function() {

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var p = rDraw.width / 20;
    var q = rDraw.height / 20;

    canvas.width = p;
    canvas.height = q;
    canvas.style.width = rDraw.width + 'px';
    canvas.style.height = rDraw.height + 'px';

    context.drawImage(img, 0, 0, p, q);

    var texture5 = new PIXI.Texture.fromCanvas(canvas);
    var sprite = new PIXI.Sprite(texture5);


  //  var sprite = PIXI.Sprite.fromImage(rDraw.url);
    sprite.position.x = rDraw.x;
    sprite.position.y = rDraw.y;

    sprite.width = rDraw.width;
    sprite.height = rDraw.height;

    graphicLayer.addChild(sprite);

    renderer.render(stage);
    updateSpaces(r);

  });

/*
  var sprite = PIXI.Sprite.fromImage(rDraw.url);
  sprite.position.x = rDraw.x;
  sprite.position.y = rDraw.y;


  graphicLayer.addChild(sprite);



  renderer.render(stage);

	updateSpaces(r);
  */
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
	rDraw.url = 'https://crossorigin.me/' + r.url;
 // rDraw.url = 'http://cors.io/?u=' + r.url;
  rDraw.color = r.color;
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

