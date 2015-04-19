'use strict';

import {World} from 'world';
import * as _ from 'underscore';
import * as $ from 'jquery';

describe('World - Size generate', () => {
  var world = new World();

  it('should generate world size based on 1400x800', () => {
    var size = world.sizeGenerate({
      width: 1400,
      height: 800,
      pixelPercent: 2
    });

    expect(size.pixel).toEqual(28);
    expect(size.width).toEqual(50);
    expect(size.height).toEqual(28);
  });
  it('should generate world size based on 1756x937', () => {
    var size = world.sizeGenerate({
      width: 1756,
      height: 937,
      pixelPercent: 2
    });

    expect(size.pixel).toEqual(35);
    expect(size.width).toEqual(50);
    expect(size.height).toEqual(26);
  });
});

describe('World - Map generate', () => {
  var world = new World(),
    width = 50, // count of pixels by width
    height = 28, // count of pixels by height
    pixel = 28,
    map = world.mapGenerate({
      width: width,
      height: height,
      pixel: pixel
    });

  it('should be a two-dimensional array', () => {
    expect(_.isArray(map)).toEqual(true);
    _.each(map, string => {
      expect(_.isArray(string)).toEqual(true);
    });
  });
  it('length should equal world height', () => {
    expect(map.length).toEqual(height);
  });
  it('each string length should be equal world width', () => {
    _.each(map, string => {
      expect(string.length).toEqual(width);
    });
  });
});

describe('World - Shadow points', () => {
  var world = new World(),
    size = world.sizeGenerate({
      width: 1400,
      height: 800,
      pixelPercent: 2
    }),
    map = world.mapGenerate({
      width: size._width,
      height: size._height,
      pixel: size.pixel
    }),
    shadowPoints;

  it('should generate array of shadow points', () => {
    shadowPoints = world.shadowPointsGenerate({
      width: size.width,
      height: size.height,
      map: map
    });
    expect(_.isArray(shadowPoints)).toEqual(true);
    expect(shadowPoints.length).toEqual(4);
    _.each(shadowPoints, function(item) {
      expect(item.id).toEqual('shadow_point');
    });
  });
  it('each request of method should shift first element to end of list', () => {
    var firstRequestShadowPoints = world.shadowPointsGet(shadowPoints),
      firstPoint = firstRequestShadowPoints[0],
      secondRequestShadowPoints = world.shadowPointsGet(shadowPoints),
      lastPoint = secondRequestShadowPoints[secondRequestShadowPoints.length - 1];

    expect(firstPoint).toEqual(lastPoint);
    expect(firstRequestShadowPoints.length).toEqual(4);
    expect(secondRequestShadowPoints.length).toEqual(4);
  });
});

describe('World - Point add', () => {
  var world = new World(),
    size = world.sizeGenerate({
      width: 1400,
      height: 800,
      pixelPercent: 2
    }),
    params = {
      width: size.width,
      height: size.height,
      pixel: size.pixel
    },
    event = {
      target: $('<div id="canvas"></div>')[0],
      offsetY: 100,
      offsetX: 150
    };

  world.snake = {
    pieces: [{
      position: {
        left: 0,
        top: 0
      }
    }]
  };

  it('should create new point', () => {
    var point = world.pointAdd(event, params);
    expect(point.top).toEqual(3);
    expect(point.left).toEqual(5);
    expect(point._top).toEqual(size.pixel * point.top);
    expect(point._left).toEqual(size.pixel * point.left);

    expect(world.points.length).toEqual(1);
  });
  it('shouldn\'t add point if user click to the snake', () => {
    var event2 = _.clone(event);
    _.extend(event2, {
      target: $('<div id="piece_1"></div>')[0]
    });
    expect(world.pointAdd(event2, params)).toEqual(false);
  });
  it('shouldn\'t add point if calculated position on the snake', () => {
    var event3 = _.clone(event);
    _.extend(event3, {
      offsetY: 5,
      offsetX: 5
    });
    expect(world.pointAdd(event3, params)).toEqual(false);
  });
  it('shouldn\'t add point if user click to other point', () => {
    // because point with this params was added in first test
    expect(world.pointAdd(event, params)).toEqual(false);
  });
});

describe('World - Point remove', () => {
  var world = new World(),
    size = world.sizeGenerate({
      width: 1400,
      height: 800,
      pixelPercent: 2
    }),
    params = {
      width: size.width,
      height: size.height,
      pixel: size.pixel
    },
    event = {
      target: $('<div id="canvas"></div>')[0],
      offsetY: 100,
      offsetX: 100
    };

  world.snake = {
    pieces: [{
      position: {
        left: 0,
        top: 0
      }
    }]
  };

  it('should remove specified point', () => {
    world.pointAdd(event, params);
    expect(world.points.length).toEqual(1);
    expect(world.pointRemove(0)).toEqual(true);
    expect(world.points.length).toEqual(0);
  });
  it('shouldn\'t remove not exists points', () => {
    world.pointAdd(event, params);
    expect(world.pointRemove(1)).toEqual(false);
    expect(world.points.length).toEqual(1);
  });
});

describe('World - Animation', () => {
  var world = new World(),
    animationName = 'test',
    animationCallbackIsCalled,
    animationTasks = world.animationTasks,
    animation = {
      frames: [],
      callback: () => {
        animationCallbackIsCalled = true;
      }
    },
    i = 0, l = 10;

  for (; i < l; i++) {
    animation.frames.push(() => {});
  }

  it('shouldn\'t add animation if stack object doesn\'t have "name" field', () => {
    expect(world.animationAdd(animation)).toEqual(false);
  });
  it('should add animation to animations stack', () => {
    animation.name = animationName;
    expect(world.animationAdd(animation)).toEqual(true);
    expect(animationTasks[animationName]).toEqual(animation);
  });

  it('should execute animation callback when frames length equal 0', done => {
    setTimeout(() => {
      expect(animationCallbackIsCalled).toEqual(true);
      done();
    }, 200);
  });

  it('should remove specified animation task', () => {
    world.animationAdd(animation);
    expect(_.size(animationTasks)).toEqual(1);
    expect(world.animationRemove(animationName)).toEqual(true);
    expect(_.size(animationTasks)).toEqual(0);
  });
});
