require('./raf-polyfill')();

var App = require('./app');

var Time = require('./time');

var StateManager = require('./state-manager');

var Input = require('./input');
var Loading = require('./loading');

var Engine = function(container, methods) {
  this.container = container;

  this.controller = new App(container);

  this.app = methods;
  this.controller.main = this.app;
  this.app.app = this.controller;

  this.tickFunc = (function (self) { return function() { self.tick(); }; })(this);
  this.preloaderTickFunc = (function (self) { return function() { self._preloaderTick(); }; })(this);

  this.strayTime = 0;
  this._time = 0;

  setTimeout(function() {
    this.configureApp();
  }.bind(this), 0);
};

Engine.prototype.configureApp = function() {
  this.controller.resize(this.controller.width, this.controller.height);

  if (this.app.configure) {
    this.app.configure();
  }

  this.controller.video.init();

  if (this.controller.config.addInputEvents) {
    this.controller.input = new Input(this.controller);
  }

  this._setDefaultStates();

  this._time = Time.now();

  this._preloaderVideo = this.controller.video.createLayer({
    allowHiDPI: true,
    getCanvasContext: true
  });

  this._preloader = new Loading(this.controller);

  this.controller.assets.start(function() {
    window.cancelAnimationFrame(this.preloaderId);
    this._preloaderVideo.destroy();

    this.start();
  }.bind(this));

  if (this.controller.assets.isLoading && this.controller.config.showPreloader) {
    this.preloaderId = window.requestAnimationFrame(this.preloaderTickFunc);
  }
};

Engine.prototype.addEvents = function() {
  var self = this;

  window.addEventListener('blur', function() {
    self.controller.input.resetKeys();

    if (self.app.blur) {
      self.app.blur();
    }
  });

  window.addEventListener('focus', function() {
    self.controller.input.resetKeys();

    if (self.app.focus) {
      self.app.focus();
    }
  });
};

Engine.prototype.start = function() {
  if (this.controller.config.addInputEvents) {
    this.addEvents();
  }

  window.requestAnimationFrame(this.tickFunc);
};

Engine.prototype.tick = function() {
  window.requestAnimationFrame(this.tickFunc);

  this.controller.debug.begin();

  var now = Time.now();
  var time = (now - this._time) / 1000;
  this._time = now;

  this.controller.debug.perf('update');
  this.update(time);
  this.controller.debug.stopPerf('update');

  this.controller.states.exitUpdate(time);

  this.controller.debug.perf('render');
  this.render();
  this.controller.debug.stopPerf('render');

  this.controller.debug.render();

  this.controller.debug.end();
};

Engine.prototype.update = function(time) {
  if (time > this.controller.config.maxStepTime) { time = this.controller.config.maxStepTime; }

  if (this.controller.config.fixedStep) {
    this.strayTime = this.strayTime + time;
    while (this.strayTime >= this.controller.config.stepTime) {
      this.strayTime = this.strayTime - this.controller.config.stepTime;
      this.controller.states.update(this.controller.config.stepTime);
    }
  } else {
    this.controller.states.update(time);
  }
};

Engine.prototype.render = function() {
  this.controller.video.beginFrame();

  this.controller.video.clear();

  this.controller.states.render();

  this.controller.video.endFrame();
};

Engine.prototype._preloaderTick = function() {
  this.preloaderId = window.requestAnimationFrame(this.preloaderTickFunc);

  var now = Time.now();
  var time = (now - this._time) / 1000;
  this._time = now;

  if (this.app.preloading) {
    this.app.preloading(time, this._preloaderVideo);
  } else {
    this._preloader.render(time, this._preloaderVideo);
  }
};

Engine.prototype._setDefaultStates = function() {
  var states = new StateManager();
  states.add('main', this.app);
  states.add('debug', this.controller.debug);

  states.protect('main');
  states.protect('debug');
  states.hide('debug');

  this.controller.states = states;
};

module.exports = Engine;
