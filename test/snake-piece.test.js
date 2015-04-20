'use strict';

import {World} from 'world';
import {SnakePiece} from 'snake-piece';
import * as _ from 'underscore';
import * as $ from 'jquery';

describe('Snake Piece - Validate', () => {
  var piece = new SnakePiece({}),
    pieceParams = {
      index: 0,
      worldSize: {
        width: 50,
        height: 28
      },
      worldMap: 'map',
      worldPixel: 28,
      snakePosition: {
        top: 0,
        left: 0
      },
      snakeBody: [],
      snakeDirection: 'top'
    };

  it('should return true', () => {
    expect(piece.validate(pieceParams)).toEqual(true);
  });
  it('should return false', () => {
    delete pieceParams.worldSize;
    expect(piece.validate(pieceParams)).toEqual(false);
  });
});

describe('Snake Piece - Out of', () => {
  var world = new World(),
    piece = new SnakePiece({}),
    width = 50, // count of pixels by width
    height = 28, // count of pixels by height
    pieceParams = {
      worldSize: {
        width: width,
        height: height
      }
    },
    position = {
      top: 5,
      left: 5
    };

  it('should return position object if point contained in world canvas', () => {
    var position1 = _.clone(position);
    position1 = piece.checkIsOutOf(pieceParams, position1);
    expect(position1.top).toEqual(5);
    expect(position1.left).toEqual(5);
    expect(position1.attempt).toEqual(1);
  });
  it('should shift left position to 0 and top position to 6', () => {
    var position2 = _.clone(position);
    position2.left = -1;
    position2 = piece.checkIsOutOf(pieceParams, position2);
    expect(position2.top).toEqual(6);
    expect(position2.left).toEqual(0);
    expect(position2.attempt).toEqual(2);
  });
  it('should shift left and top positions to 0', () => {
    var position3 = _.clone(position);
    position3.left = -1;
    position3.top = -1;
    position3 = piece.checkIsOutOf(pieceParams, position3);
    expect(position3.top).toEqual(0);
    expect(position3.left).toEqual(0);
    expect(position3.attempt).toEqual(2);
  });
  it('should shift left position to 48 and top position to 27', () => {
    var position4 = _.clone(position);
    position4.left = 51;
    position4.top = 28;
    position4 = piece.checkIsOutOf(pieceParams, position4);
    expect(position4.top).toEqual(27);
    expect(position4.left).toEqual(48);
    expect(position4.attempt).toEqual(3);
  });
});

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
  it('should return empty piece object', () => {
    delete pieceParams.worldSize;
    expect(_.isEmpty(new SnakePiece(pieceParams))).toEqual(true);
  });
});
