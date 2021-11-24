import { ApiPromise, WsProvider } from '@polkadot/api';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const fs = require('fs');
const twit = require("./twitter.cjs");

const MINIMUM_V1_PRICE = 0.05
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

        // We console.log and write to file just to see the stream of blocks we're receiving (to know we're alive)
        console.log(`block: ${header.number - 1} (${header.parentHash})`);
        fs.appendFile('logs.log', `block: ${header.number - 1} (${header.parentHash})\n`, () => { });

        // Subscribing to blocks
        const getBlock = api.rpc.chain.getBlock(header.parentHash).then((block) => {
            // Loop through extrinsics
            block.block.extrinsics.forEach((i) => {
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
                            let statement = `Singular RMRK sale alert! https://singular.rmrk.app/collectibles/${nft} was purchased for ${purchase_price / (10 ** 12)}KSM by ${purchaser}`
                            fs.appendFile('logs.log', `${statement}\n`, () => { });
                            console.log(statement)
                            twit.main(statement)
                        } else if (version == "2.0.0" && purchase_price >= MINIMUM_V2_PRICE * (10 ** 12)) {
                            let statement = `Kanaria RMRK sale alert! https://kanaria.rmrk.app/catalogue/${nft} was purchased for ${purchase_price / (10 ** 12)}KSM by ${purchaser}`
                            fs.appendFile('logs.log', `${statement}\n`, () => { });
                            console.log(statement)
                            twit.main(statement)
                        } else {
                            // if version *isn't* 1.0.0 or 2.0.0 (which shouldn't happen) or if threshold isn't met
                            let statement = `RMRK sale minimum not met -- ${version}: ${nft} was purchased for ${purchase_price / (10 ** 12)}KSM by ${purchaser}`
                            console.log(statement)
                            fs.appendFile('logs.log', `${statement}\n`, () => { });
                        }
                    }
                }
            });
        });
    });
}

twitter_rmrk_bot()
