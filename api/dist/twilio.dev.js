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
          console.log('ENDED CALL');
          _context3.next = 3;
          return regeneratorRuntime.awrap(removeFromCurrent(req.params.id));

        case 3:
        case "end":
          return _context3.stop();
      }
    }
  });
}); // Interpret Message from User

router.post('/query', function _callee4(req, res) {
  var twiml, message, from, user, isCurrent, answeringFor, expert, asker, askerInfo, currentExpert, newKnowledge, knowledgeUpdate, topic, match, _currentExpert;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          twiml = new MessagingResponse(); // Message Body

          message = req.body.Body.toLowerCase(); // Phone Number of Sender

          from = req.body.From; // Get User Info of Sender

          _context4.next = 5;
          return regeneratorRuntime.awrap(getUserFromPhone(from));

        case 5:
          user = _context4.sent;
          // If sender is currently an "expert" (in the queue to answer y or n)
          isCurrent = user.current;

          if (!isCurrent) {
            _context4.next = 20;
            break;
          }

          _context4.next = 10;
          return regeneratorRuntime.awrap(getUserFromId(user.answering));

        case 10:
          answeringFor = _context4.sent;
          answeringFor = answeringFor.rows[0];

          if (!(message == 'y' || message == 'yes')) {
            _context4.next = 17;
            break;
          }

          [user, answeringFor].forEach(function (u) {
            client.calls.create({
              method: 'POST',
              url: 'https://cerebro-qa.herokuapp.com/api/twilio/voice/' + u.answering || u.user_id,
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

        case 17:
          twiml.message("".concat(answeringFor.name, ": ").concat(answeringFor.askertopic, " denied by ").concat(user.name), {
            to: adminNumber
          });
          _context4.next = 20;
          return regeneratorRuntime.awrap(removeFromCurrent(user.user_id));

        case 20:
          if (!(message.startsWith('a: ') && from == adminNumber)) {
            _context4.next = 35;
            break;
          }

          // Dara suggests connection: a: e <expert_id> q <asker_id>
          expert = parseInt(message.split('e')[1].split('q')[0].trim());
          asker = parseInt(message.split('e')[1].split('q')[1].trim());
          _context4.next = 25;
          return regeneratorRuntime.awrap(getUserFromId(asker));

        case 25:
          askerInfo = _context4.sent;
          askerInfo = askerInfo.rows[0];
          _context4.next = 29;
          return regeneratorRuntime.awrap(setUserToCurrentExpert(asker, expert));

        case 29:
          currentExpert = _context4.sent;
          currentExpert = currentExpert.rows[0];
          console.log(askerInfo);
          twiml.message("".concat(askerInfo.name, " wants to know: ").concat(askerInfo.askertopic, ". We think you might be able to help! Are you available? Reply 'Y' for yes or 'N' for no"), {
            to: '+1' + currentExpert.phone
          });
          _context4.next = 58;
          break;

        case 35:
          if (!(message.startsWith('as: ') && from == adminNumber)) {
            _context4.next = 38;
            break;
          }

          _context4.next = 58;
          break;

        case 38:
          if (!message.startsWith('add')) {
            _context4.next = 46;
            break;
          }

          // Add knowledge to user profile
          newKnowledge = message.split('add')[1].trim();
          _context4.next = 42;
          return regeneratorRuntime.awrap(addNewKnowledge(user.user_id, newKnowledge));

        case 42:
          knowledgeUpdate = _context4.sent;
          twiml.message("'".concat(newKnowledge, "' added!"));
          _context4.next = 58;
          break;

        case 46:
          if (!message.startsWith('question:')) {
            _context4.next = 57;
            break;
          }

          // Extract topic from question
          topic = message.split('question:')[1].trim();
          _context4.next = 50;
          return regeneratorRuntime.awrap(setAskerTopic(user.user_id, topic));

        case 50:
          twiml.message('Searching for available experts...');
          _context4.next = 53;
          return regeneratorRuntime.awrap(searchExperts(topic));

        case 53:
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

          _context4.next = 58;
          break;

        case 57:
          if (message != 'n' && message != 'no') {
            twiml.message("Sorry! That message isn't supported yet. You can either: \n \n Ask a question by sending 'QUESTION: ' following by your statement or topic of interest \n \n Add new knowledge to your profile with 'ADD'");
          }

        case 58:
          res.writeHead(200, {
            'Content-Type': 'text/xml'
          });
          res.end(twiml.toString());

        case 60:
        case "end":
          return _context4.stop();
      }
    }
  });
});
module.exports = router;