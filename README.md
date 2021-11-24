# RMRK 1.0 and 2.0 Twitter bot

This is a simple bot for streaming RMRK BUY operations.

We create a websocket connection to wss://node.rmrk.app (Kusama) and parse the incoming blocks for matching BUY remarks.

Specifically, a BUY is in two parts: a system.remark that calls the BUY, and a balance transfer (actually two balance transfers, one to the seller, and another to the fee-collector).  These two operations are batched in a utility.batchAll.

Once we parse for a matching transaction, we create our message, and send it to Twitter.

# Requirements

node+yarn and Twitter API keys

You need to be a [Twitter developer](https://developer.twitter.com) which requires applying to Twitter and their acceptance of your use case.

Once you're onboard, create a Standaone App, view the App details, click on *Keys and tokens* to generate an api key and secret, and an access token and secret.

# Running

Clone this repository and run `yarn` then populate a file `.env` with your API keys and secrets.  For example:

```
TWITTER_API_KEY="abc"
TWITTER_API_KEY_SECRET="def"
TWITTER_ACCESS_TOKEN="ghi"
TWITTER_ACCESS_TOKEN_SECRET="jkl"
```

Then run `node index.js` and watch it work.  You'll see a stream of blocks as they are witnessed and parsed:

block: 10237880 (0x6877e02a724970cb1837d8764da9e30206cff6da3c4b0866daf3b61e7773cc62)
block: 10237881 (0xf0124a430bea47cb8c1d881fe31c8b3f8becd39cacd2e7da49b368109dfcc530)
block: 10237882 (0x2be03fa8b1268ff926b1c20ee20d8eefe3dcc3885b3c68b4232eb1f8c3d6a560)
block: 10237883 (0x1743ac5cca676dab4cf6720bd70a5b3a18f6661b13feef196c4cdfdb11d0589c)

The console output is also written to logs.log.

When a sale is witnessed, the log will show the Tweet, and the Tweet will be sent.

# Testing

You can switch the comment for the websocket connection to run in dev mode, with a local Polkadot node running.
You might want to use some of the test interactions [here](https://github.com/bmacer/rmrk2-interaction-examples) to see it work, or you can generate your own RMRKs with rmrk-tools.
