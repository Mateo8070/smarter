import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleGenAI, type FunctionDeclaration, Type, type GenerateContentResponse, type Content, type Part } from '@google/genai';
import { SendIcon, BotIcon, MicrophoneIcon, StopCircleIcon } from '../components/Icons';
import { useDb } from '../hooks/useDb';
import type { Hardware, Category } from '../types/database';
import { parseMarkdownToReact } from '../utils/markdown';

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

// --- Web Speech API ---
// FIX: Cast `window` to `any` to access non-standard properties `SpeechRecognition` and `webkitSpeechRecognition`.
// FIX: Rename `SpeechRecognition` to `SpeechRecognitionAPI` to avoid shadowing the `SpeechRecognition` type.
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// --- AI Function Declarations ---
const getStockItemsDeclaration: FunctionDeclaration = {
  name: 'getStockItems',
  parameters: {
    type: Type.OBJECT,
    description: 'Get a list of stock items from the inventory database. Returns a maximum of 20 items.',
    properties: {
      query: {
        type: Type.STRING,
        description: 'A search term to filter items by their description.',
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


// --- Styled Components ---
const ChatPageContainer = styled.div<{ isModal?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: ${({ isModal }) => isModal ? '75vh' : '100%'};
  width: ${({ isModal }) => isModal ? '700px' : '100%'};
  max-width: ${({ isModal }) => isModal ? '90vw' : '100%'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 85%;
  padding: 12px 16px;
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
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background-color: var(--surface);
  gap: 12px;
`;

const ChatInput = styled.textarea`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background-color: var(--surface-variant);
  color: var(--text-primary);
  font-size: 1rem;
  resize: none;
  outline: none;
  max-height: 120px;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}33;
  }
`;

const ActionButton = styled.button`
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
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
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &.mic-active {
    color: var(--danger);
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
  const { hardware, categories } = useDb();
  const [messages, setMessages] = useState<Content[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiClient = useRef(getAiClient());
  
  const [isListening, setIsListening] = useState(false);
  // FIX: Use the `SpeechRecognition` type, which is now unshadowed.
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
    // FIX: Check for the renamed `SpeechRecognitionAPI` constant.
    if (!SpeechRecognitionAPI) {
      alert("Sorry, your browser doesn't support speech recognition.");
      return;
    }
    
    if (!recognitionRef.current) {
      // FIX: Instantiate using the renamed `SpeechRecognitionAPI` constant.
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false; // Stop after a single utterance
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
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

  const getStockItems = (
    args: { query?: string; categoryName?: string; sortBy?: 'description' | 'retail_price' | 'quantity'; sortOrder?: 'asc' | 'desc' },
  ): object => {
    let results = hardware ? [...hardware.filter(h => !h.is_deleted)] : [];
  
    if (args.categoryName) {
      const category = categories?.find(c => c.name.toLowerCase() === args.categoryName?.toLowerCase());
      if (category) {
        results = results.filter(item => item.category_id === category.id);
      } else {
        return { error: `Category '${args.categoryName}' not found.` };
      }
    }
  
    if (args.query) {
      results = results.filter(item => item.description?.toLowerCase().includes(args.query!.toLowerCase()));
    }
  
    if (args.sortBy) {
        const order = args.sortOrder === 'desc' ? -1 : 1;
        results.sort((a, b) => {
            switch(args.sortBy) {
                case 'description':
                    return (a.description || '').localeCompare(b.description || '') * order;
                case 'retail_price':
                    return ((a.retail_price || 0) - (b.retail_price || 0)) * order;
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
        retail_price: item.retail_price
    }));
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

    const userMessage: Content = { role: 'user', parts: [{ text: input }] };
    const newMessages: Content[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const systemInstruction = `You are a helpful inventory management assistant for 'Giya Hardware'. You can answer questions about the stock. You have access to tools to query the database. The available categories are: ${categories?.map(c => c.name).join(', ') || 'none'}. When asked for data from a tool, ALWAYS present it in a Markdown table. Do not return raw JSON. If a tool returns an empty array, inform the user that no items were found matching their criteria. If a tool returns an error, inform the user about the error.`;

      let response: GenerateContentResponse = await aiClient.current.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: newMessages,
        config: { systemInstruction },
        tools: [{ functionDeclarations: [getStockItemsDeclaration] }]
      });
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];
        let functionResponsePayload = null;
        let apiResponse: Content[] = [{ role: 'model', parts: [{ functionCall }] }];

        if (functionCall.name === 'getStockItems') {
            const result = getStockItems(functionCall.args as any);
            functionResponsePayload = { result };
        }
        
        if (functionResponsePayload) {
          apiResponse.push({
            role: 'user',
            parts: [{ functionResponse: { name: functionCall.name, response: functionResponsePayload } }]
          });
          
          const finalResult = await aiClient.current.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [...newMessages, ...apiResponse],
            config: { systemInstruction },
            tools: [{ functionDeclarations: [getStockItemsDeclaration] }]
          });
          response = finalResult;
        }
      }
      
      const modelResponse: Content = { role: 'model', parts: [{ text: response.text }] };
      setMessages(prev => [...prev, modelResponse]);

    } catch (err: any) {
      console.error("AI Error:", err);
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
        <ChatInput value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Type or speak a message..." disabled={isLoading} rows={1} />
        {/* FIX: Check for the renamed `SpeechRecognitionAPI` constant. */}
        {SpeechRecognitionAPI && (
          <ActionButton type="button" onClick={toggleListen} className={isListening ? 'mic-active' : ''} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
            {isListening ? <StopCircleIcon /> : <MicrophoneIcon />}
          </ActionButton>
        )}
        <ActionButton as="button" type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
          <SendIcon />
        </ActionButton>
      </InputContainer>
    </ChatPageContainer>
  );
};

export default Chatbot;
