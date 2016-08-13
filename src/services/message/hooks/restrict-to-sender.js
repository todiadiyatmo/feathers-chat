'use strict';

// src/services/message/hooks/restrict-to-sender.js
//
// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/hooks/readme.html

const defaults = {};
const errors = require('feathers-errors');

module.exports = function(options) {
  options = Object.assign({}, defaults, options);

  return function(hook) {
    hook.restrictToSender = true;

    const messageService = hook.app.service('message')

    return messageService.get(hook.id, hook.params).then(message => {

      if(message.sentBy._id !== hook.params.user._id ) {
        throw new errors.NotAuthenticated('Access not allowed');
      }

    })

    return hook;

  };
};
