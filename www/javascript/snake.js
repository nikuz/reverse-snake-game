'use strict';

import {settings} from 'settings';
import {SnakePiece} from 'snake-piece';
import * as $ from 'jquery';
import * as _ from 'underscore';
import * as PF from 'pathfinding';
import * as Reflux from 'reflux';
import {log} from 'logger';

var defaultsSnakeOptions = {
  inmove: true,
  length: 5,
  direction: 'top',
  trapped: false
};
var defaultSnakePosition  = {
  left: 10,
  top: 5
};

export class Snake {
  constructor(world, options) {
    options = options || {};
    _.extend(this, defaultsSnakeOptions, options);
    this.position = {};
    _.extend(this.position, defaultSnakePosition);

    world.snake = this;
    world.actions.snakeCreated();

    this.actions = Reflux.createActions([
      'lengthChanged',
      'trapped'
    ]);

    world.actions.snakeClamped.listen(() => {
      this.clampedSay();
    });
    world.actions.pointCreated.listen(() => {
      this.moveInterrupt(world);
      this.targetGet(world);
    });
    this.draw(world);
    this.targetGet(world);
  }
  draw(world) {
    this.pieces = [];
    this.el = $('#snake');
    var i = 0, l = this.length;
    for (; i < l; i++) {
      this.pieceAdd(world, i);
    }

    //if (settings.dev) {
    //  _.each(this.pieces, (piece, index) => {
    //    var top = 5 + index,
    //      left = 10 - index;
    //
    //    piece.move({
    //      top: top,
    //      left: left,
    //      _top: top * world.pixel,
    //      _left: left * world.pixel
    //    });
    //  });
    //}
  }
  targetGet(world) {
    var shadowPoints = world.shadowPointsGet(),
      points = world.points.length ? world.points : shadowPoints;

    var curLoop = (points) => {
      var i = 0, l = points.length,
        point, tryPath, target;

      for (; i < l; i++) {
        point = points[i];
        tryPath = this.getPath(world, null, {
          point: point
        });
        if (tryPath.length) {
          if (points !== shadowPoints) {
            target = nextLoop(points, i, point, tryPath) || nextLoop(shadowPoints, i, point, tryPath, true);
          } else {
            target = nextLoop(points, i, point, tryPath);
          }
          if (target) {
            return target;
          }
        }
      }
    };

    var nextLoop = (points, curIndex, curPoint, curPath, isShadow) => {
      if (!points || !points.length) return false;

      var i = 0, l = points.length,
        nextTryPath;

      for (; i<l; i++) {
        if (isShadow || curIndex !== i) {
          nextTryPath = this.targetTryNext(world, curIndex, curPoint, curPath, points[i]);
          if (nextTryPath) {
            return nextTryPath;
          }
        }
      }
    };

    var target = points !== shadowPoints ? curLoop(points) || curLoop(shadowPoints) : curLoop(shadowPoints);
    if (target) {
      this.targetSet(target);
      this.inmove && this.move(world);
      return target;
    }

    log('No one point is achievable');
    this.trappedSay();
    return false;
  }
  targetTryNext(world, curPointIndex, curPoint, curPath, nextPoint) {
    var curPathLastPoint = curPath.length - 1,
      nextPosition = {
        top: curPath[curPathLastPoint][1],
        left: curPath[curPathLastPoint][0]
      },
      nextTarget = {
        point: nextPoint
      };

    var nextSnakePosition = curPath.slice(0);
    if (nextSnakePosition.length > this.pieces.length + 1) {
      nextSnakePosition.splice(0, nextSnakePosition.length - this.pieces.length - 1);
    } else if (nextSnakePosition.length < this.pieces.length) {
      let i = 0,
        l = this.pieces.length - nextSnakePosition.length,
        piece;

      for (; i < l; i++) {
        piece = this.pieces[i].position;
        nextSnakePosition.push([
          piece.left,
          piece.top
        ]);
      }
    }

    var nextPath = this.getPath(world, nextPosition, nextTarget, nextSnakePosition);

    if (nextPath.length) {
      return {
        index: curPoint.id === 'shadow_point' ? curPoint.id : curPointIndex,
        point: curPoint,
        path: curPath
      };
    } else {
      return false;
    }
  }
  targetSet(target) {
    if (_.isObject(target) && !_.isUndefined(target.index) && target.point && target.path) {
      this.target = target;
      //this.logSet(target.path);
      return true;
    } else {
      return false;
    }
  }
  checkTargetReached() {
    var position = this.position,
      target = this.target.point;

    return position.left === target.left && position.top === target.top;
  }
  targetReached(world, getNext) {
    if (this.target.index !== 'shadow_point') {
      world.pointRemove(this.target.index);
      this.length += 1;
      this.setDirection();
      this.pieceAdd(world, this.length - 1);
      this.actions.lengthChanged();
    }
    this.target = null;
    if (getNext) {
      this.targetGet(world);
    }
  }
  move(world) {
    var path = this.target.path,
      animationTask = {
        name: 'snake_move',
        frames: [],
        callback: () => {
          if (this.checkTargetReached()) {
            log('Stop moved');
            this.targetReached(world, true);
          } else {
            this.trappedSay();
          }
        }
      };

    _.each(path, pathPoint => {
      animationTask.frames.push(() => {
        var chainPoint, chainPrevPoint,
          nextPoint = world.map[pathPoint[1]][pathPoint[0]];

        _.extend(this.position, nextPoint);
        _.each(this.pieces, (piece, pieceIndex) => {
          chainPoint = _.clone(piece.position);
          if (piece.head) {
            piece.move(nextPoint);
          } else {
            piece.move(chainPrevPoint, this.pieces[pieceIndex - 1], pieceIndex === this.pieces.length - 1);
          }
          chainPrevPoint = chainPoint;
        });
      });
    });
    world.animationAdd(animationTask);
    log('Start moved');
  }
  moveInterrupt(world) {
    world.animationRemove('snake_move');
    log('Moved Interrupt');
    if (this.checkTargetReached()) {
      this.targetReached(world, false);
    }
    this.target = null;
  }
  getPath(world, curPosition, target, nextSnakePosition) {
    curPosition = curPosition || this.position;
    target = target || this.target;
    if (curPosition.left === target.point.left && curPosition.top === target.point.top) {
      return [];
    }

    var matrix = [];
    _.each(world.map, string => {
      var matrixString = [];
      _.each(string, pixel => {
        let i = 0, l,
          piece, result = 0;

        if (nextSnakePosition) {
          l = nextSnakePosition.length;
          for (; i<l; i++) {
            piece = nextSnakePosition[i];
            if (piece[1] === pixel.top && piece[0] === pixel.left) {
              result = 1;
              break;
            }
          }
        } else {
          l = this.pieces.length;
          for (; i<l; i++) {
            piece = this.pieces[i].position;
            if (piece.top === pixel.top && piece.left === pixel.left) {
              result = 1;
              break;
            }
          }
        }

        i = 0; l = world.points.length;
        for (; i<l; i++) {
          piece = world.points[i];
          if (piece !== target.point && piece.top === pixel.top && piece.left === pixel.left) {
            result = 1;
            break;
          }
        }
        matrixString.push(result);
      });
      matrix.push(matrixString);
    });
    var grid = new PF.Grid(matrix),
      finder = new PF.BestFirstFinder({
        allowDiagonal: settings.allowDiagonalPath
      }),
      path = finder.findPath(
        curPosition.left,
        curPosition.top,
        target.point.left,
        target.point.top,
        grid
      );

    if (path.length > 0) {
      path.shift();
    }
    return path;
  }
  setDirection() {
    var length = this.pieces.length,
      last = this.pieces[length - 1].position,
      beforeLast = this.pieces[length - 2].position;

    if (last.left < beforeLast.left) {
      this.direction = 'right';
    } else if (last.left > beforeLast.left) {
      this.direction = 'left';
    } else if (last.top < beforeLast.top) {
      this.direction = 'bottom';
    } else if (last.top > beforeLast.top) {
      this.direction = 'top';
    }
    return this.direction;
  }
  pieceAdd(world, index) {
    var piece = new SnakePiece({
      index: index,
      worldSize: {
        width: world.width,
        height: world.height
      },
      worldMap: world.map,
      worldPixel: world.pixel,
      snakePosition: {
        top: this.position.top,
        left: this.position.left
      },
      snakeBody: this.pieces,
      snakeDirection: this.direction
    });
    $(this.el).append(piece.el);
    this.pieces.push(piece);
    return piece;
  }
  clampedSay() {
    this.say('Opps');
  }
  trappedSay() {
    this.trapped = true;
    this.actions.trapped();
    this.say('I am trapped');
    //this.logList();
  }
  say(words) {
    this.pieces[0].say(words);
  }
  logSet(path) {
    this.log = this.log || [];
    this.log.push(path);
    if (this.log.length > 5) {
      this.log.splice(0, this.log.length - 5);
    }
  }
  logList() {
    _.each(this.log, item => {
      log(item);
    });
  }
}