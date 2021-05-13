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
  addMatches,
  setUserToActivated,
} = require('../actions/actions');
const dotenv = require('dotenv');
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const flowId = process.env.TWILIO_TRIGGER_FLOW;
const twilioPhone = process.env.TWILIO_PHONE;
const adminNumber = process.env.ADMIN_NUMBER;
const herokuUrl = process.env.HEROKU_URL;
const localUrl = process.env.LOCAL_URL;
const twilio = require('twilio');

const client = twilio(accountSid, authToken);
const MessagingResponse = twilio.twiml.MessagingResponse;
const VoiceResponse = twilio.twiml.VoiceResponse;

// Trigger Textbot Intro Message
router.post('/trigger/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await setUserToActivated(id);
    const name = user.rows[0].name.split(' ')[0];
    const phone = user.rows[0].phone;
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
  try {
    const { id } = req.params;
    // Use the Twilio Node.js SDK to build an XML response
    const response = new VoiceResponse();
    const dial = response.dial();
    dial.conference(id, {
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient',
    });

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(response.toString());
  } catch (error) {
    console.log(error);
  }
});

router.post('/voice/end/:id', async (req, res) => {
  try {
    // const followUp = new MessagingResponse();
    const user = await removeFromCurrent(req.params.id);

    const message =
      user.rows[0].askertopic == null
        ? 'Thank you for sharing your knowledge! We appreciate it :)'
        : 'We hope you found what you were looking for! Send another question to learn more...';
    client.messages
      .create({
        body: message,
        from: twilioPhone,
        to: user.rows[0].phone,
      })
      .then((message) => {});
    client.messages
      .create({
        body: user.rows[0].name + ' ended call.',
        from: twilioPhone,
        to: adminNumber,
      })
      .then((message) => {});
    res.json(user);
  } catch (error) {
    console.log(error.message);
  }
});

// Interpret Message from User
router.post('/query', async (req, res) => {
  try {
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
        //Change waiting music
        twiml.message(
          `${answeringFor.name}: ${answeringFor.askertopic} accepted by ${user.name}!`,
          {
            to: adminNumber,
          }
        );
        [user, answeringFor].forEach(function (u) {
          client.calls
            .create({
              method: 'POST',
              url: herokuUrl + 'api/twilio/voice/' + (u.current ? u.answering : u.user_id),
              to: u.phone,
              from: twilioPhone,
              statusCallbackEvent: ['completed'],
              statusCallbackMethod: 'POST',
              statusCallback: herokuUrl + 'api/twilio/voice/end/' + u.user_id,
            })
            .then((call) => process.stdout.write(`Called ${u.phone} | `));
        });
      } else {
        const denied = await removeFromCurrent(user.user_id);
        twiml.message(`${answeringFor.name}: '${answeringFor.askertopic}' denied by ${user.name}`, {
          to: adminNumber,
        });
        var remainingMatches = answeringFor.matches.filter((m) => m != user.user_id);
        await addMatches(answeringFor.user_id, remainingMatches);
        if (remainingMatches.length > 0) {
          var match = getRandomItem(remainingMatches);
          const currentExpert = await setUserToCurrentExpert(answeringFor.user_id, match);
          var experts = remainingMatches.join(',');
          twiml.message(
            `${answeringFor.name} wants to know: '${answeringFor.askertopic}'. We think you might be able to help! Are you available? Reply 'Y' for yes, 'N' for no`,
            {
              to: currentExpert.rows[0].phone,
            }
          );
          twiml.message(
            `${answeringFor.name}: '${answeringFor.askertopic}' - sending out request to ${currentExpert.rows[0].name}. List of potential matches: ${experts}`,
            {
              to: adminNumber,
            }
          );
        }
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
      twiml.message(
        `${askerInfo.name} wants to know: ${askerInfo.askertopic}. We think you might be able to help! Are you available? Reply 'Y' for yes or 'N' for no`,
        {
          to: currentExpert.phone,
        }
      );
    } else if (message.startsWith('as: ') && from == adminNumber) {
      // Dara sends personalized message: ADMIN SEND: <person_id> m <message>
      var person = parseInt(message.substr(3, message.indexOf(' ')).trim());
      var response = message.substr(message.indexOf(' ') + 3).trim();
      var personInfo = await getUserFromId(person);
      twiml.message(`${response}`, {
        to: personInfo.rows[0].phone,
      });
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
      var matches = await searchExperts(topic, user.user_id);
      if (!matches || matches.length == 0) {
        twiml.message(`${user.name}: ${topic}`, {
          to: adminNumber,
        });
      } else {
        // For now, will only check the top match
        // Random selection
        var match = getRandomItem(matches);
        await setUserToCurrentExpert(user.user_id, match.user_id);
        var experts = matches.map((m) => m.user_id).join(',');
        twiml.message(
          `${user.name} wants to know: ${topic}. We think you might be able to help! Are you available? Reply 'Y' for yes, 'N' for no`,
          {
            to: adminNumber, //match.phone,
          }
        );
        twiml.message(
          `${user.name}: ${topic} - sending out request to ${match.name}. List of potential matches: ${experts}`,
          {
            to: adminNumber,
          }
        );
      }
    } else if (message != 'n' && message != 'no' && message != 'y' && message != 'yes') {
      twiml.message(
        "Sorry! That message isn't supported yet. You can either: \n \n Ask a question by sending 'QUESTION: ' following by your statement or topic of interest \n \n Add new knowledge to your profile with 'ADD'"
      );
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } catch (error) {
    console.log(error);
  }
});

function getRandomItem(arr) {
  // get random index value
  const randomIndex = Math.floor(Math.random() * arr.length);

  // get random item
  const item = arr[randomIndex];

  return item;
}
module.exports = router;
