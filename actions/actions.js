const pool = require('../config/db');
const OpenAI = require('openai-api');
const dotenv = require('dotenv');
dotenv.config();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const { google } = require('googleapis');
const cal = google.calendar({
  version: 'v3',
  auth: GOOGLE_API_KEY,
});
// Load your key from an environment variable or secret management service
// (do not include your key directly in your code)
const OPENAI_API_KEY = process.env.OPENAI_SECRET_KEY;

const openai = new OpenAI(OPENAI_API_KEY);

// Search Experts that have knowledge in specified topic
const searchExperts = async (topic, userId) => {
  try {
    // Words to ignore in query
    var ignoreWords = [
      'the',
      'it',
      'is',
      'i',
      'want',
      'would',
      'like',
      'a',
      'an',
      'by',
      'to',
      'you',
      'me',
      'he',
      'she',
      'how',
      'are',
      'for',
      'of',
      'know',
      'about',
      'and',
      'tell',
      'can',
      'do',
    ];
    var relevantTopic = ignoreWords.reduce(
      (result, word) => result.replace(' ' + word + ' ', ' '),
      topic
    );

    // Topic with relevant words
    relevantTopic = ignoreWords.includes(relevantTopic.split(' ')[0])
      ? relevantTopic.substring(relevantTopic.indexOf(' ') + 1)
      : relevantTopic;

    var users = await getAllUsers();
    users = users.rows.filter((x) => x.user_id != userId); // && x.activated == true);
    var availableSkills = [];

    // Get list of all available skills
    users.forEach((user) => {
      availableSkills = availableSkills.concat(user.knowledge.map((x) => x.toLowerCase()));
    });
    availableSkills = [...new Set(availableSkills)];

    // Compare topic against available skills
    const gptResponse = await openai.search({
      engine: 'davinci',
      documents: availableSkills,
      query: relevantTopic,
    });

    // Grab top-scoring skill
    var potentialMatch = gptResponse.data.data
      .sort((a, b) => {
        return b.score - a.score;
      })
      .filter((x) => x.score > 200)[0];
    console.log(
      gptResponse.data.data
        .sort((a, b) => {
          return b.score - a.score;
        })
        .filter((x) => x.score > 200)
    );
    console.log(availableSkills[potentialMatch.document]);
    var usersWithSkill = [];
    if (potentialMatch) {
      var topSkill = availableSkills[potentialMatch.document];
      users.forEach((user) => {
        if (user.knowledge.map((x) => x.toLowerCase()).includes(topSkill)) {
          usersWithSkill.push(user);
        }
      });
    }

    // Check availability of each user
    const start = new Date();
    const end = new Date().setTime(start.getTime() + 30 * 60 * 1000);
    var matchIds = [];
    usersWithSkill.forEach((u, index) => {
      var calendar = u.email;
      cal.freebusy
        .query({
          resource: {
            // Set times to ISO strings as such
            timeMin: new Date(start).toISOString(),
            timeMax: new Date(end).toISOString(),
            timeZone: 'PT', //Default timezone for now
            items: [{ id: calendar }],
          },
        })
        .then((result) => {
          const busy = result.data.calendars[calendar].busy;
          const errors = result.data.calendars[calendar].errors;
          if (busy.length !== 0) {
            usersWithSkill = usersWithSkill.slice(index + 1);
          } else if (errors != undefined) {
            console.log(`Calendar of ${u.name} is private`);
          }
        });
      matchIds.push(u.user_id);
    });
    await addMatches(userId, matchIds);
    return [];
  } catch (error) {
    console.log(error.message);
  }
};

const addMatches = async (id, matches) => {
  try {
    const user = await pool.query('UPDATE users SET matches = $1 WHERE user_id = $2', [
      matches,
      id,
    ]);
    return user;
  } catch (err) {
    console.log(err.message);
  }
};

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
    const res = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return res.rows[0];
  } catch (err) {
    console.log(err.message);
  }
};

const getUserFromId = async (id) => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
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
  const finished = await pool.query(
    'UPDATE users SET current = FALSE, answering = NULL WHERE user_id = $1 RETURNING *',
    [user]
  );
  return finished;
};

const getAllUsers = async () => {
  try {
    const allUsers = await pool.query('SELECT * FROM users');
    return allUsers;
  } catch (error) {
    console.error(error.message);
  }
};

const setAskerTopic = async (id, topic) => {
  const asker = await pool.query('UPDATE users SET askerTopic = $1 WHERE user_id = $2 ', [
    topic,
    id,
  ]);
  return asker;
};

const setUserToActivated = async (id) => {
  const user = await pool.query(
    'UPDATE users SET activated = TRUE WHERE user_id = $1 RETURNING *',
    [id]
  );
  return user;
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
  addMatches,
  setUserToActivated,
};
