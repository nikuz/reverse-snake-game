'use strict';

import * as $ from 'jquery';
import * as $mobile from 'jquerymobile';
import * as _ from 'underscore';
import * as Reflux from 'reflux';

export class Menu {
  constructor(world) {
    this.actions = Reflux.createActions([
      'startTaped',
      'hsTaped',
      'settingsTaped'
    ]);
    world.actions.start.listen(() => {
      this.close(world);
    });
    world.actions.getMenu.listen(() => {
      this.open(world);
    });
    world.actions.gameover.listen(() => {
      this.open(world, 'game-over');
    });

    this.draw(world);
  }
  draw(world) {
    this.el = $('#ovl_wrap');
    $('#m-start').on('tap', () => {
      this.actions.startTaped();
      this.closed(() => {
        world.el
          .addClass('game-started')
          .removeClass('initial-state');
      });
    });
    $('#m-resume').on('tap', () => {
      this.close(world);
    });
    $('#m-hs').on('tap', () => {
      this.actions.hsTaped();
    });
    $('#m-settings').on('tap', () => {
      this.actions.settingsTaped();
    });
  }
  open(world, cl) {
    world.el.removeClass('ovl-closed');
    setTimeout(() => {
      cl = cl || '';
      world.el.addClass('ovl-opened ' + cl);
    }, 20);
  }
  close(world) {
    this.el.one('transitionend', () => {
      world.el.addClass('ovl-closed');
      this.afterClose();
    });
    world.el.removeClass('ovl-opened');
  }
  afterClose() {
    _.each(this.afterCloseStack, item => {
      item();
    });
    this.afterCloseStack = [];
  }
  closed(handler) {
    if (!this.afterCloseStack) {
      this.afterCloseStack = [];
    }
    this.afterCloseStack.push(handler);
  }
}
