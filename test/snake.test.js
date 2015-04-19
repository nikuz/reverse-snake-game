'use strict';

import {World} from 'world';
import {Snake} from 'snake';
import {SnakePiece} from 'snake-piece';
import * as _ from 'underscore';
import * as $ from 'jquery';

/*describe('Snake - Create', () => {
  var world = new World(),
    length = 10,
    position = {
      left: 10,
      top: 10
    },
    direction = 'left',
    snake = new Snake(world, {
      inmove: false,
      length: length,
      position: position,
      direction: direction
    });

  it('should create snake', () => {
    expect(snake.length).toEqual(length);
    expect(snake.position).toEqual(position);
    expect(snake.direction).toEqual(direction);
  });
});*/

/*describe('Snake - Path get', () => {
  var world = new World(),
    width = 50, // count of pixels by width
    height = 28, // count of pixels by height
    pixel = 28,
    length = 10,
    initialPosition = {
      left: 0,
      top: 0
    },
    nextPosition = {
      top: 0,
      left: 30
    },
    target1 = {
      point: {
        top: 0,
        left: 30
      }
    },
    target2 = {
      point: {
        top: 20,
        left: 20
      }
    },
    target3 = {
      point: {
        top: 0,
        left: 25
      }
    },
    snake = new Snake(world, {
      inmove: false,
      length: length,
      position: initialPosition
    });

  world.mapGenerate({
    width: width,
    height: height,
    pixel: pixel
  });

  it('should be a two-dimensional array', () => {
    var path = snake.getPath(world, initialPosition, target1);
    expect(_.isArray(path)).toEqual(true);
    _.each(path, item => {
      expect(_.isArray(item)).toEqual(true);
    });
  });

  it('should generate path from 0:0 to 0:30', () => {
    var path = snake.getPath(world, initialPosition, target1);
    expect(path.length).toEqual(31);
    _.each(path, (item, count) => {
      expect(item.length).toEqual(2);
      // first value is a left
      expect(item[0]).toEqual(count);
      // second value is a top
      expect(item[1]).toEqual(0);
    });
  });

  it('should generate path from 0:0 to 20:20', () => {
    // diagonal path
    var path = snake.getPath(world, initialPosition, target2);
    expect(path.length).toEqual(21);
    _.each(path, (item, count) => {
      // first value is a left
      expect(item[0]).toEqual(count);
      // second value is a top
      expect(item[1]).toEqual(count);
    });
  });

  it('should generate path from 0:0 to 0:30 if next target is achievable', () => {
    var path = snake.getPath(world, initialPosition, target1),
      nextPath = snake.getPath(world, nextPosition, target2, path);

    expect(path.length).toEqual(31);
    expect(nextPath.length).toEqual(21);
  });
  it('nextPath length will be 0 if next target under snake\'s body', () => {
    var path = snake.getPath(world, initialPosition, target1),
      nextPath = snake.getPath(world, nextPosition, target3, path);

    expect(path.length).toEqual(31);
    expect(nextPath.length).toEqual(0);
  });
  it('nextPath length will be 0 if next target the same as current snake position', () => {
    var path = snake.getPath(world, initialPosition, {
      point: initialPosition
    });
    expect(path.length).toEqual(0);
  });
});*/

/*describe('Snake - Target try next (considering the current path)', () => {
  var world = new World(),
    points = [{
      top: 10,
      left: 10,
      id: 'point_1'
    }, {
      top: 10,
      left: 15,
      id: 'point_2'
    }, {
      top: 9,
      left: 10,
      id: 'point_3'
    }, {
      top: 10,
      left: 13,
      id: 'point_4'
    }],
    snake = new Snake(world, {
      inmove: false,
      position: points[0],
      direction: 'top'
    });

  it('should confirm that next target is achievable', () => {
    // current path will be from points[0] to points[1]
    var curPath = snake.getPath(world, points[0], {
        point: points[1]
      }),
      // target is points[2]
      nextTarget = snake.targetTryNext(world, 1, points[1], curPath, points[2]);

    // if next path is achievable, return curPath
    expect(!!nextTarget).toEqual(true);
    expect(nextTarget.path).toEqual(curPath);
  });
  it('should return false if next target is not achievable', () => {
    // current path will be from points[0] to points[1]
    var curPath = snake.getPath(world, points[0], {
        point: points[1]
      }),
      // target is points[3]
      nextTarget = snake.targetTryNext(world, 1, points[1], curPath, points[3]);

    expect(nextTarget).toEqual(false);
  });
});

describe('Snake - Target set', () => {
  var world = new World(),
    snake = new Snake(world, {
      inmove: false
    }),
    target = {
      index: 'target_1',
      point: 'point_1',
      path: []
    };

  it('should set target', () => {
    expect(snake.targetSet(target)).toEqual(true);
  });
  it('shouldn\'t set target if target object is corrupted', () => {
    var target2 = _.clone(target);
    target2.path = null;
    expect(snake.targetSet(target2)).toEqual(false);
  });
});

describe('Snake - Target get', () => {
  var world = new World(),
    points = [{
      top: 10,
      left: 10,
      id: 'point_1'
    }, {
      top: 10,
      left: 15,
      id: 'point_2'
    }, {
      top: 9,
      left: 10,
      id: 'point_3'
    }, {
      top: 10,
      left: 13,
      id: 'point_4'
    }],
    snake = new Snake(world, {
      inmove: false,
      position: points[0],
      direction: 'top'
    });

  world.points = points;

  it('should get next target for snake', () => {
    var target = snake.targetGet(world);
    expect(target.point).toEqual(points[1]);
  });
});*/
