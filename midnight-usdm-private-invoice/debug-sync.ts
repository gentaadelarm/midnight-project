import { resolveNetwork, getOrCreateWallet } from './src/network.ts';
import { createWallet } from './src/wallet.ts';

const { network, config } = resolveNetwork();
const record = getOrCreateWallet(network);

console.log('Network:', network);
console.log('Indexer:', config.indexer);
console.log('Indexer WS:', config.indexerWS);
console.log('Node:', config.node);
console.log('');

console.log('Creating wallet...');

const ctx = await createWallet({
  network,
  networkConfig: config,
  seed: record.seed,
});

console.log('Wallet created.');
console.log('Restored:', ctx.restored);
console.log('');

console.log('Waiting for state...');

const subscription = ctx.wallet.state().subscribe((state: any) => {
  console.log(
    new Date().toISOString(),
    'synced =',
    state.isSynced,
  );
});

await ctx.wallet.waitForSyncedState();

console.log('SYNC COMPLETE');

subscription.unsubscribe();
await ctx.wallet.stop();

