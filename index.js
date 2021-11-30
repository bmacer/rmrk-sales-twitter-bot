import { ApiPromise, WsProvider } from '@polkadot/api';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const fs = require('fs');
const twit = require("./twitter.cjs");

const LOGFILE = "listings.txt"

require('dotenv').config()

const axios = require('axios');

const sendMessage = async (message) => {
    try {
        const data = {
            'toPersonEmail': "bmacer@cisco.com",
            'text': message
        };
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.WEBEX_API}`
            }
        };
        console.log(config)
        const res = await axios.post('https://webexapis.com/v1/messages', data, config);
    } catch (err) {
        console.error(err);
    }
};

sendMessage("ok");







function getChildrenAndSend(s, q) {
    const { spawn } = require('child_process');

    let child = spawn(
        '/home/ec2-user/rmrk2-rust-consolidator/target/release/rmrk2-rust-consolidator',
        [
            '--input',
            '/home/ec2-user/full-results.json',
            q
        ]
    );

    child.on('exit', function (code, signal) {
        console.log('child process exited with ' +
            `code ${code} and signal ${signal}`);
    });

    child.stdout.on('data', (data) => {
        sendMessage(`${s} ${data.toString()}`);
        console.log(`${s}\n${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`child stderr: \n${data}`);
    });
}






// /home/ec2-user/rmrk2-rust-consolidator/target/release/rmrk2-rust-consolidator --input /home/ec2-user/full-results.json 8788603-e0b9bdcc456a36497a-KANHAND-1f4a3_objectleft-00000978



const MINIMUM_V1_PRICE = 3
const MINIMUM_V2_PRICE = 0.01

const provider = new WsProvider('wss://node.rmrk.app') // Use for production
// const provider = new WsProvider('ws://127.0.0.1:9944') // Use for dev
const api = await new ApiPromise({ provider }).isReady;

function twitter_rmrk_bot() {
    let latest_block = 0;
    api.rpc.chain.subscribeNewHeads((header) => {

        // Sometimes we get fed the same block twice, let's not eat it.
        if (header.number - 1 <= latest_block) {
            return
        }
        latest_block = header.number - 1;
	if (latest_block % 600 == 0) {
		sendMessage(`keepalive at block ${latest_block}`)
	}
        // We console.log and write to file just to see the stream of blocks we're receiving (to know we're alive)
        console.log(`block: ${header.number - 1} (${header.parentHash})`);
        fs.appendFile('logs.txt', `block: ${header.number - 1} (${header.parentHash})\n`, () => { });

        // Subscribing to blocks
        const getBlock = api.rpc.chain.getBlock(header.parentHash).then((block) => {
            // Loop through extrinsics
            block.block.extrinsics.forEach((i) => {
		if (i.method.section == "system") {
                    let caller = i.signature.signer
                    // console.log(i);
                    let parts = i.args[0].toHuman().split("::")
                    // console.log(parts);
                    // console.log(parts)
                    if (parts.length > 3) {
                        let interaction = parts[1]

                        // if (interaction == "LIST") {
                        let version = parts[2];
                        let nft = parts[3]
                        let price = parts[4]
                        let link = version == "1.0.0" ? `https://singular.rmrk.app/collectibles/${nft}` : `https://kanaria.rmrk.app/catalogue/${nft}`
                        let string = `${price / 10 ** 12}KSM ${interaction} ${version} (block ${latest_block}) ${link}\n`
                        console.log(string)
                        if (version == "2.0.0") {
                            // sendMessage(string)
                            getChildrenAndSend(string, nft)
                        }
                        fs.appendFile(LOGFILE, string, () => { });
                        // }
                    }

                }
                // Since BUY only exists properly in "utility" extrinsics, we don't care about anything else
                if (i.method.section == "utility") {
                    // Initialize our values
                    let nft = ""; // This will be the ID of the nft
                    let purchase_price = 0; // This will be the total amount transferred in the batch
                    let purchaser = i.signer; // This is the caller of the batch
                    let version = ""; // This is the RMRK version (1.0.0 or 2.0.0)

                    // Looping through each element in the batch
                    i.method.args[0].forEach((el) => {
                        // If the element is a transfer, we get the balance transferred
                        if (el.method == "transfer") {
                            // We add here because there is both the transfer to the seller and the fee
                            purchase_price += parseInt(el.args[1])
                        }
                        // If the element is "remark", we extract nft and version variables
                        if (el.method == "remark") {
                            // Split the argument into a list
                            let interaction_as_list = el.args[0].toHuman().split("::")
                            // Make sure we're dealing with a "BUY" with enough args
                            if (interaction_as_list.length >= 4 && interaction_as_list[1] == "BUY") {
                                nft = interaction_as_list[3]
                                version = interaction_as_list[2]
                            }
                        }
                    })
                    // Only if our assignments were successful should we sent to our publishing api
                    if (nft != "" && purchase_price != 0 && purchaser != "") {
                        if (version == "1.0.0" && purchase_price >= MINIMUM_V1_PRICE * (10 ** 12)) {
                            let statement = `Singular RMRK Large Purchase (${purchase_price / (10 ** 12)}KSM): https://singular.rmrk.app/collectibles/${nft} was purchased by ${purchaser} on Kusama block ${latest_block}`
                            fs.appendFile('logs.txt', `${statement}\n`, () => { });
                            console.log(statement)
                            twit.main(statement)
                        } else if (version == "2.0.0" && purchase_price >= MINIMUM_V2_PRICE * (10 ** 12)) {
                            let statement = `Kanaria Sale Alert! (${purchase_price / (10 ** 12)}KSM) https://kanaria.rmrk.app/catalogue/${nft} was purchased by ${purchaser} on Kusama block ${latest_block}`
                            fs.appendFile('logs.txt', `${statement}\n`, () => { });
                            console.log(statement)
                            twit.main(statement)
                        } else {
                            // if version *isn't* 1.0.0 or 2.0.0 (which shouldn't happen) or if threshold isn't met
                            let statement = `RMRK sale minimum not met -- ${version}: ${nft} was purchased for ${purchase_price / (10 ** 12)}KSM by ${purchaser}`
                            console.log(statement)
                            fs.appendFile('logs.txt', `${statement}\n`, () => { });
                        }
                    }
                }
            });
        });
    });
}

twitter_rmrk_bot()
