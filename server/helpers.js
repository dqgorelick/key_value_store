const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database(process.env.NODE_ENV !== 'test' ? './working.db' : './test.db');

const helpers = {
  addItem: (key, value, cb) => {
    // address concurrent GET / SET for same keys by using one 'UPSERT' query
    db.run('INSERT OR REPLACE INTO keys (item_key, item_value) VALUES (?, ?)', key, value, (err) => {
      cb(err);
    });
  },
  getItem: (key, cb) => {
    db.all('SELECT item_value FROM keys WHERE item_key=?', key, (err, result) => {
      cb(err, result);
    });
  },
  createTable: (cb) => {
    db.run("CREATE TABLE if NOT EXISTS keys (item_key TEXT PRIMARY KEY, item_value TEXT)", (err) => {
      cb(err);
    });
  },
  dropTable: (cb) => {
    db.run("DROP TABLE keys", (err) => {
      cb(err);
    });
  },
  clearDatabase: (cb) => {
    db.run('DELETE FROM keys', (err) => {
      cb(err);
    });
  }
};

module.exports = helpers;
