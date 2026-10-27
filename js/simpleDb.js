'use strict';
t.module(() => {

  const DATABASE = "log-store";
  const VERSION = 1;
  const STORE = "logs";

  function string(value, name) {
    if (typeof value !== "string") {
      throw new TypeError(`${name} must be a string.`);
    }
    return value;
  }

  function time(value, name) {
    const number = value instanceof Date ? value.getTime() : value;

    if (typeof number !== "number" || !Number.isFinite(number)) {
      throw new TypeError(`${name} must be a finite number or valid Date.`);
    }

    return number;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, VERSION);

      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE, {
          keyPath: "id"
        });

        store.createIndex("timestamp", "timestamp");
        store.createIndex("type_timestamp", ["type", "timestamp"]);
        store.createIndex("type_group_timestamp", [
          "type", "group", "timestamp"
        ]);
      };

      request.onerror = () => reject(request.error);

      request.onblocked = () => {
        console.warn(
          "LogStore: database upgrade is blocked. Close other tabs using it."
        );
      };

      request.onsuccess = () => {
        const db = request.result;

        db.onversionchange = () => db.close();

        resolve(db);
      };
    });
  }

  function createAPI(db) {
    // Resolve only after the whole transaction completes.
    function transact(mode, work) {
      return new Promise((resolve, reject) => {
        let tx;
        let result;
        let failure;

        function fail(error) {
          failure = error;
          try {
            tx.abort();
          } catch {
            reject(error);
          }
        }

        function watch(request, handler) {
          request.onsuccess = () => {
            try {
              handler(request.result);
            } catch (error) {
              fail(error);
            }
          };
        }

        try {
          tx = db.transaction(STORE, mode);

          tx.oncomplete = () => resolve(result);
          tx.onabort = () => reject(
            failure ||
            tx.error ||
            new DOMException("Transaction aborted.", "AbortError")
          );

          work(
            tx.objectStore(STORE),
            value => { result = value; },
            watch
          );
        } catch (error) {
          if (tx) {
            fail(error);
          } else {
            reject(error);
          }
        }
      });
    }

    function selection(store, type, group, start, end) {
      let name;
      let prefix;

      if (type === undefined) {
        name = "timestamp";
        prefix = null;
      } else if (group === undefined) {
        name = "type_timestamp";
        prefix = [type];
      } else {
        name = "type_group_timestamp";
        prefix = [type, group];
      }

      const lower = start ?? -Infinity;
      const upper = end ?? Infinity;

      return {
        index: store.index(name),
        range: IDBKeyRange.bound(
          prefix ? [...prefix, lower] : lower,
          prefix ? [...prefix, upper] : upper,
          false,
          true
        )
      };
    }

    return Object.freeze({
      async append({ type, group = "", value }) {
        string(type, "type");
        string(group, "group");
        string(value, "value");

        const entry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type,
          group,
          value
        };

        return transact("readwrite", (store, set) => {
          store.add(entry);
          set(entry);
        });
      },

      async get(id) {
        string(id, "id");

        return transact("readonly", (store, set, watch) => {
          watch(store.get(id), set);
        });
      },

      async list() {
        return transact("readonly", (store, set, watch) => {
          const types = [];
          set(types);

          const request = store
            .index("type_timestamp")
            .openKeyCursor();

          watch(request, cursor => {
            if (!cursor) return;

            const type = cursor.key[0];
            types.push(type);

            // All stored timestamps are finite. Jump past this type.
            cursor.continue([type, Infinity]);
          });
        });
      },

      async query({ type, group, start, end } = {}) {
        if (type !== undefined) string(type, "type");

        if (group !== undefined) {
          string(group, "group");

          if (type === undefined) {
            throw new TypeError("group requires type.");
          }
        }

        if (start !== undefined) start = time(start, "start");
        if (end !== undefined) end = time(end, "end");

        if (start !== undefined && end !== undefined) {
          if (start > end) {
            throw new RangeError("start must not be after end.");
          }
          if (start === end) return [];
        }

        return transact("readonly", (store, set, watch) => {
          const { index, range } = selection(
            store, type, group, start, end
          );

          watch(index.getAll(range), set);
        });
      },

      async delete(type, end) {
        string(type, "type");
        end = time(end, "end");

        return transact("readwrite", (store, set, watch) => {
          const { index, range } = selection(
            store, type, undefined, undefined, end
          );

          let count = 0;
          set(count);

          watch(index.openCursor(range), cursor => {
            if (!cursor) return;

            cursor.delete();
            set(++count);
            cursor.continue();
          });
        });
      }
    });
  }

  return {
    async open() {
      return createAPI(await openDatabase());
    }
  };
});
