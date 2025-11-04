import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleGenAI, type FunctionDeclaration, Type, type Content, type Part, type Chat } from '@google/genai';
import { SendIcon, BotIcon, MicrophoneIcon, StopCircleIcon } from '../components/Icons';
import { useDb } from '../hooks/useDb';
import { db } from '../db/db';
import type { Hardware } from '../types/database';
import { parseMarkdownToReact } from '../utils/markdown';

// --- Minimal type definitions for Web Speech API ---
// This is to solve the "Cannot find name 'SpeechRecognition'" error.
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: any;
}

// Define the SpeechRecognition interface to resolve the type error.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

// --- AI Client Initialization ---
let genAI: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI | null => {
  if (genAI) return genAI;
  const key = process.env.API_KEY;
  if (!key) {
    console.warn('API_KEY not found in environment variables.');
    return null;
  }
  try {
    genAI = new GoogleGenAI({ apiKey: key });
    return genAI;
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI:', err);
    return null;
  }
};

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const searchStockItemsDeclaration: FunctionDeclaration = {
  name: 'searchStockItems',
  parameters: {
    type: Type.OBJECT,
    description: 'Searches the inventory database for stock items. Use this to find items by name, description, or category, and to answer questions about item availability, price, quantity, or other details.',
    properties: {
      itemNameOrDescription: {
        type: Type.STRING,
        description: 'The name or a descriptive keyword for the stock item to search for. For example, to find all hammers, use "hammer".',
      },
      categoryName: {
        type: Type.STRING,
        description: 'The name of a category to filter items by.',
      },
      sortBy: {
        type: Type.STRING,
        description: 'The field to sort by. Valid options are "description", "retail_price", or "quantity".',
      },
      sortOrder: {
        type: Type.STRING,
        description: 'The order to sort by. Valid options are "asc" (ascending) or "desc" (descending). Default is "asc".',
      },
    },
    required: [],
  },
};

// Function to add a new hardware item
const addHardwareDeclaration: FunctionDeclaration = {
  name: 'addHardware',
  parameters: {
    type: Type.OBJECT,
    description: 'Adds a new hardware item to the inventory. Requires a description, category ID, quantity, and retail price. Other fields are optional.',
    properties: {
      description: { type: Type.STRING, description: 'Description of the hardware item.' },
      category_id: { type: Type.STRING, description: 'The ID of the category the item belongs to.' },
      quantity: { type: Type.STRING, description: 'The quantity of the item, e.g., "10 units" or "5 meters".' },
      retail_price: { type: Type.NUMBER, description: 'The retail price of the item.' },
      retail_price_unit: { type: Type.STRING, description: 'Unit for retail price, e.g., "per unit", "per meter".' },
      wholesale_price: { type: Type.NUMBER, description: 'The wholesale price of the item.' },
      wholesale_price_unit: { type: Type.STRING, description: 'Unit for wholesale price, e.g., "per unit", "per meter".' },
      supplier: { type: Type.STRING, description: 'The supplier of the item.' },
      min_stock_level: { type: Type.NUMBER, description: 'Minimum stock level before reordering.' },
      location: { type: Type.STRING, description: 'Storage location of the item.' },
      notes: { type: Type.STRING, description: 'Any additional notes about the item.' },
    },
    required: ['description', 'category_id', 'quantity', 'retail_price'],
  },
};

// Function to update an existing hardware item
const updateHardwareDeclaration: FunctionDeclaration = {
  name: 'updateHardware',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates an existing hardware item in the inventory. Requires the item ID and at least one field to update.',
    properties: {
      id: { type: Type.STRING, description: 'The ID of the hardware item to update.' },
      description: { type: Type.STRING, description: 'New description of the hardware item.' },
      category_id: { type: Type.STRING, description: 'New category ID the item belongs to.' },
      quantity: { type: Type.STRING, description: 'New quantity of the item.' },
      retail_price: { type: Type.NUMBER, description: 'New retail price of the item.' },
      retail_price_unit: { type: Type.STRING, description: 'New unit for retail price.' },
      wholesale_price: { type: Type.NUMBER, description: 'New wholesale price of the item.' },
      wholesale_price_unit: { type: Type.STRING, description: 'New unit for wholesale price.' },
      supplier: { type: Type.STRING, description: 'New supplier of the item.' },
      min_stock_level: { type: Type.NUMBER, description: 'New minimum stock level.' },
      location: { type: Type.STRING, description: 'New storage location.' },
      notes: { type: Type.STRING, description: 'New additional notes.' },
    },
    required: ['id'],
  },
};

// Function to delete a hardware item
const deleteHardwareDeclaration: FunctionDeclaration = {
  name: 'deleteHardware',
  parameters: {
    type: Type.OBJECT,
    description: 'Marks a hardware item as deleted in the inventory. Requires the item ID.',
    properties: {
      id: { type: Type.STRING, description: 'The ID of the hardware item to delete.' },
    },
    required: ['id'],
  },
};

// Function to add an audit log entry
const addAuditLogDeclaration: FunctionDeclaration = {
  name: 'addAuditLog',
  parameters: {
    type: Type.OBJECT,
    description: 'Adds an entry to the audit log. Useful for tracking changes or actions related to inventory items.',
    properties: {
      item_id: { type: Type.STRING, description: 'The ID of the item related to the audit log entry.' },
      change_description: { type: Type.STRING, description: 'A description of the change or action.' },
      username: { type: Type.STRING, description: 'The username of the person who made the change. Default to "AI Assistant" if not specified.' },
    },
    required: ['item_id', 'change_description'],
  },
};


// --- Styled Components ---
const ChatPageContainer = styled.div<{ isModal?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  max-height: ${({ isModal }) => isModal ? '90vh' : '100%'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 90%;
  padding: 10px 14px;
  border-radius: 18px;
  background-color: ${props => props.isUser ? 'var(--primary)' : 'var(--surface)'};
  color: ${props => props.isUser ? 'white' : 'var(--text-primary)'};
  border: 1px solid ${props => props.isUser ? 'var(--primary)' : 'var(--border)'};
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;

  @media (max-width: 480px) {
    max-width: 95%;
  }

  & table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 14px;
    background-color: var(--background);
    color: var(--text-primary); /* Ensure table text color respects theme */
  }
  & th, & td {
    border: 1px solid var(--border);
    padding: 8px;
    text-align: left;
  }
  & th {
    background-color: var(--surface-variant);
    font-weight: 600;
  }
  /* Fix for dark mode table text color */
  & table, & th, & td {
    color: var(--text-primary);
  }
`;

const LoadingBubble = styled.div`
  align-self: flex-start;
  padding: 12px 16px;
  border-radius: 18px;
  background-color: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-secondary);
`;

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 12px;
  border-top: 1px solid var(--border);
  background-color: var(--surface);
  gap: 8px;
`;

const InputWrapper = styled.div`
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
`;

const ChatInput = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  padding-left: 48px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background-color: var(--surface-variant);
  color: var(--text-primary);
  font-size: 1rem;
  resize: none;
  outline: none;
  max-height: 120px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}33;
    border-radius: 24px;
  }
`;

const MicButton = styled.button`
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;

  &:hover:not(:disabled) {
    background-color: var(--background);
    color: var(--text-primary);
  }
  &.mic-active {
    color: var(--danger);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SendButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:disabled {
    background-color: var(--text-secondary);
    opacity: 0.6;
    cursor: not-allowed;
    transform: scale(0.9);
  }
`;


const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
  color: var(--text-secondary);
  padding: 24px;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    color: var(--primary);
  }
  h2 {
    color: var(--text-primary);
  }
`;

// --- Chatbot Component ---
interface ChatbotProps {
  isModal?: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ isModal }) => {
  const { hardware, categories, addHardware: dbAddHardware, updateHardware: dbUpdateHardware, deleteHardware: dbDeleteHardware, addAuditLog: dbAddAuditLog } = useDb();
  const [messages, setMessages] = useState<Content[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiClient = useRef(getAiClient());
  const chatRef = useRef<Chat | null>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      handleListen();
    }
  };

  const handleListen = () => {
    if (!SpeechRecognitionAPI) {
      alert("Sorry, your browser doesn't support speech recognition.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false; // Stop after a single utterance
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        // Update the input field with the latest interim transcript, or final if available
        setInput(finalTranscript || interimTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      }

      recognitionRef.current = recognition;
    }

    setInput('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  const searchStockItems = async (
    args: { itemNameOrDescription?: string; categoryName?: string; sortBy?: 'description' | 'retail_price' | 'quantity'; sortOrder?: 'asc' | 'desc' },
  ): Promise<object> => {
    // Defensive parsing: sometimes the SDK sends args as a JSON string
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args || {};

    // Use the live `hardware` array when available; otherwise read directly from Dexie
    let results: any[] = [];
    if (hardware && Array.isArray(hardware)) {
      results = [...hardware.filter(h => !h.is_deleted)];
    } else {
      // hardware hook might not be loaded yet; read directly from the DB
      try {
        const items = await db.hardware.toArray();
        results = items.filter(h => !h.is_deleted);
      } catch (err: any) {
        return { error: `Failed to read local database: ${err?.message || err}` };
      }
    }

    if (parsedArgs.categoryName) {
      const category = categories?.find(c => c.name.toLowerCase() === parsedArgs.categoryName?.toLowerCase());
      if (category) {
        results = results.filter(item => item.category_id === category.id);
      } else {
        return { error: `Category '${parsedArgs.categoryName}' not found.` };
      }
    }

    if (parsedArgs.itemNameOrDescription) {
      results = results.filter(item => item.description?.toLowerCase().includes(parsedArgs.itemNameOrDescription!.toLowerCase()));
    }

    if (parsedArgs.sortBy) {
      const order = parsedArgs.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        switch (parsedArgs.sortBy) {
          case 'description':
            return ((a.description || '').localeCompare(b.description || '')) * order;
          case 'retail_price':
            return (((a.retail_price || 0) - (b.retail_price || 0)) * order) as any;
          case 'quantity':
            const qtyA = parseInt(a.quantity || '0', 10);
            const qtyB = parseInt(b.quantity || '0', 10);
            return (qtyA - qtyB) * order;
          default:
            return 0;
        }
      });
    }

    // Return a simplified object for the AI
    return results.slice(0, 20).map(item => ({
      description: item.description,
      category: categories?.find(c => c.id === item.category_id)?.name || 'N/A',
      quantity: item.quantity,
      retail_price: item.retail_price,
    }));
  };

  // Local function to add hardware
  const addHardware = async (args: {
    description: string;
    category_id: string;
    quantity: string;
    retail_price: number;
    retail_price_unit?: string;
    wholesale_price?: number;
    wholesale_price_unit?: string;
    supplier?: string;
    min_stock_level?: number;
    location?: string;
    notes?: string;
  }): Promise<object> => {
    if (!dbAddHardware || !dbAddAuditLog) return { error: 'Database functions not available.' };
    try {
      const newItem: Hardware = {
        id: crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        ...args,
      } as Hardware; // Cast to Hardware to satisfy type, assuming all required fields are present
      await dbAddHardware(newItem);
      await dbAddAuditLog({
        id: crypto.randomUUID(),
        item_id: newItem.id,
        change_description: `AI added item: ${newItem.description}`,
        created_at: new Date().toISOString(),
        username: 'AI Assistant',
        is_synced: 0,
      });
      return { success: `Hardware item '${newItem.description}' added with ID: ${newItem.id}` };
    } catch (error: any) {
      return { error: `Failed to add hardware item: ${error.message}` };
    }
  };

  // Local function to update hardware
  const updateHardware = async (args: {
    id: string;
    description?: string;
    category_id?: string;
    quantity?: string;
    retail_price?: number;
    retail_price_unit?: string;
    wholesale_price?: number;
    wholesale_price_unit?: string;
    supplier?: string;
    min_stock_level?: number;
    location?: string;
    notes?: string;
  }): Promise<object> => {
    if (!dbUpdateHardware || !dbAddAuditLog) return { error: 'Database functions not available.' };
    try {
      const { id, ...updates } = args;
      await dbUpdateHardware(id, { ...updates, updated_at: new Date().toISOString() });
      await dbAddAuditLog({
        id: crypto.randomUUID(),
        item_id: id,
        change_description: `AI updated item ID: ${id} with changes: ${JSON.stringify(updates)}`,
        created_at: new Date().toISOString(),
        username: 'AI Assistant',
        is_synced: 0,
      });
      return { success: `Hardware item ID '${id}' updated.` };
    } catch (error: any) {
      return { error: `Failed to update hardware item ID '${args.id}': ${error.message}` };
    }
  };

  // Local function to delete hardware
  const deleteHardware = async (args: { id: string }): Promise<object> => {
    if (!dbDeleteHardware || !dbAddAuditLog) return { error: 'Database functions not available.' };
    try {
      await dbDeleteHardware(args.id);
      await dbAddAuditLog({
        id: crypto.randomUUID(),
        item_id: args.id,
        change_description: `AI marked item ID: ${args.id} as deleted.`, // Use 'marked as deleted' instead of 'deleted' for soft delete
        created_at: new Date().toISOString(),
        username: 'AI Assistant',
        is_synced: 0,
      });
      return { success: `Hardware item ID '${args.id}' marked as deleted.` };
    } catch (error: any) {
      return { error: `Failed to delete hardware item ID '${args.id}': ${error.message}` };
    }
  };

  // Local function to add audit log (can be called directly by AI or internally)
  const addAuditLog = async (args: {
    item_id: string;
    change_description: string;
    username?: string;
  }): Promise<object> => {
    if (!dbAddAuditLog) return { error: 'Database function not available.' };
    try {
      const newLog = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_synced: 0,
        username: args.username || 'AI Assistant',
        ...args,
      };
      await dbAddAuditLog(newLog);
      return { success: `Audit log added for item ID '${args.item_id}'.` };
    } catch (error: any) {
      return { error: `Failed to add audit log: ${error.message}` };
    }
  };

  if (!aiClient.current) {
    return (
        <ChatPageContainer isModal={isModal}>
            <WelcomeScreen>
                <BotIcon />
                <h2>AI Assistant Unavailable</h2>
                <p>The AI features are currently disabled. Please ensure the API key is configured correctly.</p>
            </WelcomeScreen>
        </ChatPageContainer>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessageText = input;
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessageText }] }]);
    setInput('');
    setIsLoading(true);
    let responseText = '';

    try {
        if (!aiClient.current) throw new Error("AI client not initialized.");

        if (!chatRef.current) {
            const systemInstruction = `You are a function-calling AI model for a hardware store inventory system. Your goal is to assist users by performing actions and answering questions about inventory using the provided tools.

When you need to use a tool, respond ONLY with a JSON object in the following format:
{
  "tool_call": {
    "name": "tool_name",
    "args": { "arg1": "value1", "arg2": "value2" }
  }
}
Do NOT include any other text or markdown outside of this JSON object when making a tool call.

If you do not need to call a tool, respond with natural language.

Here are the tools you can use:

- 'searchStockItems': Use this to find inventory items.
  - Parameters: itemNameOrDescription (string), categoryName (string), sortBy (string), sortOrder (string).
  - Example JSON call: {"tool_call": {"name": "searchStockItems", "args": {"itemNameOrDescription": "hammer", "categoryName": "Tools"}}}
  - After the tool returns data, format the results as a Markdown table. If no items are found, inform the user.

- 'addHardware': Use this to add new items.
  - Parameters: description (string), category_id (string), quantity (string), retail_price (number), etc.
  - Example JSON call: {"tool_call": {"name": "addHardware", "args": {"description": "Wrench", "category_id": "123", "quantity": "5 units", "retail_price": 1000}}}
  - You will need to ask the user for all required information if not provided.

- 'updateHardware': Use this to modify existing items.
  - Parameters: id (string), description (string), category_id (string), etc.
  - Example JSON call: {"tool_call": {"name": "updateHardware", "args": {"id": "abc", "quantity": "10 units"}}}

- 'deleteHardware': Use this to mark items as deleted.
  - Parameters: id (string).
  - Example JSON call: {"tool_call": {"name": "deleteHardware", "args": {"id": "xyz"}}}
  - ALWAYS ask for user confirmation before performing a deletion.

- 'addAuditLog': Use this to record actions.
  - Parameters: item_id (string), change_description (string), username (string).
  - Example JSON call: {"tool_call": {"name": "addAuditLog", "args": {"item_id": "123", "change_description": "Item added by AI"}}}

Always provide a helpful and informative response based on tool outputs. Do not make up information. Report tool errors to the user.`;
            chatRef.current = aiClient.current.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                tools: [{ functionDeclarations: [searchStockItemsDeclaration, addHardwareDeclaration, updateHardwareDeclaration, deleteHardwareDeclaration, addAuditLogDeclaration] }],
                history: [
                    {
                        role: 'user',
                        parts: [{ text: 'Find screwdrivers' }],
                    },
                    {
                        role: 'model',
                        parts: [{
                            functionCall: {
                                name: 'searchStockItems',
                                args: { itemNameOrDescription: 'screwdriver' },
                            },
                        }],
                    },
                ],
            });
        }

        const chat = chatRef.current;
        console.log("[AI Debug] User message:", userMessageText);
        let response = await chat.sendMessage({ message: userMessageText });
        console.log("[AI Debug] Initial AI response:", response, "Function Calls (native):", typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls, "Text (native):", typeof response.text === 'function' ? response.text() : response.text);

        let toolCallDetected = false;
        let toolCallName: string | null = null;
        let toolCallArgs: any = null;

        // Attempt to parse AI's text response for a custom JSON tool call
        const aiTextResponse = typeof response.text === 'function' ? response.text() : response.text;
        if (aiTextResponse) {
            try {
                const parsedResponse = JSON.parse(aiTextResponse);
                if (parsedResponse && parsedResponse.tool_call && parsedResponse.tool_call.name && parsedResponse.tool_call.args) {
                    toolCallDetected = true;
                    toolCallName = parsedResponse.tool_call.name;
                    toolCallArgs = parsedResponse.tool_call.args;
                    console.log("[AI Debug] Custom JSON tool call detected:", toolCallName, toolCallArgs);
                }
            } catch (e) {
                // Not a JSON tool call, treat as regular text
            }
        }

        // If native functionCalls are present, prioritize them (though they haven't been working)
        const nativeFunctionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
        if (nativeFunctionCalls && nativeFunctionCalls.length > 0) {
            toolCallDetected = true;
            toolCallName = nativeFunctionCalls[0].name;
            toolCallArgs = nativeFunctionCalls[0].args;
            console.log("[AI Debug] Native function call detected (prioritized):", toolCallName, toolCallArgs);
        }


        if (toolCallDetected) {
            let functionResultPayload = null;
            if (toolCallName === 'searchStockItems') {
                const result = searchStockItems(toolCallArgs as any);
                functionResultPayload = { result };
            } else if (toolCallName === 'addHardware') {
                const result = await addHardware(toolCallArgs as any);
                functionResultPayload = { result };
            } else if (toolCallName === 'updateHardware') {
                const result = await updateHardware(toolCallArgs as any);
                functionResultPayload = { result };
            } else if (toolCallName === 'deleteHardware') {
                const result = await deleteHardware(toolCallArgs as any);
                functionResultPayload = { result };
            } else if (toolCallName === 'addAuditLog') {
                const result = await addAuditLog(toolCallArgs as any);
                functionResultPayload = { result };
            }

            console.log("[AI Debug] Function result payload:", functionResultPayload);

            if (functionResultPayload) {
                const result = functionResultPayload.result;
                if (result && typeof result === 'object' && 'error' in result) {
                    console.error("[AI Debug] Tool function returned an error:", result.error);
                    const errorResponse: Content = { role: 'model', parts: [{ text: `Error calling tool: ${result.error}` }] };
                    setMessages(prev => [...prev, errorResponse]);
                    setIsLoading(false);
                    return;
                }
                const functionResponsePart: Part = {
              functionResponse: {
                name: toolCallName as string,
                response: await result,
              },
                };
                console.log("[AI Debug] Sending function response back to AI:", functionResponsePart);
                // FIX: Wrap functionResponsePart in a Content object with role: 'function'
                response = await chat.sendMessage({
                    role: 'function', // or 'tool', depending on exact API expectation
                    parts: [functionResponsePart]
                });
                console.log("[AI Debug] AI response after function result:", response);
                // After sending function response, the AI should generate a text response.
                // We don't expect another tool call immediately after a functionResponse.
                // So, we'll break the loop here and process the final text response.
            } else {
                console.warn("[AI Debug] No function result payload generated for tool call:", toolCallName);
            }
        }

        // Now, process the final text response from the AI
        responseText = typeof response.text === 'function' ? response.text() : response.text;
        console.log("[AI Debug] Final AI response text:", responseText);

        if (!responseText?.trim()) {
            console.warn("[AI Debug] Final AI response text is empty. Using fallback message.");
            const fallbackMessage = "I'm sorry, I couldn't generate a response. Please try rephrasing your request.";
            const errorResponse: Content = { role: 'model', parts: [{ text: fallbackMessage }] };
            setMessages(prev => [...prev, errorResponse]);
        }
        else {
            const modelResponse: Content = { role: 'model', parts: [{ text: responseText }] };
            setMessages(prev => [...prev, modelResponse]);
        }

    } catch (err: any) {
      console.error("[AI] An error occurred during the request:", err);
      const errorResponse: Content = { role: 'model', parts: [{ text: `AI Error: ${err.message || 'An unexpected error occurred.'}` }] };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  return (
    <ChatPageContainer isModal={isModal}>
      <MessagesContainer>
        {messages.length === 0 && !isLoading && (
          <WelcomeScreen>
            <BotIcon />
            <h2>AI Assistant</h2>
            <p>Ask me anything about your stock, or for help with the app.</p>
          </WelcomeScreen>
        )}
        {messages.map((msg, index) => {
          const part = msg.parts[0];
          if (part && 'text' in part && part.text) {
            return (
              <MessageBubble key={index} isUser={msg.role === 'user'}>
                {parseMarkdownToReact(part.text)}
              </MessageBubble>
            );
          }
          return null;
        })}
        {isLoading && <LoadingBubble>Thinking...</LoadingBubble>}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer onSubmit={handleSend}>
        <InputWrapper>
          {SpeechRecognitionAPI && (
            <MicButton type="button" onClick={toggleListen} className={isListening ? 'mic-active' : ''} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
              {isListening ? <StopCircleIcon /> : <MicrophoneIcon />}
            </MicButton>
          )}
          <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="type or speak" disabled={isLoading} rows={1} />
        </InputWrapper>
        <SendButton type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
          <SendIcon />
        </SendButton>
      </InputContainer>
    </ChatPageContainer>
  );
};

export default Chatbot;
