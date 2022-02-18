//SK36ca4909f2633e8202c5d1c6872f93a6
//7UZPRGCrodpIexl83AMkD9oFxSuFFsXS
// const accountSid = 'AC3872903fafd9a981840235e924bc36f2'; //AC3872903fafd9a981840235e924bc36f2
// const authToken = '[Redacted]'; 991541a8dcbbe6dacab3c675d18d2dc0


// const accountSid = 'SK36ca4909f2633e8202c5d1c6872f93a6';
const accountSid = 'AC3872903fafd9a981840235e924bc36f2';
const authToken = '7f4fb1b3965d771660c803a8ae83a42a';

const client = require('twilio')(accountSid, authToken);



client.messages
    .create({
        body: 'hello brandon',
        messagingServiceSid: 'MGe3f2f00a70d4c251e85f487ea799fac6',
        to: '+19102362749'
    })
    .then(message => console.log(message.sid))
    .done();
