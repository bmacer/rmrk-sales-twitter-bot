import { ApiPromise, WsProvider } from '@polkadot/api';
import { createRequire } from "module";

import { u8aToHex } from "@polkadot/util";
import { decodeAddress, Keyring } from "@polkadot/keyring";
import { execPath } from 'process';
// import keyring from '@polkadot/ui-keyring';

const require = createRequire(import.meta.url);
const fs = require('fs');
const twit = require("./twitter.cjs");
const telegram = require("./telegram.cjs");
const webex = require("./webex.cjs");

const handles = {
    H6eq9zedryfAMVFsgpKYFrnEWBPBgwHEv6p9fJBUs2C81fJ: "@blocksbrandon"
}

telegram.post("Running")
webex.post("Running")
const MINIMUM_V1_PRICE = 0.05
const MINIMUM_V2_PRICE = 0.01
const LOGFILE = "listings.txt"
const HOME_DIR = "/home/pi/"
const DEBUG_LOGS = "debug.txt"

const provider = new WsProvider('wss://node.rmrk.app') // Use for production
const api = await new ApiPromise({ provider }).isReady;

let prod = false;

// "FRvj8ZJN8nKe9DXyffQbTnnryyWLbfZ8bijfDAo3B869PoL"
async function get_id(ksm) {
    try {
        const me = await api.query.identity.identityOf(ksm);
        const tw = me.toHuman().info.twitter.Raw;
        return tw;
    } catch {
        return "";
    }
}

function handle_mint(signer, interaction_as_list) {
    console.log("MINT!");
    console.log(signer);
    let [_x, _y, version, raw_mint_data] = interaction_as_list;
    if (version == "1.0.0") {
        let post = false;
        let prestatement = "";

        if (signer == "HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU") {
            post = true;
            prestatement = "RMRK Official MINTING!!!"
            // TODO handle the raw data
        } else if (raw_mint_data.includes("FANARIA")) {
            post = true;
            prestatement = "New Fanaria MINTING!";
        } else if (raw_mint_data.includes("4a4c04c0029f17067c-73DKY")) {
            post = true;
            prestatement = `New Longneck MINTING!`
        }
        let statement = `${prestatement} listed by ${signer}`
        if (post) {
            webex.post(statement);
            console.log(statement);
        } else {
            console.log("Minting of a non-captured collection:");
            console.log(statement);
        }
    }
}

function handle_list(signer, interaction_as_list) {
    console.log("LIST!");
    console.log(signer);
    console.log(interaction_as_list)
    let [_x, _y, version, nft, price] = interaction_as_list;
    if (price == 0) {
        console.log("Delisting");
        return;
    }
    let url = "";
    price = parseFloat(price) / 1_000_000_000_000.
    console.log(price);

    if (version == "1.0.0") {
        url = `https://singular.rmrk.app/collectibles/${nft}`;
        let post = false;
        let prestatement = "";
        let name = nft.split("-")[3];

        if (signer == "HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU") {
            post = true;
            prestatement = "RMRK Official!!!"
            // webex.post(`RMRK official: ${price} ${link}`)
        } else if (nft.includes("FANARIA")) {
            post = true;
            prestatement = "New Fanaria listing!";
        } else if (nft.includes("4a4c04c0029f17067c-73DKY")) {
            post = true;
            prestatement = `New Longneck listing!`
            let statement = `New Longneck listing! ${name} listed for ${price / 0.98}KSM, listed by ${signer} ${url}`
            if (prod) {
                twit.tweet_giraffe(statement);
            } else {
                webex.post("non-prod:");
                webex.post(statement);
                console.log(statement);
            }
        }
        let statement = `${prestatement} ${name} listed for ${price}KSM by ${signer} ${url}`
        if (post) {
            webex.post(statement);
        } else {
            console.log("Listing of a non-captured collection:");
            console.log(statement);
        }
    }
    if (version == "2.0.0") {
        url = `https://kanaria.rmrk.app/catalogue/${nft}`;
        // is it bird?
        let prestatement = "";
        let level = "";
        let bird = false;
        if (nft.includes("KANBIRD")) {
            bird = true;
            let l = nft.split("-")[3].charAt(3);
            if (l == "S") {
                level = " (Super Founder)"
            } else if (l == "F") {
                level = " (Founder)"
            } else if (l == "R") {
                level = " (Rare)"
            } else if (l == "L") {
                level = " (Limited)"
            }
            prestatement = "New Kanaria Listing";
        } else {
            let name = nft.split("-")[3];
            prestatement = `New Kanaria Item Listing (${name})`
        }
        let statement = `${prestatement}${level} listed for ${price / 0.95}KSM by ${signer} https://kanaria.rmrk.app/catalogue/${nft}`
        if (bird) {
            if (prod) {
                console.log("prod listing");
                console.log(statement);
                twit.tweet_listing(statement);
            } else {
                console.log("dev listing");
                console.log(statement);
                webex.post(statement);
            }
        } else {
            console.log("no bird");
            console.log(statement);
            // webex.post(statement);
        }
    }
}

function handle_buy(signer, nft, purchase_price, version) {
    console.log("BUY!");
    console.log(signer, nft, purchase_price, version);

    if (version == "1.0.0") {
        if (nft.includes("4a4c04c0029f17067c-73DKY")) {
            let name = nft.split("-")[3];
            let link = `https://singular.rmrk.app/collectibles/${nft}`;
            let statement = `Longneck Sale Alert! ${name} was purchased for ${purchase_price}KSM by ${signer} ${link}`
            if (prod) {
                console.log("prod posting:");
                console.log(statement);
                twit.tweet_giraffe(statement);
            } else {
                console.log("dev posting:");
                console.log(statement);
                webex.post(statement);
            }
        } else {
            let name = nft.split("-")[3];
            let link = `https://singular.rmrk.app/collectibles/${nft}`;
            let statement = `RMRK1.0 Sale Alert! ${name} was purchased for ${purchase_price}KSM by ${signer} ${link}`
            if (prod) {
                console.log("prod posting:");
                console.log(statement);
                // twit.tweet_giraffe(statement);
            } else {
                console.log("dev posting:");
                console.log(statement);
                webex.post(statement);
            }
        }
    }
    if (version == "2.0.0") {
        // let url = `https://kanaria.rmrk.app/catalogue/${nft}`;
        let prestatement = "";
        let level = "";
        let bird = false;
        if (nft.includes("KANBIRD")) {
            bird = true;
            let l = nft.split("-")[3].charAt(3);
            if (l == "S") {
                level = " (Super Founder)"
            } else if (l == "F") {
                level = " (Founder)"
            } else if (l == "R") {
                level = " (Rare)"
            } else if (l == "L") {
                level = " (Limited)"
            }
            prestatement = "Kanaria Bird Sale Alert";
        } else {
            prestatement = "New Kanaria Item Sale"
        }
        let statement = `Kanaria Bird Sale Alert${level}! ${purchase_price}KSM ${signer} purchased https://kanaria.rmrk.app/catalogue/${nft}`
        if (bird) {
            if (prod) {
                console.log("prod listing");
                console.log(statement);
                twit.main(statement);
            } else {
                console.log("dev listing");
                console.log(statement);
                webex.post(statement);
            }
        } else {
            console.log("no bird");
            console.log(statement);
            // webex.post(statement);
        }
    }
}

async function twitter_rmrk_bot() {
    let latest_block = 0;
    api.rpc.chain.subscribeNewHeads(async (header) => {

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
        const getBlock = api.rpc.chain.getBlock(header.parentHash).then(async (block) => {
            // Loop through extrinsics
            block.block.extrinsics.forEach(async (i) => {
                let signer = ""
                if (i.signer) {
                    signer = i.signer.toString();
                    let twitter_handle = await get_id(signer);
                    if (twitter_handle) {
                        signer = twitter_handle;
                    }
                }
                if (i.method.section == "system") {
                    console.log("system");
                    let interaction_as_list = i.args[0].toHuman().split("::")
                    if (interaction_as_list.length >= 3) {
                        console.log(i.args[0].toHuman());
                        let interaction = interaction_as_list[1];

                        if (interaction == "MINTNFT") {
                            handle_mint(signer, interaction_as_list)
                        }

                        if (interaction == "LIST") {
                            handle_list(signer, interaction_as_list);
                        }
                    }
                }

                if (i.method.section == "utility") {
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
                        let price = parseFloat(purchase_price) / 1_000_000_000_000.
                        handle_buy(signer, nft, price, version);
                    }
                }
            });
        });
    });
}

twitter_rmrk_bot()
