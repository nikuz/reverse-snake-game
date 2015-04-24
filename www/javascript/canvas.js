'use strict';

import {settings} from 'settings';
import * as $ from 'jquery';
import * as _ from 'underscore';
import * as Reflux from 'reflux';
import {log} from 'logger';

export class Canvas {
  constructor(options) {
    this.opts = options || {};

    this.sizeGenerate();
    this.mapGenerate();
    this.shadowPointsGenerate();
    this.points = [];
    this.pointsLength = 0;
    this.animationTasks = {};
    this.animationSlow = true;
    this.isPlay = true;

    this.actions = Reflux.createActions([
      'pointCreated',
      'snakeCreated',
      'snakeClamped',
      'pause',
      'play'
    ]);
    this.actions.snakeCreated.listen(() => {
      this.counterUpdate();
      this.snake.actions.lengthChanged.listen(() => {
        this.counterUpdate();
      });
      this.snake.actions.trapped.listen(() => {
        this.gameOver();
      });
    });
    this.actions.pause.listen(() => {
      this.pause();
    });
    this.actions.play.listen(() => {
      this.play();
    });

    this.draw();
  }
  sizeGenerate(opts) {
    opts = opts || this.opts;
    var size = {},
      pixelPercent = opts.pixelPercent || 3, // pixel will be 3% of biggest screen size
      ww = opts.width || window.innerWidth,
      wh = opts.height || window.innerHeight;

    size.pixel = parseInt((ww > wh ? ww : wh) / 100 * pixelPercent, 10);

    size.width = parseInt(ww / size.pixel, 10);
    size.height = parseInt(wh / size.pixel, 10);
    size._width = size.width * size.pixel;
    size._height = size.height * size.pixel;

    _.extend(this, size);
    return size;
  }
  draw() {
    this.el = $('#canvas');
    this.el.css({
      width: this._width,
      height: this._height
    }).on('touchstart', e => {
      this.pointAdd(e.originalEvent);
    });
    $('#pause').on('click', () => {
      if (this.isPlay) {
        this.actions.pause();
      } else {
        this.actions.play();
      }
    });

    if (settings.dev) {
      this.el.on('click', () => {
        this.animationStop();
      });
      let mapCells = [],
        devCanvas;

      _.each(this.map, string => {
        _.each(string, point => {
          let ceil = $('<div class="map-cell fa fa-circle"></div>'),
            style = {
              left: point._left,
              top: point._top,
              width: this.pixel,
              height: this.pixel,
              'line-height': this.pixel + 'px'
            };
          ceil.css(style);
          mapCells.push(ceil);
        });
      });
      devCanvas = $('#dev_canvas');
      devCanvas.css({
        left: $(this.el).offset().left
      }).append(mapCells);

      $(this.el).css({
        opacity: .5
      });
    }
  }
  mapGenerate(opts) {
    opts = opts || {
      width: this.width,
      height: this.height,
      pixel: this.pixel
    };
    var i = 0, j = 0,
      mapWL = opts.width,
      mapHL = opts.height,
      map = new Array(mapHL);

    for(; i<mapHL; i++){
      map[i] = new Array(mapWL);
      j = 0;
      for (; j<mapWL; j++) {
        map[i][j] = {
          top: i,
          left: j,
          _top: i * opts.pixel,
          _left: j * opts.pixel
        }
      }
    }
    this.map = map;
    return map;
  }
  pointAdd(e, opts) {
    opts = opts || {
      width: this.width,
      height: this.height,
      pixel: this.pixel
    };
    var target = e.target;
    if (target.id.indexOf('piece_') === 0) {
      this.actions.snakeClamped();
      return false;
    } else if (this.points.length > settings.pointsLimit || this.snake.trapped || target.id !== 'canvas' || !this.isPlay) {
      return false;
    } else {
      this.actions.pointCreated();
      this.pointsLength += 1;
      var touchEvent = e.targetTouches[0],
        y = parseInt(touchEvent.clientY / opts.pixel, 10),
        x = parseInt(touchEvent.clientX / opts.pixel, 10);

      x = x < opts.width ? x : opts.width - 1;
      y = y < opts.height ? y : opts.height - 1;

      var point = {
          top: y,
          left: x,
          _top: y * opts.pixel,
          _left: x * opts.pixel,
          id: 'point_' + this.pointsLength
        },
        i = 0, l = this.snake.pieces.length,
        piece;

      for (; i < l; i++) {
        piece = this.snake.pieces[i];
        if (piece.position.left === point.left && piece.position.top === point.top) {
          this.actions.snakeClamped();
          return false;
        }
      }

      i = 0; l = this.points.length;
      for (; i < l; i++) {
        piece = this.points[i];
        if (piece.left === point.left && piece.top === point.top) {
          return false;
        }
      }
    }

    this.points.push(point);
    this.pointDraw(point);
    this.animationSlow = false;
    log('Point created');
    return point;
  }
  pointDraw(pointItem) {
    $(this.el).append(`<div class="point" id="${pointItem.id}"></div>`);
    $('#' + pointItem.id).css({
      left: pointItem._left,
      top: pointItem._top,
      width: this.pixel,
      height: this.pixel
    });
  }
  pointRemove(pointIndex) {
    if (this.points[pointIndex]) {
      var point = this.points.splice(pointIndex, 1)[0];
      $('#' + point.id).remove();
      if (!this.points.length) {
        this.animationSlow = true;
      }
      return true;
    } else {
      return false;
    }
  }
  shadowPointsGenerate(opts) {
    opts = opts || {
      map: this.map,
      width: this.width,
      height: this.height
    };
    var shadowPoints = [],
      map = opts.map,
      w = opts.width - 1,
      h = opts.height - 1,
      wc = 9,
      hc = 5,
      points = [
        map[0][0],
        map[2][3],
        map[0][wc],
        map[0][w - wc],
        map[2][w - 3],
        map[0][w],
        map[3][w - 2],
        map[hc][w],
        map[h - hc][w],
        map[h - 3][w - 3],
        map[h][w],
        map[h - 2][w - 3],
        map[h][w - wc],
        map[h][wc],
        map[h - 2][3],
        map[h][0],
        map[h - 3][2],
        map[h - hc][0],
        map[hc][0],
        map[3][2]
      ];

    _.each(points, point => {
      shadowPoints.push({
        id: 'shadow_point',
        top: point.top,
        left: point.left,
        _top: point._top,
        _left: point._left
      });
    });

    this.shadowPoints = shadowPoints;
    return shadowPoints;
  }
  shadowPointsGet(shadowPoints) {
    var points = shadowPoints || this.shadowPoints;
    points.push(points.shift());
    return points;
  }
  animationStart() {
    if (_.isEmpty(this.animationTasks) || !this.isPlay) {
      return this.animationStop();
    }

    _.each(this.animationTasks, task => {
      if (task.frames.length) {
        task.frames.shift()();
      } else if (!task.end) {
        task.end = true;
        this.animationRemove(task.name);
        task.callback();
      }
    });

    if (this.animationSlow || settings.dev) {
      this.animationTime = setTimeout(() => {
        this.animationStart();
      }, settings.slowAnimationSpeed || settings.devAnimationSpeed);
      this.animation = true;
    } else {
      this.animationFrame = requestAnimationFrame(() => {
        this.animationStart();
      });
      this.animation = true;
    }
  }
  animationStop() {
    if (this.animation) {
      if (this.isPlay) {
        log('Empty animations');
        log('Clear animations frame');
        this.animation = false;
      } else {
        log('Paused');
      }
      if (this.animationTime) {
        clearTimeout(this.animationTime);
      }
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      if (settings.dev) {
        this.animationTasks = {};
      }
    }
  }
  animationAdd(animationTask) {
    if (animationTask.name) {
      this.animationTasks[animationTask.name] = animationTask;
      if (!this.animation) {
        this.animationStart();
      }
    }
    return animationTask.name !== undefined;
  }
  animationRemove(name) {
    var errors;
    if (_.isArray(name)) {
      _.each(name, item => {
        if (this.animationTasks[item]) {
          delete this.animationTasks[item];
        } else {
          errors = true;
        }
      });
    } else {
      if (this.animationTasks[name]) {
        delete this.animationTasks[name];
      } else {
        errors = true;
      }
    }
    return !errors;
  }
  pause() {
    this.isPlay = false;
    $('body').addClass('game-pause');
  }
  play() {
    this.isPlay = true;
    this.animationStart();
    $('body').removeClass('game-pause');
  }
  gameOver() {
    this.animationStop();
    $('body').addClass('game-over');
  }
  counterUpdate() {
    $('#counter').text(this.snake.length);
  }
}
