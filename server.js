const express = require('express');
const cors = require('cors');
const { urlencoded } = require('body-parser');
const app = express();

//middleware
app.use(express.json());
app.use(cors());
app.use(urlencoded({ extended: false }));

// Define Routes
app.use('/api/twilio', require('./api/twilio'));
app.use('/api/users', require('./api/users'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
