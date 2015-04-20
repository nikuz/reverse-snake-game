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
        'worldSize',
        'worldMap',
        'worldPixel',
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
    var worldCell = opts.worldMap[this.position.top][this.position.left];
    this.position._left = worldCell._left;
    this.position._top = worldCell._top;
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
    var ww = opts.worldSize.width - 1,
      wh = opts.worldSize.height - 1,
      iterator = position.attempt ? -1 : 1,
      outOf;

    if (position.left > ww) {
      position.left = ww;
      position.top += iterator;
      outOf = true;
    } else if (position.left < 0) {
      position.left = 0;
      position.top += iterator;
      outOf = true;
    } else if (position.top > wh) {
      position.top = wh;
      position.left += iterator;
      outOf = true;
    } else if (position.top < 0) {
      position.top = 0;
      position.left += iterator;
      outOf = true;
    }
    position.attempt = (position.attempt + 1) || 1;
    if (!outOf || position.attempt > 5) {
      return position;
    } else if (outOf) {
      return this.checkIsOutOf(opts, position);
    }
  }
  draw(opts) {
    var pieceId = `piece_${opts.index}`;
    this.el = $(`<div id="${pieceId}"></div>`);
    this.el.css({
      width: opts.worldPixel,
      height: opts.worldPixel,
      left: this.position._left,
      top: this.position._top
    });
  }
  move(point) {
    this.position = point;
    $(this.el).css({
      'left': point._left,
      'top': point._top
    });
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
