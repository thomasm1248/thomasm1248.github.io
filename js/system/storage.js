'use strict';
t.module(() => {

  const storeExample = {
    data: {},
    version: 1, // number of migrations applied
  };

  function asStorageKey(storeName) {
    return 'js/system/storage ' + storeName;
  }

  function get(storeName) {
    const existingDataAsText = localStorage.getItem(asStorageKey(storeName));
    if(existingDataAsText)
      return JSON.parse(existingDataAsText);
    return null;
  }

  function storeIsOutdated(store, migrations) {
    return store.version < migrations.length;
  }

  function applyMigrations(store, migrations) {
    for(let i = store.version; i < migrations.length; i++) {
      // Apply migration
      store.data = migrations[i](store.data);
    }
  }

  function put(storeName, store) {
    localStorage.setItem(asStorageKey(storeName), JSON.stringify(store));
  }

  // Public functions

  function open({ name, seed, migrations, onsave, onload }) {
    if(!name)
      name = 'default';
    if(!seed)
      seed = {};
    if(!migrations)
      migrations = [];

    let data = seed;

    const existingStore = get(name);
    if(existingStore) {
      if(storeIsOutdated(existingStore, migrations))
        applyMigrations(existingStore, migrations);
      data = existingStore.data;
    }

    if(onload) data = onload(data);

    function save() {
      const dataToSave = onsave
        ? onsave(handle.data)
        : handle.data;

      put(name, {
        data: dataToSave,
        version: migrations.length,
      });
    }

    const handle = {
      data,
      save,
    };

    return handle;
  }

  return {
    open,
  };
});
