var Potion = require('potion');

var app = Potion.init(document.querySelector('.game'), {
  configure: function() {
    app.resize(document.body.clientWidth, document.body.clientHeight);
    app.config.allowHiDPI = true;
  },

  init: function() {
    this.particles = [];

    window.addEventListener('resize', function() {
      app.resize(document.body.clientWidth, document.body.clientHeight);
    });
  },

  mousemove: function(value) {
    this.particles.push(new Particle(value.x, value.y, app.input.mouse.dx * 20, app.input.mouse.dy * 20));
  },

  update: function(time) {
    for (var i=0, len=this.particles.length; i<len; i++) {
      var particle = this.particles[i];
      if (particle) { particle.update(time); }
    }
  },

  render: function() {
    for (var i=0, len=this.particles.length; i<len; i++) {
      var particle = this.particles[i];
      if (particle) { particle.render(); }
    }
  }
});

var Particle = function(x, y, dx, dy) {
  this.x = x;
  this.y = y;
  this.r = Math.random() * 20 + 5;
  this.dx = dx;
  this.dy = dy;

  var colors = ['#04819e', '#38b2ce', '#60b9ce', '#015367', '#ff9900'];
  this.color = colors[Math.floor(colors.length * Math.random())];
};

Particle.prototype.update = function(time) {
  this.dx = this.dx + (0 - this.dx) * time;
  this.dy = this.dy + (0 - this.dy) * time;

  this.r = this.r + (0 - this.r) * time;

  if (this.r <= 0.5) {
    app.main.particles.splice(app.main.particles.indexOf(this), 1);
  }

  this.x += this.dx * time;
  this.y += this.dy * time;
};

Particle.prototype.render = function() {
  app.video.ctx.beginPath();
  app.video.ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, false);
  app.video.ctx.strokeStyle = this.color;
  app.video.ctx.stroke();
  app.video.ctx.closePath();
};
