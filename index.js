import { ApiPromise, WsProvider } from '@polkadot/api';
import { createRequire } from "module";

import { u8aToHex } from "@polkadot/util";
import { decodeAddress, Keyring } from "@polkadot/keyring";
import { execPath } from 'process';
import { isGeneratorFunction } from 'util/types';
// import keyring from '@polkadot/ui-keyring';
import { highRollers } from './testing.js';

let HIGH_ROLLERS = highRollers();

const require = createRequire(import.meta.url);
const fs = require('fs');
const telegram = require("./telegram.cjs");
const webex = require("./webex.cjs");

var sqlite3 = require('sqlite3').verbose();
var file = "./db.db";

// const provider = new WsProvider('wss://node.rmrk.app') // Use for production
const provider = new WsProvider('wss://kusama-rpc.polkadot.io')
const api = await new ApiPromise({ provider }).isReady;


const open = require('open');

const dont_want_to_see_list = [
    "BUFFCHIMP",
    "3cbd5d669b87e6bb23-OC4E7",
    "24d6d7cd9a97d46d3e-SUB-CL",
    "8476db81626f94356a-E7Y1R",
]

async function open_url(url) {
    let blacklisted = false;
    for (let bad in dont_want_to_see_list) {
        if (url.includes(dont_want_to_see_list[bad])) {
            console.log(bad);
            console.log(url);
            console.log(`blacklisted::: ${url}`);
            blacklisted = true;
        }
    }
    await open(url);
    telegram.post(url);
}

function get_collection_url_from_raw_mint_data(data) {
    let decoded_mint_data = decodeURIComponent(data);
    let json = JSON.parse(decoded_mint_data);
    let url = `https://singular.rmrk.app/collections/${encodeURIComponent(json.collection)}`;
    return url;
}

// put items into db
// -- listings --
// block, id, price, lister

let nft_id = "chaos-gir-102";
let block = 100;
let price = 1.5;
let lister = "PKO3";

function nid_to_cid(nft) {
    // input: 11394049-7c9f7a1b771e25f335-ULQD6-SAKURA_1144_LEGENDARY_EDITION-0000000000000011
    // output: 7c9f7a1b771e25f335-ULQD6
    let split = nft.split("-");
    if (split.length > 2) {
        return split.slice(1, 3).join("-");
    }
    return "";
}

function nid_to_sid(nft) {
    // input: 11394049-7c9f7a1b771e25f335-ULQD6-SAKURA_1144_LEGENDARY_EDITION-0000000000000011
    // output: 7c9f7a1b771e25f335-ULQD6
    let split = nft.split("-");
    if (split.length > 3) {
        return split[3];
    }
    return "";
}

webex.post("Running")


const MINIMUM_V1_PRICE = 0.05
const MINIMUM_V2_PRICE = 0.01
const LOGFILE = "listings.txt"
const HOME_DIR = "/home/pi/"
const DEBUG_LOGS = "unknown.txt"

const RMRK_OFFICIAL = "HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU";
const RMRK_PARTNER = "G7pQAvMZ4yFa7wWsDVJTbNr4shUi98ajzZhRYiMMH1j9LRz";

const NEW_GUY = "22708b368d163c8007-KV";
const SKYLAB = "70499e87a25cddd465-CARD";






// DELETE FROM listings WHERE id=(SELECT id FROM listings WHERE nft="8949171-e0b9bdcc456a36497a-KANBIRD-KANL-00008110");
function delete_from_sql(nft) {
    var db = new sqlite3.Database(file);

    // insert one row into the langs table
    db.run(`DELETE FROM listings WHERE id=(SELECT id FROM listings WHERE nft=(?));`,
        [nft], function (err) {
            if (err) {
                console.log("errrrr");
                return console.log(err.message);
            }
            // get the last insert id
            // console.log(`A row has been deleted`);
        });
    db.close();
}

// delete_from_sql("11147523-c6017764e7a1d03b5e-RMRKOLDCOINS-OLD_COIN_2203016-0000000000000011");

function update_latest_block_in_sql(block) {
    var db = new sqlite3.Database(file);
    db.run(`UPDATE latest_block SET number=(?)`,
        [block], function (err) {
            if (err) {
                return console.log(err.message);
            }
        });
    db.close();
}


function insert(version, price, block, nft, seller) {
    var db = new sqlite3.Database(file);

    // insert one row into the langs table
    db.run(`INSERT INTO listings(version, price, block, nft, collection, symbol, seller) VALUES(?, ?, ?, ?, ?, ?, ?)`,
        [version, price / 1_000_000_000_000, block, nft, nid_to_cid(nft), nid_to_sid(nft), seller], function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            // console.log(`A row has been inserted with rowid ${this.lastID}`);
        });
    db.close();
}

function insert_buy(version, price, block, nft, seller) {
    var db = new sqlite3.Database(file);

    // insert one row into the langs table
    db.run(`INSERT INTO sales(version, price, block, nft, collection, symbol, seller) VALUES(?, ?, ?, ?, ?, ?, ?)`,
        [version, price, block, nft, nid_to_cid(nft), nid_to_sid(nft), seller], function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            // console.log(`A sale row has been inserted with rowid ${this.lastID}`);
        });
    db.close();
}



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
    let [_x, _y, version, raw_mint_data] = interaction_as_list;
    if (version == "1.0.0") {
        let post = false;
        let prestatement = "";
        let collection_url = get_collection_url_from_raw_mint_data(raw_mint_data);
        if (signer == RMRK_OFFICIAL || signer == RMRK_PARTNER) {
            prestatement = "RMRK Official MINTING!!!"
            webex.post("new rmrk official minting");
            console.log(raw_mint_data);
            open_url(collection_url);
        } else if (raw_mint_data.includes(NEW_GUY)) {
            webex.post(`new guy minted: ${collection_url}`);
        }
        let statement = `${prestatement} \nminted by ${signer}.  \ncollection: \n${collection_url}`;
        if (post) {
            webex.post(statement);
            console.log(statement);
            open_url(collection_url);
        } else {
            console.log("Minting of a non-captured collection:");
            console.log(statement);
            fs.appendFile(DEBUG_LOGS, `${statement}\n`, () => { });
            // open_url(collection_url);
        }
    }
}

function handle_list(signer, interaction_as_list, block) {
    let [_x, _y, version, nft, price] = interaction_as_list;
    if (price == 0 && !nft.includes("4a4c04c0029f17067c-73DKY")) {
        delete_from_sql(nft);
        return;
    }
    // console.log("LIST!");
    insert(version, price, block, nft, signer);
    let url = "";
    price = parseFloat(price) / 1_000_000_000_000.
    // console.log(price);

    if (version == "1.0.0") {
        url = `https://singular.rmrk.app/collectibles/${nft}`;
        // open_url(url);
        let prestatement = "";
        let name = nft.split("-")[3];
        //22708b368d163c8007-KV 

        if (signer == "HeyRMRK7L7APFpBrBqeY62dNhFKVGP4JgwQpcog2VTb3RMU" || signer == "G7pQAvMZ4yFa7wWsDVJTbNr4shUi98ajzZhRYiMMH1j9LRz") {
            prestatement = "RMRK Official!!!"
            console.log("rmrk official");
            open_url(url);
            // webex.post(`RMRK official: ${price} ${link}`)

        } else if (nft.includes(NEW_GUY) || nft.includes(SKYLAB)) {
            console.log("new guy or skylab listing")
            console.log(url)
            webex.post(url)
            // open(url)
        }
        let statement = `\n${prestatement} ${name} LISTED for ${price}KSM by ${signer} \n${url}\n`;
        webex.post(statement);
        console.log(statement);
    }

    if (version == "2.0.0") {
        url = `https://kanaria.rmrk.app/catalogue/${nft}`;
        if (signer == RMRK_OFFICIAL || signer == RMRK_PARTNER) {
            console.log("rmrk new for sale");
            open_url(url);
        }
        if (price < 25) {
            open_url(url);
        }
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
            prestatement = "New Kanaria";
        } else {
            let name = nft.split("-")[3];
            prestatement = `New Kanaria Item Listing (${name})`
        }
        let statement = `${prestatement}${level} listed\n${(price / 0.95).toFixed(2)}KSM\nby ${signer} \nhttps://kanaria.rmrk.app/catalogue/${nft}\n`

        console.log(statement);
        webex.post(statement);
    }
}
function handle_buy(signer, nft, purchase_price, version, block) {
    insert_buy(version, purchase_price, block, nft, signer);
    if (version == "1.0.0") {
        let name = nft.split("-")[3];
        let link = `https://singular.rmrk.app/collectibles/${nft}`;
        let statement = `RMRK1.0 Sale Alert! ${name} was purchased for ${purchase_price.toFixed(2)}KSM by ${signer} \n${link}`
        console.log(statement);
        webex.post(statement);

        if (signer in HIGH_ROLLERS) {
            console.log("New high-roller purchase: ", HIGH_ROLLERS[signer]);
            webex.post("high-roller");
            open_url(link);
        }
    }
    if (version == "2.0.0") {
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
        let statement = `${prestatement}${level}! ${purchase_price.toFixed(2)}KSM ${signer} purchased \nhttps://kanaria.rmrk.app/catalogue/${nft}`
        console.log(statement);
        webex.post(statement);
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
        update_latest_block_in_sql(latest_block);
        if (header.number % 10 == 0) {
            console.log(`block: ${header.number - 1}`);
        }
        const getBlock = api.rpc.chain.getBlock(header.parentHash).then(async (block) => {
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
                    let interaction_as_list = i.args[0].toHuman().split("::")
                    if (interaction_as_list.length >= 3) {
                        let interaction = interaction_as_list[1];
                        if (interaction == "MINTNFT" || interaction == "MINT") {
                            handle_mint(signer, interaction_as_list)
                        }
                        if (interaction == "LIST") {
                            handle_list(signer, interaction_as_list, latest_block);
                        }
                    }
                }

                if (i.method.section == "utility") {
                    let nft = ""; // This will be the ID of the nft
                    let purchase_price = 0; // This will be the total amount transferred in the batch
                    let purchaser = i.signer; // This is the caller of the batch
                    let version = ""; // This is the RMRK version (1.0.0 or 2.0.0)
                    // Looping through each element in the batch
                    let done = false;
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
                            if (interaction_as_list[1] == "LIST") {
                                console.log("multiple listings");
                                handle_list(signer, interaction_as_list, latest_block);
                            }
                            if (interaction_as_list[1] == "MINT" || interaction_as_list[1] == "MINTNFT") {
                                console.log("multiple mintings");
                                handle_mint(signer, interaction_as_list);
                            }
                        }

                    })
                    // Only if our assignments were successful should we sent to our publishing api
                    if (nft != "" && purchase_price != 0 && purchaser != "") {
                        let price = parseFloat(purchase_price) / 1_000_000_000_000.
                        handle_buy(signer, nft, price, version, latest_block);
                    }
                }
            });
        });
    });
}

twitter_rmrk_bot()
