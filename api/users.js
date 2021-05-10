const {
  addNewKnowledge,
  getAllUsers,
  getUserFromId,
} = require('../actions/actions');
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Create User on Form Submit
router.post('/form_submit', async (req, res) => {
  try {
    const answers = req.body.form_response.answers;
    const name = answers[0].text;
    const email = answers[1].text;
    const phone = answers[2].text;
    const knowledge = answers[3].text.split(',').map((x) => x.trim());
    const looking_for = answers[4].text.split(',').map((x) => x.trim());
    const newUser = await pool.query(
      'INSERT INTO users (name, email, phone, knowledge, looking_for) VALUES($1, $2, $3, $4, $5) RETURNING *',
      [name, email, phone, knowledge, looking_for]
    );
    res.json(newUser);
  } catch (error) {
    console.error(error.message);
  }
});

// Get users
router.get('/', async (req, res) => {
  try {
    const allUsers = await getAllUsers();
    res.json(allUsers);
  } catch (error) {
    console.error(error.message);
  }
});

// Get user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserFromId(id);
    res.json(user);
  } catch (error) {
    console.error(error.message);
  }
});

// Add Knowledge
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newKnowledge } = req.body;
    const updateUser = addNewKnowledge(id, newKnowledge);
    res.json(updateUser);
  } catch (error) {
    console.error(error.message);
  }
});

// Delete User
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteUser = await pool.query(
      'DELETE FROM users WHERE user_id = $1',
      [id]
    );
    res.json(deleteUser);
  } catch (error) {
    console.error(error.message);
  }
});
module.exports = router;
