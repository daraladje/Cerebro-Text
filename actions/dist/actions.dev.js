"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var pool = require('../config/db');

var OpenAI = require('openai-api');

var dotenv = require('dotenv');

dotenv.config();
var GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

var _require = require('googleapis'),
    google = _require.google;

var cal = google.calendar({
  version: 'v3',
  auth: GOOGLE_API_KEY
}); // Load your key from an environment variable or secret management service
// (do not include your key directly in your code)

var OPENAI_API_KEY = process.env.OPENAI_SECRET_KEY;
var openai = new OpenAI(OPENAI_API_KEY); // Search Experts that have knowledge in specified topic

var searchExperts = function searchExperts(topic, userId) {
  var ignoreWords, relevantTopic, users, availableSkills, gptResponse, potentialMatch, usersWithSkill, topSkill, start, end, matchIds;
  return regeneratorRuntime.async(function searchExperts$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          // Words to ignore in query
          ignoreWords = ['the', 'it', 'is', 'i', 'want', 'would', 'like', 'a', 'an', 'by', 'to', 'you', 'me', 'he', 'she', 'how', 'are', 'for', 'of', 'know', 'about', 'and', 'tell', 'can', 'do'];
          relevantTopic = ignoreWords.reduce(function (result, word) {
            return result.replace(' ' + word + ' ', ' ');
          }, topic); // Topic with relevant words

          relevantTopic = ignoreWords.includes(relevantTopic.split(' ')[0]) ? relevantTopic.substring(relevantTopic.indexOf(' ') + 1) : relevantTopic;
          _context.next = 6;
          return regeneratorRuntime.awrap(getAllUsers());

        case 6:
          users = _context.sent;
          users = users.rows.filter(function (x) {
            return x.user_id != userId;
          }); // && x.activated == true);

          availableSkills = []; // Get list of all available skills

          users.forEach(function (user) {
            availableSkills = availableSkills.concat(user.knowledge.map(function (x) {
              return x.toLowerCase();
            }));
          });
          availableSkills = _toConsumableArray(new Set(availableSkills)); // Compare topic against available skills

          _context.next = 13;
          return regeneratorRuntime.awrap(openai.search({
            engine: 'davinci',
            documents: availableSkills,
            query: relevantTopic
          }));

        case 13:
          gptResponse = _context.sent;
          // Grab top-scoring skill
          potentialMatch = gptResponse.data.data.sort(function (a, b) {
            return b.score - a.score;
          }).filter(function (x) {
            return x.score > 200;
          })[0];
          console.log(gptResponse.data.data);
          usersWithSkill = [];

          if (potentialMatch) {
            topSkill = availableSkills[potentialMatch.document];
            users.forEach(function (user) {
              if (user.knowledge.map(function (x) {
                return x.toLowerCase();
              }).includes(topSkill)) {
                usersWithSkill.push(user);
              }
            });
          } // Check availability of each user


          start = new Date();
          end = new Date().setTime(start.getTime() + 30 * 60 * 1000);
          matchIds = [];
          usersWithSkill.forEach(function (u, index) {
            var calendar = u.email;
            cal.freebusy.query({
              resource: {
                // Set times to ISO strings as such
                timeMin: new Date(start).toISOString(),
                timeMax: new Date(end).toISOString(),
                timeZone: 'PT',
                //Default timezone for now
                items: [{
                  id: calendar
                }]
              }
            }).then(function (result) {
              var busy = result.data.calendars[calendar].busy;
              var errors = result.data.calendars[calendar].errors;

              if (busy.length !== 0) {
                usersWithSkill = usersWithSkill.slice(index + 1);
              } else if (errors != undefined) {
                console.log("Calendar of ".concat(u.name, " is private"));
              }
            });
            matchIds.push(u.user_id);
          });
          _context.next = 24;
          return regeneratorRuntime.awrap(addMatches(userId, matchIds));

        case 24:
          return _context.abrupt("return", []);

        case 27:
          _context.prev = 27;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0.message);

        case 30:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 27]]);
};

var addMatches = function addMatches(id, matches) {
  var user;
  return regeneratorRuntime.async(function addMatches$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET matches = $1 WHERE user_id = $2', [matches, id]));

        case 3:
          user = _context2.sent;
          return _context2.abrupt("return", user);

        case 7:
          _context2.prev = 7;
          _context2.t0 = _context2["catch"](0);
          console.log(_context2.t0.message);

        case 10:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 7]]);
};

var addNewKnowledge = function addNewKnowledge(id, knowledge) {
  var user;
  return regeneratorRuntime.async(function addNewKnowledge$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET knowledge = knowledge || $1 WHERE user_id = $2', [[knowledge], id]));

        case 3:
          user = _context3.sent;
          return _context3.abrupt("return", user);

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          console.log(_context3.t0.message);

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
};

var getUserFromPhone = function getUserFromPhone(phone) {
  var res;
  return regeneratorRuntime.async(function getUserFromPhone$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users WHERE phone = $1', [phone]));

        case 3:
          res = _context4.sent;
          return _context4.abrupt("return", res.rows[0]);

        case 7:
          _context4.prev = 7;
          _context4.t0 = _context4["catch"](0);
          console.log(_context4.t0.message);

        case 10:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 7]]);
};

var getUserFromId = function getUserFromId(id) {
  var res;
  return regeneratorRuntime.async(function getUserFromId$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users WHERE user_id = $1', [id]));

        case 3:
          res = _context5.sent;
          return _context5.abrupt("return", res);

        case 7:
          _context5.prev = 7;
          _context5.t0 = _context5["catch"](0);
          console.log(_context5.t0.message);

        case 10:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 7]]);
};

var setUserToCurrentExpert = function setUserToCurrentExpert(asker, expert) {
  var currentExpert;
  return regeneratorRuntime.async(function setUserToCurrentExpert$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET current = TRUE, answering = $1 WHERE user_id = $2 RETURNING *', [asker, expert]));

        case 2:
          currentExpert = _context6.sent;
          return _context6.abrupt("return", currentExpert);

        case 4:
        case "end":
          return _context6.stop();
      }
    }
  });
};

var removeFromCurrent = function removeFromCurrent(user) {
  var finished;
  return regeneratorRuntime.async(function removeFromCurrent$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET current = FALSE, answering = NULL WHERE user_id = $1 RETURNING *', [user]));

        case 2:
          finished = _context7.sent;
          return _context7.abrupt("return", finished);

        case 4:
        case "end":
          return _context7.stop();
      }
    }
  });
};

var getAllUsers = function getAllUsers() {
  var allUsers;
  return regeneratorRuntime.async(function getAllUsers$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users'));

        case 3:
          allUsers = _context8.sent;
          return _context8.abrupt("return", allUsers);

        case 7:
          _context8.prev = 7;
          _context8.t0 = _context8["catch"](0);
          console.error(_context8.t0.message);

        case 10:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 7]]);
};

var setAskerTopic = function setAskerTopic(id, topic) {
  var asker;
  return regeneratorRuntime.async(function setAskerTopic$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET askerTopic = $1 WHERE user_id = $2 ', [topic, id]));

        case 2:
          asker = _context9.sent;
          return _context9.abrupt("return", asker);

        case 4:
        case "end":
          return _context9.stop();
      }
    }
  });
};

var setUserToActivated = function setUserToActivated(id) {
  var user;
  return regeneratorRuntime.async(function setUserToActivated$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.next = 2;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET activated = TRUE WHERE user_id = $1 RETURNING *', [id]));

        case 2:
          user = _context10.sent;
          return _context10.abrupt("return", user);

        case 4:
        case "end":
          return _context10.stop();
      }
    }
  });
};

module.exports = {
  addNewKnowledge: addNewKnowledge,
  getUserFromPhone: getUserFromPhone,
  getAllUsers: getAllUsers,
  getUserFromId: getUserFromId,
  searchExperts: searchExperts,
  setUserToCurrentExpert: setUserToCurrentExpert,
  removeFromCurrent: removeFromCurrent,
  setAskerTopic: setAskerTopic,
  addMatches: addMatches,
  setUserToActivated: setUserToActivated
};