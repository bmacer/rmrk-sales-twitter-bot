require('dotenv').config()
const { TwitterClient } = require('twitter-api-client')

// This is a simple implementation of the Twitter API.  Presumably, this would function the same for other platforms with their implementation
// The "tweet" parameter is just a string
module.exports.main = async function tweet(tweet) {
    const twitterClient = new TwitterClient({
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_KEY_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    twitterClient.tweets.statusesUpdate({
        status: tweet
    }).then(response => {
        console.log("Tweeted!", response)
    }).catch(err => {
        console.error(err)
    })

}
