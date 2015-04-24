"use strict";

import {settings} from 'settings';

export var log = function(msg) {
  if (settings.dev) {
    console.log(msg);
  }
};