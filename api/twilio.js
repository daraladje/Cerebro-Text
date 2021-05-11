const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const {
  addNewKnowledge,
  getUserFromPhone,
  searchExperts,
  setUserToCurrentExpert,
  removeFromCurrent,
  getUserFromId,
  setAskerTopic,
} = require('../actions/actions');
const dotenv = require('dotenv');
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const flowId = process.env.TWILIO_TRIGGER_FLOW;
const twilioPhone = process.env.TWILIO_PHONE;
const adminNumber = process.env.ADMIN_NUMBER;
const twilio = require('twilio');

const client = twilio(accountSid, authToken);
const MessagingResponse = twilio.twiml.MessagingResponse;
const VoiceResponse = twilio.twiml.VoiceResponse;

// Trigger Textbot Intro Message
router.post('/trigger/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [
      id,
    ]);
    const name = user.rows[0].name.split(' ')[0];
    const phone = '+1' + user.rows[0].phone;
    client.studio
      .flows(flowId)
      .executions.create({
        to: phone,
        from: twilioPhone,
        parameters: {
          name: name,
        },
      })
      .then((execution) => {});

    res.json(user);
  } catch (error) {
    console.log(error.message);
  }
});

router.post('/voice/:id', async (req, res) => {
  const { id } = req.params;
  // Use the Twilio Node.js SDK to build an XML response
  const response = new VoiceResponse();
  const dial = response.dial();
  dial.conference(id, {
    startConferenceOnEnter: true,
    endConferenceOnExit: true,
  });

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(response.toString());
});

router.post('/voice/end/:id', async (req, res) => {
  try {
    await removeFromCurrent(req.params.id);
    res.status(200);
  } catch (error) {}
});

// Interpret Message from User
router.post('/query', async (req, res) => {
  const twiml = new MessagingResponse();
  // Message Body
  const message = req.body.Body.toLowerCase();

  // Phone Number of Sender
  const from = req.body.From;

  // Get User Info of Sender
  const user = await getUserFromPhone(from);

  // If sender is currently an "expert" (in the queue to answer y or n)
  const isCurrent = user.current;
  if (isCurrent) {
    var answeringFor = await getUserFromId(user.answering);
    answeringFor = answeringFor.rows[0];
    if (message == 'y' || message == 'yes') {
      //Does not connect phone calls for some reason
      //Change waiting music
      console.log('TEST ID: ' + u.answering || u.user_id);
      [(user, answeringFor)].forEach(function (u) {
        client.calls
          .create({
            method: 'POST',
            url:
              'https://cerebro-qa.herokuapp.com/api/twilio/voice/' +
                u.answering || u.user_id,
            to: u.phone,
            from: twilioPhone,
            statusCallbackEvent: ['completed'],
            statusCallbackMethod: 'POST',
            statusCallback:
              'https://cerebro-qa.herokuapp.com/api/twilio/voice/end/' +
              u.user_id,
          })
          .then((call) => process.stdout.write(`Called ${u.phone}`));
      });
      return;
    } else {
      twiml.message(
        `${answeringFor.name}: ${answeringFor.askertopic} denied by ${user.name}`,
        {
          to: adminNumber,
        }
      );
      await removeFromCurrent(user.user_id);
    }
  }
  if (message.startsWith('a: ') && from == adminNumber) {
    // Dara suggests connection: a: e <expert_id> q <asker_id>
    var expert = parseInt(message.split('e')[1].split('q')[0].trim());
    var asker = parseInt(message.split('e')[1].split('q')[1].trim());
    var askerInfo = await getUserFromId(asker);
    askerInfo = askerInfo.rows[0];
    var currentExpert = await setUserToCurrentExpert(asker, expert);
    currentExpert = currentExpert.rows[0];
    console.log(askerInfo);
    twiml.message(
      `${askerInfo.name} wants to know: ${askerInfo.askertopic}. We think you might be able to help! Are you available? Reply 'Y' for yes or 'N' for no`,
      {
        to: '+1' + currentExpert.phone,
      }
    );
  } else if (message.startsWith('as: ') && from == adminNumber) {
    // Dara sends personalized message: ADMIN SEND: p <person_id> m <message>
  } else if (message.startsWith('add')) {
    // Add knowledge to user profile
    var newKnowledge = message.split('add')[1].trim();
    var knowledgeUpdate = await addNewKnowledge(user.user_id, newKnowledge);
    twiml.message(`'${newKnowledge}' added!`);
  } else if (message.startsWith('question:')) {
    // Extract topic from question
    var topic = message.split('question:')[1].trim();
    await setAskerTopic(user.user_id, topic);
    twiml.message('Searching for available experts...');
    var match = await searchExperts(topic);

    // If no user found for specific topic
    if (!match) {
      twiml.message(`${user.name}: ${topic}`, {
        to: '+18324542040',
      });
    } else {
      const currentExpert = setUserToCurrentExpert(asker, expert);
      twiml.message(
        `${asker.name} wants to know: ${topic}. We think you might be able to help! Are you available? Reply 'Y' for yes, 'N' for no`,
        {
          to: '+1' + currentExpert.phone,
        }
      );
    }
  } else if (message != 'n' && message != 'no') {
    twiml.message(
      "Sorry! That message isn't supported yet. You can either: \n \n Ask a question by sending 'QUESTION: ' following by your statement or topic of interest \n \n Add new knowledge to your profile with 'ADD'"
    );
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

module.exports = router;
