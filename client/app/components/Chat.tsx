"use client"
import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input} from '@/components/ui/input'
import { MessageCircle, User, Bot, FileText } from 'lucide-react'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const Chat: React.FC =() => {

    interface Doc{
        pageContent?:String;
        metadata?:{
            loc?:{
                pageNumber?: number;
            };
            source?: string
        }
    }

    interface IMessage{
        role: 'assistant' | 'user',
        content?: string;
        documents?: Doc[];
    } 

    const [message, setmessage] = React.useState<string>('');
    const [Messages, setMessages] = React.useState<IMessage[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [expandedDocs, setExpandedDocs] = React.useState<{ [key: number]: boolean }>({});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [Messages, isLoading]);

    const handleSendChatMessage = async ()=>{
        if (!message.trim() || isLoading) return;
        
        const currentMessage = message.trim()
        setMessages(prev => [...prev, {role:'user', content: currentMessage} ])
        setmessage('')
        setIsLoading(true)
        
        try {
            if(!apiBaseUrl){
                throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured')
            }
            const res = await fetch(`${apiBaseUrl}/chat?message=${encodeURIComponent(currentMessage)}`)
            const data = await res.json()
            setMessages((prev)=>[...prev, {
              role: 'assistant',
              content: data?.message,
              documents: data?.docs,
            }])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages((prev)=>[...prev, {
              role: 'assistant',
              content: 'Sorry, there was an error processing your request.',
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const toggleDocs = (index: number) => {
        setExpandedDocs(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

  return (
    <div className='flex flex-col h-screen bg-linear-to-br from-slate-50 to-slate-100'>
        {/* Header */}
        <div className='bg-white border-b border-slate-200 px-6 py-4 shadow-sm'>
            <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-500 rounded-lg'>
                    <MessageCircle className='w-5 h-5 text-white' />
                </div>
                <div>
                    <h1 className='text-xl font-semibold text-slate-800'>PDF Chat Assistant</h1>
                    <p className='text-sm text-slate-500'>Ask questions about your uploaded PDF</p>
                </div>
            </div>
        </div>

        {/* Messages Container */}
        <div className='flex-1 overflow-y-auto px-4 py-6 space-y-4'>
            {Messages.length === 0 && (
                <div className='flex flex-col items-center justify-center h-full text-center px-4'>
                    <div className='p-4 bg-blue-100 rounded-full mb-4'>
                        <Bot className='w-12 h-12 text-blue-500' />
                    </div>
                    <h2 className='text-2xl font-semibold text-slate-700 mb-2'>Welcome to PDF Chat</h2>
                    <p className='text-slate-500 max-w-md'>
                        Upload a PDF file and start asking questions. I'll help you find information from your document.
                    </p>
                </div>
            )}

            {Messages.map((msg, index) => (
                <div
                    key={index}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {msg.role === 'assistant' && (
                        <div className='shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mt-1'>
                            <Bot className='w-5 h-5 text-white' />
                        </div>
                    )}
                    
                    <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                                msg.role === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-white text-slate-800 rounded-bl-sm border-slate-200 border'
                            }`}
                        >
                            <p className='whitespace-pre-wrap wrap-break-words'>{msg.content}</p>
                        </div>
                        
                        {msg.role === 'assistant' && msg.documents && msg.documents.length > 0 && (
                            <button
                                onClick={() => toggleDocs(index)}
                                className='mt-2 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors'
                            >
                                <FileText className='w-3 h-3' />
                                {expandedDocs[index] ? 'Hide' : 'Show'} sources ({msg.documents.length})
                            </button>
                        )}

                        {msg.role === 'assistant' && msg.documents && msg.documents.length > 0 && expandedDocs[index] && (
                            <div className='mt-2 w-full space-y-2'>
                                {msg.documents.map((doc, docIndex) => (
                                    <div
                                        key={docIndex}
                                        className='bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs'
                                    >
                                        {doc.metadata?.loc?.pageNumber && (
                                            <div className='text-slate-500 mb-1'>
                                                Page {doc.metadata.loc.pageNumber}
                                            </div>
                                        )}
                                        <p className='text-slate-700 line-clamp-3'>
                                            {doc.pageContent}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {msg.role === 'user' && (
                        <div className='shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center mt-1'>
                            <User className='w-5 h-5 text-slate-600' />
                        </div>
                    )}
                </div>
            ))}

            {isLoading && (
                <div className="flex gap-3 justify-start">
                    <div className='shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mt-1'>
                        <Bot className='w-5 h-5 text-white' />
                    </div>
                    <div className='bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-200'>
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                            <span className='text-slate-600'>Thinking...</span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className='bg-white border-t border-slate-200 px-4 py-4 shadow-lg'>
            <div className='flex gap-2.5 max-w-5xl mx-auto'>
                <Input 
                    value={message} 
                    onChange={(e)=>setmessage(e.target.value)} 
                    type="text" 
                    placeholder="Type your message here..."
                    disabled={isLoading}
                    className='flex-1'
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading && message.trim()) {
                            handleSendChatMessage()
                        }
                    }}
                />
                <Button 
                    onClick={handleSendChatMessage} 
                    disabled={!message.trim() || isLoading}
                    className='bg-blue-500 hover:bg-blue-600 text-white px-6'
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </Button>
            </div>
        </div>
    </div>
  )
}

export default Chat
