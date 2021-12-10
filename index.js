import { ApiPromise, WsProvider } from '@polkadot/api';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const fs = require('fs');
const twit = require("./twitter.cjs");
const telegram = require("./telegram.cjs");
const webex = require("./webex.cjs");

telegram.post("Running")
webex.post("Running")

const MINIMUM_V1_PRICE = 0.05
const MINIMUM_V2_PRICE = 0.01
const LOGFILE = "listings.txt"
const HOME_DIR = "/home/pi/"
const DEBUG_LOGS = "debug.txt"

const provider = new WsProvider('wss://node.rmrk.app') // Use for production
// const provider = new WsProvider('ws://127.0.0.1:9944') // Use for dev
const api = await new ApiPromise({ provider }).isReady;

function getChildrenAndSend(s, q) {
    const { spawn } = require('child_process');

    let child = spawn(
        `${HOME_DIR}rmrk2-rust-consolidator/target/release/rmrk2-rust-consolidator`,
        [
            '--input',
            `${HOME_DIR}full-results.json`,
            q
        ]
    );

    child.on('exit', function (code, signal) {
        console.log('child process exited with ' +
            `code ${code} and signal ${signal}`);
    });

    child.stdout.on('data', (data) => {
        webex.post(`${s} ${data.toString()}`);
        console.log(`${s}\n${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`child stderr: \n${data}`);
    });
}

function twitter_rmrk_bot() {
    let latest_block = 0;
    api.rpc.chain.subscribeNewHeads((header) => {

        // Sometimes we get fed the same block twice, let's not eat it.
        if (header.number - 1 <= latest_block) {
            return
        }
        latest_block = header.number - 1;
        fs.writeFile("latest.txt", Date().toString(), () => { });
        // We console.log and write to file just to see the stream of blocks we're receiving (to know we're alive)
        console.log(`block: ${header.number - 1} (${header.parentHash})`);
        fs.appendFile(DEBUG_LOGS, `block: ${header.number - 1} (${header.parentHash})\n`, () => { });
        // Subscribing to blocks
        const getBlock = api.rpc.chain.getBlock(header.parentHash).then((block) => {
            // Loop through extrinsics
            block.block.extrinsics.forEach((i) => {
                if (i.method.section == "system") {
                    console.log("system");
                    let interaction_as_list = i.args[0].toHuman().split("::")
                    if (interaction_as_list.length > 4) {
                        console.log(interaction_as_list);
                        let interaction = interaction_as_list[1];
                        let version = interaction_as_list[2];
                        if (interaction == "LIST") {
                            let nft = interaction_as_list[3];
                            let price = parseFloat(interaction_as_list[4]);
                            if (nft.includes("4a4c04c0029f17067c-73DKY") || nft.includes("FANARIA") && price > 0) {
                                webex.post(`NEW GIRAFFE or FANARIA AVAILABLE: ${link}`);
                            }
                            if (price != 0 && nft.includes("KANBIRD")) {
                                // 8949171-e0b9bdcc456a36497a-KANBIRD-KANL-00007935
                                let l = nft.split("-")[3].charAt(3);
                                let level = "";
                                if (l == "S") {
                                    level = "Super Founder"
                                } else if (l == "F") {
                                    level = "Founder"
                                } else if (l == "R") {
                                    level = "Rare"
                                } else if (l == "L") {
                                    level = "Limited"
                                }

                                let s = `New Kanaria Listing (${level})! ${price / 1_000_000_000_000.}KSM https://kanaria.rmrk.app/catalogue/${nft}`
                                console.log(s);
                                twit.tweet_listing(s);
                            }

                        }
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
                            // I don't care about 1.0.0 for now.
                            // let statement = `Singular RMRK sale alert! https://singular.rmrk.app/collectibles/${nft} was purchased for ${purchase_price / (10 ** 12)}KSM by ${purchaser}`
                            // fs.appendFile(DEBUG_LOGS, `${statement}\n`, () => { });
                            // console.log(statement)
                            // twit.main(statement)
                        } else if (version == "2.0.0" && purchase_price >= MINIMUM_V2_PRICE * (10 ** 12)) {
                            let statement = `Kanaria Bird Sale Alert! ${purchase_price / (10 ** 12)}KSM https://kanaria.rmrk.app/catalogue/${nft} was purchased by ${purchaser}`
                            fs.appendFile(DEBUG_LOGS, `${statement}\n`, () => { });
                            console.log(statement)
                            if (nft.includes("KANBIRD")) {
                                twit.main(statement)
                                telegram.post(statement)
                            }
                        } else {
                            // if version *isn't* 1.0.0 or 2.0.0 (which shouldn't happen) or if threshold isn't met
                            let statement = `RMRK sale minimum not met -- ${version}: ${nft} was purchased for ${purchase_price / (10 ** 12)}KSM by ${purchaser}`
                            console.log(statement)
                            fs.appendFile(DEBUG_LOGS, `${statement}\n`, () => { });
                        }
                    }
                }
            });
        });
    });
}

twitter_rmrk_bot()
