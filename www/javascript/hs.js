'use strict';

import * as $ from 'jquery';
import * as $mobile from 'jquerymobile';
import * as _ from 'underscore';
import * as Reflux from 'reflux';

const scoresHost = 'http://192.168.174.130';
const APIKEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9';
const scoreCache = 1; // one hour
const prevScoreToken = 'hs:prev';
const nameToken = 'hs:name';
const listIdPrefix = 'hs_i_';
const cssEscapeReg = new RegExp('(!|"|#|\\$|%|&|\'|\\(|\\)|\\*|\\+|,|-|\\.|/|:|;|<|=|>|\\?|@|\\[|\\]|\\^|`|\\{|\\|\\}|\\s)', 'g');

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

export class HS {
  constructor(world, menu) {
    this.actions = Reflux.createActions([
      'scoresReceived',
      'nameReceived'
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
    //this.draw(world); // TODO: should to be deleted
    //this.scoresAdd(null, world.score); // TODO: should to be deleted
  }
  draw(world) {
    $('#back_scores').on('tap', () => {
      this.close(world);
    });
    this.el = $('#high_scores');
    this.listEl = $('#hs-list');
    //setTimeout(() => {
      this.scoresGet();
    //}, 1000);

    this.actions.scoresReceived.listen(scores => {
      var listCont = '',
        curName = localStorage.getItem(nameToken);

      _.each(scores, item => {
        listCont += this.listItemGet(item.name, item.score, item.name === curName);
      });
      this.listEl.html(listCont);
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
  scoresGet() {
    var localHs = this.scoresGetLocal();
    if (localHs && localHs.valid) {
      return this.actions.scoresReceived(localHs.data);
    }

    localHs = $.get(this.urlGet('/scores'));
    localHs.then(data => {
      if (data.error) {
        console.log(data.error);
      } else {
        this.scoresSaveLocal({
          data: data.result,
          time: Date.now()
        });
        this.actions.scoresReceived(data.result);
      }
    }, err => {
      if (localHs) {
        this.actions.scoresReceived(localHs.data);
      } else {
        this.actions.scoresGetError();
      }
      console.log(err);
    });
  }
  scoresAdd(name, score, isUpdate) {
    if (!name) {
      return this.nameGet();
    }
    var prevScore = localStorage.getItem(prevScoreToken);
    //score = 10; // TODO: should to be deleted
    $.post(this.urlGet('/scores'), {
      name: name,
      score: score,
      prevScore: prevScore
    }).then(data => {
      if (data.error) {
        console.log(data.error);
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
        this.scoresListUpdate(name, score, isUpdate);
      }
    }, err => {
      console.log(err);
    });
  }
  scoresListUpdate(name, score, isUpdate) {
    if (!isUpdate) {
      this.actions.scoresReceived(this.scoresGetLocal().data);
    }
    setTimeout(() => {
      var scoreItem = $('#hs_i_' + name);
      if (isUpdate) {
        $('.hs-score', scoreItem).text(score);
      }
      this.el.animate({scrollTop: scoreItem.offset().top}, '500', 'swing');
    }, 100);
  }
  scoresGetLocal() {
    var localHs = localStorage.getItem('hs');
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
    localStorage.setItem('hs', JSON.stringify(localHs));
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
