import ActivePairLevelStore from '../src/ActivePairLevelStore';

(async () => {
  const store = new ActivePairLevelStore(ActivePairLevelStore.path);
  console.log('Removing active pair cache...');
  await store.delAll();
  console.log('Done');
})();