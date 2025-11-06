
// import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
// import path from 'path';
// import fs from 'fs';
// import crypto from 'crypto';
// import xlsx from 'xlsx';
// import dotenv from 'dotenv';
// import { GoogleGenAI } from '@google/genai';
// import { helpContent } from './help2.js';
// import { fileURLToPath } from 'url';

// // --- File Paths and Initialization ---
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Loading environment variables: Ensuring configuration is set up!
// const envPath = app.isPackaged
//   ? path.join(process.resourcesPath, '.env')
//   : path.join(__dirname, '.env');

// if (fs.existsSync(envPath)) {
//   dotenv.config({ path: envPath });
//   console.log(`[main.js] Loaded environment variables from ${envPath}`);
// } else {
//   console.warn(`[main.js] .env file not found at path: ${envPath}. AI features may not work.`);
// }

// let db; // Will be initialized after app is ready
// let mainWindow; // This will hold our main browser window

// const credsPath = path.join(app.getPath('userData'), 'credentials.json');

// /**
//  * Reads user credentials from the credentials file.
//  * @returns {object|null} The parsed credentials object or null if not found/readable.
//  */
// function getCredentials() {
//   try {
//     if (fs.existsSync(credsPath)) {
//       const credsData = fs.readFileSync(credsPath, 'utf8');
//       return JSON.parse(credsData);
//     }
//   } catch (error) {
//     console.error('Error reading credentials:', error);
//   }
//   return null; // No credentials found
// }

// // --- Window Creation ---
// /**
//  * Creates the main application window.
//  */
// function createWindow() {
//     mainWindow = new BrowserWindow({
//         width: 1500,
//         height: 800,
//         minWidth: 200, // Adjusted for better responsiveness on smaller screens
//         frame: false, // Custom frame for better control
//         resizable: true,
//         icon: path.join(__dirname, 'assets', 'icon.png'), // Application icon
//         webPreferences: {
//             preload: path.join(__dirname, 'preload.js'), // Preload script for IPC
//             contextIsolation: true, // Enhances security
//             nodeIntegration: false, // Prevents Node.js integration in renderer
//             spellcheck: false, // Disable spell checking globally,
//         }
//     });

//     // Loading the main HTML file
//     mainWindow.loadFile('index.html');
//     mainWindow.maximize(); // Occupy the whole screen
//     // mainWindow.webContents.openDevTools(); // Uncommented for development debugging

//     // Handling window state changes (maximized/normal)
//     mainWindow.on('maximize', () => {
//         mainWindow.webContents.send('window-state', 'maximized');
//     });

//     mainWindow.on('unmaximize', () => {
//         mainWindow.webContents.send('window-state', 'normal');
//     });

//     // Send initial state on load
//     if (mainWindow.isMaximized()) {
//         mainWindow.webContents.send('window-state', 'maximized');
//     } else {
//         mainWindow.webContents.send('window-state', 'normal');
//     }
// }

// // --- App Lifecycle ---
// app.whenReady().then(async () => {
//     try {
//         // Using dynamic import to load database only when the app is ready
//         const databaseModule = await import('./database.js');
//         db = databaseModule.default;
//         console.log('[main.js] Database loaded successfully.');
//     } catch (error) {
//         console.error('[main.js] Failed to load database:', error);
//         // Displaying a critical error if the database fails to initialize
//         dialog.showErrorBox("Database Error", "Failed to initialize the database. The application might not work correctly. Please check logs for more details.");
//     }
//     createWindow(); // Create the window after database setup attempt

//     // Re-create the window if none are open (macOS specific)
//     app.on('activate', () => {
//         if (BrowserWindow.getAllWindows().length === 0) {
//             createWindow();
//         }
//     });
// });

// // Closing the app when all windows are closed
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') { // Don't quit on macOS if Dock icon is clicked
//         app.quit();
//     }
// });

// // --- IPC Handlers ---

// /**
//  * IPC Handler: Checks if the credentials file exists.
//  * @returns {boolean} True if the credentials file exists, false otherwise.
//  */
// ipcMain.handle('check-credentials-exist', () => {
//     return fs.existsSync(credsPath);
// });

// /**
//  * IPC Handler: Sets up initial user credentials and admin code.
//  * @param {string} username - The username for login.
//  * @param {string} password - The user's password.
//  * @returns {{success: boolean, message?: string}} Result of the operation.
//  */
// ipcMain.handle('setup-credentials', (event, username, password) => {
//     try {
//         // Securely generating salt for password hashing
//         const salt = crypto.randomBytes(16).toString('hex');
//         // Hashing the password using PBKDF2
//         const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

//         // Saving credentials to a JSON file
//         const data = JSON.stringify({ username, salt, hash });
//         fs.writeFileSync(credsPath, data, 'utf8');

//         return { success: true }; // Credentials saved successfully
//     } catch (error) {
//         console.error('Error setting up credentials:', error);
//         return { success: false, message: 'Failed to save credentials. Please check file permissions.' };
//     }
// });

// /**
//  * IPC Handler: Attempts to log in a user.
//  * @param {string} username - The entered username.
//  * @param {string} password - The entered password.
//  * @returns {{success: boolean, message?: string}} Login result.
//  */
// ipcMain.handle('attempt-login', async (event, username, password) => {
//     return { success: true }; // Login successful!
//     /*
//     const creds = getCredentials();
//     // Validating username and checking if credentials exist
//     if (!creds || creds.username.toLowerCase() !== username.toLowerCase()) {
//         return { success: false, message: 'Invalid username or password.' };
//     }

//     try {
//         // Hashing the entered password for comparison
//         const hashToCompare = crypto.pbkdf2Sync(password, creds.salt, 1000, 64, 'sha512').toString('hex');

//         // Comparing hashes
//         if (creds.hash == hashToCompare) {
//             return { success: true }; // Login successful!
//         } else {
//             return { success: false, message: 'Invalid username or password.' };
//         }

//     } catch (error) {
//         console.error('Error during login verification:', error);
//         return { success: false, message: 'An error occurred during login. Please try again.' };
//     }
//         */
// });

// /**
//  * IPC Handler: Changes the user's password after verifying the current password and admin code.
//  * @param {object} payload - Contains oldPassword, newPassword, newUsername, and adminCode.
//  * @returns {{success: boolean, message?: string}} Result of the password change.
//  */
// ipcMain.handle('change-password', async (event, { oldPassword, newPassword, newUsername }) => {
//     const creds = getCredentials();
//     if (!creds) {
//         return { success: false, message: 'No credentials found to update.' };
//     }



//     try {
//         // Verifying the current password
//         const hashToCompare = crypto.pbkdf2Sync(oldPassword, creds.salt, 1000, 64, 'sha512').toString('hex');
//         if (creds.hash !== hashToCompare) {
//             return { success: false, message: 'Incorrect current password. Please check and try again.' };
//         }

//         // Generating and saving new credentials
//         const newSalt = crypto.randomBytes(16).toString('hex');
//         const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 1000, 64, 'sha512').toString('hex');
//         const finalUsername = newUsername && newUsername.trim() ? newUsername.trim() : creds.username;

//         const newData = JSON.stringify({
//             username: finalUsername,
//             salt: newSalt,
//             hash: newHash
//         });

//         fs.writeFileSync(credsPath, newData, 'utf8');

//         return { success: true, message: 'Credentials updated successfully!' };

//     } catch (error) {
//         console.error('Error changing password:', error);
//         return { success: false, message: 'An internal error occurred while changing the password.' };
//     }
// });

// /**
//  * IPC Handler: Retrieves all hardware items from the database, sorted by description.
//  * @returns {Array<object>} An array of hardware items.
//  */
// ipcMain.handle('get-all-hardware', async () => {
//     if (!db) {
//         console.warn('Database not available for get-all-hardware.');
//         return [];
//     }
//     try {
//         // Fetching all hardware, sorted alphabetically by description
//         const stmt = db.prepare('SELECT * FROM hardware ORDER BY description COLLATE NOCASE ASC');
//         return stmt.all();
//     } catch (error) {
//         console.error('Error getting all hardware:', error);
//         return []; // Return empty array on error
//     }
// });

// /**
//  * IPC Handler: Adds a new hardware item to the database.
//  * @param {object} item - The hardware item details.
//  * @returns {{success: boolean, id?: number, error?: {message: string}}} Result of the add operation.
//  */
// ipcMain.handle('add-hardware', async (event, item) => {
//     if (!db) return { success: false, error: { message: "Database not available." } };
//     try {
//         // Validating required fields before insertion
//         if (!item.description || !item.category || item.quantity === null || item.wholesale_price === null || item.retail_price === null) {
//             return { success: false, error: { message: "Missing required fields (Description, Category, Quantity, Wholesale Price, Retail Price)." }};
//         }

//         const stmt = db.prepare('INSERT INTO hardware (description, category, quantity, wholesale_price, retail_price) VALUES (?, ?, ?, ?, ?)');
//         const result = stmt.run(
//             item.description,
//             item.category,
//             item.quantity,
//             Number(item.wholesale_price), // Ensuring prices are numbers
//             Number(item.retail_price)
//         );
//         console.log(`Added hardware item with ID: ${result.lastInsertRowid}`);
//         return { success: true, id: result.lastInsertRowid };
//     } catch (error) {
//         console.error('Error adding hardware:', error);
//         return { success: false, error: { message: error.message } };
//     }
// });

// /**
//  * IPC Handler: Updates an existing hardware item.
//  * @param {number} id - The ID of the item to update.
//  * @param {object} data - An object containing the field and new value (e.g., { description: 'New Name' }).
//  * @returns {{success: boolean, error?: string}} Result of the update operation.
//  */
// ipcMain.handle('update-hardware', async (event, id, data) => {
//     if (!db) return { success: false, error: "Database not available." };
//     try {
//         const field = Object.keys(data)[0];
//         const value = data[field];

//         // Performing specific validations based on the field being updated
//         if (field === 'description' && !String(value).trim()) return { success: false, error: 'Description cannot be empty.' };
//         if (field === 'category' && !String(value).trim()) return { success: false, error: 'Category cannot be empty.' };
//         if (field === 'quantity' && (String(value).trim() === ''))
//             return { success: false, error: 'Quantity must be a valid number.' };
//         if (field === 'wholesale_price' || field === 'retail_price') {
//              const numValue = Number(value);
//              if(isNaN(numValue) || numValue < 0) {
//                 return { success: false, error: `Invalid ${field.replace('_', ' ')}. Must be a non-negative number.`};
//              }
//         }

//         // Constructing the update statement dynamically and safely
//         const stmt = db.prepare(`UPDATE hardware SET ${field} = ? WHERE id = ?`);
//         stmt.run(value, id);
//         console.log(`Updated hardware ID ${id} - ${field}: ${value}`);
//         return { success: true };
//     } catch (error) {
//         console.error(`Error updating hardware ID ${id}:`, error);
//         return { success: false, error: error.message };
//     }
// });

// /**
//  * IPC Handler: Shows a context menu for hardware items (e.g., delete).
//  * @param {number} itemId - The ID of the item.
//  * @param {string} itemDescription - The description of the item for the menu label.
//  */
// ipcMain.on('show-item-context-menu', (event, itemId, itemDescription) => {
//     const template = [
//         {
//             label: `Delete "${itemDescription}" (ID: ${itemId})`,
//             click: () => {
//                 // Asking for confirmation before deletion
//                 try {
//                     if (!db) {
//                          // Sending notification back to renderer if DB is not ready
//                          mainWindow.webContents.send('item-deleted-notification', { success: false, itemId, itemDescription, message: 'Database not available.' });
//                          return;
//                     }
//                     const stmt = db.prepare('DELETE FROM hardware WHERE id = ?');
//                     stmt.run(itemId);
//                     // Notifying the renderer that the item was deleted
//                     mainWindow.webContents.send('item-deleted-notification', { success: true, itemId, itemDescription });
//                 } catch (error) {
//                     console.error('Error deleting item:', error);
//                     // Notifying the renderer about the error
//                     mainWindow.webContents.send('item-deleted-notification', { success: false, itemId, itemDescription, message: error.message });
//                 }
//             }
//         }
//     ];
//     const menu = Menu.buildFromTemplate(template);
//     menu.popup({ window: BrowserWindow.fromWebContents(event.sender) }); // Show menu relative to the sender's window
// });

// // --- Notes IPC Handlers ---
// /**
//  * IPC Handler: Retrieves all notes from the database, sorted by creation date.
//  * @returns {Array<object>} An array of note objects.
//  */
// ipcMain.handle('get-all-notes', async () => {
//     if (!db) {
//         console.warn('Database not available for get-all-notes.');
//         return [];
//     }
//     try {
//         // Fetching notes, ordered by most recent first
//         return db.prepare('SELECT * FROM notes ORDER BY createdAt DESC').all();
//     } catch (error) {
//         console.error('Error getting all notes:', error);
//         return [];
//     }
// });

// /**
//  * IPC Handler: Adds a new note to the database.
//  * @param {object} note - The note object {title, body}.
//  * @returns {{success: boolean, id?: number, error?: {message: string}}} Result of the add operation.
//  */
// ipcMain.handle('add-note', async (event, note) => {
//     if (!db) return { success: false, error: { message: "Database not available." } };
//     try {
//         const stmt = db.prepare('INSERT INTO notes (title, body, createdAt) VALUES (?, ?, ?)');
//         const result = stmt.run(note.title, note.body, new Date().toISOString());
//         console.log(`Added note with ID: ${result.lastInsertRowid}`);
//         return { success: true, id: result.lastInsertRowid };
//     } catch (error) {
//         console.error('Error adding note:', error);
//         return { success: false, error: { message: error.message } };
//     }
// });

// /**
//  * IPC Handler: Deletes a note from the database.
//  * @param {number} id - The ID of the note to delete.
//  * @returns {{success: boolean, error?: {message: string}}} Result of the delete operation.
//  */
// ipcMain.handle('delete-note', async (event, id) => {

//     if (!db) return { success: false, error: { message: "Database not available." } };
//     try {
//         db.prepare('DELETE FROM notes WHERE id = ?').run(id);
//         console.log(`Deleted note with ID: ${id}`);
//         return { success: true };
//     } catch (error) {
//         console.error('Error deleting note:', error);
//         return { success: false, error: { message: error.message } };
//     }
// });

// // --- AI Chat and Query Execution ---

// // Whitelists for security: only allow specific columns and operators
// const ALLOWED_HARDWARE_COLUMNS = ['id', 'description', 'category', 'quantity', 'wholesale_price', 'retail_price', '*'];
// const ALLOWED_NOTES_COLUMNS = ['id', 'title', 'body', 'createdAt', '*'];
// const ALLOWED_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE'];
// const ALLOWED_DIRECTIONS = ['ASC', 'DESC'];

// /**
//  * Safely executes a query plan generated by the AI, with robust validation.
//  * @param {object} plan - The structured JSON query plan.
//  * @returns {{data: object[]}|{error: string}} The query result or an error message.
//  */
// function executeQueryPlan(plan) {
//     try {
//         // Basic validation of the plan structure
//         if (!plan || typeof plan !== 'object') {
//             return { error: "Invalid query plan format. Expected a JSON object." };
//         }

//         const { from, select, where, orderBy, limit } = plan;

//         // Table Validation
//         if (!from || !['hardware', 'notes'].includes(from)) {
//             return { error: 'Invalid or missing table in query plan. Must be "hardware" or "notes".' };
//         }

//         const ALLOWED_COLUMNS = from === 'hardware' ? ALLOWED_HARDWARE_COLUMNS : ALLOWED_NOTES_COLUMNS;

//         // SELECT Clause Construction & Validation
//         let selectClause = 'SELECT *';
//         if (select && Array.isArray(select) && select.length > 0) {
//             // Ensure all requested columns are allowed
//             if (select.some(col => !ALLOWED_COLUMNS.includes(col))) {
//                 return { error: "Query contains an invalid column in the SELECT clause. Please use allowed columns only." };
//             }
//             selectClause = `SELECT ${select.join(', ')}`;
//         }

//         const fromClause = `FROM ${from}`; // Table name is already validated

//         // WHERE Clause Construction & Validation
//         let whereClause = '';
//         const params = []; // To store values for prepared statements, preventing SQL injection
//         if (where && Array.isArray(where) && where.length > 0) {
//             const conditions = [];
//             for (const cond of where) {
//                 // Validate each condition part
//                 if (!Array.isArray(cond) || cond.length !== 3) return { error: "Invalid WHERE condition format. Each condition must be [column, operator, value]." };
//                 const [column, operator, value] = cond;

//                 // Validate column, operator, and value
//                 if (!ALLOWED_COLUMNS.includes(column) || column === '*') return { error: `Invalid column "${column}" in WHERE clause.` };
//                 if (!ALLOWED_OPERATORS.includes(operator.toUpperCase())) return { error: `Invalid operator "${operator}" in WHERE clause.` };

//                 conditions.push(`${column} ${operator.toUpperCase()} ?`); // Use placeholder for value
//                 params.push(value); // Add value to params array
//             }
//             whereClause = `WHERE ${conditions.join(' AND ')}`; // Combine conditions with AND
//         }

//         // ORDER BY Clause Construction & Validation
//         let orderByClause = '';
//         if (orderBy && typeof orderBy === 'object') {
//             const { column, direction } = orderBy;
//             // Validate column and direction
//             if (!ALLOWED_COLUMNS.includes(column) || column === '*') return { error: `Invalid column "${column}" in ORDER BY clause.` };
//             const sortDir = (direction || 'ASC').toUpperCase();
//             if (!ALLOWED_DIRECTIONS.includes(sortDir)) return { error: `Invalid direction "${direction}" in ORDER BY clause. Use ASC or DESC.` };
//             orderByClause = `ORDER BY ${column} ${sortDir}`;
//         }

//         // LIMIT Clause Construction & Validation
//         let limitClause = '';
//         if (limit && typeof limit === 'number' && limit > 0) {
//             limitClause = `LIMIT ?`;
//             params.push(Math.min(limit, 100)); // Cap limit to prevent excessive data retrieval
//         }

//         // Assembling the final SQL query
//         const sql = `${selectClause} ${fromClause} ${whereClause} ${orderByClause} ${limitClause}`;
//         console.log('[main.js] Executing AI-generated query:', sql, params);

//         const stmt = db.prepare(sql);
//         const data = stmt.all(...params); // Execute with parameters
//         return { data };

//     } catch (e) {
//         console.error("Error executing query plan:", e);
//         return { error: `Database error: ${e.message}` }; // Return specific error message
//     }
// }


// /**
//  * IPC Handler: Handles AI chat interactions.
//  * It first tries to generate a query plan, then executes it, or falls back to conversational mode.
//  * @param {Array<object>} history - The conversation history.
//  * @returns {{success: boolean, text: string}} The AI's response.
//  */
// ipcMain.handle('ai-chat', async (event, history) => {
//     try {
//         // Checking if API key is available
//         if (!process.env.API_KEY) {
//             console.error('API_KEY environment variable not set.');
//             // Informing the user if the AI is not configured
//             return { success: false, text: '<div class="assistant-bubble assistant-error">The AI assistant is not configured. Please ensure the API_KEY is set in your .env file.</div>' };
//         }
//         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
//         const model = 'gemini-2.5-flash-preview-04-17'; // Using a cost-effective and fast model

//         const userPrompt = history[history.length - 1].parts[0].text; // Get the latest user message

//         // --- Step 1: Generate Query Plan ---
//         // System instruction for the AI to generate a query plan
//         const queryGenerationSystemInstruction = `You are an intelligent database query generator. Your sole purpose is to analyze a user's request and translate it into a structured JSON query plan. You MUST ONLY respond with the raw JSON object, without any markdown formatting like \`\`\`json.

// The available tables are:
// 1.  "hardware": columns are id (INTEGER), description (TEXT), category (TEXT), quantity (TEXT), wholesale_price (REAL), retail_price (REAL). Available categories are: electrical, plumbing, agriculture, painting, safety, tools, vending, building, carpentry, other. Do not use the 'id' column for general text searches unless the user explicitly asks to find something by its ID.
// 2.  "notes": columns are id (INTEGER), title (TEXT), body (TEXT), createdAt (TEXT).

// The JSON query plan format is:
// {
//   "from": "tablename",
//   "select": ["column1", "column2"],
//   "where": [ ["column", "operator", "value"] ],
//   "orderBy": { "column": "description", "direction": "ASC" },
//   "limit": 10
// }
// - You MUST specify the "from" table ("hardware" or "notes").
// - All other fields are optional.
// - Supported operators for 'where' are: '=', '!=', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE'. For LIKE, the value must include '%' wildcards.
// - If the user's request is not a query for data (e.g., "hello", "how are you?", "how does this app work?"), you MUST respond with: {"isConversational": true}
// - If you cannot formulate a query for the user's request, you MUST respond with: {"isConversational": true}
// - if users ask about summing the retail prices of items, you MUST respond with a query plan that sums the retail prices, like this:
// {
//   "from": "hardware",
//   "select": ["SUM(retail_price) AS total_retail_price"],
//   "where": [],
//   "orderBy": {},
//   "limit": 1
// }
// - If users ask about summing the wholesale prices of items, you MUST respond with a query plan that sums the wholesale prices, like this:
// {
//   "from": "hardware",
//   "select": ["SUM(wholesale_price) AS total_wholesale_price"],
//   "where": [],
//   "orderBy": {},
//   "limit": 1
// }
// - Note: The 'quantity' column in the 'hardware' table is stored as TEXT. If users ask for quantity comparisons, treat it as text or if they imply numerical comparison, try to convert carefully. If it's complex, flag as conversational.
// `;

//         const queryGenResponse = await ai.models.generateContent({
//             model,
//             contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
//             // Requesting JSON output directly
//             config: {
//                 systemInstruction: queryGenerationSystemInstruction,
//                 responseMimeType: 'application/json'
//             }
//         });

//         let planJson = queryGenResponse.text.trim();
//         // Cleaning up potential markdown fences around JSON
//         const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
//         let match = planJson.match(fenceRegex);
//         if (match && match[2]) {
//             planJson = match[2].trim();
//         }

//         let plan;
//         try {
//             plan = JSON.parse(planJson);
//         } catch (e) {
//             console.error("Failed to parse AI query plan:", planJson, e);
//             plan = { isConversational: true }; // Fallback if JSON is malformed
//         }

//         // --- Step 2: Handle the plan ---
//         if (plan.isConversational) {
//             // If it's conversational, use the detailed conversational instructions
//             const conversationalSystemInstruction = `You are Mat, a helpful and friendly AI assistant for the "Stock Management App (SMA)". The app is used at GIYA Hardware.
// - Your primary role is to help users with their inventory, answer questions about the app, and engage in general conversation (e.g., business ideas, bible stories, motivational quotes).
// - You MUST wrap your entire response in a single HTML element: \`<div class="assistant-bubble">\`.
// - Be expressive and use a variety of formatting. When appropriate, use HTML elements like tables (with class="stat-table"), headings (\`<h4>\`, \`<h5>\`), bullet points (\`<ul>\`/\`<li>\`), bold (\`<strong>\`), italics (\`<em>\`), underlines (\`<u>\`), and highlights (\`<span class="highlight">highlighted text</span>\`) to make your answers clear and visually appealing.
// - Use inline \`style\` attributes for colors or backgrounds to make responses visually engaging. Use high-contrast, aesthetically pleasing color combinations for text, backgrounds, and highlights. For example:
//     - Use dark text on a light background for highlighting: \`<span style="background-color: #FFFF00; color: #000000;" class="highlight">highlighted text</span>\`
//     - Use white text on a dark blue background: \`<div style="background-color: #00008B; color: #FFFFFF;">Important Note</div>\`
//     - Feel free to be creative with colors like green, blue, purple, orange, etc., ensuring readability and visual appeal.
// - If the user starts a conversation in Chichewa, you MUST respond entirely in Chichewa.
// - Refer to the user guide below to answer questions about the app.

// USER GUIDE:
// ${helpContent}
// `;

//             const convoResponse = await ai.models.generateContent({
//                 model,
//                 contents: history, // Pass the full conversation history
//                 config: { systemInstruction: conversationalSystemInstruction }
//             });

//             let convoText = convoResponse.text.trim();
//             const convoMatch = convoText.match(fenceRegex);
//             if (convoMatch && convoMatch[2]) {
//                 convoText = convoMatch[2].trim();
//             }
//             return { success: true, text: convoText }; // Return conversational response
//         }

//         // --- Step 3: Execute the generated query plan ---
//         const queryResult = executeQueryPlan(plan);

//         // Handle errors during query execution
//         if (queryResult.error) {
//             console.error("AI Query Execution Error:", queryResult.error);
//             return { success: false, text: `<div class="assistant-bubble assistant-error">Oops! I had trouble fetching that data: ${queryResult.error}</div>` };
//         }
//         // Handle cases where no data is found
//         if (!queryResult.data || queryResult.data.length === 0) {
//             return { success: true, text: '<div class="assistant-bubble">I couldn\'t find any items that match your request. Would you like to try a different search?</div>' };
//         }

//         // --- Step 4: Format results with AI ---
//         // System instruction for formatting the data into a user-friendly HTML response
//         const dataFormattingSystemInstruction = `You are Mat, a helpful AI assistant. Your task is to take a user's original question and the corresponding data retrieved from a database, and format it into a clear, user-friendly HTML response.
//         - You MUST wrap your entire response in a single HTML element: <div class="assistant-bubble">.
//         - Your response should directly answer the user's question using the data.
//         - Be very expressive and use a variety of formatting.
//         - If the data is tabular (e.g., list of items, multiple records), you MUST present it inside an HTML <table> with the class "stat-table". Do NOT add any inline style attributes for colors, backgrounds, or borders to the table or its child elements (<tr>, <th>, <td>). The application's stylesheet will handle all theme styling for tables.
//         - For single items, summaries, or key findings, use a variety of styled elements like lists (<ul>/<li>), paragraphs, headings (<h4>, <h5>), bold text (<strong>), italics (<em>), underlines (<u>), and highlights (<span class="highlight">highlighted text</span>) to make the data easy to understand and visually engaging.
//         - Use inline style attributes for colors or backgrounds anywhere in your response (except for the table itself as per above) to make your answers visually engaging. Use high-contrast, visually appealing color combinations. Examples:
//             - Use dark text on a light background for highlighting: \`<span style="background-color: #FFFFE0; color: #333333;" class="highlight">Key Insight</span>\`
//             - Use white text on a dark background: \`<div style="background-color: #2C3E50; color: #ECF0F1; padding: 10px; border-radius: 5px;">Summary Data</div>\`
//             - Use different background colors for different sections or data points to differentiate them clearly. Think about using blues, greens, purples, oranges, yellows for varied visual appeal. Ensure colors work well together and maintain readability.
//         - If the user's original question was in Chichewa, you MUST format the entire response in Chichewa or sometimes use English words for emphasis, including any headers or introductory text.
//         - Refer to the user guide below to answer questions about the app.
//         - When narrating or telling a long story (for example, "tell me the story of Jonah"), present the story in a visually engaging way: use attractive, varied background colors, section highlights, and descriptive text formatting.
//         always assume a darkmode so you use sensible colors
// `;

//         // Constructing the prompt for the AI to format the data
//         const dataFormattingPrompt = `Original user question: "${userPrompt}"\n\nDatabase results (JSON):\n${JSON.stringify(queryResult.data, null, 2)}\n\nPlease generate the HTML response.`;

//         const formatResponse = await ai.models.generateContent({
//             model,
//             contents: [{ role: 'user', parts: [{ text: dataFormattingPrompt }] }],
//             config: { systemInstruction: dataFormattingSystemInstruction }
//         });

//         let formatText = formatResponse.text.trim();
//         const formatMatch = formatText.match(fenceRegex);
//         if (formatMatch && formatMatch[2]) {
//             formatText = formatMatch[2].trim();
//         }
//         return { success: true, text: formatText }; // Return formatted data response

//     } catch (error) {
//         console.error('AI Chat Error:', error);
//         // Providing a user-friendly error message for AI failures
//         return { success: false, text: `<div class="assistant-bubble assistant-error">Sorry, I encountered an error while trying to process your request with the AI. Please try again later or check your network connection. Error: ${error.message}</div>` };
//     }
// });

// /**
//  * IPC Handler: Exports the current hardware stock data to an Excel file.
//  */
// ipcMain.on('export-excel', async () => {
//     if (!db) {
//         mainWindow.webContents.send('excel-exported', { status: 'error', message: 'Database not available for export.' });
//         return;
//     }
//     try {
//         // Fetching all necessary hardware data
//         const items = db.prepare('SELECT description, category, quantity, wholesale_price, retail_price FROM hardware').all();
//         if (items.length === 0) {
//             mainWindow.webContents.send('excel-exported', { status: 'no-data', message: 'No hardware data found to export.' });
//             return;
//         }

//         // Map items to create a new array with the desired column order for the export
//         const dataToExport = items.map(item => ({
//             quantity: item.quantity,
//             description: item.description,
//             retail_price: item.retail_price,
//             wholesale_price: item.wholesale_price,
//             category: item.category
//         }));

//         // Creating an Excel worksheet and workbook from the reordered data
//         const worksheet = xlsx.utils.json_to_sheet(dataToExport);
//         const workbook = xlsx.utils.book_new();
//         xlsx.utils.book_append_sheet(workbook, worksheet, 'HardwareStock');

//         // Prompting the user to choose a save location
//         const { filePath, canceled } = await dialog.showSaveDialog({
//             title: 'Export Hardware Stock to Excel',
//             defaultPath: `hardware-stock-${new Date().toISOString().split('T')[0]}.xlsx`, // Default filename with date
//             filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
//         });

//         if (canceled || !filePath) {
//             mainWindow.webContents.send('excel-exported', { status: 'cancelled' }); // User cancelled save
//             return;
//         }

//         // Writing the workbook to the chosen file path
//         xlsx.writeFile(workbook, filePath);
//         // Notifying the renderer of success
//         mainWindow.webContents.send('excel-exported', { status: 'success', message: `Exported successfully to ${filePath}` });
//         shell.showItemInFolder(filePath); // Open the folder containing the exported file

//     } catch (error) {
//         console.error('Error exporting to Excel:', error);
//         // Notifying the renderer of failure
//         mainWindow.webContents.send('excel-exported', { status: 'error', message: `Export failed: ${error.message}` });
//     }
// });

// /**
//  * IPC Handler: Imports hardware stock data from an Excel file.
//  */
// ipcMain.on('import-excel', async (event) => {

//     if (!db) {
//         mainWindow.webContents.send('import-result', { success: false, message: 'Database not available for import.' });
//         return;
//     }

//     // Prompting the user to select an Excel file
//     const { filePaths, canceled } = await dialog.showOpenDialog({
//         title: 'Import Hardware Stock from Excel',
//         properties: ['openFile'],
//         filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
//     });

//     if (canceled || !filePaths || filePaths.length === 0) {
//         mainWindow.webContents.send('import-result', { success: true, message: 'Import cancelled by user.' }); // User cancelled selection
//         return;
//     }

//     const filePath = filePaths[0];
//     try {
//         // Reading the Excel workbook and sheet
//         const workbook = xlsx.readFile(filePath);
//         const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
//         const worksheet = workbook.Sheets[sheetName];
//         const data = xlsx.utils.sheet_to_json(worksheet);

//         if (!data || data.length === 0) {
//             mainWindow.webContents.send('import-result', { success: false, message: 'The selected Excel file is empty or in an unsupported format.' });
//             return;
//         }

//         // Validating headers against required columns
//         const requiredHeaders = ['description', 'category', 'quantity', 'wholesale_price', 'retail_price'];
//         const fileHeaders = Object.keys(data[0]);
//         const missingHeaders = requiredHeaders.filter(h => !fileHeaders.includes(h));

//         if (missingHeaders.length > 0) {
//              // Informing user about missing columns
//              mainWindow.webContents.send('import-result', { success: false, message: `Import failed. Missing required columns: ${missingHeaders.join(', ')}. Please ensure your Excel file has these headers.` });
//              return;
//         }

//         // Preparing statements for bulk import: delete existing, reset sequence, then insert new
//         const deleteAllStmt = db.prepare('DELETE FROM hardware');
//         const resetIdStmt = db.prepare('DELETE FROM sqlite_sequence WHERE name = ?');
//         const insertStmt = db.prepare('INSERT INTO hardware (description, category, quantity, wholesale_price, retail_price) VALUES (@description, @category, @quantity, @wholesale_price, @retail_price)');

//         let skippedCount = 0;
//         // Using a transaction for atomic insert of multiple rows
//         const insertMany = db.transaction((items) => {
//             for (const item of items) {
//                 // Basic data validation for each row
//                 if (!item.description || !item.category || item.quantity == null || item.wholesale_price == null || item.retail_price == null) {
//                     skippedCount++; // Count rows that are incomplete
//                     continue;
//                 }
//                 // Inserting the item with type conversions
//                 insertStmt.run({
//                     description: String(item.description).trim(),
//                     category: String(item.category).trim(),
//                     quantity: String(item.quantity).trim(), // Keep quantity as string as it might not always be numeric
//                     wholesale_price: Number(item.wholesale_price) || 0, // Default to 0 if conversion fails
//                     retail_price: Number(item.retail_price) || 0      // Default to 0 if conversion fails
//                 });
//             }
//         });

//         // Executing the delete and reset within a transaction
//         db.transaction(() => {
//             deleteAllStmt.run();
//             resetIdStmt.run('hardware');
//         })();

//         insertMany(data); // Performing the actual data insertion

//         // Notifying the renderer about the import result
//         let message = `Successfully imported ${data.length - skippedCount} items.`;
//         if(skippedCount > 0) {
//             message += ` Skipped ${skippedCount} rows due to missing required data.`;
//         }
//         mainWindow.webContents.send('import-result', { success: true, message: message });

//     } catch (error) {
//         console.error('Error importing from Excel:', error);
//         // Notifying the renderer of failure
//         mainWindow.webContents.send('import-result', { success: false, message: `Import failed: ${error.message}` });
//     }
// });


// // --- Window Control IPC Handlers ---
// /**
//  * IPC Handler: Minimizes the main window.
//  */
// ipcMain.on('minimize-window', () => mainWindow.minimize());

// /**
//  * IPC Handler: Toggles maximization/restoration of the main window.
//  */
// ipcMain.on('maximize-window', () => {
//     if (mainWindow.isMaximized()) {
//         mainWindow.unmaximize();
//     } else {
//         mainWindow.maximize();
//     }
// });

// /**
//  * IPC Handler: Closes the main window.
//  */
// ipcMain.on('close-window', () => mainWindow.close());
