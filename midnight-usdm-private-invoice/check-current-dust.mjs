import { resolveNetwork, getOrCreateWallet } from './src/network.js';
import { createWallet, unshieldedToken } from './src/wallet.js';
import * as Rx from 'rxjs';

const { network, config: networkConfig } = resolveNetwork();
const WALLET = getOrCreateWallet(network);

console.log('Network:', network);

const walletCtx = await createWallet({
  network,
  networkConfig,
  seed: WALLET.seed,
});

console.log('Syncing...');
const state = await walletCtx.wallet.waitForSyncedState();

const tNight =
  state.unshielded.balances[unshieldedToken().raw] ?? 0n;

const dust =
  state.dust.balance(new Date());

console.log('');
console.log('=== CURRENT BALANCES ===');
console.log('tNIGHT:', tNight.toString());
console.log('DUST:  ', dust.toString());

console.log('');
console.log('=== DUST STATE ===');
console.log('dust object:', state.dust);

await walletCtx.wallet.stop();
