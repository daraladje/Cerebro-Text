const pool = require('../config/db');
const addNewKnowledge = async (id, knowledge) => {
  try {
    const user = await pool.query(
      'UPDATE users SET knowledge = knowledge || $1 WHERE user_id = $2',
      [[knowledge], id]
    );
    return user;
  } catch (err) {
    console.log(err.message);
  }
};

const getUserFromPhone = async (phone) => {
  try {
    var number = phone.replace('+1', '');
    const res = await pool.query('SELECT * FROM users WHERE phone = $1', [
      number,
    ]);
    return res.rows[0];
  } catch (err) {
    console.log(err.message);
  }
};

const getUserFromId = async (id) => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE user_id = $1', [
      id,
    ]);
    return res;
  } catch (err) {
    console.log(err.message);
  }
};

const setUserToCurrentExpert = async (asker, expert) => {
  const currentExpert = await pool.query(
    'UPDATE users SET current = TRUE, answering = $1 WHERE user_id = $2 RETURNING *',
    [asker, expert]
  );
  return currentExpert;
};

const removeFromCurrent = async (user) => {
  await pool.query(
    'UPDATE users SET current = FALSE, answering = NULL WHERE user_id = $1 RETURNING *',
    [user]
  );
};

const getAllUsers = async () => {
  try {
    const allUsers = await pool.query('SELECT * FROM users');
    return allUsers;
  } catch (error) {
    console.error(error.message);
  }
};

// Search Experts that have knowledge in specified topic
const searchExperts = async (topic) => {
  // Need to figure out better matching logic here...
  var users = await getAllUsers();
  users.rows.forEach((user) => {
    if (user.knowledge.find((k) => k.includes(topic))) {
      return user;
    }
  });
  return null;
};

const setAskerTopic = async (id, topic) => {
  const asker = await pool.query(
    'UPDATE users SET askerTopic = $1 WHERE user_id = $2 ',
    [topic, id]
  );
  return asker;
};

module.exports = {
  addNewKnowledge,
  getUserFromPhone,
  getAllUsers,
  getUserFromId,
  searchExperts,
  setUserToCurrentExpert,
  removeFromCurrent,
  setAskerTopic,
};
