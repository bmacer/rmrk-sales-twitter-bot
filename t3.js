import { ApiPromise, WsProvider } from '@polkadot/api';

import { gett, getBlock, getListings, getListingsByCollectionId } from './sql_functions.cjs';



let x = await getBlock();
let l = await getListings();

console.log("x: ", x.number);

let cols = []

l.forEach(async function (listing) {
    console.log(listing);
    cols.push(listing.collection);
});

const unique = [...new Set(cols)]

let counts = {}

unique.forEach(async function (col) {
    let c = await getListingsByCollectionId(col);
    console.log(c.length);
    counts[col] = c.length;
    console.log(counts);
});
