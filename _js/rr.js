var BubbleShoot = window.BubbleShoot || {};
BubbleShoot.width = window.innerWidth > 1000 ? 1000 : window.innerWidth;
BubbleShoot.height = window.innerHeight < 738 ? 500 :  window.innerHeight;
window.onload = function() {
  // Get the canvas and context
  document.getElementById("top_bar").style.width = BubbleShoot.width;
  var canvas1 = document.getElementById('canvas'); //finds Original Canvas
  var canv = document.createElement('canvas'); // creates new canvas element
  canv.id = 'canvasdummy'; // gives canvas id
  canv.height = BubbleShoot.height; //get original canvas height
  canv.width = BubbleShoot.width;
  document.body.appendChild(canv); // adds the canvas to the body element
  var canvas = document.getElementById('canvasdummy'); //find new canvas we created
  var context = canvas.getContext('2d');
  canvas.width = BubbleShoot.width;
  // Timing and frames per second
  var lastframe = 0;
  var fpstime = 0;
  var framecount = 0;
  var fps = 0;

  var initialized = false;
  var isMobile = window.innerWidth < 1000
  // Level
  var level = {
    x: 0,           // X position
    y: 105,          // Y position
    width: 0,       // Width, gets calculated
    height: 0,      // Height, gets calculated
    columns: 15,    // Number of tile columns
    rows: 26,       // Number of tile rows
    tilewidth: !isMobile ? 60 : 64,  // Visual width of a tile
    tileheight: !isMobile ? 60 : 64, // Visual height of a tile
    rowheight: !isMobile ? 55 : 55,  // Height of a row
    radius: !isMobile ? 30 : 32,     // Bubble collision radius
    tiles: []       // The two-dimensional tile array
  };

  var touchMouse = (function(){
    "use strict";
    var timeStart, touchStart, mouseTouch, listeningElement, hypot;


    mouseTouch = {};  // the public object
    // public properties.
    mouseTouch.clickRadius = 3; // if touch start and end within 3 pixels then may be a click
    mouseTouch.clickTime = 200; // if touch start and end in under this time in ms then may be a click
    mouseTouch.generateClick = true; // if true simulates onClick event
                                     // if false only generate mousedown, mousemove, and mouseup
    mouseTouch.clickOnly = false; // if true on generate click events
    mouseTouch.status = "Started."; // just for debugging



    // ES6 new math function
    // not sure the extent of support for Math.hypot so hav simple poly fill
    if(typeof Math.hypot === 'function'){
      hypot = Math.hypot;
    }else{
      hypot = function(x,y){  // Untested
        return Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
      };
    }
    // Use the new API and MouseEvent object
    function triggerMouseEvemt(type,fromTouch,fromEvent){
      var mouseEvent = new MouseEvent(
        type,
        {
          'view': fromEvent.target.ownerDocument.defaultView,
          'bubbles': true,
          'cancelable': true,
          'screenX':fromTouch.screenX,
          'screenY':fromTouch.screenY,
          'clientX':fromTouch.clientX,
          'clientY':fromTouch.clientY,
          'offsetX':fromTouch.clientX, // this is for old Chrome
          'offsetY':fromTouch.clientY,
          'ctrlKey':fromEvent.ctrlKey,
          'altKey':fromEvent.altKey,
          'shiftKey':fromEvent.shiftKey,
          'metaKey':fromEvent.metaKey,
          'button':0,
          'buttons':1,
        });
      // to do.
      // dispatch returns cancelled you will have to
      // add code here if needed
      fromTouch.target.dispatchEvent(mouseEvent);
    }

    // touch listener. Listens to Touch start, move and end.
    // dispatches mouse events as needed. Also sends a click event
    // if click falls within supplied thresholds and conditions
    function emulateMouse(event) {

      var type, time, touch, isClick, mouseEventType, x, y, dx, dy, dist;
      event.preventDefault();  // stop any default happenings interfering
      type = event.type ;  // the type.

      // ignore multi touch input
      if (event.touches.length > 1){
        if(touchStart !== undefined){ // don't leave the mouse down
          triggerMouseEvent("mouseup",event.changedTouches[0],event);
        }
        touchStart = undefined;
        return;
      }
      mouseEventType = "";
      isClick = false;  // default no click
      // check for each event type I have the most numorus move event first, Good practice to always think about the efficancy for conditional coding.
      if(type === "touchmove" && !mouseTouch.clickOnly){        // touchMove
        touch = event.changedTouches[0];
        mouseEventType = "mousemove";      // not much to do just move the mouse
      }else
      if(type === "touchstart"){
        touch = touchStart = event.changedTouches[0]; // save the touch start for dist check
        timeStart = event.timeStamp; // save the start time
        mouseEventType = !mouseTouch.clickOnly?"mousedown":"";     // mouse event to create
      }else
      if(type === "touchend"){  // end check time and distance
        touch =  event.changedTouches[0];
        mouseEventType = !mouseTouch.clickOnly?"mouseup":"";     // ignore mouse up if click only
        // if click generator active
        if(touchStart !== undefined && mouseTouch.generateClick){
          time = event.timeStamp - timeStart;  // how long since touch start
          // if time is right
          if(time < mouseTouch.clickTime){
            // get the distance from the start touch
            dx = touchStart.clientX-touch.clientX;
            dy = touchStart.clientY-touch.clientY;
            dist = hypot(dx,dy);
            if(dist < mouseTouch.clickRadius){
              isClick = true;
            }
            debugger
          }
        }
      }
      // send mouse basic events if any
      if(mouseEventType !== ""){
        // send the event
        console.log('touch', mouseEventType)
        if(mouseEventType === 'mouseup') {
          onMouseDown(touch)
        }

        if(mouseEventType === 'mousemove') {
          onMouseMove(touch)
        }
        //triggerMouseEvent(mouseEventType,touch,event);
      }
      // if a click also generates a mouse click event
      if(isClick){
        // generate mouse click
        triggerMouseEvent("click",touch,event);
      }
    }

    // remove events
    function removeTouchEvents(){
      listeningElement.removeEventListener("touchstart", emulateMouse);
      listeningElement.removeEventListener("touchend", emulateMouse);
      listeningElement.removeEventListener("touchmove", emulateMouse);
      listeningElement = undefined;

    }

    // start  adds listeners and makes it all happen.
    // element is optional and will default to document.
    // or will Listen to element.
    function startTouchEvents(element){
      if(listeningElement !== undefined){ // untested
        // throws to stop cut and past useage of this example code.
        // Overwriting the listeningElement can result in a memory leak.
        // You can remove this condition block and it will work
        // BUT IT IS NOT RECOGMENDED

        throw new ReferanceError("touchMouse says!!!! API limits functionality to one element.");
      }
      if(element === undefined){
        element = document;
      }
      listeningElement = element;
      listeningElement.addEventListener("touchstart", emulateMouse);
      listeningElement.addEventListener("touchend", emulateMouse);
      listeningElement.addEventListener("touchmove", emulateMouse);
    }

    // add the start event to public object.
    mouseTouch.start = startTouchEvents;
    // stops event listeners and remove them from the DOM
    mouseTouch.stop = removeTouchEvents;

    return mouseTouch;

  })();


  // Define a tile class
  var Tile = function(x, y, type, shift) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.removed = false;
    this.shift = shift;
    this.velocity = 0;
    this.alpha = 1;
    this.processed = false;
  };

  // Player
  var player = {
    x: 100,
    y: 0,
    angle: 0,
    tiletype: 0,
    bubble: {
      x: 0,
      y: 0,
      angle: 100,
      speed: 3500,
      dropspeed: 2600,
      tiletype: 0,
      visible: false
    },
    nextbubble: {
      x: 0,
      y: 0,
      tiletype: 4,
      colors: [4,2,3,1]
    }
  };

  // Neighbor offset table
  var neighborsoffsets = [[[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]], // Even row tiles
    [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]]];  // Odd row tiles

  // Number of different colors
  var bubblecolors = 7;//萬用球  白

  // Game states
  var gamestates = { init: 0, ready: 1, shootbubble: 2, removecluster: 3, gameover: 4};
  var gamestate = gamestates.init;

  // Score
  var score = 0;

  var turncounter = 0;
  var rowoffset = 0;

  // Animation variables
  var animationstate = 0;
  var animationtime = 0;

  // Clusters
  var showcluster = false;
  var cluster = [];
  var floatingclusters = [];

  // Images
  var images = [];
  var bubbleimage;

  // Image loading global variables
  var loadcount = 0;
  var loadtotal = 0;
  var preloaded = false;

  // Load images
  function loadImages(imagefiles) {
    // Initialize variables
    loadcount = 0;
    loadtotal = imagefiles.length;
    preloaded = false;

    // Load the images
    var loadedimages = [];
    for (var i=0; i<imagefiles.length; i++) {
      // Create the image object
      var image = new Image();

      // Add onload event handler
      image.onload = function () {
        loadcount++;
        if (loadcount == loadtotal) {
          // Done loading
          preloaded = true;
        }
      };

      // Set the source url of the image
      image.src = imagefiles[i];

      // Save to the image array
      loadedimages[i] = image;
    }

    // Return an array of images
    return loadedimages;
  }

  // Initialize the game
  function init() {
    // Load images
    images = loadImages(["./bubble-sprites.png"]);
    bubbleimage = images[0];

    // Add mouse events
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    if(canvas !== null){
      touchMouse.generateClick = false; // no mouse clicks please
      touchMouse.start(canvas);
    }
    // Initialize the two-dimensional tile array
    for (var i=0; i<level.columns; i++) {
      level.tiles[i] = [];
      for (var j=0; j<level.rows; j++) {
        // Define a tile type and a shift parameter for animation
        level.tiles[i][j] = new Tile(i, j, 0, 0)
      }
    }
    //灰色版面
    level.width = BubbleShoot.width;
    level.height = window.innerHeight - 200;

    // Init the player 玩家發射球排版位置
    player.x = level.x + level.width/2- level.tilewidth/2;
    player.y = level.y + level.height;
    player.angle = 90;
    player.tiletype = 0;

    player.nextbubble.x = player.x - 2 * level.tilewidth;
    player.nextbubble.y = player.y;

    // New game
    newGame();

    // Enter main loop
    main(0);
  }

  // Main loop
  function main(tframe) {
    // Request animation frames
    window.requestAnimationFrame(main);

    if (!initialized) {
      // Preloader

      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the frame
      drawFrame();

      if (preloaded) {
        // Add a delay for demonstration purposes
        setTimeout(function(){initialized = true;}, 1000);
      }
    } else {
      // Update and render the game
      update(tframe);
      render();
    }
  }

  // Update the game state
  function update(tframe) {
    var dt = (tframe - lastframe) / 1000;
    lastframe = tframe;

    // Update the fps counter
    updateFps(dt);

    if (gamestate == gamestates.ready) {
      // Game is ready for player input
    } else if (gamestate == gamestates.shootbubble) {
      // Bubble is moving
      stateShootBubble(dt);
    } else if (gamestate == gamestates.removecluster) {
      // Remove cluster and drop tiles
      stateRemoveCluster(dt);
    }
  }

  function setGameState(newgamestate) {
    gamestate = newgamestate;

    animationstate = 0;
    animationtime = 0;
  }

  function stateShootBubble(dt) {
    // Bubble is moving

    // Move the bubble in the direction of the mouse
    player.bubble.x += dt * player.bubble.speed * Math.cos(degToRad(player.bubble.angle));
    player.bubble.y += dt * player.bubble.speed * -1*Math.sin(degToRad(player.bubble.angle));

    // Handle left and right collisions with the level
    if (player.bubble.x <= level.x) {
      // Left edge
      player.bubble.angle = 180 - player.bubble.angle;
      player.bubble.x = level.x;
    } else if (player.bubble.x + level.tilewidth >= level.x + level.width) {
      // Right edge
      player.bubble.angle = 180 - player.bubble.angle;
      player.bubble.x = level.x + level.width - level.tilewidth;
    }

    // Collisions with the top of the level
    if (player.bubble.y <= level.y) {
      // Top collision
      player.bubble.y = level.y;
      snapBubble();
      return;
    }

    // Collisions with other tiles
    for (var i=0; i<level.columns; i++) {
      for (var j=0; j<level.rows; j++) {
        var tile = level.tiles[i][j];

        // Skip empty tiles
        if (tile.type < 0) {
          continue;
        }

        // Check for intersections
        var coord = getTileCoordinate(i, j);
        if (circleIntersection(player.bubble.x + level.tilewidth/2,
          player.bubble.y + level.tileheight/2,
          level.radius,
          coord.tilex + level.tilewidth/2,
          coord.tiley + level.tileheight/2,
          level.radius)) {

          // Intersection with a level bubble
          snapBubble();
          return;
        }
      }
    }
  }

  function stateRemoveCluster(dt) {
    if (animationstate == 0) {
      resetRemoved();

      // Mark the tiles as removed
      for (var i=0; i<cluster.length; i++) {
        // Set the removed flag
        cluster[i].removed = true;
      }

      // Add cluster score
      score += cluster.length * 2;

      // Find floating clusters
      floatingclusters = findFloatingClusters();

      if (floatingclusters.length > 0) {
        // Setup drop animation 掉下來的也計算
        for (var i=0; i<floatingclusters.length; i++) {
          for (var j=0; j<floatingclusters[i].length; j++) {
            var tile = floatingclusters[i][j];
            tile.shift = 0;
            tile.shift = 1;
            tile.velocity = player.bubble.dropspeed;

            score += 10;
          }
        }
      }

      animationstate = 1;
    }

    if (animationstate == 1) {
      // Pop bubbles
      var tilesleft = false;
      for (var i=0; i<cluster.length; i++) {
        var tile = cluster[i];

        if (tile.type >= 0) {
          tilesleft = true;

          // Alpha animation
          tile.alpha -= dt * 15;
          if (tile.alpha < 0) {
            tile.alpha = 0;
          }

          if (tile.alpha == 0) {
            tile.type = -1;
            tile.alpha = 1;
          }
        }
      }

      // Drop bubbles
      for (var i=0; i<floatingclusters.length; i++) {
        for (var j=0; j<floatingclusters[i].length; j++) {
          var tile = floatingclusters[i][j];

          if (tile.type >= 0) {
            tilesleft = true;

            // Accelerate dropped tiles
            tile.velocity += dt * 700;
            tile.shift += dt * tile.velocity;

            // Alpha animation
            tile.alpha -= dt * 8;
            if (tile.alpha < 0) {
              tile.alpha = 0;
            }

            // Check if the bubbles are past the bottom of the level
            if (tile.alpha == 0 || (tile.y * level.rowheight + tile.shift > (level.rows - 1) * level.rowheight + level.tileheight)) {
              tile.type = -1;
              tile.shift = 0;
              tile.alpha = 1;
            }
          }

        }
      }

      if (!tilesleft) {//檢查是否結束
        // Next bubble
        nextBubble();

        // Check for game over
        var tilefound = false
        for (var i=0; i<level.columns; i++) {
          for (var j=0; j<level.rows; j++) {
            if (level.tiles[i][j].type != -1) {
              tilefound = true;
              break;
            }
          }
        }

        if (tilefound) {
          setGameState(gamestates.ready);
        } else {
          // No tiles left, game over
          setGameState(gamestates.gameover);
        }
      }
    }
  }

  // Snap bubble to the grid
  function snapBubble() {
    // Get the grid position
    var centerx = player.bubble.x + level.tilewidth/2;
    var centery = player.bubble.y + level.tileheight/2;
    var gridpos = getGridPosition(centerx, centery);

    // Make sure the grid position is valid
    if (gridpos.x < 0) {
      gridpos.x = 0;
    }

    if (gridpos.x >= level.columns) {
      gridpos.x = level.columns - 1;
    }

    if (gridpos.y < 0) {
      gridpos.y = 0;
    }

    if (gridpos.y >= level.rows) {
      gridpos.y = level.rows - 1;
    }

    // Check if the tile is empty
    var addtile = false;
    if (level.tiles[gridpos.x][gridpos.y].type !=-1) {
      // Tile is not empty, shift the new tile downwards 加到目標格子
      for (var newrow=gridpos.y+1; newrow<level.rows; newrow++) {
        if (level.tiles[gridpos.x][newrow].type == -1) {
          gridpos.y = newrow;
          addtile = true;
          break;
        }
      }
    } else {
      addtile = true;
    }

    // Add the tile to the grid
    if (addtile) {
      // Hide the player bubble
      player.bubble.visible = false;

      // Set the tile
      if(player.bubble.tiletype==6){//百搭球(實驗)
        level.tiles[gridpos.x][gridpos.y].type=level.tiles[gridpos.x][gridpos.y-1].type;
      }else{level.tiles[gridpos.x][gridpos.y].type = player.bubble.tiletype;
      }

      // Check for game over
      if (checkGameOver()) {
        return;
      }

      // Find clusters
      cluster = findCluster(gridpos.x, gridpos.y, true, true, false);

      if (cluster.length >= 3) {
        // Remove the cluster
        setGameState(gamestates.removecluster);
        return;
      }
    }

    // No clusters found
    turncounter++;
    if (turncounter >= 5) {
      // Add a row of bubbles
      //addBubbles();
      turncounter = 0;
      rowoffset = (rowoffset + 1) % 2;

      if (checkGameOver()) {
        return;
      }
    }

    // Next bubble
    nextBubble();
    setGameState(gamestates.ready);
  }

  function checkGameOver() {
    // Check for game over
    for (var i=0; i<level.columns; i++) {
      // Check if there are bubbles in the bottom row
      if (level.tiles[i][level.rows-1].type != -1) {
        // Game over
        nextBubble();
        setGameState(gamestates.gameover);
        return true;
      }
    }

    return false;
  }

  function addBubbles() {
    // Move the rows downwards
    for (var i=0; i<level.columns; i++) {
      for (var j=0; j<level.rows-1; j++) {
        level.tiles[i][level.rows-1-j].type = level.tiles[i][level.rows-1-j-1].type;
      }
    }

    // Add a new row of bubbles at the top
    for (var i=0; i<level.columns; i++) {
      // Add random, existing, colors
      level.tiles[i][0].type = getExistingColor();
    }
  }

  // Find the remaining colors
  function findColors() {
    var foundcolors = [];
    var colortable = [];
    for (var i=0; i<bubblecolors; i++) {
      colortable.push(false);
    }

    // Check all tiles
    for (var i=0; i<level.columns; i++) {
      for (var j=0; j<level.rows; j++) {
        var tile = level.tiles[i][j];
        if (tile.type >= 0) {
          if (!colortable[tile.type]) {
            colortable[tile.type] = true;
            foundcolors.push(tile.type);
          }
        }
      }
    }

    return foundcolors;
  }

  // Find cluster at the specified tile location
  function findCluster(tx, ty, matchtype, reset, skipremoved) {
    // Reset the processed flags
    if (reset) {
      resetProcessed();
    }

    // Get the target tile. Tile coord must be valid.
    var targettile = level.tiles[tx][ty];

    // Initialize the toprocess array with the specified tile
    var toprocess = [targettile];
    targettile.processed = true;
    var foundcluster = [];

    while (toprocess.length > 0) {
      // Pop the last element from the array
      var currenttile = toprocess.pop();

      // Skip processed and empty tiles
      if (currenttile.type == -1) {
        continue;
      }

      // Skip tiles with the removed flag
      if (skipremoved && currenttile.removed) {
        continue;
      }

      // Check if current tile has the right type, if matchtype is true
      if (!matchtype || (currenttile.type == targettile.type)) {
        // Add current tile to the cluster
        foundcluster.push(currenttile);

        // Get the neighbors of the current tile
        var neighbors = getNeighbors(currenttile);

        // Check the type of each neighbor
        for (var i=0; i<neighbors.length; i++) {
          if (!neighbors[i].processed) {
            // Add the neighbor to the toprocess array
            toprocess.push(neighbors[i]);
            neighbors[i].processed = true;
          }
        }
      }
    }

    // Return the found cluster
    return foundcluster;
  }

  // Find floating clusters
  function findFloatingClusters() {
    // Reset the processed flags
    resetProcessed();

    var foundclusters = [];

    // Check all tiles
    for (var i=0; i<level.columns; i++) {
      for (var j=0; j<level.rows; j++) {
        var tile = level.tiles[i][j];
        if (!tile.processed) {
          // Find all attached tiles
          var foundcluster = findCluster(i, j, false, false, true);

          // There must be a tile in the cluster
          if (foundcluster.length <= 0) {
            continue;
          }

          // Check if the cluster is floating
          var floating = true;
          for (var k=0; k<foundcluster.length; k++) {
            if (foundcluster[k].y == 0) {
              // Tile is attached to the roof
              floating = false;
              break;
            }
          }

          if (floating) {
            // Found a floating cluster
            foundclusters.push(foundcluster);
          }
        }
      }
    }

    return foundclusters;
  }

  // Reset the processed flags
  function resetProcessed() {
    for (var i=0; i<level.columns; i++) {
      for (var j=0; j<level.rows; j++) {
        level.tiles[i][j].processed = false;
      }
    }
  }

  // Reset the removed flags
  function resetRemoved() {
    for (var i=0; i<level.columns; i++) {
      for (var j=0; j<level.rows; j++) {
        level.tiles[i][j].removed = false;
      }
    }
  }

  // Get the neighbors of the specified tile
  function getNeighbors(tile) {
    var tilerow = (tile.y + rowoffset) % 2; // Even or odd row
    var neighbors = [];

    // Get the neighbor offsets for the specified tile
    var n = neighborsoffsets[tilerow];

    // Get the neighbors
    for (var i=0; i<n.length; i++) {
      // Neighbor coordinate
      var nx = tile.x + n[i][0];
      var ny = tile.y + n[i][1];

      // Make sure the tile is valid
      if (nx >= 0 && nx < level.columns && ny >= 0 && ny < level.rows) {
        neighbors.push(level.tiles[nx][ny]);
      }
    }

    return neighbors;
  }

  function updateFps(dt) {
    if (fpstime > 0.25) {
      // Calculate fps
      fps = Math.round(framecount / fpstime);

      // Reset time and framecount
      fpstime = 0;
      framecount = 0;
    }

    // Increase time and framecount
    fpstime += dt;
    framecount++;
  }

  // Draw text that is centered
  function drawCenterText(text, x, y, width) {
    var textdim = context.measureText(text);
    context.fillText(text, x + (width-textdim.width)/2, y);
  }

  // Render the game
  function render() {//面板設計
    // Draw the frame around the game
    drawFrame();

    var yoffset =  level.tileheight/2;
    var grad = context.createLinearGradient(0, 100, 600, 100);

    grad.addColorStop(0, 'rgba(185, 159, 239, 1)');
    grad.addColorStop(0.81, 'rgba(202, 166, 220, 1)');

    context.fillStyle = grad;
    context.fillRect(0, 0, 600, 200);
    // Draw level background
    context.fillRect(level.x-4, level.y - 4, level.width + 8, level.height + 4 - yoffset);

    // Render tiles
    renderTiles();
    context.fillStyle = "transporter";
    context.fillRect(level.x - 4, level.y - 4 + level.height + 4 - yoffset, level.width + 48, 2*level.tileheight + 30);
    // Draw score
    var high_score = document.getElementById('high_score');

    high_score.innerHTML = '$' +score;

    // Render cluster
    if (showcluster) {
      renderCluster(cluster, 255, 128, 128);

      for (var i=0; i<floatingclusters.length; i++) {
        var col = Math.floor(100 + 100 * i / floatingclusters.length);
        renderCluster(floatingclusters[i], col, col, col);
      }
    }


    // Render player bubble
    renderPlayer();




    // Game Over overlay
    if (gamestate == gamestates.gameover) {
      context.fillStyle = "rgba(0, 0, 0, 0.8)";
      context.fillRect(level.x - 4, level.y - 4, level.width + 8, level.height + 2 * level.tileheight + 8 - yoffset);

      context.fillStyle = "#ffffff";
      context.font = "24px Verdana";
      document.getElementById("end_game").style.display = 'block';
      runConfetti()
      drawCenterText("Game Over!", level.x, level.y + level.height / 2 + 10, level.width);
      drawCenterText("Click to start", level.x, level.y + level.height / 2 + 40, level.width);
    }
  }

  // Draw a frame around the game
  function drawFrame() {
    // Draw background
    context.fillStyle = "#222";
    //context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw header 頭
    context.fillStyle = "#FFD306";
    context.fillRect(0, 0, canvas.width, 79);

    // Draw title 標題
    context.fillStyle = "#ffffff";
    context.font = "24px Verdana";
    context.fillText("bbbbbbbbbbbba", 10, 37);

    // Display fps
    context.fillStyle = "#ffffff";
    context.font = "12px Verdana";
    context.fillText("Fps: " + fps, 13, 57);
  }

  // Render tiles
  function renderTiles() {
    // Top to bottom
    for (var j=0; j<level.rows; j++) {
      for (var i=0; i<level.columns; i++) {
        // Get the tile
        var tile = level.tiles[i][j];

        // Get the shift of the tile for animation
        var shift = tile.shift;

        // Calculate the tile coordinates
        var coord = getTileCoordinate(i, j);

        // Check if there is a tile present
        if (tile.type >= 0) {
          // Support transparency
          context.save();
          context.globalAlpha = tile.alpha;

          // Draw the tile using the color
          drawBubble(coord.tilex, coord.tiley + shift, tile.type);

          context.restore();
        }
      }
    }
  }

  // Render cluster
  function renderCluster(cluster, r, g, b) {
    for (var i=0; i<cluster.length; i++) {
      // Calculate the tile coordinates
      var coord = getTileCoordinate(cluster[i].x, cluster[i].y);

      // Draw the tile using the color
      context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      context.fillRect(coord.tilex+level.tilewidth/4, coord.tiley+level.tileheight/4, level.tilewidth/2, level.tileheight/2);
    }
  }

  // Render the player bubble
  function renderPlayer() {
    var centerx = BubbleShoot.width/2;
    var centery = (player.y + level.tileheight/2) - 100;

    // Draw player background circle
    context.fillStyle = "#7a7a7a";
    context.beginPath();
    context.arc(centerx, centery, level.radius+12, 0, 2*Math.PI, false);
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "#8c8c8c";
    context.stroke();

    // Draw the angle
    context.lineWidth = 3
    context.strokeStyle = "#ccc";
    context.setLineDash([5, 3]);
    context.beginPath();
    context.moveTo(centerx, centery);
    context.lineTo(centerx + 1.5*level.tilewidth * Math.cos(degToRad(player.angle)), centery - 1.5*level.tileheight * Math.sin(degToRad(player.angle)));
    context.stroke();

    // Draw the next bubble
    //drawBubble(centerx, player.nextbubble.y, player.nextbubble.tiletype);

    // Draw the bubble
    if (player.bubble.visible) {
      drawBubble(player.bubble.x, player.bubble.y - 100, player.bubble.tiletype);
    }

  }

  // Get the tile coordinate
  function getTileCoordinate(column, row) {
    var tilex = level.x + column * level.tilewidth;

    // X offset for odd or even rows
    if ((row + rowoffset) % 2) {
      tilex += level.tilewidth/2;
    }

    var tiley = level.y + row * level.rowheight;
    return { tilex: tilex, tiley: tiley };
  }

  // Get the closest grid position
  function getGridPosition(x, y) {
    var gridy = Math.floor((y - level.y) / level.rowheight);

    // Check for offset
    var xoffset = 0;
    if ((gridy + rowoffset) % 2) {
      xoffset = level.tilewidth / 2;
    }
    var gridx = Math.floor(((x - xoffset) - level.x) / level.tilewidth);

    return { x: gridx, y: gridy };
  }


  // Draw the bubble
  function drawBubble(x, y, index) {
    if (index < 0 || index >= bubblecolors)
      return;

    // Draw the bubble sprite
    context.drawImage(bubbleimage, index * 40, 0, 40, 40, x, y, level.tilewidth, level.tileheight);
  }

  // Start a new game
  function newGame() {
    // Reset score
    score = 0;
    document.getElementById("end_game").style.display = 'none';

    turncounter = 0;
    rowoffset = 0;

    // Set the gamestate to ready
    setGameState(gamestates.ready);

    // Create the level
    createLevel();

    // Init the next bubble and set the current bubble.
    nextBubble();
    nextBubble();
  }

  // Create a random level
  function createLevel() {
    // Create a level with random tiles
    const colors = [
     // 1R  2R  3R  4R  5R  6R  7R  8R  9R  10R  11R 12R 13R
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  -1, -1, -1],
      [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  -1, -1, -1],
      [ 1,   1,  1,  1,  2,  2, -1, -1, -1, -1,  -1, -1, -1],
      [ 1,   1,  1,  1,  1,  1,  2,  2, -1, -1,  -1, -1, -1],
      [ 1,   1,  1,  1,  1,  1,  1,  1,  2,  2,   4,  4,  4],
      [ 1,   1,  1,  1,  1,  1,  1,  1,  1,  1,   2,  2,  4],
      [ 1,   1,  1,  1,  1,  1,  1,  1,  1,  1,   1,  3,  2],
      [ 1,   1,  1,  1,  1,  1,  1,  1,  1,  1,   1,  3,  3],
      [ 1,   1,  1,  1,  1,  1,  1,  1,  1,  1,   1,  2,  2],
      [ 1,   1,  1,  1,  1,  1,  1,  1,  1,  2,   2,  4,  4],
      [ 1,   1,  1,  1,  1,  1,  1,  2,  2, -1,   4, -1,  4],
      [ 1,   1,  1,  1,  1,  2,  2, -1, -1, -1,  -1, -1, -1],
      [ 1,  -1,  1, -1,  2, -1, -1, -1, -1, -1,  -1, -1, -1],
      [-1,  -1, -1, -1, -1, -1, -1, -1, -1, -1,  -1, -1, -1],
      [-1,  -1, -1, -1, -1, -1, -1, -1, -1, -1,  -1, -1, -1],
    ]
    for (var j=0; j<level.rows; j++) {
      var randomtile = randRange(0, bubblecolors-1);
      var count = 0;
      var x = 5;
      for (var i=0; i<level.columns; i++) {
        if (count >= 2) {
          // Change the random tile
          var newtile = randRange(0, bubblecolors-1);

          // Make sure the new tile is different from the previous tile
          if (newtile == randomtile) {
            newtile = (newtile + 1) % bubblecolors;
          }
          randomtile = newtile;
          count = 0;
        }
        count++;

        if (j < level.rows/2) {
          level.tiles[i][j].type = colors[i][j];
        } else {
          level.tiles[i][j].type = -1;
        }
        x++;
      }
    }
  }

  function runConfetti() {
    //-----------Var Inits--------------
    var cx = context.canvas.width/2;
    var cy = context.canvas.height/2;

    let confetti = [];
    const confettiCount = 300;
    const gravity = 0.5;
    const terminalVelocity = 0.1;
    const drag = 0.075;
    const colors = [
      { front : 'red', back: 'darkred'},
      { front : 'green', back: 'darkgreen'},
      { front : 'blue', back: 'darkblue'},
      { front : 'yellow', back: 'darkyellow'},
      { front : 'orange', back: 'darkorange'},
      { front : 'pink', back: 'darkpink'},
      { front : 'purple', back: 'darkpurple'},
      { front : 'turquoise', back: 'darkturquoise'},
    ];

//-----------Functions--------------
    resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cx = context.canvas.width/2;
      cy = context.canvas.height/2;
    }

    randomRange = (min, max) => Math.random() * (max - min) + min

    initConfetti = () => {
      for (let i = 0; i < confettiCount; i++) {
        confetti.push({
          color : colors[Math.floor(randomRange(0, colors.length))],
          dimensions : {
            x: randomRange(10, 20),
            y: randomRange(10, 30),
          },
          position   : {
            x: randomRange(0, canvas.width),
            y: canvas.height - 1,
          },
          rotation   : randomRange(0, 2 * Math.PI),
          scale      : {
            x: 1,
            y: 1,
          },
          velocity   : {
            x: randomRange(-25, 25),
            y: randomRange(0, -50),
          },
        });
      }
    }

//---------Render-----------
    render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((confetto, index) => {
        let width = (confetto.dimensions.x * confetto.scale.x);
        let height = (confetto.dimensions.y * confetto.scale.y);

        // Move canvas to position and rotate
        context.translate(confetto.position.x, confetto.position.y);
        context.rotate(confetto.rotation);

        // Apply forces to velocity
        confetto.velocity.x -= confetto.velocity.x * drag;
        confetto.velocity.y = Math.min(confetto.velocity.y + gravity, terminalVelocity);
        confetto.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random();

        // Set position
        confetto.position.x += confetto.velocity.x;
        confetto.position.y += confetto.velocity.y;

        // Delete confetti when out of frame
        if (confetto.position.y >= canvas.height) confetti.splice(index, 1);

        // Loop confetto x position
        if (confetto.position.x > canvas.width) confetto.position.x = 0;
        if (confetto.position.x < 0) confetto.position.x = canvas.width;

        // Spin confetto by scaling y
        confetto.scale.y = Math.cos(confetto.position.y * 0.1);
        context.fillStyle = confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;

        // Draw confetto
        context.fillRect(-width / 2, -height / 2, width, height);

        // Reset transform matrix
        context.setTransform(1, 0, 0, 1, 0, 0);
      });

      // Fire off another round of confetti
      if (confetti.length <= 10) initConfetti();

      window.requestAnimationFrame(render);
    }

//---------Execution--------
    initConfetti();
    render();

//----------Resize----------
    window.addEventListener('resize', function () {
      resizeCanvas();
    });

//------------Click------------
    window.addEventListener('click', function() {
      initConfetti();
    });
  }
  // Create a random bubble for the player
  function nextBubble() {
    // Set the current bubble
    player.tiletype = player.nextbubble.tiletype;
    player.bubble.tiletype = player.nextbubble.tiletype;
    player.bubble.x = player.x;
    player.bubble.y = player.y;
    player.bubble.visible = true;

    // Get a random type from the existing colors
    var nextcolor = getExistingColor();

    player.nextbubble.tiletype = nextcolor;
  }

  // Get a random existing color
  function getExistingColor() {
    existingcolors = findColors().sort().reverse();
    var bubbletype = 0;
    if(player.nextbubble.colors.length) {
      bubbletype = player.nextbubble.colors[0];
      player.nextbubble.colors.shift()
    } else {
      bubbletype = existingcolors[existingcolors.length-1];
    }


    return bubbletype;
  }

  // Get a random int between low and high, inclusive
  function randRange(low, high) {
    return Math.floor(low + Math.random()*(high-low+1));
  }

  // Shoot the bubble
  function shootBubble() {
    // Shoot the bubble in the direction of the mouse
    player.bubble.x = player.x;
    player.bubble.y = player.y;
    player.bubble.angle = player.angle;
    player.bubble.tiletype = player.tiletype;

    // Set the gamestate
    setGameState(gamestates.shootbubble);
  }

  // Check if two circles intersect
  function circleIntersection(x1, y1, r1, x2, y2, r2) {
    // Calculate the distance between the centers
    var dx = x1 - x2;
    var dy = y1 - y2;
    var len = Math.sqrt(dx * dx + dy * dy);

    if (len < r1 + r2) {
      // Circles intersect
      return true;
    }

    return false;
  }

  // Convert radians to degrees
  function radToDeg(angle) {
    return angle * (180 / Math.PI);
  }

  // Convert degrees to radians
  function degToRad(angle) {
    return angle * (Math.PI / 180);
  }

  // On mouse movement
  function onMouseMove(e) {
    // Get the mouse position
    var pos = getMousePos(canvas, e);

    // Get the mouse angle
    var mouseangle = radToDeg(Math.atan2((player.y+level.tileheight/2) - pos.y, pos.x - (player.x+level.tilewidth/2)));

    // Convert range to 0, 360 degrees
    if (mouseangle < 0) {
      mouseangle = 180 + (180 + mouseangle);
    }

    // Restrict angle to 8, 172 degrees
    var lbound = 8;
    var ubound = 172;
    if (mouseangle > 90 && mouseangle < 270) {
      // Left
      if (mouseangle > ubound) {
        mouseangle = ubound;
      }
    } else {
      // Right
      if (mouseangle < lbound || mouseangle >= 270) {
        mouseangle = lbound;
      }
    }

    // Set the player angle
    player.angle = mouseangle;
  }
  function clear(){
    for(var yis=0;yis<level.rows;yis++){//y軸
      //level.tiles[xis][yis].type=4;
      for(var xis=0;xis<level.columns;xis++){//x軸
        if(level.tiles[xis][yis].type>-1){
          break;
        }else if(xis== level.columns-1){
          for(var i=0;i<level.columns;i++){
            level.tiles[i][yis-1].type=-1;
          }
        }
      }
    }
  }
  function rainb(){
    player.bubble.x = player.x;
    player.bubble.y = player.y;
    player.bubble.angle = player.angle;
    player.bubble.tiletype = 6;
    player.tiletype=6;
    // Set the gamestate
    setGameState(gamestates.ready);


  }
  // On mouse button click
  function onMouseDown(e) {//觸發條件
    // Get the mouse position
    //level.x+10,level.y + level.height+20 , level.x+40,70
    /*context.fillStyle = "#28FF28";
     context.fillRect(level.x*2+64,level.y + level.height+20 ,level.x+40,50 );*/
    var pos = getMousePos(canvas, e);

    if (pos.x>=level.x+10&&pos.x<=level.x*2+50&&pos.y>=level.y + level.height+20 ){
      clear();
    }else if(pos.x>=level.x*2+64&&pos.x<=level.x*3+104&&pos.y>=level.y + level.height+20 ){
      rainb();
    }else  if (gamestate == gamestates.ready) {
      shootBubble();
    } else if (gamestate == gamestates.gameover) {
      newGame();
    }
  }
  // Get the mouse position
  function getMousePos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left)/(rect.right - rect.left)*canvas.width),
      y: Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*canvas.height)
    };
  }


  // Call init to start the game
  init();
};
