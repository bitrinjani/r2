import ActivePairLevelStore from '../src/ActivePairLevelStore';
import { getChronoDB } from '../src/chrono';

(async () => {
  const store = new ActivePairLevelStore(getChronoDB());
  console.log('Removing active pair cache...');
  await store.delAll();
  console.log('Done');
})();