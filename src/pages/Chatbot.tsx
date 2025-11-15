import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { type Content } from '@google/generative-ai';
import { SendIcon, BotIcon, MicrophoneIcon, StopCircleIcon, ClearIcon } from '../components/Icons';
import { parseMarkdownToReact } from '../utils/markdown';
import { useDb } from '../hooks/useDb';
import { Card } from '../pages/Stock.styles';
import ItemDetailsModal from '../components/ItemDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import StockForm from '../components/StockForm';
import Modal from '../components/Modal';
import type { Hardware } from '../types/database';
import { useToast } from '../components/Toast';

// --- Minimal type definitions for Web Speech API ---
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal?: boolean;
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

const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// --- Styled Components ---
const ChatPageContainer = styled.div<{ $isModal?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  max-height: ${({ $isModal }) => ($isModal ? '90vh' : '100%')};

  @media (min-width: 768px) {
    height: 100%; /* Full height for desktop */
    max-width: 900px; /* Constrain width for desktop */
    margin: 0 auto; /* Center the container */
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--background);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 100%; /* Ensure it doesn't overflow its parent */

  @media (max-width: 767px) {
    padding: 24px 12px; /* Vertical 24px, Horizontal 12px */
  }
`;

const UserMessage = styled.div`
  max-width: 100%;
  padding: 16px;
  background-color: var(--surface-variant);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

const AIMessageContainer = styled.div`
  max-width: 100%;
  padding: 16px;
  background-color: var(--surface);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;

  &.error {
    background-color: var(--danger-surface);
    border-color: var(--danger);
    color: var(--danger);
  }

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

const AICard = styled.div`
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;

  &.error {
    background-color: var(--danger-surface);
    border-color: var(--danger);
    color: var(--danger);
  }

  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-top: 10px;
`;

const TableWrapper = styled.div`
  overflow-x: auto; /* Enable horizontal scrolling */
  width: 100%;
  margin-top: 10px;
  border-radius: 8px;
  /* Remove outer border so table uses single, collapsed borders for a cleaner look */
  background-color: transparent;
`;

const ItemTable = styled.table<{ $zebra?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; /* Ensure table is wide enough for scrolling */

  th {
    border: 1px solid var(--border);
    padding: 8px;
    text-align: left;
    white-space: nowrap; /* Prevent text wrapping */
    background-color: var(--surface-variant);
    font-weight: 600;
    color: var(--text-primary);
  }

  td {
    border: 1px solid var(--border);
    padding: 8px;
    text-align: left;
    color: var(--text-secondary);

    &.description-cell {
      white-space: normal;
      word-break: break-word;
    }
  }

  tbody tr {
    cursor: pointer;
    &:hover {
      background-color: var(--surface-variant);
    }
    ${({ $zebra }) => $zebra && `
      &:nth-child(even) {
        background-color: var(--surface-variant); // Or a slightly different shade
      }
    `}
  }
`;

const ResponseWrapper = styled.div`
  width: 100%;
  margin-bottom: 12px;
`;

const LoadingMessage = styled.div`
  padding: 16px;
  border-radius: 8px;
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

  @media (max-width: 767px) {
    padding: 12px 8px; /* Vertical 12px, Horizontal 8px */
  }
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
    box-shadow: 0 0 0 2px ${({ theme }) => (theme as any).primary}33;
    border-radius: 24px; /* Ensure corners remain rounded on focus */
  }

  @media (max-width: 767px) {
    padding: 12px 12px; /* Reduced horizontal padding */
    padding-left: 40px; /* Adjusted for MicButton */
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
  width: 40px; /* Reverted size */
  height: 40px; /* Reverted size */
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
  z-index: 1; /* Ensure button is above textarea */
  &:hover:not(:disabled) {
    background-color: var(--background);
    color: var(--text-primary);
  }
  &.mic-active { color: var(--danger); }
  svg { width: 32px; height: 32px; flex-shrink: 0; } /* Set icon size to 32px */

  @media (max-width: 767px) {
    left: 0px; /* Moved closer to the edge */
  }
`;

const SendButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  width: 48px; /* Reverted size */
  height: 48px; /* Reverted size */
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
  svg { width: 32px; height: 32px; flex-shrink: 0; } /* Set icon size to 32px */
`;

const ClearButton = styled.button`
  background-color: var(--surface-variant);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 10px 16px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: var(--background);
    color: var(--text-primary);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  display: flex;
  align-items: center;
  gap: 4px;
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
  setPage: (page: string, payload?: { auditItemId?: string }) => void;
  openStockFormWithAIItem: (item: Hardware) => void;
  onClearRef: React.MutableRefObject<(() => void) | null>;
}

const Chatbot: React.FC<ChatbotProps> = ({ isModal, setPage, openStockFormWithAIItem, onClearRef }) => {
  const { addToast } = useToast();
  // --- Custom Message Type for Structured Responses ---
interface CustomAIMessage {
  role: 'model';
  customData: {
    success: boolean;
    type: 'query_result' | 'natural_language' | 'error' | 'add_item_suggestion'; // Added new type
    message?: string;
    text?: string;
    data?: any[];
    itemData?: Hardware; // Added for add_item_suggestion
    renderHint?: string; // Added for renderHint
  };
}

type Message = Content | CustomAIMessage;

  const [messages, setMessages] = useState<Message[]>(() => {
  try {
    const savedMessages = localStorage.getItem('chatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [];
  } catch (error) {
    console.error("Failed to load chat history from local storage", error);
    localStorage.removeItem('chatHistory');
    return [];
  }
});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chatInputRef = useRef<HTMLTextAreaElement>(null); // Add this ref
  const [isInputEmpty, setIsInputEmpty] = useState(true); // New state for button disabled status
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { categories, hardware, updateHardware, deleteHardware } = useDb();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Hardware | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Save chat history to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history to local storage", error);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessageRef = messageRefs.current[messages.length - 1];
      if (lastMessageRef) {
        lastMessageRef.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [messages]);

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };

  useEffect(() => {
    onClearRef.current = handleClear;
    return () => {
      onClearRef.current = null;
    };
  }, [onClearRef, handleClear]);


  const handleMouseDown = () => {
    handleListen();
  };

  const handleMouseUp = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };


  const handleError = (error: Event | SpeechRecognitionErrorEvent | string) => {
    console.error("Speech recognition error:", error);
    setIsListening(false);
    let errorMessage = "An unknown speech recognition error occurred.";
    if (error instanceof Event && 'error' in error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    setMessages(prev => [...prev, { role: 'model', customData: { success: false, type: 'error', message: `Speech Error: ${errorMessage}` } }]);
  };

  const handleListen = () => {
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
              let interimTranscript = '';
              let finalTranscript = '';
      
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                  finalTranscript += transcript + ' ';
                } else {
                  interimTranscript += transcript;
                }
              }
              
              // Update the input state with both final and interim transcripts
              setInput((finalTranscript + interimTranscript).trim());
            };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => handleError(event);
      recognitionRef.current = recognition;
    }
    if (chatInputRef.current) {
      chatInputRef.current.value = ''; // Clear input at the start of listening
    }
    setInput(''); // Clear the state as well
    setIsInputEmpty(true); // Reset the button state
    recognitionRef.current.start();
    setIsListening(true);
  };

  const toggleListen = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      handleListen();
    }
  };

  // --- Handle Send ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputRef.current || !chatInputRef.current.value.trim() || isLoading) return;

    const userText = input; // Use the current input state
    setInput(''); // Clear the input field directly
    setIsInputEmpty(true); // Reset the button state

    // Map current messages to the format expected by the backend (Content[])
    const historyForBackend: Content[] = messages.map(msg => {
      if ('customData' in msg) {
        // If it's a custom AI message, convert it back to a simple 'model' text part for history
        return { role: 'model', parts: [{ text: msg.customData.text || msg.customData.message || '' }] };
      }
      return msg; // Already in Content format
    });

    const newMessages: Message[] = [...messages, { role: 'user', parts: [{ text: userText }] }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
    // Include the latest user message in the history sent to the backend
    const historyPayload = [
      ...historyForBackend,
      { role: 'user', parts: [{ text: userText }] },
    ];

    const response = await fetch('https://smart-backend-06fj.onrender.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history: historyPayload }),
    });

        if (!response.ok) {
            const errorData = await response.json();
            setMessages(prev => [...prev, { role: 'model', customData: { success: false, type: 'error', message: errorData.message || 'An unknown error occurred on the server.' } }]);
            return;
        }

        const data = await response.json();
        setMessages(prev => [...prev, { role: 'model', customData: data }]);

        // Handle new 'add_item_suggestion' type
        if (data.type === 'add_item_suggestion' && data.itemData) {
          openStockFormWithAIItem(data.itemData);
        }

    } catch (err: any) {
      console.error("[API Error]", err);
      setMessages(prev => [...prev, { role: 'model', customData: { success: false, type: 'error', message: `API Error: ${err.message}` } }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInputRef.current && chatInputRef.current.value.trim()) {
        handleSend(e as any);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsInputEmpty(e.target.value.trim() === '');
  };

  const handleItemClick = (item: Hardware) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
    setIsModalOpen(false); // Close the details modal
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteHardware(itemToDelete);
      addToast('Item deleted successfully', 'success');
    }
    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const handleEditRequest = (item: Hardware) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
    setIsModalOpen(false); // Close the details modal
  };

  const handleEditSubmit = (item: Partial<Hardware>) => {
    if (selectedItem) {
      updateHardware(selectedItem.id, item);
      addToast('Item updated successfully', 'success');
    }
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleHistoryRequest = (item: Hardware) => {
    setPage('audit-log', { auditItemId: item.id });
    setIsModalOpen(false); // Close the details modal
  };

  return (
    <ChatPageContainer $isModal={isModal}>
      <MessagesContainer>
        {messages.length === 0 && !isLoading && (
          <WelcomeScreen>
            <BotIcon />
            <h2>AI Assistant</h2>
            <p>Ask about stock, add items, or manage inventory.</p>
          </WelcomeScreen>
        )}
        {messages.map((msg, i) => {
          if (msg.role === 'user' && 'parts' in msg && msg.parts && msg.parts.length > 0) {
            return (
              <ResponseWrapper key={i} ref={(el) => { messageRefs.current[i] = el; }}>
                <UserMessage>{parseMarkdownToReact(msg.parts[0].text || '')}</UserMessage>
              </ResponseWrapper>
            );
          }
          // Only render model responses; show the immediately preceding user prompt above them
          if (msg.role === 'model' && 'customData' in msg) {
            const { type, message, text, data } = msg.customData;
            const respType = type ?? (text ? 'natural_language' : (data ? 'query_result' : undefined));

            // --- Query result rendering ---
            if (respType === 'query_result' && data && Array.isArray(data)) {
              // Helper to check if an object is likely a hardware item
              const isHardwareItem = (item: any): item is Hardware =>
                item && typeof item === 'object' && 'description' in item && 'quantity' in item && 'retail_price' in item && 'id' in item;

              // Use card view only for a small number of hardware items
              if (data.length > 0 && data.length <= 3 && data.every(isHardwareItem)) {
                return (
                  <ResponseWrapper key={i} ref={(el) => { messageRefs.current[i] = el; }}>
                    <CardContainer>
                      {data.map((item, idx) => {
                        const category = categories?.find(c => c.id === item.category_id);
                        return (
                          <Card key={idx} onClick={() => handleItemClick(item as Hardware)}>
                            <div className="card-header">
                              <span className="description">{item.description}</span>
                              {category && <span className="category-tag" style={{'--category-color': category.color} as React.CSSProperties}>{category.name}</span>}
                            </div>
                            <div className="card-body">
                              <div className="detail-item">
                                <span className="detail-label">Qty</span>
                                <span className="detail-value">{item.quantity || 'N/A'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Retail</span>
                                <span className="detail-value">
                                  {item.retail_price}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Wholesale</span>
                                <span className="detail-value">
                                  {item.wholesale_price}
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </CardContainer>
                  </ResponseWrapper>
                );
              } else if (data.length > 0) {
                // For larger results or non-hardware data, show a table
                const excluded = ['id', 'is_deleted', 'updated_at', 'created_at', 'updated_by', 'location'];
                let headers = Object.keys(data[0]).filter(k => !excluded.includes(k));

                // If category_id was in the original data, add 'category' to the end of headers
                if (Object.keys(data[0]).includes('category_id')) {
                  headers = headers.filter(h => h !== 'category_id'); // Ensure it's not duplicated if somehow present
                  headers.push('category');
                }

                return (
                  <ResponseWrapper key={i} ref={(el) => { messageRefs.current[i] = el; }}>
                    <AICard>
                      {message && <p>{message}</p>}
                      <TableWrapper>
                        <ItemTable $zebra={msg.customData.renderHint === 'zebra_table'}>
                          <thead>
                            <tr>
                              {headers.map(header => {
                                const displayHeader = header === 'quantity' ? 'Qty' :
                                                      header === 'wholesale_price' ? 'WP' :
                                                      header === 'retail_price' ? 'RP' :
                                                      header.replace(/_/g, ' ');
                                return <th key={header}>{displayHeader}</th>;
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((item, idx) => (
                              <tr key={idx} onClick={() => handleItemClick(item as Hardware)}>
                                {headers.map(header => {
                                  const isDescription = header === 'description';
                                  if (header === 'category') {
                                    const category = categories?.find(c => c.id === item.category_id);
                                    return <td key={header}>{category?.name || 'N/A'}</td>;
                                  }
                                  return <td key={header} className={isDescription ? 'description-cell' : ''}>{item[header]}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </ItemTable>
                      </TableWrapper>
                    </AICard>
                  </ResponseWrapper>
                );
              }
            }

            // --- Natural language rendering ---
            if (respType === 'natural_language' && text) {
              const looksLikeHtml = /<[^>]+>/.test(text.trim());
              const containsTable = /<table/i.test(text.trim());
              return (
                <ResponseWrapper key={i} ref={(el) => { messageRefs.current[i] = el; }}>
                  <AICard>
                    {looksLikeHtml ? (
                      containsTable ? (
                        <TableWrapper>
                          <div dangerouslySetInnerHTML={{ __html: text }} />
                        </TableWrapper>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: text }} />
                      )
                    ) : (
                      parseMarkdownToReact(text)
                    )}
                  </AICard>
                </ResponseWrapper>
              );
            }

            // --- Error or empty results ---
            if (type === 'error' && message) {
              return (
                <ResponseWrapper key={i} ref={(el) => { messageRefs.current[i] = el; }}>
                  <AICard className="error">{parseMarkdownToReact(message)}</AICard>
                </ResponseWrapper>
              );
            }

            if (respType === 'query_result' && data && data.length === 0) {
              return (
                <ResponseWrapper key={i} ref={(el) => { messageRefs.current[i] = el; }}>
                  <AICard>{message || 'No results found.'}</AICard>
                </ResponseWrapper>
              );
            }
          }
          return null;
        })}
        {isLoading && <LoadingMessage>Thinking...</LoadingMessage>}
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
            ref={chatInputRef}
            value={input} // Bind value to state
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type or speak..."
            disabled={isLoading}
            rows={1}
          />
        </InputWrapper>
        <SendButton type="submit" disabled={isInputEmpty || isLoading}>
          <SendIcon />
        </SendButton>
      </InputContainer>
      {selectedItem && (
        <ItemDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={selectedItem}
          onEdit={handleEditRequest}
          onHistory={handleHistoryRequest}
          onDelete={handleDeleteRequest}
        />
      )}
      {selectedItem && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Item">
          <StockForm
            onSubmit={handleEditSubmit}
            initialItem={selectedItem}
            categories={categories || []}
          />
        </Modal>
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
    </ChatPageContainer>
  );
};

export default Chatbot;
