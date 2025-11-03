import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { GoogleGenAI, type FunctionDeclaration, Type, type Content, type Part, type Chat } from '@google/genai';
import { SendIcon, BotIcon, MicrophoneIcon, StopCircleIcon } from '../components/Icons';
import { useDb } from '../hooks/useDb';
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

// --- Web Speech API ---
const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// --- AI Function Declarations ---
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
  const { hardware, categories } = useDb();
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

  const searchStockItems = (
    args: { itemNameOrDescription?: string; categoryName?: string; sortBy?: 'description' | 'retail_price' | 'quantity'; sortOrder?: 'asc' | 'desc' },
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
  
    if (args.itemNameOrDescription) {
      results = results.filter(item => item.description?.toLowerCase().includes(args.itemNameOrDescription!.toLowerCase()));
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
                default:                    return 0;
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

    const userMessageText = input;
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessageText }] }]);
    setInput('');
    setIsLoading(true);
    let responseText = '';

    try {
        if (!aiClient.current) throw new Error("AI client not initialized.");
        
        if (!chatRef.current) {
            const systemInstruction = `You are a function-calling AI model for a hardware store inventory system. Your purpose is to answer user questions about stock by using the 'searchStockItems' function. You MUST call this function to answer questions. Do not answer from memory. After the function returns data, format the result as a Markdown table. If the function returns no items, inform the user. Do not make up information.`;
            chatRef.current = aiClient.current.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction },
                tools: [{ functionDeclarations: [searchStockItemsDeclaration] }]
            });
        }
        
        const chat = chatRef.current;
        let response = await chat.sendMessage({ message: userMessageText });

        while (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];
            
            let functionResultPayload = null;
            if (functionCall.name === 'searchStockItems') {
                const result = searchStockItems(functionCall.args as any);
                functionResultPayload = { result };
            }

            if (functionResultPayload) {
                const result = functionResultPayload.result;
                if (result && typeof result === 'object' && 'error' in result) {
                    // If the tool function returned an error, report it to the user.
                    const errorResponse: Content = { role: 'model', parts: [{ text: `Error calling tool: ${result.error}` }] };
                    setMessages(prev => [...prev, errorResponse]);
                    setIsLoading(false);
                    return; // Stop processing further and display the error
                }
                const functionResponsePart: Part = {
                    functionResponse: { name: functionCall.name, response: functionResultPayload },
                };
                response = await chat.sendMessage({ parts: [functionResponsePart] });
            } else {
                break; 
            }
        }

        responseText = response.text;

        if (!responseText?.trim()) {
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
