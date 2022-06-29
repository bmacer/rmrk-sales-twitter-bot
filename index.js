import { ApiPromise, WsProvider } from '@polkadot/api';
import { createRequire } from "module";
import { BlockList } from 'net';
import { parse } from 'path';
import {
    BLOCK_HASH_RMRK_PURCHASE_SINGLE_LAND,
    BLOCK_HASH_RMRK_PURCHASE_MULTIPLE_LANDS,
    BLOCK_HASH_VOUCHER_SINGLE_LAND,
    BLOCK_HASH_VOUCHER_MULTIPLE_LANDS
} from './testing_blocks.js';

const require = createRequire(import.meta.url);

const parse_data = require("./parse_skybreach_data.cjs");
const webex = require("./webex.cjs");
const twitter = require("./twitter.cjs");

// Web Sockets
const MOONRIVER_WS = "wss.api.moonriver.moonbeam.network";
const BACKUP_WS = "moonriver-rpc.dwellir.com"

// RMRK ETH contract
// https://moonriver.moonscan.io/address/0x98af019cdf16990130cba555861046b02e9898cc
const RMRK_CONTRACT = "0x98af019cdf16990130cba555861046b02e9898cc";

// TOPIC ID for Rarity and Coordinates
const TOPIC_RARITY = "0x2b027c92af51f684f8f32d81528135b3fc9de472e7ee1e7c1ef2069342061cae";
const TOPIC_COORDINATES = "0x8ab30b0cba3d3325d957c283bcd2f5ac70efe38245303058259d4c9dbb7d4321";

// Index for Event that will reliably provide buyer (for Voucher Redeem)
const BUYER_INDEX = "0x0a08";

// Index for Event that will provide purchase details 
const PURCHASE_INDEX_ID = "0x6802";

let ws = MOONRIVER_WS;

const provider = new WsProvider(`wss://${ws}`) // Use for production
const api = await new ApiPromise({ provider }).isReady;

function skybreach_bot() {
    let latest_block = 0;

    api.rpc.chain.subscribeNewHeads(async (header) => {

        // For testing specific blocks or constants
        // let BLOCK = BLOCK_HASH_VOUCHER_MULTIPLE_LANDS;
        // let BLOCK = "0xe4c77236666951b8d70bb54b7ab44a550c2dd21bb7dc1ea25880255810ff73e8";

        // Initializing our variables
        let voucher_purchase = false;
        let is_purchase_with_rmrk = false;
        let purchase_price;
        let purchaser;
        let seller;
        let coordinates;

        // Sometimes we get fed the same block twice, let's not eat it.
        if (header.number - 1 <= latest_block) {
            return
        }

        let block_number = header.number - 1;
        // Convenience link for Moonriver transaction details
        let moon_url = `https://moonriver.moonscan.io/block/${block_number}`;
        console.log(`block: ${block_number} (${header.parentHash})`);

        // let BLOCK = BLOCK_HASH_VOUCHER_MULTIPLE_LANDS;
        // let BLOCK = "0xe4c77236666951b8d70bb54b7ab44a550c2dd21bb7dc1ea25880255810ff73e8";
        let BLOCK = header.parentHash;

        // Subscribing to blocks from the chain (toggle commented line to test)
        // const getBlock = api.rpc.chain.getBlock(header.parentHash).then(async (block) => {
        const getBlock = api.rpc.chain.getBlock(BLOCK).then(async (block) => {

            // Get the events for the block
            let apiAt = await api.at(BLOCK);
            let blockEvents = await apiAt.query.system.events();

            // Loop through extrinsics
            block.block.extrinsics.forEach((i, extrinsic_index) => {

                // We only care about "Ethereum" extrinsics
                if (i.method.section != "ethereum") {
                    return;
                }

                let eip_call = i.args[0].toHuman()["eip1559"];
                if (!eip_call) {
                    eip_call = i.args[0].toHuman()["EIP1559"];
                }
                // We only care about EIP1559 (not Legacy) Ethereum extrinsics
                if (!eip_call) {
                    return;
                };

                // We only care about interactions targeting the RMRK contract
                let contract = eip_call.action?.Call;
                if (contract != RMRK_CONTRACT) {
                    return;
                }

                let data = eip_call.input;
                // We need to loop through the events to correlate buyer/seller and purchase price
                blockEvents.forEach((r) => {

                    // If the phase of the event isn't initialized, we don't care about it
                    if (r.phase.isInitialization) {
                        return;
                    }

                    // Events are related to extrinsic indexes.  We only care about events that are 
                    // correlated to our specific extrinsic
                    let extrinsic_id = r.phase.asApplyExtrinsic.words[0];
                    if (!extrinsic_index == extrinsic_id) {
                        return;
                    }

                    if (r.event.index == BUYER_INDEX) {
                        purchaser = r.event.data[0];
                    }

                    if (r.event.index.toString() == PURCHASE_INDEX_ID) {
                        console.log("found PURCHASE_INDEX_ID")
                        let price_long = r.event.data[3];
                        purchase_price = price_long / (10 ** 10);
                        purchaser = r.event.data[1];
                        seller = r.event.data[2];
                    }

                    let topics = r.event.data[0].topics;
                    if (topics) {
                        if (topics[0] == TOPIC_COORDINATES) {
                            console.log("Found TOPIC_COORDINATES");
                            voucher_purchase = true;
                            let data = r.event.data[0].data;
                            coordinates = parse_data.extract_coordinates_from_topic(data.toString());
                        }
                        if (topics[0] == TOPIC_RARITY) {
                            let data = r.event.data[0].data;
                            console.log(data.toString());
                        }
                    }
                })
                if (!coordinates) {
                    coordinates = parse_data.parse(data);
                }


                if (purchase_price && purchaser && coordinates && seller) {
                    let statement = `SKYBREACH LAND PURCHASE!\nLocation: ${coordinates}\nPaid: ${purchase_price}RMRK\nPurchaser: ${purchaser}\nSeller: ${seller}`;
                    statement = statement.replace("0x7e8421b873429eE58A06055E89CD0DBeF51784F0", "Original Land Sale");
                    console.log(statement);
                    webex.post(statement);
                    webex.post(moon_url);
                    twitter.skybreach_listing(statement);
                } else if (voucher_purchase) {
                    let statement = `SKYBREACH LAND VOUCHER REDEEMED!\nLocation: ${coordinates}\nRedeemer: ${purchaser}`;
                    console.log(statement);
                    webex.post(statement);
                    webex.post(moon_url);
                    twitter.skybreach_listing(statement);
                }
            });
        });
    });
}

skybreach_bot()