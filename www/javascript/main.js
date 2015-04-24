'use strict';

import {World} from 'world';
import {Snake} from 'snake';

var isReady;
$(document).on('deviceready', function(){
  !isReady && ready();
});
$(document).ready(function(){
  !isReady && ready();
});

function ready() {
  isReady = true;
  var world = new World();
  var snake = new Snake(world, {
    //inmove: false,
    position: {
      top: 5,
      left: 10
    },
    direction: 'bottom'
  });
}