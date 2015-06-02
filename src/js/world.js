'use strict';

import * as $ from 'jquery';
import * as $mobile from 'jquerymobile';
import * as Reflux from 'reflux';
import {Menu} from 'menu';
import {HS} from 'hs';
import {Settings} from 'settings';
import {Canvas} from 'canvas';
import {Snake} from 'snake';

class World {
  constructor() {
    this.el = $('body');
    this.gameState = 'play';
    this.actions = Reflux.createActions([
      'start',
      'pause',
      'play',
      'gameover',
      'getMenu'
    ]);

    this.draw();
    this.backgroundPrepare();

    /*setTimeout(() => {
      this.gameOver();
    }, 3000);*/
  }
  draw() {
    var menu = new Menu(this),
      hs = new HS(this, menu),
      settings = new Settings(this, menu);

    menu.actions.startTaped.listen(() => {
      this.gameStart();
    });
    $('#pause').on('tap', e => {
      e.preventDefault();
      if (this.gameState === 'play') {
        this.gamePause();
      } else {
        this.gamePlay();
      }
    });
    $('#menu').on('tap', e => {
      e.preventDefault();
      this.actions.getMenu();
    });

    $('#cw-restart').on('click', () => {
      this.gameRestart();
      menu.closed(() => {
        this.el
          .addClass('game-started')
          .removeClass('game-over initial-state');
      });
    });
    $('#cw-hs').on('click', () => {
      menu.actions.hsTaped(true);
      this.el.removeClass('game-over');
      setTimeout(() => {
        this.el.addClass('initial-state');
      }, 500);
    });
  }
  backgroundPrepare() {
    var canvas = new Canvas(this),
      snake = new Snake(canvas, {
        //inmove: false,
        position: {
          top: 5,
          left: 10
        },
        direction: 'bottom'
      });

    this.score = 0;
    snake.actions.trapped.listen(() => {
      this.gameOver();
    });
  }
  gameStart() {
    if (this.gameState !== 'over') {
      this.actions.start();
      //this.backgroundPrepare();
    } else {
      this.gameRestart();
    }
  }
  gameRestart() {
    this.gameState = 'play';
    this.actions.start();
    this.backgroundPrepare();
  }
  gamePause() {
    this.actions.pause();
    this.gameState = 'pause';
    this.el.addClass('game-pause');
  }
  gamePlay() {
    this.actions.play();
    this.gameState = 'play';
    this.el.removeClass('game-pause');
  }
  gameOver() {
    this.gameState = 'over';
    this.actions.gameover();
    this.el.removeClass('game-started');
  }
}
if (window.device) {
  document.addEventListener('deviceready', () => {
    $(document).ready(() => {
      new World();
    });
  });
} else {
  $(document).ready(() => {
    new World();
  });
}
