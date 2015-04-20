"use strict";

import * as settings from 'settings';

export var log = function(msg) {
  if (settings.dev) {
    console.log(msg);
  }
};