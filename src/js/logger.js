"use strict";

import {config} from 'config';

export var log = function(msg) {
  if (config.dev) {
    console.log(msg);
  }
};