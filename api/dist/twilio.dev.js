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
    setAskerTopic = _require.setAskerTopic,
    addMatches = _require.addMatches,
    setUserToActivated = _require.setUserToActivated;

var dotenv = require('dotenv');

dotenv.config();
var accountSid = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
var flowId = process.env.TWILIO_TRIGGER_FLOW;
var twilioPhone = process.env.TWILIO_PHONE;
var adminNumber = process.env.ADMIN_NUMBER;
var herokuUrl = process.env.HEROKU_URL;
var localUrl = process.env.LOCAL_URL;

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
          return regeneratorRuntime.awrap(setUserToActivated(id));

        case 4:
          user = _context.sent;
          name = user.rows[0].name.split(' ')[0];
          phone = user.rows[0].phone;
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
          try {
            id = req.params.id; // Use the Twilio Node.js SDK to build an XML response

            response = new VoiceResponse();
            dial = response.dial();
            dial.conference(id, {
              startConferenceOnEnter: true,
              endConferenceOnExit: true,
              waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient'
            });
            res.writeHead(200, {
              'Content-Type': 'text/xml'
            });
            res.end(response.toString());
          } catch (error) {
            console.log(error);
          }

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
});
router.post('/voice/end/:id', function _callee3(req, res) {
  var user, message;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(removeFromCurrent(req.params.id));

        case 3:
          user = _context3.sent;
          message = user.rows[0].askertopic == null ? 'Thank you for sharing your knowledge! We appreciate it :)' : 'We hope you found what you were looking for! Send another question to learn more...';
          client.messages.create({
            body: message,
            from: twilioPhone,
            to: user.rows[0].phone
          }).then(function (message) {});
          client.messages.create({
            body: user.rows[0].name + ' ended call.',
            from: twilioPhone,
            to: adminNumber
          }).then(function (message) {});
          res.json(user);
          _context3.next = 13;
          break;

        case 10:
          _context3.prev = 10;
          _context3.t0 = _context3["catch"](0);
          console.log(_context3.t0.message);

        case 13:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 10]]);
}); // Interpret Message from User

router.post('/query', function _callee4(req, res) {
  var twiml, message, from, user, isCurrent, answeringFor, denied, remainingMatches, match, _currentExpert, experts, expert, asker, askerInfo, currentExpert, person, response, personInfo, newKnowledge, knowledgeUpdate, topic, matches;

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
            _context4.next = 33;
            break;
          }

          _context4.next = 11;
          return regeneratorRuntime.awrap(getUserFromId(user.answering));

        case 11:
          answeringFor = _context4.sent;
          answeringFor = answeringFor.rows[0];

          if (!(message == 'y' || message == 'yes')) {
            _context4.next = 18;
            break;
          }

          //Change waiting music
          twiml.message("".concat(answeringFor.name, ": ").concat(answeringFor.askertopic, " accepted by ").concat(user.name, "!"), {
            to: adminNumber
          });
          [user, answeringFor].forEach(function (u) {
            client.calls.create({
              method: 'POST',
              url: herokuUrl + 'api/twilio/voice/' + (u.current ? u.answering : u.user_id),
              to: u.phone,
              from: twilioPhone,
              statusCallbackEvent: ['completed'],
              statusCallbackMethod: 'POST',
              statusCallback: herokuUrl + 'api/twilio/voice/end/' + u.user_id
            }).then(function (call) {
              return process.stdout.write("Called ".concat(u.phone, " | "));
            });
          });
          _context4.next = 33;
          break;

        case 18:
          _context4.next = 20;
          return regeneratorRuntime.awrap(removeFromCurrent(user.user_id));

        case 20:
          denied = _context4.sent;
          twiml.message("".concat(answeringFor.name, ": '").concat(answeringFor.askertopic, "' denied by ").concat(user.name), {
            to: adminNumber
          });
          remainingMatches = answeringFor.matches.filter(function (m) {
            return m != user.user_id;
          });
          _context4.next = 25;
          return regeneratorRuntime.awrap(addMatches(answeringFor.user_id, remainingMatches));

        case 25:
          if (!(remainingMatches.length > 0)) {
            _context4.next = 33;
            break;
          }

          match = getRandomItem(remainingMatches);
          _context4.next = 29;
          return regeneratorRuntime.awrap(setUserToCurrentExpert(answeringFor.user_id, match));

        case 29:
          _currentExpert = _context4.sent;
          experts = remainingMatches.join(',');
          twiml.message("".concat(answeringFor.name, " wants to know: '").concat(answeringFor.askertopic, "'. We think you might be able to help! Are you available? Reply 'Y' for yes, 'N' for no"), {
            to: _currentExpert.rows[0].phone
          });
          twiml.message("".concat(answeringFor.name, ": '").concat(answeringFor.askertopic, "' - sending out request to ").concat(_currentExpert.rows[0].name, ". List of potential matches: ").concat(experts), {
            to: adminNumber
          });

        case 33:
          if (!(message.startsWith('a: ') && from == adminNumber)) {
            _context4.next = 47;
            break;
          }

          // Dara suggests connection: a: e <expert_id> q <asker_id>
          expert = parseInt(message.split('e')[1].split('q')[0].trim());
          asker = parseInt(message.split('e')[1].split('q')[1].trim());
          _context4.next = 38;
          return regeneratorRuntime.awrap(getUserFromId(asker));

        case 38:
          askerInfo = _context4.sent;
          askerInfo = askerInfo.rows[0];
          _context4.next = 42;
          return regeneratorRuntime.awrap(setUserToCurrentExpert(asker, expert));

        case 42:
          currentExpert = _context4.sent;
          currentExpert = currentExpert.rows[0];
          twiml.message("".concat(askerInfo.name, " wants to know: ").concat(askerInfo.askertopic, ". We think you might be able to help! Are you available? Reply 'Y' for yes or 'N' for no"), {
            to: currentExpert.phone
          });
          _context4.next = 87;
          break;

        case 47:
          if (!(message.startsWith('as: ') && from == adminNumber)) {
            _context4.next = 56;
            break;
          }

          // Dara sends personalized message: ADMIN SEND: <person_id> m <message>
          person = parseInt(message.substr(3, message.indexOf(' ')).trim());
          response = message.substr(message.indexOf(' ') + 3).trim();
          _context4.next = 52;
          return regeneratorRuntime.awrap(getUserFromId(person));

        case 52:
          personInfo = _context4.sent;
          twiml.message("".concat(response), {
            to: personInfo.rows[0].phone
          });
          _context4.next = 87;
          break;

        case 56:
          if (!message.startsWith('add')) {
            _context4.next = 64;
            break;
          }

          // Add knowledge to user profile
          newKnowledge = message.split('add')[1].trim();
          _context4.next = 60;
          return regeneratorRuntime.awrap(addNewKnowledge(user.user_id, newKnowledge));

        case 60:
          knowledgeUpdate = _context4.sent;
          twiml.message("'".concat(newKnowledge, "' added!"));
          _context4.next = 87;
          break;

        case 64:
          if (!message.startsWith('question:')) {
            _context4.next = 86;
            break;
          }

          // Extract topic from question
          topic = message.split('question:')[1].trim();
          console.log(topic);
          console.log(user);
          _context4.next = 70;
          return regeneratorRuntime.awrap(setAskerTopic(user.user_id, topic));

        case 70:
          twiml.message('Searching for available experts...');
          _context4.next = 73;
          return regeneratorRuntime.awrap(searchExperts(topic, user.user_id));

        case 73:
          matches = _context4.sent;

          if (!(matches.length == 0)) {
            _context4.next = 78;
            break;
          }

          twiml.message("".concat(user.name, ": ").concat(topic), {
            to: adminNumber
          });
          _context4.next = 84;
          break;

        case 78:
          // For now, will only check the top match
          // Random selection
          match = getRandomItem(matches);
          _context4.next = 81;
          return regeneratorRuntime.awrap(setUserToCurrentExpert(user.user_id, match.user_id));

        case 81:
          experts = matches.map(function (m) {
            return m.user_id;
          }).join(',');
          twiml.message("".concat(user.name, " wants to know: ").concat(topic, ". We think you might be able to help! Are you available? Reply 'Y' for yes, 'N' for no"), {
            to: adminNumber //match.phone,

          });
          twiml.message("".concat(user.name, ": ").concat(topic, " - sending out request to ").concat(match.name, ". List of potential matches: ").concat(experts), {
            to: adminNumber
          });

        case 84:
          _context4.next = 87;
          break;

        case 86:
          if (message != 'n' && message != 'no' && message != 'y' && message != 'yes') {
            twiml.message("Sorry! That message isn't supported yet. You can either: \n \n Ask a question by sending 'QUESTION: ' following by your statement or topic of interest \n \n Add new knowledge to your profile with 'ADD'");
          }

        case 87:
          res.writeHead(200, {
            'Content-Type': 'text/xml'
          });
          res.end(twiml.toString());
          _context4.next = 94;
          break;

        case 91:
          _context4.prev = 91;
          _context4.t0 = _context4["catch"](0);
          console.log(_context4.t0);

        case 94:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 91]]);
});

function getRandomItem(arr) {
  // get random index value
  var randomIndex = Math.floor(Math.random() * arr.length); // get random item

  var item = arr[randomIndex];
  return item;
}

module.exports = router;