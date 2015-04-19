'use strict';

import {SnakePiece} from 'snake-piece';
import * as $ from 'jquery';
import * as _ from 'underscore';
import * as PF from 'pathfinding';
import * as Reflux from 'reflux';

export class Snake {
  constructor(world, options) {
    options = options || {};
    var defaults = {
      inmove: true,
      length: 5,
      direction: 'right',
      position: {
        left: 0,
        top: 0
      }
    };
    _.extend(defaults, options);
    _.extend(this, defaults);

    this.pieces = [];
    world.snake = this;
    world.actions.snakeCreated();

    this.actions = Reflux.createActions([
      'lengthChanged'
    ]);

    world.actions.snakeClamped.listen(() => {
      this.clamped();
    });
    world.actions.pointCreated.listen(() => {
      this.moveInterrupt(world);
      this.targetGet(world);
    });
    this.draw(world);
  }
  draw(world) {
    this.el = $('#snake');
    var i = 0, l = this.length;
    for (; i < l; i++) {
      this.pieces.push(this.pieceAdd(world, i));
    }
  }
  targetGet(world) {
    var shadowPoints = world.shadowPointsGet(),
      points = world.points.length ? world.points : shadowPoints;

    var loop = (points, curIndex, curPoint, curPath, isShadow) => {
      if (!points || !points.length) return false;
      for (let j = 0; j<l; j++) {
        if (isShadow || curIndex !== j) {
          return this.targetTryNext(world, curIndex, curPoint, curPath, points[j]);
        }
      }
    };

    var i = 0, l = points.length,
      point, tryPath, target;

    for (; i < l; i++) {
      point = points[i];
      tryPath = this.getPath(world, null, {
        point: point
      });
      if (tryPath.length) {
        target = loop(points, i, point, tryPath) || (points !== shadowPoints && loop(shadowPoints, i, point, tryPath, true));
        if (target) {
          this.targetSet(target);
          this.inmove && this.move(world);
          return target;
        }
      }
    }
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
    if (_.isObject(target) && target.index && target.point && target.path) {
      this.target = target;
      return true;
    } else {
      return false;
    }
  }
  targetReached(world) {
    if (this.target.index !== 'shadow_point') {
      world.pointRemove(this.target.index);
      this.length += 1;
      this.setDirection();
      this.pieceAdd(world, this.length - 1);
      this.actions.lengthChanged();
    }
    this.target = null;
    this.targetGet(world);
  }
  move(world) {
    var path = this.target.path,
      animationTask = {
        name: 'snake_move',
        frames: [],
        callback: () => {
          var position = this.position,
            target = this.target.point;

          if (position.left === target.left && position.top === target.top) {
            this.targetReached(world);
          } else {
            this.trapped();
          }
        }
      };

    _.each(path, pathPoint => {
      animationTask.frames.push(() => {
        var chainPoint, chainPrevPoint,
          nextPoint = world.map[pathPoint[1]][pathPoint[0]];

        this.position = nextPoint;
        _.each(this.pieces, piece => {
          chainPoint = piece.position;
          if (piece.head) {
            piece.move(nextPoint);
          } else {
            piece.move(chainPrevPoint);
          }
          chainPrevPoint = chainPoint;
        });
      });
    });
    world.animationAdd(animationTask);
    console.log('start moved');
  }
  moveInterrupt(world) {
    this.target = null;
    world.animationRemove('snake_move');
    console.log('Stop moved');
  }
  getPath(world, curPosition, target, nextSnakePosition) {
    curPosition = curPosition || this.position;
    target = target || this.target;
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
        allowDiagonal: true
      });

    return finder.findPath(
      curPosition.left,
      curPosition.top,
      target.point.left,
      target.point.top,
      grid
    );
  }
  setDirection() {
    var last = this.pieces[this.length - 2].position,
      beforeLast = this.pieces[this.length - 3].position;

    if (last.left < beforeLast.left) {
      this.direction = 'right';
    } else if (last.left > beforeLast.left) {
      this.direction = 'left';
    } else if (last.top < beforeLast.top) {
      this.direction = 'bottom';
    } else if (last.top > beforeLast.top) {
      this.direction = 'top';
    }
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
    return piece;
  }
  clamped() {
    this.pieces[0].say('Opps');
  }
  trapped() {
    this.pieces[0].say('I am trapped');
  }
}