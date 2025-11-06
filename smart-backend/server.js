// server.js (pure JavaScript – drop-in replacement, no TypeScript)
import express from 'express';
import './database.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3002;
import db from './database.js';

/* -------------------------------------------------
   /api/sync – unchanged
   ------------------------------------------------- */
app.post('/api/sync', (req, res) => {
  const { categories, hardware, notes, audit_logs } = req.body;

  try {
    db.transaction(() => {
      if (categories) {
        const stmt = db.prepare(
          'INSERT OR REPLACE INTO categories (id, name, color, is_deleted, updated_at) VALUES (?, ?, ?, ?, ?)'
        );
        for (const c of categories) stmt.run(c.id, c.name, c.color, c.is_deleted ? 1 : 0, c.updated_at);
      }
      if (hardware) {
        const stmt = db.prepare(
          'INSERT OR REPLACE INTO hardware (id, description, category_id, quantity, wholesale_price, retail_price, wholesale_price_unit, retail_price_unit, updated_at, is_deleted, updated_by, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const h of hardware)
          stmt.run(
            h.id,
            h.description,
            h.category_id,
            h.quantity,
            h.wholesale_price,
            h.retail_price,
            h.wholesale_price_unit,
            h.retail_price_unit,
            h.updated_at,
            h.is_deleted ? 1 : 0,
            h.updated_by,
            h.location
          );
      }
      if (notes) {
        const stmt = db.prepare(
          'INSERT OR REPLACE INTO notes (id, title, body, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const n of notes) stmt.run(n.id, n.title, n.body, n.created_at, n.updated_at, n.is_deleted ? 1 : 0);
      }
      if (audit_logs) {
        const stmt = db.prepare(
          'INSERT OR REPLACE INTO audit_logs (id, item_id, username, change_description, created_at, is_synced) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const l of audit_logs) stmt.run(l.id, l.item_id, l.username, l.change_description, l.created_at, l.is_synced ? 1 : 0);
      }
    })();
    res.status(200).json({ message: 'Sync successful' });
  } catch (error) {
    console.error('Sync failed:', error);
    res.status(500).json({ message: 'Sync failed', error: error.message });
  }
});

/* -------------------------------------------------
   /api/chat – GET (ping)
   ------------------------------------------------- */
app.get('/api/chat', (req, res) => {
  res.json({ status: 200, message: 'You have hit the Chat server!' });
});

/* -------------------------------------------------
   /api/chat – POST (AI + SQL)
   ------------------------------------------------- */
app.post('/api/chat', async (req, res) => {
  const { history } = req.body;
  const debug = req.query.debug === 'true';

  if (!history || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty history provided.' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        text: '<div class="assistant-bubble assistant-error">GEMINI_API_KEY missing.</div>',
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = model.startChat({ history });

    const userPrompt = history[history.length - 1].parts[0].text;

    // ---------- Schema prompt ----------
    const tableSchemas = {
      categories: `CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT, is_deleted INTEGER DEFAULT 0, updated_at TEXT);`,
      hardware: `CREATE TABLE hardware (id TEXT PRIMARY KEY, description TEXT, category_id TEXT, quantity TEXT, wholesale_price REAL, retail_price REAL, wholesale_price_unit TEXT, retail_price_unit TEXT, updated_at TEXT, is_deleted INTEGER DEFAULT 0, updated_by TEXT, location TEXT, FOREIGN KEY (category_id) REFERENCES categories (id));`,
      notes: `CREATE TABLE notes (id TEXT PRIMARY KEY, title TEXT, body TEXT, created_at TEXT, updated_at TEXT, is_deleted INTEGER DEFAULT 0);`,
      audit_logs: `CREATE TABLE audit_logs (id TEXT PRIMARY KEY, item_id TEXT, username TEXT, change_description TEXT, created_at TEXT, is_synced INTEGER DEFAULT 0);`,
    };

    const promptWithSchema = `You are an AI assistant that can answer questions about hardware, categories, notes, and audit logs.
Here are the database schemas:
${Object.entries(tableSchemas)
  .map(([n, s]) => `Table: ${n}\nSchema: ${s}`)
  .join('\n\n')}

If the question needs data, return **only** a SQLite SELECT query (no markdown, no extra text).
If the question is conversational, return a natural-language answer.
User's question: ${userPrompt}`;

    const aiRes = await chat.sendMessage(promptWithSchema);
    const aiText = aiRes.response.text();

    // ---------- Extract SQL ----------
    let sql = '';
    const mdMatch = aiText.match(/```(?:sql|sqlite)?\n([\s\S]*?)\n```/);
    if (mdMatch?.[1]) sql = mdMatch[1].trim();
    else if (
      !sql &&
      /^(SELECT|INSERT|UPDATE|DELETE)\b/i.test(aiText.trim())
    ) {
      sql = aiText.trim();
    }

    // ---------- Helper: format price ----------
    const fmtPrice = (price, unit) => {
      if (price == null) return 'N/A';
      const p = Number(price);
      const formatted = `MK ${p.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      return unit ? `${formatted} / ${unit}` : formatted;
    };

    // ---------- Execute SQL ----------
    if (sql) {
      try {
        const rows = db.prepare(sql).all();

        // ----- Aggregate detection -----
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]);
          const aggKey = keys.find(k =>
            /^(COUNT|SUM|AVG|MAX|MIN)\(/i.test(k)
          );
          if (aggKey) {
            const val = rows[0][aggKey];
            let txt = `Result: ${val}`;
            if (/COUNT/i.test(aggKey)) txt = `You have ${val} item${val === 1 ? '' : 's'}.`;
            else if (/SUM.*quantity/i.test(aggKey)) txt = `Total quantity: ${val}.`;
            return res.json({ success: true, type: 'natural_language', text: txt });
          }
        }

        // ----- No rows -----
        if (rows.length === 0) {
          return res.json({
            success: true,
            type: 'query_result',
            message: 'No results found.',
            data: [],
          });
        }

        // ----- Clean rows (remove internal fields) -----
        const hide = ['id', 'is_deleted', 'updated_at', 'created_at', 'updated_by'];
        const cleaned = rows.map(r => {
          const c = { ...r };
          hide.forEach(k => delete c[k]);
          // format price fields for nicer cards / tables
          if (c.retail_price != null) c.retail_price = fmtPrice(c.retail_price, c.retail_price_unit);
          if (c.wholesale_price != null) c.wholesale_price = fmtPrice(c.wholesale_price, c.wholesale_price_unit);
          return c;
        });

        // ----- Decide rendering style -----
        const response = {
          success: true,
          type: 'query_result',
          message: rows.length > 3 ? 'Here are the results:' : undefined,
          data: cleaned,
        };

        // Optional: let frontend know when to use cards vs table
        response.renderHint = rows.length <= 3 ? 'cards' : 'table';

        if (debug) response.debugInfo = { aiResponseText: aiText, sqlQuery: sql };
        return res.json(response);
      } catch (sqlErr) {
        console.error('SQL error:', sqlErr);
        const errResp = {
          success: false,
          type: 'error',
          message: `SQL execution failed: ${sqlErr.message}`,
        };
        if (debug) errResp.debugInfo = { aiResponseText: aiText, sqlQuery: sql, sqlError: sqlErr.message };
        return res.status(500).json(errResp);
      }
    }

    // ---------- No SQL → natural language ----------
    const nlResp = { success: true, type: 'natural_language', text: aiText };
    if (debug) nlResp.debugInfo = { aiResponseText: aiText };
    return res.json(nlResp);
  } catch (err) {
    console.error('AI Chat error:', err);
    const msg = err?.message ?? String(err);
    res.status(500).json({
      success: false,
      text: `<div class="assistant-bubble assistant-error">AI error: ${msg}</div>`,
    });
  }
});

/* -------------------------------------------------
   Start server
   ------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
