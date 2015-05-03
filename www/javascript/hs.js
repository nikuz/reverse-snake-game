'use strict';

import * as $ from 'jquery';
import * as $mobile from 'jquerymobile';
import * as _ from 'underscore';
import * as Reflux from 'reflux';

var scoresHost;
if (window.device) {
  scoresHost = 'http://91.239.26.79';
} else {
  scoresHost = 'http://192.168.174.130';
}
const APIKEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9';
const scoreCache = 1; // one hour
// localStorage tokens
const hsToken = 'hs';
const hsAuthToken = 'hs:auth';
const prevScoreToken = 'hs:prev';
const nameToken = 'hs:name';
//
const listIdPrefix = 'hs_i_';
const cssEscapeReg = new RegExp('(!|"|#|\\$|%|&|\'|\\(|\\)|\\*|\\+|,|-|\\.|/|:|;|<|=|>|\\?|@|\\[|\\]|\\^|`|\\{|\\|\\}|\\s)', 'g');

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

export class HS {
  constructor(world, menu) {
    this.actions = Reflux.createActions([
      'scoresReceived',
      'nameReceived',
      'authTokenReceived'
    ]);
    menu.actions.hsTaped.listen(isAddNew => {
      this.open(world);
      this.draw(world);
      if (isAddNew) {
        this.scoresAdd(null, world.score);
      }
    });
    this.actions.nameReceived.listen((name, isUpdate) => {
      this.scoresAdd(name, world.score, isUpdate);
    });
    this.actions.authTokenReceived.listen(() => {
      this.scoresAdd(null, world.score);
    });
  }
  draw(world) {
    $('#back_scores').on('tap', () => {
      this.close(world);
    });
    this.el = $('#high_scores');
    this.listEl = $('#hs-list');
    this.scoresGet();

    this.actions.scoresReceived.listen(scores => {
      var listCont = '',
        curName = localStorage.getItem(nameToken);

      _.each(scores, item => {
        listCont += this.listItemGet(item.name, item.score, item.name === curName);
      });
      this.listEl.html(listCont);
      this.drawed = true;
    });

    $('#hs-refresh').on('tap', () => {
      this.scoresGet(true);
    });
  }
  listItemGet(name, score, me) {
    if (!this.tpl) {
      this.tpl = _.template($('#score_tpl').text());
    }
    if (name.length > 30) {
      name = name.substring(0, 30) + '...';
    }

    return this.tpl({
      score: score,
      name: name,
      id: me ? listIdPrefix + name : '',
      cl: me ? 'me' : ''
    });
  }
  /*authTokenGet() {
    var loadCl = 'hs-upload';
    var device = window.device || {
        model: 'snake_model',
        platform: 'snake_platform',
        uuid: 'snake_uuid',
        version: 'snake_version'
      };

    $.ajax({
      url: this.urlGet('/auth'),
      method: 'post',
      data: {
        model: device.model,
        platform: device.platform,
        uuid: device.uuid,
        version: device.version
      },
      beforeSend: () => {
        this.el.addClass(loadCl);
      },
      success: data => {
        if (data.error) {
          console.log(data.error);
        } else {
          localStorage.setItem(hsAuthToken, data.result.token);
          this.actions.authTokenReceived();
        }
      },
      error: err => {
        console.log(err);
      },
      complete: () => {
        this.el.removeClass(loadCl);
      }
    });
  }*/
  scoresGet(force) {
    if (!force) {
      var localHs = this.scoresGetLocal();
      if (localHs && localHs.valid) {
        if (!this.drawed) {
          this.actions.scoresReceived(localHs.data);
        }
        return;
      }
    }

    var loadCl = 'hs-load',
      connectionErrCl = 'get-connection-error';

    $.ajax({
      url: this.urlGet('/scores'),
      cache: false,
      beforeSend: () => {
        this.el.addClass(loadCl);
      },
      success: data => {
        this.el.removeClass(connectionErrCl);
        if (data.error) {
          console.log(data.error);
        } else {
          this.scoresSaveLocal({
            data: data.result,
            time: Date.now()
          });
          this.actions.scoresReceived(data.result);
        }
      },
      error: err => {
        if (localHs && localHs.time !== 0) {
          this.actions.scoresReceived(localHs.data);
        } else {
          this.scoresSaveLocal({
            data: {},
            time: 0
          });
          if (err.status === 0) {
            this.el.addClass(connectionErrCl);
          }
        }
      },
      complete: () => {
        this.el.removeClass(loadCl);
      }
    });
  }
  scoresAdd(name, score, isUpdate) {
    /*var authToken = localStorage.getItem(hsAuthToken);
    if (!authToken) {
      return this.authTokenGet();
    }*/
    if (!name) {
      return this.nameGet();
    }
    var prevScore = localStorage.getItem(prevScoreToken),
      uploadCl = 'hs-upload';

    if (isUpdate && prevScore !== null && prevScore < score) {
      isUpdate = confirm('New scores bigger than previous. Are you sure that want to update scores?');
      if (!isUpdate) {
        return;
      }
    }
    $.ajax({
      url: this.urlGet('/scores'),
      method: 'post',
      data: {
        name: name,
        score: score,
        prevScore: prevScore
      },
      beforeSend: () => {
        this.el.addClass(uploadCl);
      },
      success: data => {
        if (data.error) {
          if (data.error === 'busy name') {
            alert('This name is busy. Please try to write other name.');
            localStorage.removeItem(nameToken);
            this.scoresAdd(null, score);
          }
        } else {
          localStorage.setItem(prevScoreToken, score);
          this.scoresSaveLocal({
            name: name,
            score: score
          }, !isUpdate, isUpdate);
          this.scoresListUpdate(name);
        }
      },
      error: err => {
        console.log(err);
      },
      complete: () => {
        this.el.removeClass(uploadCl);
      }
    });
  }
  scoresListUpdate(name) {
    this.actions.scoresReceived(this.scoresGetLocal().data);
    setTimeout(() => {
      var scoreItem = $('#hs_i_' + name);
      this.el.animate({scrollTop: scoreItem.offset().top}, '500', 'swing');
    }, 100);
  }
  scoresGetLocal() {
    var localHs = localStorage.getItem(hsToken);
    if (localHs) {
      localHs = JSON.parse(localHs);
      localHs.valid = true;
      console.log('HS cache time: ' + (Date.now() - localHs.time) / 1000 / 60 / 60);
      if ((Date.now() - localHs.time) / 1000 / 60 / 60 > scoreCache) {
        localHs.valid = false;
      }
      return localHs;
    } else {
      return null;
    }
  }
  scoresSaveLocal(data, additional, isUpdate) {
    var localHs = data;
    if (additional || isUpdate) {
      localHs = this.scoresGetLocal();
      if (additional) {
        localHs.data.push(data);
      }
      if (isUpdate) {
        let targetIndex = _.findIndex(localHs.data, {name: data.name});
        localHs.data[targetIndex] = data;
      }
      localHs.data = _.sortBy(localHs.data, item => {
        return parseInt(item.score, 10);
      });
    }
    localStorage.setItem(hsToken, JSON.stringify(localHs));
  }
  nameGet() {
    var name = localStorage.getItem(nameToken);
    if (name) {
      this.actions.nameReceived(name, true);
    } else {
      let shownCl = 'hs-add-mode';
      let errCl = 'hs-add-error';
      if (!this.form) {
        this.form = $('#hs-new-form');
        this.form.on('submit', e => {
          e.preventDefault();
          var name = cssEscape($('#hs-new-text').val().trim());
          if (name.length !== 0) {
            this.form.removeClass(shownCl + ' ' + errCl);
            localStorage.setItem(nameToken, name);
            this.actions.nameReceived(name);
          } else {
            this.form.addClass(errCl);
          }
        });
      }
      this.form.addClass(shownCl);
    }
  }
  urlGet(url) {
    return scoresHost + url + '?token=' + APIKEY;
  }
  open(world) {
    world.el.addClass('high-scores-shown');
  }
  close(world) {
    world.el.removeClass('high-scores-shown');
  }
}


function cssEscape(cl) {
  return cl.replace(cssEscapeReg, '');
}
