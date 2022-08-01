
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
require('dotenv').config()

const isProd = process.env.IS_PROD == "true";
console.log(`Running in production? --> ${isProd}`);

const parse_data = require("./parse_skybreach_data.cjs");
const webex = require("./webex.cjs");
const twitter = require("./twitter.cjs");

// Web Sockets
// const WS_URL = "wss://wss.api.moonriver.moonbeam.network";
const WS_URL = "wss://moonriver-rpc.dwellir.com"
// const WS_URL = "wss://public-rpc.pinknode.io"

// RMRK ETH contract
// https://moonriver.moonscan.io/address/0x98af019cdf16990130cba555861046b02e9898cc
// const OLD_RMRK_CONTRACT = "0x98af019cdf16990130cba555861046b02e9898cc";
const RMRK_CONTRACT = "0x913a3e067a559ba24a7a06a6cdea4837eeeaf72d";

// TOPIC ID for Rarity and Coordinates
const TOPIC_RARITY = "0x2b027c92af51f684f8f32d81528135b3fc9de472e7ee1e7c1ef2069342061cae";
const TOPIC_COORDINATES = "0x8ab30b0cba3d3325d957c283bcd2f5ac70efe38245303058259d4c9dbb7d4321";

// Prefix for LISTING function
const LISTING_FUNCTION_PREFIX = "50fd7367";

// Prefix for RE-LISTING function
const RELISTING_FUNCTION_PREFIX = "b3de019c";

// Index for Event that will reliably provide buyer (for Voucher Redeem)
const BUYER_INDEX = "0x0a08";

// Index for Event that will provide purchase details 
const PURCHASE_INDEX_ID = "0x6802";

// Index for Event that will provide LISTING details
const BALANCE_WITHDRAW_EVENT_FOR_SELLER = "0x0a08";

// Index for Event that will provide OFFER details
const OFFER_INDEX_ID = "";

// Index for Event that will provide TRANSFER details
const TRANSFER_INDEX_ID = "";

// Index for Event that will provide CHANGE PRICE details
const CHANGE_PRICE_INDEX_ID = "";

// let ws = WS_URL;

const provider = new WsProvider(WS_URL) // Use for production
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
        let is_a_listing = false;
        let purchase_price;
        let selling_price;
        let purchaser;
        let seller;
        let coordinates;
        let BLOCK;

        // Sometimes we get fed the same block twice, let's not eat it.
        if (header.number - 1 <= latest_block) {
            return
        }

        let block_number = header.number - 1;
        // Convenience link for Moonriver transaction details
        let moon_url = `https://moonriver.moonscan.io/block/${block_number}`;
        console.log(`block: ${block_number} (${header.parentHash})`);

        if (isProd) {
            console.log("Is PROD");
            BLOCK = header.parentHash;
        } else {
            console.log("Is NOT PROD");

            // BLOCK = BLOCK_HASH_VOUCHER_MULTIPLE_LANDS;
            // BLOCK = "0x57350f266a0c2bd9298c2d9a5d1564c680dfb20065416c730733454586369852"

            // New PURCHASE block (2,190,051)
            // BLOCK = "0xd92b53d3c0275b30efa38b56262426ea87a0924518790505cf597d017a65b3c7";

            // New LISTING block
            // BLOCK = "0x28a6eb69f1dd2881bc7f8ce6bb027b1232912d88cbb8e868e6a2f8d458d39618";
            BLOCK = "0x4ee4f5898d7d66e38c7fd791adc4d987dac71524466321f77cf64f310a8d19b8";


        }

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
                } else {
                    console.log("RMRK!");
                }

                // console.log(eip_call);

                let data = eip_call.input;

                if (data.includes(LISTING_FUNCTION_PREFIX) || data.includes(RELISTING_FUNCTION_PREFIX)) {
                    console.log("it's a listing");
                    is_a_listing = true;
                    // Is a listing!
                    // 0x50fd7367
                    // 0000000000000000000000000000000000000000000000000000000000007256 <- plot
                    // 000000000000000000000000000000000000000000000000000000e8d4a51000 <- price
                    let plot = data.slice(10, 74);
                    while (plot.charAt(0) == "0") {
                        plot = plot.substring(1);
                    }
                    let price = data.slice(75);
                    while (price.charAt(0) == "0") {
                        price = price.substring(1);
                    }
                    console.log("price:: ", price);
                    price = parseInt(price, 16);
                    console.log("price: ", price);
                    price = price * 10 ** -10;
                    plot = parse_data.convert_hex_to_x_y_coordinates(plot);
                    selling_price = price;
                    coordinates = `(${plot})`
                }

                // We need to loop through the events to correlate buyer/seller and purchase price
                blockEvents.forEach((r) => {

                    // If the phase of the event isn't initialized, we don't care about it
                    if (r.phase.isInitialization) {
                        return;
                    }

                    // Events are related to extrinsic indexes.  We only care about events that are 
                    // correlated to our specific extrinsic
                    let extrinsic_id = r.phase.asApplyExtrinsic.words[0];
                    if (extrinsic_index != extrinsic_id) {
                        // not relevant event
                        return;
                    }

                    if (r.event.index == BALANCE_WITHDRAW_EVENT_FOR_SELLER) {
                        seller = r.event.data[0];
                        console.log(seller.toString());
                    }


                    if (r.event.index == BUYER_INDEX) {
                        purchaser = r.event.data[0];
                    }

                    if (r.event.index.toString() == PURCHASE_INDEX_ID) {
                        console.log("found PURCHASE_INDEX_ID")
                        let price_long = r.event.data[3].toString();
                        if (purchase_price) {
                            purchase_price += price_long / (10 ** 10);
                        } else {
                            purchase_price = price_long / (10 ** 10);
                        }
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
                    if (isProd) {
                        twitter.skybreach_listing(statement);
                    }
                } else if (voucher_purchase) {
                    let statement = `SKYBREACH LAND VOUCHER REDEEMED!\nLocation: ${coordinates}\nRedeemer: ${purchaser}`;
                    console.log(statement);
                    webex.post(statement);
                    if (isProd) {
                        twitter.skybreach_listing(statement);
                    }
                } else if (is_a_listing) {
                    let statement = `SKYBREACH LAND LISTED!\nLocation: ${coordinates}\nSeller: ${seller}\nPrice: ${selling_price} RMRK`;
                    console.log(statement);
                    webex.post(statement);
                }
            });

            if (!isProd) {
                process.exit(0);
            }
        });
    });
}

skybreach_bot()