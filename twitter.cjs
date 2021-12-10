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
        console.log("Tweeted!  Tweet ID: ", response.id)
    }).catch(err => {
        console.error(err)
    })

}

module.exports.tweet_listing = async function tweet_listing(tweet) {
    const twitterClient = new TwitterClient({
        apiKey: process.env.TWITTER_API_KEY2,
        apiSecret: process.env.TWITTER_API_KEY_SECRET2,
        accessToken: process.env.TWITTER_ACCESS_TOKEN2,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET2,
    });

    twitterClient.tweets.statusesUpdate({
        status: tweet
    }).then(response => {
        console.log("Tweeted!  Tweet ID: ", response.id)
    }).catch(err => {
        console.error(err)
    })

}
