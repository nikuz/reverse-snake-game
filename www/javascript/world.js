'use strict';

import {Canvas} from 'canvas';
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
  var canvas = new Canvas();
  var snake = new Snake(canvas, {
    //inmove: false,
    position: {
      top: 5,
      left: 10
    },
    direction: 'bottom'
  });
}