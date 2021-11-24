# RMRK 1.0 and 2.0 Twitter bot

This is a simple bot for streaming RMRK BUY operations.

We create a websocket connection to wss://node.rmrk.app (Kusama) and parse the incoming blocks for matching BUY remarks.

Specifically, a BUY is in two parts: a system.remark that calls the BUY, and a balance transfer (actually two balance transfers, one to the seller, and another to the fee-collector).  These two operations are batched in a utility.batchAll.

Once we parse for a matching transaction, we create our message, and send it to Twitter.

# Requirements

Node and Twitter API keys

You need to be a [Twitter developer](https://developer.twitter.com) which requires applying to Twitter and their acceptance of your use case.

Once you're onboard, create a Standaone App, view the App details, click on *Keys and tokens* to generate an api key and secret, and an access token and secret.

# Running

Clone this repository and opulate a file `.env` with your API keys and secrets.  For example:

TWITTER_API_KEY="abc"
TWITTER_API_KEY_SECRET="def"
TWITTER_ACCESS_TOKEN="ghi"
TWITTER_ACCESS_TOKEN_SECRET="jkl"

Then run `node index.js` and watch it work.
