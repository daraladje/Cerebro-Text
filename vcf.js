var vCardsJS = require('vcards-js');

//create a new vCard
var vCard = vCardsJS();

//set properties
vCard.firstName = 'Cerebro';
vCard.photo.embedFromFile('./contact_card.jpeg');
vCard.logo.embedFromFile('./contact_card.jpeg');
vCard.workPhone = '14695356147';
vCard.url = 'https://daratest.carrd.co/';

//save to file
vCard.saveToFile('./cerebro.vcf');
