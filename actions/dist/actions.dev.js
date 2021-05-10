"use strict";

var pool = require('../config/db');

var addNewKnowledge = function addNewKnowledge(id, knowledge) {
  var user;
  return regeneratorRuntime.async(function addNewKnowledge$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET knowledge = knowledge || $1 WHERE user_id = $2', [[knowledge], id]));

        case 3:
          user = _context.sent;
          return _context.abrupt("return", user);

        case 7:
          _context.prev = 7;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0.message);

        case 10:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 7]]);
};

var getUserFromPhone = function getUserFromPhone(phone) {
  var number, res;
  return regeneratorRuntime.async(function getUserFromPhone$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          number = phone.replace('+1', '');
          _context2.next = 4;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users WHERE phone = $1', [number]));

        case 4:
          res = _context2.sent;
          return _context2.abrupt("return", res.rows[0]);

        case 8:
          _context2.prev = 8;
          _context2.t0 = _context2["catch"](0);
          console.log(_context2.t0.message);

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 8]]);
};

var getUserFromId = function getUserFromId(id) {
  var res;
  return regeneratorRuntime.async(function getUserFromId$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users WHERE user_id = $1', [id]));

        case 3:
          res = _context3.sent;
          return _context3.abrupt("return", res);

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

var setUserToCurrentExpert = function setUserToCurrentExpert(asker, expert) {
  var currentExpert;
  return regeneratorRuntime.async(function setUserToCurrentExpert$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET current = TRUE, answering = $1 WHERE user_id = $2 RETURNING *', [asker, expert]));

        case 2:
          currentExpert = _context4.sent;
          return _context4.abrupt("return", currentExpert);

        case 4:
        case "end":
          return _context4.stop();
      }
    }
  });
};

var removeFromCurrent = function removeFromCurrent(user) {
  return regeneratorRuntime.async(function removeFromCurrent$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET current = FALSE, answering = NULL WHERE user_id = $1 RETURNING *', [user]));

        case 2:
        case "end":
          return _context5.stop();
      }
    }
  });
};

var getAllUsers = function getAllUsers() {
  var allUsers;
  return regeneratorRuntime.async(function getAllUsers$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT * FROM users'));

        case 3:
          allUsers = _context6.sent;
          return _context6.abrupt("return", allUsers);

        case 7:
          _context6.prev = 7;
          _context6.t0 = _context6["catch"](0);
          console.error(_context6.t0.message);

        case 10:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 7]]);
}; // Search Experts that have knowledge in specified topic


var searchExperts = function searchExperts(topic) {
  var users;
  return regeneratorRuntime.async(function searchExperts$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return regeneratorRuntime.awrap(getAllUsers());

        case 2:
          users = _context7.sent;
          users.rows.forEach(function (user) {
            if (user.knowledge.find(function (k) {
              return k.includes(topic);
            })) {
              return user;
            }
          });
          return _context7.abrupt("return", null);

        case 5:
        case "end":
          return _context7.stop();
      }
    }
  });
};

var setAskerTopic = function setAskerTopic(id, topic) {
  var asker;
  return regeneratorRuntime.async(function setAskerTopic$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return regeneratorRuntime.awrap(pool.query('UPDATE users SET askerTopic = $1 WHERE user_id = $2 ', [topic, id]));

        case 2:
          asker = _context8.sent;
          return _context8.abrupt("return", asker);

        case 4:
        case "end":
          return _context8.stop();
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
  setAskerTopic: setAskerTopic
};