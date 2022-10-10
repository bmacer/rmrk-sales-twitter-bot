import dotenv from "dotenv";
// require("dotenv").config();
dotenv.config();

// const axios = require('axios');
import axios from "axios";

const WEBEX_ROOM_MY_SOULS_ACTIVITY = "Y2lzY29zcGFyazovL3VzL1JPT00vMzcxNWZjNTEtNDg5OC0xMWVkLWE0YmItNmQ2ODRiN2Q0YjYy"
const WEBEX_ROOM_EVRLOOT_SALES = "Y2lzY29zcGFyazovL3VzL1JPT00vMjlmOWE5OTAtNDg5OC0xMWVkLTg3MjctMTc3ODg4NDNhN2Nk"
const WEBEX_ROOM_EVRLOOT_LISTINGS = "Y2lzY29zcGFyazovL3VzL1JPT00vMjI4MDgzZjAtNDg5OC0xMWVkLWIyM2YtYzkzOTVjN2NiMDAw"

export const mine = async (message) => {
  const WEBEX_API_KEY = process.env.WEBEX_API;
  try {
    const data = {
      roomId: WEBEX_ROOM_MY_SOULS_ACTIVITY,
      text: message,
    };
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEBEX_API_KEY}`,
      },
    };
    console.log(config);
    const res = await axios.post(
      "https://webexapis.com/v1/messages",
      data,
      config
    );
  } catch (err) {
    console.error(err);
  }
};

export const sales = async (message) => {
  const WEBEX_API_KEY = process.env.WEBEX_API;
  try {
    const data = {
      roomId: WEBEX_ROOM_EVRLOOT_SALES,
      text: message,
    };
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEBEX_API_KEY}`,
      },
    };
    console.log(config);
    const res = await axios.post(
      "https://webexapis.com/v1/messages",
      data,
      config
    );
  } catch (err) {
    console.error(err);
  }
};

export const list = async (message) => {
  const WEBEX_API_KEY = process.env.WEBEX_API;
  try {
    const data = {
      roomId: WEBEX_ROOM_EVRLOOT_LISTINGS,
      text: message,
    };
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEBEX_API_KEY}`,
      },
    };
    console.log(config);
    const res = await axios.post(
      "https://webexapis.com/v1/messages",
      data,
      config
    );
  } catch (err) {
    console.error(err);
  }
};

const post = async (message) => {
  const WEBEX_API_KEY = process.env.WEBEX_API;
  try {
    const data = {
      toPersonEmail: "bmacer@cisco.com",
      text: message,
    };
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WEBEX_API_KEY}`,
      },
    };
    console.log(config);
    const res = await axios.post(
      "https://webexapis.com/v1/messages",
      data,
      config
    );
  } catch (err) {
    console.error(err);
  }
};

export default post;

// module.exports.post = async function post(message) {
//   const WEBEX_API_KEY = process.env.WEBEX_API;
//   try {
//     const data = {
//       toPersonEmail: "bmacer@cisco.com",
//       text: message,
//     };
//     const config = {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${WEBEX_API_KEY}`,
//       },
//     };
//     console.log(config);
//     const res = await axios.post(
//       "https://webexapis.com/v1/messages",
//       data,
//       config
//     );
//   } catch (err) {
//     console.error(err);
//   }
// };

// module.exports.post_to_stickie_room = async function post_to_stickie_room(
//   message
// ) {
//   const WEBEX_API_KEY = process.env.WEBEX_API;
//   try {
//     const data = {
//       roomId: process.env.STICKIES_ROOM_API,
//       text: message,
//     };
//     console.log(data);
//     console.log(WEBEX_API_KEY);
//     const config = {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${WEBEX_API_KEY}`,
//       },
//     };
//     console.log(config);
//     const res = await axios.post(
//       "https://webexapis.com/v1/messages",
//       data,
//       config
//     );
//   } catch (err) {
//     console.error(err);
//   }
// };

// module.exports.post_stickie_sale = async function post_stickie_sale(message) {
//   const WEBEX_API_KEY = process.env.WEBEX_API;
//   try {
//     const data = {
//       roomId:
//         "Y2lzY29zcGFyazovL3VzL1JPT00vNjBlZGQ0ZjAtYjAzNC0xMWVjLTk4MzYtMjFjZGZmMDFjOGUy",
//       text: message,
//     };
//     console.log(data);
//     console.log(WEBEX_API_KEY);
//     const config = {
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${WEBEX_API_KEY}`,
//       },
//     };
//     console.log(config);
//     const res = await axios.post(
//       "https://webexapis.com/v1/messages",
//       data,
//       config
//     );
//   } catch (err) {
//     console.error(err);
//   }
// };

// Y2lzY29zcGFyazovL3VzL1JPT00vNjBlZGQ0ZjAtYjAzNC0xMWVjLTk4MzYtMjFjZGZmMDFjOGUy
