'use strict';

import {config} from 'config';
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
  constructor(canvas, options) {
    options = options || {};
    _.extend(this, defaultsSnakeOptions, options);
    this.position = {};
    _.extend(this.position, defaultSnakePosition);

    canvas.snake = this;

    this.actions = Reflux.createActions([
      'lengthChanged',
      'trapped'
    ]);
    canvas.actions.snakeCreated();

    canvas.actions.snakeClamped.listen(() => {
      this.clampedSay();
    });
    canvas.actions.pointCreated.listen(() => {
      this.moveInterrupt(canvas);
      this.targetGet(canvas);
    });
    this.draw(canvas);
    this.targetGet(canvas);
  }
  draw(canvas) {
    this.pieces = [];
    this.el = $('#snake');
    this.el.html('');
    var i = 0, l = this.length;
    for (; i < l; i++) {
      this.pieceAdd(canvas, i);
    }

    //if (config.dev) {
    //  _.each(this.pieces, (piece, index) => {
    //    var top = 5 + index,
    //      left = 10 - index;
    //
    //    piece.move({
    //      top: top,
    //      left: left,
    //      _top: top * canvas.pixel,
    //      _left: left * canvas.pixel
    //    });
    //  });
    //}
  }
  targetGet(canvas) {
    var points = canvas.points;
    if (points.length) {
      _.each(points, (item, index) => {
        item.index = index;
      });
    }
    points = points.concat(canvas.shadowPointsGet());
    var i = 0, l = points.length,
      tryPath, sequence = [],
      initialPath = [
        [this.position.left, this.position.top]
      ],
      pathes = [],
      curPath = initialPath,
      permutations = 0,
      snakePieces = this.pieces.slice(0),
      firstPath = this.targetTryNext(canvas, curPath, points[0], snakePieces);

    for (; i<l; i++) {
      tryPath = this.targetTryNext(canvas, curPath, points[i], snakePieces);
      if (tryPath) {
        sequence.push({
          index: points[i].id === 'shadow_point' ? points[i].id : points[i].index,
          point: points[i],
          path: tryPath
        });
        if (sequence.length === config.sequenceLength) {
          break;
        }
        pathes.push(tryPath);
        curPath = tryPath;

        // add virtual piece
        if (curPath.length > snakePieces.length) {
          snakePieces.push({
            position: curPath[curPath.length - snakePieces.length - 1]
          });
        } else {
          snakePieces.push({
            position: snakePieces[0].getPiecePosition({
              index: snakePieces.length,
              canvasSize: {
                width: canvas.width,
                height: canvas.height
              },
              snakePosition: {
                top: this.position.top,
                left: this.position.left
              },
              snakeBody: snakePieces,
              snakeDirection: this.direction
            })
          });
        }
      } else {
        permutations += 1;
        if (permutations === l) {
          break;
        }
        points.push(points.splice(i, 1)[0]);
        i -= 1;
        if (sequence.length > 1) {
          curPath = pathes[pathes.length - 2];
        } else {
          curPath = initialPath;
        }
        pathes.pop();
        sequence.pop();
        snakePieces.pop();
      }
    }
    if (sequence.length) {
      this.targetSet(sequence[0]);
      this.inmove && this.move(canvas);
      if (!_.isEqual(firstPath, sequence[0].path)) {
        console.log(sequence);
      }
      return sequence[0];
    }
    console.log(sequence.length);
    log('No one point is achievable');
    this.trappedSay();
    return false;
  }
  targetTryNext(canvas, curPath, nextPoint, nextSnake) {
    var curPathLastPoint = curPath.length - 1,
      nextPosition = {
        top: curPath[curPathLastPoint][1],
        left: curPath[curPathLastPoint][0]
      },
      nextTarget = {
        point: nextPoint
      };

    var nextSnakePosition = curPath.slice(0);
    if (nextSnakePosition.length > nextSnake.length) {
      nextSnakePosition.splice(0, nextSnakePosition.length - nextSnake.length);
    } else if (nextSnakePosition.length < nextSnake.length) {
      let i = 0,
        l = nextSnake.length - nextSnakePosition.length,
        piece;

      for (; i < l; i++) {
        piece = nextSnake[i].position;
        nextSnakePosition.push([
          piece.left,
          piece.top
        ]);
      }
    }

    var nextPath = this.getPath(canvas, nextPosition, nextTarget, nextSnakePosition);
    if (nextPath.length) {
      return nextPath;
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
  targetReached(canvas, getNext) {
    if (this.target.index !== 'shadow_point') {
      canvas.pointRemove(this.target.index);
      this.length += 1;
      this.setDirection();
      this.pieceAdd(canvas, this.length - 1);
      this.actions.lengthChanged();
    }
    this.target = null;
    if (getNext) {
      this.targetGet(canvas);
    }
  }
  move(canvas) {
    var path = this.target.path,
      animationTask = {
        name: 'snake_move',
        frames: [],
        callback: () => {
          if (this.checkTargetReached()) {
            log('Stop moved');
            this.targetReached(canvas, true);
          } else {
            this.trappedSay();
          }
        }
      };

    _.each(path, pathPoint => {
      animationTask.frames.push(() => {
        var chainPoint, chainPrevPoint,
          nextPoint = canvas.map[pathPoint[1]][pathPoint[0]];

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
    canvas.animationAdd(animationTask);
    log('Start moved');
  }
  moveInterrupt(canvas) {
    canvas.animationRemove('snake_move');
    log('Moved Interrupt');
    if (this.checkTargetReached()) {
      this.targetReached(canvas, false);
    }
    this.target = null;
  }
  getPath(canvas, curPosition, target, nextSnakePosition) {
    curPosition = curPosition || this.position;
    target = target || this.target;
    if (curPosition.left === target.point.left && curPosition.top === target.point.top) {
      return [];
    }

    var matrix = [];
    _.each(canvas.map, string => {
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

        i = 0; l = canvas.points.length;
        for (; i<l; i++) {
          piece = canvas.points[i];
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
        allowDiagonal: config.allowDiagonalPath
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
  pieceAdd(canvas, index) {
    var piece = new SnakePiece({
      index: index,
      canvasSize: {
        width: canvas.width,
        height: canvas.height
      },
      canvasMap: canvas.map,
      canvasPixel: canvas.pixel,
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