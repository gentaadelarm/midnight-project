import { resolveNetwork, getOrCreateWallet } from './network';
import { createWallet } from './wallet';

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

const dustState: any = state.dust;

console.log('\n=== DUST BALANCE ===');
console.log('balance(now):', state.dust.balance(new Date()).toString());

console.log('\n=== DUST CAPABILITIES ===');

try {
  const coins = dustState.capabilities.coinsAndBalances.getAvailableCoins();
  console.log('available coins:', coins);
} catch (e) {
  console.log('getAvailableCoins error:', e);
}

try {
  const coins = dustState.capabilities.coinsAndBalances.getTotalCoins();
  console.log('total coins:', coins);
} catch (e) {
  console.log('getTotalCoins error:', e);
}

try {
  const generated =
    dustState.capabilities.coinsAndBalances.getAvailableCoinsWithGeneratedDust();
  console.log('available + generated:', generated);
} catch (e) {
  console.log('getAvailableCoinsWithGeneratedDust error:', e);
}

try {
  const generation =
    dustState.capabilities.coinsAndBalances.getGenerationInfo();
  console.log('generation info:', generation);
} catch (e) {
  console.log('getGenerationInfo error:', e);
}

await walletCtx.wallet.stop();
