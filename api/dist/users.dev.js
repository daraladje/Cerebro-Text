"use strict";

var _require = require('../actions/actions'),
    addNewKnowledge = _require.addNewKnowledge,
    getAllUsers = _require.getAllUsers,
    getUserFromId = _require.getUserFromId;

var express = require('express');

var router = express.Router();

var pool = require('../config/db'); // Create User on Form Submit


router.post('/form_submit', function _callee(req, res) {
  var answers, name, email, phone, knowledge, looking_for, newUser;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          answers = req.body.form_response.answers;
          name = answers[0].text;
          email = answers[1].text;
          phone = answers[2].text;
          knowledge = answers[3].text.split(',').map(function (x) {
            return x.trim();
          });
          looking_for = answers[4].text.split(',').map(function (x) {
            return x.trim();
          });
          _context.next = 9;
          return regeneratorRuntime.awrap(pool.query('INSERT INTO users (name, email, phone, knowledge, looking_for) VALUES($1, $2, $3, $4, $5) RETURNING *', [name, email, phone, knowledge, looking_for]));

        case 9:
          newUser = _context.sent;
          res.json(newUser);
          _context.next = 16;
          break;

        case 13:
          _context.prev = 13;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0.message);

        case 16:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 13]]);
}); // Get users

router.get('/', function _callee2(req, res) {
  var allUsers;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(getAllUsers());

        case 3:
          allUsers = _context2.sent;
          res.json(allUsers);
          _context2.next = 10;
          break;

        case 7:
          _context2.prev = 7;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0.message);

        case 10:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // Get user

router.get('/:id', function _callee3(req, res) {
  var id, user;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          id = req.params.id;
          _context3.next = 4;
          return regeneratorRuntime.awrap(getUserFromId(id));

        case 4:
          user = _context3.sent;
          res.json(user);
          _context3.next = 11;
          break;

        case 8:
          _context3.prev = 8;
          _context3.t0 = _context3["catch"](0);
          console.error(_context3.t0.message);

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 8]]);
}); // Add Knowledge

router.put('/:id', function _callee4(req, res) {
  var id, newKnowledge, updateUser;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          try {
            id = req.params.id;
            newKnowledge = req.body.newKnowledge;
            updateUser = addNewKnowledge(id, newKnowledge);
            res.json(updateUser);
          } catch (error) {
            console.error(error.message);
          }

        case 1:
        case "end":
          return _context4.stop();
      }
    }
  });
}); // Delete User

router["delete"]('/:id', function _callee5(req, res) {
  var id, deleteUser;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          id = req.params.id;
          _context5.next = 4;
          return regeneratorRuntime.awrap(pool.query('DELETE FROM users WHERE user_id = $1', [id]));

        case 4:
          deleteUser = _context5.sent;
          res.json(deleteUser);
          _context5.next = 11;
          break;

        case 8:
          _context5.prev = 8;
          _context5.t0 = _context5["catch"](0);
          console.error(_context5.t0.message);

        case 11:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 8]]);
});
module.exports = router;