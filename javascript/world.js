'use strict';

import * as settings from 'settings';
import * as $ from 'jquery';
import * as _ from 'underscore';
import * as Reflux from 'reflux';
import {log} from 'logger';

export class World {
  constructor(options) {
    this.opts = options || {};

    this.sizeGenerate();
    this.mapGenerate();
    this.shadowPointsGenerate();
    this.points = [];
    this.pointsLength = 0;
    this.animationTasks = {};

    this.actions = Reflux.createActions([
      'pointCreated',
      'snakeCreated',
      'snakeClamped'
    ]);
    this.actions.snakeCreated.listen(() => {
      this.counterUpdate();
      this.snake.actions.lengthChanged.listen(() => {
        this.counterUpdate();
      });
    });

    this.draw();
  }
  sizeGenerate(opts) {
    opts = opts || this.opts;
    var size = {},
      pixelPercent = opts.pixelPercent || 2, // pixel will be 2% of biggest screen size
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
    this.canvas = $('#canvas');
    this.canvas.css({
      width: this._width,
      height: this._height
    });
    this.canvas.on('click', e => {
      this.pointAdd(e);
    });

    if (settings.dev) {
      let mapCells = '';
      _.each(this.map, (string, stringIndex) => {
        _.each(string, (point, pointIndex) => {
          mapCells += `<div class="map-cell" style="left:${point._left}px; top:${point._top}px; width:${this.pixel}px; height:${this.pixel}px">
                          ${stringIndex}:${pointIndex}
                       </div>`;
        });
      });
      this.devCanvas = $('#dev_canvas');
      this.devCanvas.css({
        left: $(this.canvas).offset().left
      });
      $(this.devCanvas).append(mapCells);
      $(this.canvas).css({
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
    } else if (this.snake.trapped || target.id !== 'canvas') {
      return false;
    } else {
      this.pointsLength += 1;
      var y = parseInt(e.offsetY / opts.pixel, 10),
        x = parseInt(e.offsetX / opts.pixel, 10);

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
    this.actions.pointCreated();
    log('Point created');
    return point;
  }
  pointDraw(pointItem) {
    $(this.canvas).append(`<div class="point" id="${pointItem.id}"></div>`);
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
      points = [
        map[0][0],
        map[0][w],
        map[h][w],
        map[h][0]
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
    if (_.isEmpty(this.animationTasks)) {
      log('Empty animations');
      this.animationStop();
      return;
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

    if (settings.dev) {
      this.animation = setTimeout(() => {
        this.animationStart();
      }, settings.animationSpeed);
    } else {
      this.animation = requestAnimationFrame(() => {
        this.animationStart();
      });
    }
  }
  animationStop() {
    if (this.animation) {
      log('Clear animations frame');
      if (settings.dev) {
        cancelAnimationFrame(this.animation);
      } else {
        clearTimeout(this.animation);
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
  counterUpdate() {
    $('#counter').text(this.snake.length);
  }
}
