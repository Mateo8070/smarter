import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleGenAI, type FunctionDeclaration, Type, type Content, type Part, type Chat } from '@google/genai';
import { SendIcon, BotIcon, MicrophoneIcon, StopCircleIcon } from '../components/Icons';
import { useDb } from '../hooks/useDb';
import { db } from '../db/db';
import type { Hardware } from '../types/database';
import { parseMarkdownToReact } from '../utils/markdown';

// --- Minimal type definitions for Web Speech API ---
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

// --- Tool Declarations ---
const searchStockItemsDeclaration: FunctionDeclaration = {
  name: 'searchStockItems',
  parameters: {
    type: Type.OBJECT,
    description: 'Searches the inventory database for stock items.',
    properties: {
      itemNameOrDescription: { type: Type.STRING, description: 'Name or keyword to search for.' },
      categoryName: { type: Type.STRING, description: 'Filter by category name.' },
      sortBy: { type: Type.STRING, description: 'Sort by: description, retail_price, quantity.' },
      sortOrder: { type: Type.STRING, description: 'asc or desc. Default: asc.' },
    },
    required: [],
  },
};

const addHardwareDeclaration: FunctionDeclaration = {
  name: 'addHardware',
  parameters: {
    type: Type.OBJECT,
    description: 'Adds a new hardware item.',
    properties: {
      description: { type: Type.STRING },
      category_id: { type: Type.STRING },
      quantity: { type: Type.STRING },
      retail_price: { type: Type.NUMBER },
      retail_price_unit: { type: Type.STRING },
      wholesale_price: { type: Type.NUMBER },
      wholesale_price_unit: { type: Type.STRING },
      supplier: { type: Type.STRING },
      min_stock_level: { type: Type.NUMBER },
      location: { type: Type.STRING },
      notes: { type: Type.STRING },
    },
    required: ['description', 'category_id', 'quantity', 'retail_price'],
  },
};

const updateHardwareDeclaration: FunctionDeclaration = {
  name: 'updateHardware',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates an existing item.',
    properties: {
      id: { type: Type.STRING },
      description: { type: Type.STRING },
      category_id: { type: Type.STRING },
      quantity: { type: Type.STRING },
      retail_price: { type: Type.NUMBER },
      retail_price_unit: { type: Type.STRING },
      wholesale_price: { type: Type.NUMBER },
      wholesale_price_unit: { type: Type.STRING },
      supplier: { type: Type.STRING },
      min_stock_level: { type: Type.NUMBER },
      location: { type: Type.STRING },
      notes: { type: Type.STRING },
    },
    required: ['id'],
  },
};

const deleteHardwareDeclaration: FunctionDeclaration = {
  name: 'deleteHardware',
  parameters: {
    type: Type.OBJECT,
    description: 'Marks an item as deleted.',
    properties: { id: { type: Type.STRING } },
    required: ['id'],
  },
};

const addAuditLogDeclaration: FunctionDeclaration = {
  name: 'addAuditLog',
  parameters: {
    type: Type.OBJECT,
    description: 'Logs an action.',
    properties: {
      item_id: { type: Type.STRING },
      change_description: { type: Type.STRING },
      username: { type: Type.STRING },
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

  & table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 14px;
    background-color: var(--background);
    color: var(--text-primary);
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
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}33;
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
  &.mic-active { color: var(--danger); }
  svg { width: 20px; height: 20px; }
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
  svg { width: 48px; height: 48px; margin-bottom: 16px; color: var(--primary); }
  h2 { color: var(--text-primary); }
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

  // --- Speech Recognition ---
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
      alert("Speech recognition not supported.");
      return;
    }
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += transcript;
          else interimлювати += transcript;
        }
        setInput(final || interim);
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
    setInput('');
    recognitionRef.current.start();
    setIsListening(true);
  };

  // --- Tool: searchStockItems ---
  const searchStockItems = async (args: any): Promise<{ result: any[] } | { error: string }> => {
    const parsed = typeof args === 'string' ? JSON.parse(args) : args || {};
    let results: Hardware[] = [];

    if (hardware?.length) {
      results = hardware.filter(h => !h.is_deleted);
    } else {
      try {
        const items = await db.hardware.toArray();
        results = items.filter(h => !h.is_deleted);
      } catch (err: any) {
        return { error: `DB error: ${err.message}` };
      }
    }

    if (parsed.categoryName) {
      const cat = categories?.find(c => c.name.toLowerCase() === parsed.categoryName.toLowerCase());
      if (!cat) return { error: `Category '${parsed.categoryName}' not found.` };
      results = results.filter(i => i.category_id === cat.id);
    }

    if (parsed.itemNameOrDescription) {
      const term = parsed.itemNameOrDescription.toLowerCase();
      results = results.filter(i => i.description?.toLowerCase().includes(term));
    }

    if (parsed.sortBy) {
      const order = parsed.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        switch (parsed.sortBy) {
          case 'description': return a.description.localeCompare(b.description) * order;
          case 'retail_price': return ((a.retail_price || 0) - (b.retail_price || 0)) * order;
          case 'quantity':
            const qa = parseInt(a.quantity || '0', 10);
            const qb = parseInt(b.quantity || '0', 10);
            return (qa - qb) * order;
          default: return 0;
        }
      });
    }

    return {
      result: results.slice(0, 20).map(item => ({
        description: item.description,
        category: categories?.find(c => c.id === item.category_id)?.name || 'N/A',
        quantity: item.quantity,
        retail_price: item.retail_price,
      }))
    };
  };

  // --- Tool: addHardware ---
  const addHardware = async (args: any): Promise<{ success: string } | { error: string }> => {
    if (!dbAddHardware || !dbAddAuditLog) return { error: 'DB not ready.' };
    try {
      const newItem: Hardware = {
        id: crypto.randomUUID(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        ...args,
      };
      await dbAddHardware(newItem);
      await dbAddAuditLog({
        id: crypto.randomUUID(),
        item_id: newItem.id,
        change_description: `AI added: ${newItem.description}`,
        created_at: new Date().toISOString(),
        username: 'AI Assistant',
        is_synced: 0,
      });
      return { success: `Added: ${newItem.description} (ID: ${newItem.id})` };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // --- Tool: updateHardware ---
  const updateHardware = async (args: any): Promise<{ success: string } | { error: string }> => {
    if (!dbUpdateHardware || !dbAddAuditLog) return { error: 'DB not ready.' };
    try {
      const { id, ...updates } = args;
      await dbUpdateHardware(id, { ...updates, updated_at: new Date().toISOString() });
      await dbAddAuditLog({
        id: crypto.randomUUID(),
        item_id: id,
        change_description: `AI updated: ${JSON.stringify(updates)}`,
        created_at: new Date().toISOString(),
        username: 'AI Assistant',
        is_synced: 0,
      });
      return { success: `Updated item ID: ${id}` };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // --- Tool: deleteHardware ---
  const deleteHardware = async (args: { id: string }): Promise<{ success: string } | { error: string }> => {
    if (!dbDeleteHardware || !dbAddAuditLog) return { error: 'DB not ready.' };
    try {
      await dbDeleteHardware(args.id);
      await dbAddAuditLog({
        id: crypto.randomUUID(),
        item_id: args.id,
        change_description: `AI deleted item ID: ${args.id}`,
        created_at: new Date().toISOString(),
        username: 'AI Assistant',
        is_synced: 0,
      });
      return { success: `Deleted item ID: ${args.id}` };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // --- Tool: addAuditLog ---
  const addAuditLog = async (args: any): Promise<{ success: string } | { error: string }> => {
    if (!dbAddAuditLog) return { error: 'DB not ready.' };
    try {
      const log = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        is_synced: 0,
        username: args.username || 'AI Assistant',
        ...args,
      };
      await dbAddAuditLog(log);
      return { success: `Logged action for item ${args.item_id}` };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // --- AI Client Guard ---
  if (!aiClient.current) {
    return (
      <ChatPageContainer isModal={isModal}>
        <WelcomeScreen>
          <BotIcon />
          <h2>AI Assistant Unavailable</h2>
          <p>Please set API_KEY in environment.</p>
        </WelcomeScreen>
      </ChatPageContainer>
    );
  }

  // --- Handle Send ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userText }] }]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        const systemInstruction = `You are an AI assistant for a hardware store. Use tools to search, add, update, or delete inventory. Respond with JSON tool calls when needed. Format results as Markdown tables.`;
        chatRef.current = aiClient.current!.chats.create({
          model: 'gemini-1.5-flash',
          config: { systemInstruction },
          tools: [{ functionDeclarations: [searchStockItemsDeclaration, addHardwareDeclaration, updateHardwareDeclaration, deleteHardwareDeclaration, addAuditLogDeclaration] }],
        });
      }

      const chat = chatRef.current;
      let response = await chat.sendMessage(userText);

      // --- Handle Tool Calls ---
      let toolCall = null;
      const textResponse = typeof response.text === 'function' ? response.text() : response.text;

      if (textResponse) {
        try {
          const json = JSON.parse(textResponse);
          if (json.tool_call?.name) {
            toolCall = { name: json.tool_call.name, args: json.tool_call.args };
          }
        } catch {}
      }

      const nativeCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
      if (nativeCalls?.length > 0) {
        toolCall = { name: nativeCalls[0].name, args: nativeCalls[0].args };
      }

      if (toolCall) {
        let result: any;
        switch (toolCall.name) {
          case 'searchStockItems': result = await searchStockItems(toolCall.args); break;
          case 'addHardware': result = await addHardware(toolCall.args); break;
          case 'updateHardware': result = await updateHardware(toolCall.args); break;
          case 'deleteHardware': result = await deleteHardware(toolCall.args); break;
          case 'addAuditLog': result = await addAuditLog(toolCall.args); break;
          default: result = { error: 'Unknown tool' };
        }

        if (result.error) {
          setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${result.error}` }] }]);
          setIsLoading(false);
          return;
        }

        const functionResponsePart: Part = {
          functionResponse: {
            name: toolCall.name,
            response: result // Already { result: [...] } or { success: ... }
          }
        };

        response = await chat.sendMessage([
          { role: 'user', parts: [functionResponsePart] }
        ]);
      }

      // --- Final Response ---
      const finalText = typeof response.text === 'function' ? response.text() : response.text;
      const reply = finalText?.trim() || "No response generated.";
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: reply }] }]);

    } catch (err: any) {
      console.error("[AI Error]", err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `AI Error: ${err.message}` }] }]);
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
            <p>Ask about stock, add items, or manage inventory.</p>
          </WelcomeScreen>
        )}
        {messages.map((msg, i) => {
          const part = msg.parts[0];
          if (part?.text) {
            return <MessageBubble key={i} isUser={msg.role === 'user'}>{parseMarkdownToReact(part.text)}</MessageBubble>;
          }
          return null;
        })}
        {isLoading && <LoadingBubble>Thinking...</LoadingBubble>}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer onSubmit={handleSend}>
        <InputWrapper>
          {SpeechRecognitionAPI && (
            <MicButton type="button" onClick={toggleListen} className={isListening ? 'mic-active' : ''}>
              {isListening ? <StopCircleIcon /> : <MicrophoneIcon />}
            </MicButton>
          )}
          <ChatInput
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type or speak..."
            disabled={isLoading}
            rows={1}
          />
        </InputWrapper>
        <SendButton type="submit" disabled={!input.trim() || isLoading}>
          <SendIcon />
        </SendButton>
      </InputContainer>
    </ChatPageContainer>
  );
};

export default Chatbot;