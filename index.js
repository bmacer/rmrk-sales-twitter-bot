import { ApiPromise, WsProvider } from "@polkadot/api";

import fs from "fs";
import twit from "./twitter.cjs";
import telegram from "./telegram.cjs";
import webex from "./webex.js";
import winston from "winston";

const EVRLOOT_TAROT_COLLECTION_ID = "90c6619c6b94fcfd34-EVRLOOT_TAROT_CARDS";
const EVRLOOT_ITEMS_COLLECTION_ID = "54bbd380dc3baaa27b-EVRLOOT";
const EVRSOULS_COLLECTION_ID = "54bbd380dc3baaa27b-EVRSOULS";
const EVRLOOT_RESOURCES_COLLECTION_ID = "90c6619c6b94fcfd34-EVRLOOT_RESOURCES";
const EVRLOOT_FISHING = "90c6619c6b94fcfd34-EVRLOOT_FISHING";

const EVRLOOT_COLLECTIONS = [
  EVRLOOT_TAROT_COLLECTION_ID,
  EVRLOOT_ITEMS_COLLECTION_ID,
  EVRSOULS_COLLECTION_ID,
  EVRLOOT_RESOURCES_COLLECTION_ID,
  EVRLOOT_FISHING,
];

const EVRLOOT_COLLECTIONS_DIFFERENT_COMMISSION = [
  EVRLOOT_ITEMS_COLLECTION_ID,
  EVRSOULS_COLLECTION_ID,
  EVRLOOT_RESOURCES_COLLECTION_ID,
  EVRLOOT_FISHING,
];

const nft_in_any_of = (nft, collection_list) => {
  for (let collection of collection_list) {
    if (nft.includes(collection)) {
      return true;
    }
  }
  return false;
};

const ws_urls = [
  "wss://kusama-rpc.polkadot.io",
  // "wss://node.rmrk.app",
  // "wss://public-rpc.pinknode.io",
  // "wss://kusama-rpc.dwellir.com",
];

export function get_collection_url_from_raw_mint_data(data) {
  console.log(data);
  let decoded_mint_data = decodeURIComponent(data);
  console.log(decoded_mint_data);
  let json = JSON.parse(decoded_mint_data);
  let url = `https://singular.rmrk.app/collections/${encodeURIComponent(
    json.collection
  )}`;
  return url;
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  defaultMeta: { service: "user-service" },
  transports: [
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//

// if (process.env.NODE_ENV !== 'production') {
//     logger.add(new winston.transports.Console({
//         format: winston.format.simple(),
//     }));
// }

logger.info("testing success log");

console.log("Beginning run on index.js...");

// const provider = new WsProvider('wss://node.rmrk.app') // Use for production
let ws_url = ws_urls[Math.floor(Math.random() * ws_urls.length)];
let provider;
try {
  provider = new WsProvider(ws_url); // Use for production
} catch {
  process.exit(0);
}

//kusama-rpc.polkadot.io
console.log(`Connected to WS Provider: ${ws_url}`);
const api = await new ApiPromise({ provider }).isReady;
console.log("API object initialized...");
let prod = true;

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

function handle_list(signer, interaction_as_list) {
  console.log("LIST!");
  console.log(signer);
  console.log(interaction_as_list);
  let [_x, _y, version, nft, price] = interaction_as_list;
  if (price == 0) {
    console.log("Delisting");
    return;
  }
  let url = "";
  price = parseFloat(price) / 1_000_000_000_000;
  console.log(price);

  if (version == "2.0.0") {
    url = `https://singular.app/collectibles/${nft}`;
    if (nft.includes("e0b9bdcc456a36497a")) {
      url = "https://kanaria.rmrk.app/catalogue/${nft}";
      isKanariaOrItem = true;
    }

    if (nft_in_any_of(nft, EVRLOOT_COLLECTIONS)) {
      if (nft_in_any_of(nft, EVRLOOT_COLLECTIONS_DIFFERENT_COMMISSION)) {
        price = price / 0.915;
      } else {
        price = price / 0.865;
      }
      let name = nft.split("-")[3];
      let link = `https://singular.app/collectibles/${nft}`;
      let statement = `Evrloot Listing Alert! ${name} was listed for ${price.toFixed(
        3
      )}KSM by ${signer} ${link}`;
      twit.evrloot(statement);
      webex(statement);
    }
  }
}

function handle_buy(signer, nft, purchase_price, version) {
  console.log("BUY!");
  console.log(signer, nft, purchase_price, version);
  if (version == "2.0.0") {
    // let url = `https://kanaria.rmrk.app/catalogue/${nft}`;
    let prestatement = "";
    let level = "";
    let bird = false;

    if (nft_in_any_of(nft, EVRLOOT_COLLECTIONS)) {
      purchase_price = purchase_price / 0.865;
      let name = nft.split("-")[3];
      let link = `https://singular.app/collectibles/${nft}`;
      let statement = `Evrloot Sale Alert! ${name} was purchased for ${purchase_price.toFixed(
        2
      )}KSM by ${signer} ${link}`;
      webex(statement);
      twit.evrloot(statement);
    }
  }
}

async function twitter_rmrk_bot() {
  try {
    console.log("Running twitter_rmrk_bot");
    webex("Evrloot bot has begun");
    let latest_block = 0;
    api.rpc.chain.subscribeNewHeads(async (header) => {
      // Sometimes we get fed the same block twice, let's not eat it.
      if (header.number - 1 <= latest_block) {
        return;
      }
      latest_block = header.number - 1;
      fs.writeFile("latest_block.txt", Date().toString(), () => {});
      console.log(`block: ${header.number - 1} (${header.parentHash})`);
      const getBlock = api.rpc.chain
        .getBlock(header.parentHash)
        .then(async (block) => {
          block.block.extrinsics.forEach(async (i) => {
            let signer = "";
            if (i.signer) {
              signer = i.signer.toString();
              let twitter_handle = await get_id(signer);
              if (twitter_handle) {
                signer = twitter_handle;
              }
            }
            if (i.method.section == "system") {
              let a = i.args[0].toHuman();
              if (a.includes("36bad3dc147db9792b")) {
                telegram.arch(a);
              }
              console.log("system");
              let interaction_as_list = i.args[0].toHuman().split("::");
              if (interaction_as_list.length >= 3) {
                console.log(i.args[0].toHuman());
                let interaction = interaction_as_list[1];
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
                  purchase_price += parseInt(el.args[1]);
                }
                // If the element is "remark", we extract nft and version variables
                if (el.method == "remark") {
                  let interaction_as_list = el.args[0].toHuman().split("::");
                  // Make sure we're dealing with a "BUY" with enough args
                  if (
                    interaction_as_list.length >= 4 &&
                    interaction_as_list[1] == "BUY"
                  ) {
                    nft = interaction_as_list[3];
                    version = interaction_as_list[2];
                  }
                }
              });
              // Only if our assignments were successful should we sent to our publishing api
              if (nft != "" && purchase_price != 0 && purchaser != "") {
                let price = parseFloat(purchase_price) / 1_000_000_000_000;
                handle_buy(signer, nft, price, version);
              }
            }
          });
        });
    });
  } catch (e) {
    console.log(e);
    logger.error(
      `\n${Date().toString()}\nName: ${e.name}\nMessage: ${
        e.message
      }\nStack: \n${e.stack}\n`
    );
    process.exit(0);
  }
}

twitter_rmrk_bot();
