"use strict";

import * as $ from 'jquery';
import * as Reflux from 'reflux';

export class SnakePiece {
  constructor(options) {
    var opts = options || {};
    this.validate(opts);
  }
  validate(opts) {
    var requiredFields = [
        'index',
        'canvasSize',
        'canvasMap',
        'canvasPixel',
        'snakeBody',
        'snakePosition',
        'snakeDirection'
      ],
      i = 0, l = requiredFields.length,
      field;

    for(; i<l; i++) {
      field = requiredFields[i];
      if (opts[field] === undefined) {
        return false;
      }
    }
    this.create(opts);
    return true;
  }
  create(opts) {
    this.position = this.getPiecePosition(opts);
    var canvasCell = opts.canvasMap[this.position.top][this.position.left];
    this.position._left = canvasCell._left;
    this.position._top = canvasCell._top;
    if (opts.index === 0) {
      this.head = true;
    }
    this.draw(opts);
  }
  getPiecePosition(opts) {
    var position;
    if (opts.index === 0) {
      position = opts.snakePosition;
    } else {
      let prevPiece = opts.snakeBody[opts.index - 1].position;

      switch (opts.snakeDirection) {
        case 'top':
          position = {
            top: prevPiece.top + 1,
            left: prevPiece.left
          };
          break;
        case 'right':
          position = {
            top: prevPiece.top,
            left: prevPiece.left - 1
          };
          break;
        case 'bottom':
          position = {
            top: prevPiece.top - 1,
            left: prevPiece.left
          };
          break;
        case 'left':
          position = {
            top: prevPiece.top,
            left: prevPiece.left + 1
          };
          break;
      }
    }

    return this.checkIsOutOf(opts, position);
  }
  checkIsOutOf(opts, position) {
    var ww = opts.canvasSize.width - 1,
      wh = opts.canvasSize.height - 1,
      iterator = position.attempt ? -1 : 1,
      outOf;

    if (position.left > ww) {
      position.left = ww;
      position.top += iterator;
      position.direction = iterator > 0 ? 'top' : 'bottom';
      outOf = true;
    } else if (position.left < 0) {
      position.left = 0;
      position.top += iterator;
      position.direction = iterator > 0 ? 'top' : 'bottom';
      outOf = true;
    } else if (position.top > wh) {
      position.top = wh;
      position.left += iterator;
      position.direction = iterator > 0 ? 'right' : 'left';
      outOf = true;
    } else if (position.top < 0) {
      position.top = 0;
      position.left += iterator;
      position.direction = iterator > 0 ? 'right' : 'left';
      outOf = true;
    }
    position.attempt = (position.attempt + 1) || 1;
    position.direction = position.direction || opts.snakeDirection;
    if (!outOf || position.attempt > 5) {
      return position;
    } else if (outOf) {
      return this.checkIsOutOf(opts, position);
    }
  }
  draw(opts) {
    var pieceId = `piece_${opts.index}`;
    this.el = $(`<div id="${pieceId}" class="${this.position.direction}"></div>`);
    this.el.css({
      width: opts.canvasPixel,
      height: opts.canvasPixel,
      left: this.position._left,
      top: this.position._top
    });
  }
  move(point, nextPiece, isTail) {
    var direction,
      nextPieceDirection = nextPiece && nextPiece.position.direction,
      cornerCl = '';

    if (isTail) {
      direction = nextPieceDirection;
    } else {
      var curP = this.position,
        curL = curP.left,
        curT = curP.top,
        L = point.left,
        T = point.top;

      if (curL < L) {
        direction = 'right';
      } else if (curL > L) {
        direction = 'left';
      } else if (curT < T) {
        direction = 'bottom';
      } else if (curT > T) {
        direction = 'top';
      }

      if (!this.head) {
        if (direction !== nextPieceDirection) {
          cornerCl = 'cr_' + direction + '_' + nextPieceDirection;
        }
      }
    }
    _.extend(this.position, point, {direction: direction});
    $(this.el).css({
      'left': point._left,
      'top': point._top
    }).attr('class', direction + ' ' + cornerCl);
  }
  say(message) {
    if (!this.tooltip) {
      $(this.el).append(`<span class="snake-tooltip">${message}</span>`);
      $('span', this.el).delay(100).hide(function() {
        $(this).remove();
      });
    }
  }
}
