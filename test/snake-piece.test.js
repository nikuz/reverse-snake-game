'use strict';

import {World} from 'world';
import {SnakePiece} from 'snake-piece';
import * as _ from 'underscore';
import * as $ from 'jquery';

describe('Snake Piece - Create', () => {
  var world = new World(),
    width = 50, // count of pixels by width
    height = 28, // count of pixels by height
    pixel = 28,
    map = world.mapGenerate({
      width: width,
      height: height,
      pixel: pixel
    }),
    pieceParams = {
      index: 0,
      worldSize: {
        width: width,
        height: height
      },
      worldMap: map,
      worldPixel: pixel,
      snakePosition: {
        top: 0,
        left: 0
      },
      snakeBody: [],
      snakeDirection: 'top'
    };

  it('should create snake piece', () => {
    var params = JSON.parse(JSON.stringify(pieceParams)),
      i = 0, l = 10, piece;

    for (; i<l; i++) {
      params.index = i;
      piece = new SnakePiece(params);
      expect(piece.position.top).toEqual(i);
      expect(piece.position.left).toEqual(0);
      expect(piece.position._top).toEqual(i * pixel);
      expect(piece.position._left).toEqual(0);
      params.snakeBody.push(piece);
    }
  });
});
