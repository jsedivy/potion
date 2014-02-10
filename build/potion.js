/**
 * potion - v0.0.9
 * Copyright (c) 2014, Jan Sedivy
 *
 * Compiled: 2014-02-10
 *
 * potion is licensed under the MIT License.
 */
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.Potion=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Engine = _dereq_('./src/engine');

module.exports = {
  init: function(canvas, methods) {
    var engine = new Engine(canvas, methods);
    return engine.game;
  }
};

},{"./src/engine":2}],2:[function(_dereq_,module,exports){
var Video = _dereq_('./video');
var Game = _dereq_('./game');

var raf = _dereq_('./raf');

/**
 * Main Engine class which calls the game methods
 * @constructor
 */
var Engine = function(canvas, methods) {
  var GameClass = function(canvas) { Game.call(this, canvas); };
  GameClass.prototype = Object.create(Game.prototype);
  for (var method in methods) {
    GameClass.prototype[method] = methods[method];
  }

  /**
   * Game code instance
   * @type {Game}
   */
  this.game = new GameClass(canvas);

  /**
   * Video instance for rendering into canvas
   * @type {Video}
   */
  this.video = this.game.video = new Video(canvas);

  this.game.config();

  this.setupCanvasSize();

  this.game.sprite.load(this.game.load.sprite, this.game.load.spriteImage, this.start.bind(this));
};

/**
 * Add event listener for window events
 * @private
 */
Engine.prototype.addEvents = function() {
  var self = this;

  window.addEventListener('resize', function() {
    self.setupCanvasSize();
  });

  window.addEventListener('blur', function() {
    self.game.input.resetKeys();
    self.game.blur();
  });

  window.addEventListener('focus', function() {
    self.game.input.resetKeys();
    self.game.focus();
  });
};

/**
 * Runs every time on resize event
 * @private
 */
Engine.prototype.setupCanvasSize = function() {
  this.game.resize();
  this.video.canvas.width = this.game.width;
  this.video.canvas.height = this.game.height;

  if (this.game.isRetina) {
    this.video.scale(2);
  }
};

/**
 * Starts the game, adds events and run first frame
 * @private
 */
Engine.prototype.start = function() {
  this.game.start();
  this.addEvents();
  this.startFrame();
};

/**
 * Starts next frame in game loop
 * @private
 */
Engine.prototype.startFrame = function() {
  this._time = Date.now();
  var self = this;
  raf(function() { self.tick(); });
};

/**
 * Main tick function in game loop
 * @private
 */
Engine.prototype.tick = function() {
  var time = (Date.now() - this._time) / 1000;
  if (time > 0.016) { time = 0.016; }

  this.update(time);
  this.render();

  this.startFrame();
};

/**
 * Updates the game
 * @param {number} time - time in seconds since last frame
 * @private
 */
Engine.prototype.update = function(time) {
  this.game.update(time);
};

/**
 * Renders the game
 * @private
 */
Engine.prototype.render = function() {
  this.video.ctx.clearRect(0, 0, this.game.width, this.game.height);
  this.game.render();
};

module.exports = Engine;

},{"./game":3,"./raf":6,"./video":10}],3:[function(_dereq_,module,exports){
var Input = _dereq_('./input');
var SpriteSheetManager = _dereq_('./spriteSheetManager');
var isRetina = _dereq_('./retina');

/**
 * Game class that is subclassed by actual game code
 * @constructor
 * @param {HTMLCanvasElement} canvas - canvas DOM element
 */
var Game = function(canvas) {
  /**
   * Canvas DOM element
   * @type {HTMLCanvasElement}
   */
  this.canvas = canvas;

  /**
   * Game width in pixels
   * @type {number}
   */
  this.width = 300;

  /**
   * Game highs in pixels
   * @type {number}
   */
  this.height = 300;

  /**
   * Sprites to load
   * @type {object}
   */
  this.load = {};

  /**
   * Instance of SpriteSheetManager for managing sprites and images
   * @type {SpriteSheetManager}
   */
  this.sprite = new SpriteSheetManager();

  /**
   * If you have retina screen will is true
   * @type {boolean}
   */
  this.isRetina = isRetina();

  /**
   * Input instance for mouse and keyboard events
   * @type {Input}
   */
  this.input = new Input(this);
};

/**
 * Is called when all assets are loaded
 */
Game.prototype.start = function() {};

/**
 * Configure the game
 */
Game.prototype.config = function() {};

/**
 * Window resize event
 */
Game.prototype.resize = function() {};

/**
 * Renders the game
 */
Game.prototype.render = function() {};

/**
 * Updates the game
 * @param {number} time - time in seconds since last frame
 */
Game.prototype.update = function() {};

/**
 * Keypress event
 * @param {number} keycode - char code of the pressed key
 */
Game.prototype.keypress = function(keycode) {};

/**
 * Click event
 * @param {number} x - x position
 * @param {number} y - y position
 */
Game.prototype.click = function(x, y) {};

/**
 * Mousemove event
 * @param {number} x - x position
 * @param {number} y - y position
 */
Game.prototype.mousemove = function(x, y) {};

/**
 * Window Focus event
 */
Game.prototype.focus = function() {};

/**
 * Window Blur event
 */
Game.prototype.blur = function() {};

module.exports = Game;

},{"./input":4,"./retina":7,"./spriteSheetManager":8}],4:[function(_dereq_,module,exports){
var keys = _dereq_('./keys');

/**
 * Input wrapper
 * @constructor
 * @param {Game} game - Game object
 */
var Input = function(game) {
  /**
   * Game object
   * @type {Game}
   */
  this.game = game;

  /**
   * Pressed keys object
   * @type {object}
   */
  this.keys = {};

  /**
   * Controls if you can press keys
   * @type {boolean}
   */
  this.canControlKeys = true;

  /**
   * Mouse object with positions and if is mouse button pressed
   * @type {object}
   */
  this.mouse = {
    isDown: false,
    position: { x: null, y: null }
  };

  this._addEvents();
};

/**
 * Clears the pressed keys object
 */
Input.prototype.resetKeys = function() {
  this.keys = {};
};

/**
 * Return true or false is key is pressed
 * @param {string} key
 * @return {boolean}
 */
Input.prototype.isKeyDown = function(key) {
  if (this.canControlKeys) {
    return this.keys[keys[key.toUpperCase()]];
  }
};

/**
 * Add canvas event listener
 * @private
 */
Input.prototype._addEvents = function() {
  var self = this;
  var canvas = this.game.canvas;

  canvas.addEventListener('mousemove', function(e) {
    self.game.mousemove(e.offsetX, e.offsetY);
    self.mouse.position.x = e.offsetX;
    self.mouse.position.y = e.offsetY;
  });

  canvas.addEventListener('mouseup', function() {
    self.mouse.isDown = false;
  });

  canvas.addEventListener('mousedown', function(e) {
    self.mouse.position.x = e.offsetX;
    self.mouse.position.y = e.offsetY;
    self.mouse.isDown = true;
  });

  canvas.addEventListener('click', function(e) {
    self.game.click(e.offsetX, e.offsetY);
  });

  document.addEventListener('keypress', function(e) {
    self.game.keypress(e.keyCode);
  });

  document.addEventListener('keydown', function(e) {
    self.game.input.keys[e.keyCode] = true;
  });

  document.addEventListener('keyup', function(e) {
    self.game.input.keys[e.keyCode] = false;
  });
};

module.exports = Input;

},{"./keys":5}],5:[function(_dereq_,module,exports){
module.exports = {
  'MOUSE1':-1,
  'MOUSE2':-3,
  'MWHEEL_UP':-4,
  'MWHEEL_DOWN':-5,
  'BACKSPACE':8,
  'TAB':9,
  'ENTER':13,
  'PAUSE':19,
  'CAPS':20,
  'ESC':27,
  'SPACE':32,
  'PAGE_UP':33,
  'PAGE_DOWN':34,
  'END':35,
  'HOME':36,
  'LEFT':37,
  'UP':38,
  'RIGHT':39,
  'DOWN':40,
  'INSERT':45,
  'DELETE':46,
  '_0':48,
  '_1':49,
  '_2':50,
  '_3':51,
  '_4':52,
  '_5':53,
  '_6':54,
  '_7':55,
  '_8':56,
  '_9':57,
  'A':65,
  'B':66,
  'C':67,
  'D':68,
  'E':69,
  'F':70,
  'G':71,
  'H':72,
  'I':73,
  'J':74,
  'K':75,
  'L':76,
  'M':77,
  'N':78,
  'O':79,
  'P':80,
  'Q':81,
  'R':82,
  'S':83,
  'T':84,
  'U':85,
  'V':86,
  'W':87,
  'X':88,
  'Y':89,
  'Z':90,
  'NUMPAD_0':96,
  'NUMPAD_1':97,
  'NUMPAD_2':98,
  'NUMPAD_3':99,
  'NUMPAD_4':100,
  'NUMPAD_5':101,
  'NUMPAD_6':102,
  'NUMPAD_7':103,
  'NUMPAD_8':104,
  'NUMPAD_9':105,
  'MULTIPLY':106,
  'ADD':107,
  'SUBSTRACT':109,
  'DECIMAL':110,
  'DIVIDE':111,
  'F1':112,
  'F2':113,
  'F3':114,
  'F4':115,
  'F5':116,
  'F6':117,
  'F7':118,
  'F8':119,
  'F9':120,
  'F10':121,
  'F11':122,
  'F12':123,
  'SHIFT':16,
  'CTRL':17,
  'ALT':18,
  'PLUS':187,
  'COMMA':188,
  'MINUS':189,
  'PERIOD':190
};

},{}],6:[function(_dereq_,module,exports){
module.exports = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

},{}],7:[function(_dereq_,module,exports){
var isRetina = function() {
  var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
  (min--moz-device-pixel-ratio: 1.5),\
  (-o-min-device-pixel-ratio: 3/2),\
  (min-resolution: 1.5dppx)";

  if (window.devicePixelRatio > 1)
    return true;

  if (window.matchMedia && window.matchMedia(mediaQuery).matches)
    return true;

  return false;
};

module.exports = isRetina;

},{}],8:[function(_dereq_,module,exports){
var getJSON = _dereq_('./utils').getJSON;

/**
 * Class for loading images
 * @constructor
 */
var SpriteSheetManager = function() {
  /**
   * Sprite data
   * @type {object}
   */
  this.data = {};

  /**
   * sprite image
   * @type {HTMLImageElement|null}
   */
  this.image = null;
};

/**
 * Load json file and actual sprite image
 * @param {string} json - path to the json file
 * @param {string} imagePath - path to the image
 * @param {function} callback - function that is called after everything is loaded
 */
SpriteSheetManager.prototype.load = function(json, imagePath, callback) {
  if (!json) { return callback(); }

  var self = this;

  var image = new Image();
  image.onload = function() {
    self.image = image;
    callback();
  };

  getJSON(json, function(data) {
    self.data = data;
    image.src = imagePath;
  });
};

/**
 * Get data about specific image
 * @param {string} name - image name
 * @return {object}
 */
SpriteSheetManager.prototype.get = function(name) {
  return this.data[name];
};

module.exports = SpriteSheetManager;

},{"./utils":9}],9:[function(_dereq_,module,exports){
exports.getJSON = function(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function() {
    var data = JSON.parse(this.response);
    callback(data);
  };

  request.send();
};

},{}],10:[function(_dereq_,module,exports){
/**
 * @constructor
 * @param {HTMLCanvasElement} canvas - Canvas DOM element
 */
var Video = function(canvas) {
  /**
   * Canvas DOM element
   * @type {HTMLCanvasElement}
   */
  this.canvas = canvas;

  /**
   * canvas context
   * @type {CanvasRenderingContext2D}
   */
  this.ctx = canvas.getContext('2d');
};

/**
 * Scale canvas buffer, used for retina screens
 * @param {number} scale
 */
Video.prototype.scale = function(scale) {
  this.canvas.style.width = this.canvas.width + 'px';
  this.canvas.style.height = this.canvas.height + 'px';

  this.canvas.width *= scale;
  this.canvas.height *= scale;

  this.ctx.scale(scale, scale);
};

/**
 * Draws image sprite into x a y position
 * @param {HTMLImageElement} image - image with sprites
 * @param {object} sprite - sprite data
 * @param {number} x - x position
 * @param {number} y - y position
 */
Video.prototype.sprite = function(image, sprite, x, y) {
  x = Math.floor(x);
  y = Math.floor(y);

  var w = sprite.width;
  var h = sprite.height;
  var drawWidth = w;
  var drawHeight = h;

  if (sprite.source_image.match(/@2x.png$/)) {
    drawWidth /= 2;
    drawHeight /= 2;
  }

  this.ctx.drawImage(image, sprite.x, sprite.y, w, h, x, y, drawWidth, drawHeight);
};

module.exports = Video;

},{}]},{},[1])
(1)
});