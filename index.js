import { ApiPromise, WsProvider } from '@polkadot/api';

// const provider = new WsProvider('wss://node.rmrk.app') // Use for production
const provider = new WsProvider('wss://kusama-rpc.polkadot.io')
const api = await new ApiPromise({ provider }).isReady;

async function eyris() {
    api.rpc.chain.subscribeNewHeads(async (header) => {
        console.log(`block: ${header.number - 1}`);
    });
}

eyris()
