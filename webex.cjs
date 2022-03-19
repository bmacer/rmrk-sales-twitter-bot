require('dotenv').config()

const axios = require('axios');

module.exports.post = async function post(message) {
    const WEBEX_API_KEY = process.env.WEBEX_API
    try {
        const data = {
            'toPersonEmail': "bmacer@cisco.com",
            'text': message
        };
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${WEBEX_API_KEY}`
            }
        };
        console.log(config)
        const res = await axios.post('https://webexapis.com/v1/messages', data, config);
    } catch (err) {
        console.error(err);
    }
}

module.exports.post_to_stickie_room = async function post_to_stickie_room(message) {
    const WEBEX_API_KEY = process.env.WEBEX_API
    try {
        const data = {
            'roomId': process.env.STICKIES_ROOM_API,
            'text': message
        };
        console.log(data);
        console.log(WEBEX_API_KEY);
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${WEBEX_API_KEY}`
            }
        };
        console.log(config)
        const res = await axios.post('https://webexapis.com/v1/messages', data, config);
    } catch (err) {
        console.error(err);
    }
}


