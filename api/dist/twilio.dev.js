"use strict";

var express = require('express');

var router = express.Router();

var pool = require('../config/db');

var _require = require('../actions/actions'),
    addNewKnowledge = _require.addNewKnowledge,
    getUserFromPhone = _require.getUserFromPhone,
    searchExperts = _require.searchExperts,
    setUserToCurrentExpert = _require.setUserToCurrentExpert,
    removeFromCurrent = _require.removeFromCurrent,
    getUserFromId = _require.getUserFromId,
    setAskerTopic = _require.setAskerTopic;

var dotenv = require('dotenv');

dotenv.config();
var accountSid = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
var flowId = process.env.TWILIO_TRIGGER_FLOW;
var twilioPhone = process.env.TWILIO_PHONE;
var adminNumber = process.env.ADMIN_NUMBER;

var twilio = require('twilio');

var client = twilio(accountSid, authToken);
var MessagingResponse = twilio.twiml.MessagingResponse;
var VoiceResponse = twilio.twiml.VoiceResponse; // Trigger Textbot Intro Message

router.post('/trigger/:id', function _callee(req, res) {
  var id, user, name, phone;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          id = req.params.id;
          _context.next = 4;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users WHERE user_id = $1', [id]));

        case 4:
          user = _context.sent;
          name = user.rows[0].name.split(' ')[0];
          phone = '+1' + user.rows[0].phone;
          client.studio.flows(flowId).executions.create({
            to: phone,
            from: twilioPhone,
            parameters: {
              name: name
            }
          }).then(function (execution) {});
          res.json(user);
          _context.next = 14;
          break;

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0.message);

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 11]]);
});
router.post('/voice/:id', function _callee2(req, res) {
  var id, response, dial;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          id = req.params.id; // Use the Twilio Node.js SDK to build an XML response

          response = new VoiceResponse();
          dial = response.dial();
          dial.conference(id, {
            startConferenceOnEnter: true,
            endConferenceOnExit: true
          });
          res.writeHead(200, {
            'Content-Type': 'text/xml'
          });
          res.end(response.toString());

        case 6:
        case "end":
          return _context2.stop();
      }
    }
  });
});
router.post('/voice/end/:id', function _callee3(req, res) {
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(removeFromCurrent(req.params.id));

        case 3:
          res.status(200);
          _context3.next = 8;
          break;

        case 6:
          _context3.prev = 6;
          _context3.t0 = _context3["catch"](0);

        case 8:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // Interpret Message from User

router.post('/query', function _callee4(req, res) {
  var twiml, message, from, user, isCurrent, answeringFor, expert, asker, askerInfo, currentExpert, newKnowledge, knowledgeUpdate, topic, match, _currentExpert;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          twiml = new MessagingResponse(); // Message Body

          message = req.body.Body.toLowerCase(); // Phone Number of Sender

          from = req.body.From; // Get User Info of Sender

          _context4.next = 6;
          return regeneratorRuntime.awrap(getUserFromPhone(from));

        case 6:
          user = _context4.sent;
          // If sender is currently an "expert" (in the queue to answer y or n)
          isCurrent = user.current;

          if (!isCurrent) {
            _context4.next = 22;
            break;
          }

          _context4.next = 11;
          return regeneratorRuntime.awrap(getUserFromId(user.answering));

        case 11:
          answeringFor = _context4.sent;
          answeringFor = answeringFor.rows[0];
          console.log(answeringFor);

          if (!(message == 'y' || message == 'yes')) {
            _context4.next = 19;
            break;
          }

          //Does not connect phone calls for some reason
          //Change waiting music
          [(user, answeringFor)].forEach(function (u) {
            console.log('TEST ID: ' + u.current ? u.answering : u.user_id);
            client.calls.create({
              method: 'POST',
              url: 'https://cerebro-qa.herokuapp.com/api/twilio/voice/' + u.current ? u.answering : u.user_id,
              to: u.phone,
              from: twilioPhone,
              statusCallbackEvent: ['completed'],
              statusCallbackMethod: 'POST',
              statusCallback: 'https://cerebro-qa.herokuapp.com/api/twilio/voice/end/' + u.user_id
            }).then(function (call) {
              return process.stdout.write("Called ".concat(u.phone));
            });
          });
          return _context4.abrupt("return");

        case 19:
          twiml.message("".concat(answeringFor.name, ": ").concat(answeringFor.askertopic, " denied by ").concat(user.name), {
            to: adminNumber
          });
          _context4.next = 22;
          return regeneratorRuntime.awrap(removeFromCurrent(user.user_id));

        case 22:
          if (!(message.startsWith('a: ') && from == adminNumber)) {
            _context4.next = 37;
            break;
          }

          // Dara suggests connection: a: e <expert_id> q <asker_id>
          expert = parseInt(message.split('e')[1].split('q')[0].trim());
          asker = parseInt(message.split('e')[1].split('q')[1].trim());
          _context4.next = 27;
          return regeneratorRuntime.awrap(getUserFromId(asker));

        case 27:
          askerInfo = _context4.sent;
          askerInfo = askerInfo.rows[0];
          _context4.next = 31;
          return regeneratorRuntime.awrap(setUserToCurrentExpert(asker, expert));

        case 31:
          currentExpert = _context4.sent;
          currentExpert = currentExpert.rows[0];
          console.log(askerInfo);
          twiml.message("".concat(askerInfo.name, " wants to know: ").concat(askerInfo.askertopic, ". We think you might be able to help! Are you available? Reply 'Y' for yes or 'N' for no"), {
            to: '+1' + currentExpert.phone
          });
          _context4.next = 60;
          break;

        case 37:
          if (!(message.startsWith('as: ') && from == adminNumber)) {
            _context4.next = 40;
            break;
          }

          _context4.next = 60;
          break;

        case 40:
          if (!message.startsWith('add')) {
            _context4.next = 48;
            break;
          }

          // Add knowledge to user profile
          newKnowledge = message.split('add')[1].trim();
          _context4.next = 44;
          return regeneratorRuntime.awrap(addNewKnowledge(user.user_id, newKnowledge));

        case 44:
          knowledgeUpdate = _context4.sent;
          twiml.message("'".concat(newKnowledge, "' added!"));
          _context4.next = 60;
          break;

        case 48:
          if (!message.startsWith('question:')) {
            _context4.next = 59;
            break;
          }

          // Extract topic from question
          topic = message.split('question:')[1].trim();
          _context4.next = 52;
          return regeneratorRuntime.awrap(setAskerTopic(user.user_id, topic));

        case 52:
          twiml.message('Searching for available experts...');
          _context4.next = 55;
          return regeneratorRuntime.awrap(searchExperts(topic));

        case 55:
          match = _context4.sent;

          // If no user found for specific topic
          if (!match) {
            twiml.message("".concat(user.name, ": ").concat(topic), {
              to: '+18324542040'
            });
          } else {
            _currentExpert = setUserToCurrentExpert(asker, expert);
            twiml.message("".concat(asker.name, " wants to know: ").concat(topic, ". We think you might be able to help! Are you available? Reply 'Y' for yes, 'N' for no"), {
              to: '+1' + _currentExpert.phone
            });
          }

          _context4.next = 60;
          break;

        case 59:
          if (message != 'n' && message != 'no') {
            twiml.message("Sorry! That message isn't supported yet. You can either: \n \n Ask a question by sending 'QUESTION: ' following by your statement or topic of interest \n \n Add new knowledge to your profile with 'ADD'");
          }

        case 60:
          res.writeHead(200, {
            'Content-Type': 'text/xml'
          });
          res.end(twiml.toString());
          _context4.next = 67;
          break;

        case 64:
          _context4.prev = 64;
          _context4.t0 = _context4["catch"](0);
          console.log(_context4.t0);

        case 67:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 64]]);
});
module.exports = router;