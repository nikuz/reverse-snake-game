'use strict';

import * as $ from 'jquery';
import * as $mobile from 'jquerymobile';
import * as Reflux from 'reflux';

export class Settings {
  constructor(world, menu) {
    menu.actions.settingsTaped.listen(() => {
      this.open(world);
      this.draw(world);
    });
  }
  draw(world) {
    $('#back_settings').on('tap', () => {
      this.close(world);
    });
  }
  open(world) {
    world.el.addClass('settings-shown');
  }
  close(world) {
    world.el.removeClass('settings-shown');
  }
}
