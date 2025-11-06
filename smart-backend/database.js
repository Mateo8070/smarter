import Database from 'better-sqlite3';

const db = new Database('smart-stock.db', { verbose: console.log });

function initialize() {
    console.log('Initializing database...');

    const tables = [
        `CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT,
            is_deleted INTEGER DEFAULT 0,
            updated_at TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS hardware (
            id TEXT PRIMARY KEY,
            description TEXT,
            category_id TEXT,
            quantity TEXT,
            wholesale_price REAL,
            retail_price REAL,
            wholesale_price_unit TEXT,
            retail_price_unit TEXT,
            updated_at TEXT,
            is_deleted INTEGER DEFAULT 0,
            updated_by TEXT,
            location TEXT,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        );`,
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT,
            created_at TEXT,
            updated_at TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT,
            body TEXT,
            created_at TEXT,
            updated_at TEXT,
            is_deleted INTEGER DEFAULT 0
        );`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            item_id TEXT,
            username TEXT,
            change_description TEXT,
            created_at TEXT,
            is_synced INTEGER DEFAULT 0
        );`
    ];

    db.transaction(() => {
        for (const table of tables) {
            db.prepare(table).run();
        }
    })();

    console.log('Database initialized.');
}

initialize();

export default db;