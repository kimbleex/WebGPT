"use client";

import { useState, useRef, useEffect, useMemo, memo, useTransition } from "react";
import { MODELS } from "./ModelSelector";
import ModelSelector from "./ModelSelector";
import { useLanguage } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toPng } from "html-to-image";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/lib/theme";

export interface Message {
    role: "user" | "assistant";
    content: any; // Can be string or array for multimodal
}

interface ChatInterfaceProps {
    accessPassword: string | null;
    initialMessages?: Message[];
    onMessagesChange?: (messages: Message[]) => void;
    user: any;
}

export default function ChatInterface({ accessPassword, initialMessages = [], onMessagesChange, user }: ChatInterfaceProps) {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [files, setFiles] = useState<File[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-expand textarea with requestAnimationFrame for better performance
    useEffect(() => {
        if (!textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const updateHeight = () => {
            if (textarea) {
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        };
        
        const rafId = requestAnimationFrame(updateHeight);
        return () => cancelAnimationFrame(rafId);
    }, [input]);

    // Create and cache image URLs
    const imageUrlMap = useMemo(() => {
        const map = new Map<number, string>();
        files.forEach((file, idx) => {
            if (file.type.startsWith("image/")) {
                map.set(idx, URL.createObjectURL(file));
            }
        });
        return map;
    }, [files]);

    // Cleanup image URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            imageUrlMap.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imageUrlMap]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        
        // 防止重复提交
        if ((!input.trim() && files.length === 0) || isLoading) return;
        
        // 立即设置加载状态，防止重复点击
        setIsLoading(true);
        
        // 保存当前输入和文件信息
        const currentInput = input;
        const currentFiles = [...files];
        
        // 立即清空输入框，防止重复提交
        setInput("");
        setFiles([]);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            let userContent: any = currentInput;

            if (currentFiles.length > 0) {
                const contentArray: any[] = [];
                if (currentInput.trim()) {
                    contentArray.push({ type: "text", text: currentInput });
                }

                for (const file of currentFiles) {
                    const base64 = await fileToBase64(file);
                    if (file.type.startsWith("image/")) {
                        contentArray.push({
                            type: "image_url",
                            image_url: { url: base64 }
                        });
                    }
                }
                userContent = contentArray;
            }

            const userMessage: Message = { role: "user", content: userContent };
            const newMessages = [...messages, userMessage];

            setMessages(newMessages);
            onMessagesChange?.(newMessages);

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-access-password": accessPassword || "",
                },
                body: JSON.stringify({
                    messages: newMessages.map((m, idx) => {
                        // Only send Base64 for the current message (the last one)
                        if (idx === newMessages.length - 1) return m;

                        // For previous messages, if content is an array, strip image data
                        if (Array.isArray(m.content)) {
                            return {
                                ...m,
                                content: m.content.map(item => {
                                    if (item.type === "image_url") {
                                        return { type: "text", text: "[Image]" };
                                    }
                                    return item;
                                })
                            };
                        }
                        return m;
                    }),
                    model: selectedModel,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || res.statusText);
            }

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = "";

            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
                    return updated;
                });
            }

            onMessagesChange?.([...newMessages, { role: "assistant", content: assistantMessage }]);

        } catch (error: any) {
            console.error("Chat error:", error);
            const errorMsg = `Error: ${error.message || "Something went wrong."}`;
            setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
            onMessagesChange?.([...messages, { role: "assistant", content: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportImage = async () => {
        if (!chatContainerRef.current || messages.length === 0) {
            console.warn('Cannot export: no messages or container not found');
            return;
        }

        setIsExporting(true);
        setShowActionMenu(false);

        // Declare variables at function scope so they're accessible in catch block
        let originalHeight = '';
        let originalOverflow = '';
        let originalWidth = '';
        let originalMaxWidth = '';
        let originalPadding = '';
        let images: NodeListOf<HTMLImageElement> | null = null;
        const originalImageStyles = new Map<HTMLImageElement, string>();
        const originalImageSrc = new Map<HTMLImageElement, string>();

        try {
            const node = chatContainerRef.current;

            // Store original styles
            originalHeight = node.style.height;
            originalOverflow = node.style.overflow;
            originalWidth = node.style.width;
            originalMaxWidth = node.style.maxWidth;
            originalPadding = node.style.padding;

            // Temporarily set styles for capture
            const exportWidth = 1000;
            node.style.height = 'auto';
            node.style.overflow = 'visible';
            node.style.width = `${exportWidth}px`;
            node.style.maxWidth = `${exportWidth}px`;
            node.style.padding = '80px 60px'; // Generous padding for the export

            // Wait for layout to settle
            await new Promise(resolve => setTimeout(resolve, 500));

            // Handle images for export - convert external images to base64 using server proxy
            images = node.querySelectorAll('img');
            
            const imageProcessingPromises = Array.from(images).map(async (img: HTMLImageElement) => {
                // Store original styles and src
                originalImageStyles.set(img, img.style.display || '');
                originalImageSrc.set(img, img.src);
                
                // Skip if already base64 or data URL (uploaded images)
                if (img.src.startsWith('data:') || img.src.startsWith('blob:') || 
                    img.src.startsWith('/') || img.src.startsWith(window.location.origin)) {
                    return;
                }
                
                // For external images, use server proxy to convert to base64
                try {
                    const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(img.src)}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.dataUrl) {
                            img.src = data.dataUrl;
                            console.log('Successfully converted external image to base64:', img.src.substring(0, 100) + '...');
                        } else {
                            console.warn('Image proxy returned no dataUrl:', data);
                        }
                    } else {
                        console.warn('Image proxy failed:', response.status, response.statusText);
                    }
                } catch (error) {
                    console.warn('Image proxy error:', error);
                }
            });
            
            // Wait for all image processing with timeout
            try {
                await Promise.race([
                    Promise.all(imageProcessingPromises),
                    new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
                ]);
            } catch (error) {
                console.warn('Some images failed to process, continuing with export:', error);
            }
            
            // Wait a bit for images to load after conversion
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get computed background color
            const computedStyle = window.getComputedStyle(document.body);
            let backgroundColor = computedStyle.getPropertyValue('--background').trim();
            
            // Fallback to theme-based color if CSS variable is not available
            if (!backgroundColor || backgroundColor.startsWith('var(')) {
                backgroundColor = theme === 'dark' ? '#0f0f12' : '#ffffff';
            }

            // Validate node before export
            if (!node || !node.parentElement) {
                throw new Error('Invalid node for export');
            }

            let dataUrl: string;
            try {
                dataUrl = await toPng(node, {
                    backgroundColor: backgroundColor,
                    width: exportWidth,
                    pixelRatio: 2,
                    cacheBust: true,
                    style: {
                        height: 'auto',
                        overflow: 'visible',
                        margin: '0',
                        borderRadius: '0',
                        display: 'flex',
                        flexDirection: 'column'
                    },
                    filter: (node) => {
                        if (node instanceof HTMLElement) {
                            if (node.classList.contains('no-export')) return false;
                            // Filter out input area and status bar
                            if (node.closest('.no-export')) return false;
                            // Filter out scrollbars
                            if (node.classList.contains('scrollbar-thin')) return false;
                        }
                        return true;
                    }
                });
            } catch (pngError: any) {
                console.error('toPng error details:', {
                    message: pngError?.message,
                    stack: pngError?.stack,
                    name: pngError?.name,
                    error: pngError
                });
                
                // Try alternative method with different options
                try {
                    dataUrl = await toPng(node, {
                        backgroundColor: backgroundColor,
                        pixelRatio: 1,
                        cacheBust: false,
                        filter: (node) => {
                            if (node instanceof HTMLElement) {
                                if (node.classList.contains('no-export')) return false;
                                if (node.closest('.no-export')) return false;
                            }
                            return true;
                        }
                    });
                } catch (fallbackError: any) {
                    console.error('Fallback export also failed:', fallbackError);
                    throw new Error(`Export failed: ${pngError?.message || 'Unknown error'}. Fallback also failed: ${fallbackError?.message || 'Unknown error'}`);
                }
            }

            // Restore original images
            Array.from(images).forEach((img: HTMLImageElement) => {
                const originalSrc = originalImageSrc.get(img);
                if (originalSrc) {
                    img.src = originalSrc;
                }
                const originalDisplay = originalImageStyles.get(img);
                if (originalDisplay) {
                    img.style.display = originalDisplay;
                }
            });
            
            // Restore original styles
            node.style.height = originalHeight;
            node.style.overflow = originalOverflow;
            node.style.width = originalWidth;
            node.style.maxWidth = originalMaxWidth;
            node.style.padding = originalPadding;

            if (!dataUrl) {
                throw new Error('Failed to generate image data');
            }

            const link = document.createElement('a');
            link.download = `chat-export-${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            console.error('Export failed with details:', {
                error,
                message: error?.message,
                stack: error?.stack,
                name: error?.name,
                stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
            
            // Restore styles even on error
            if (chatContainerRef.current) {
                const node = chatContainerRef.current;
                node.style.height = '';
                node.style.overflow = '';
                node.style.width = '';
                node.style.maxWidth = '';
                node.style.padding = '';
                
                // Restore original images
                if (images) {
                    Array.from(images).forEach((img: HTMLImageElement) => {
                        const originalSrc = originalImageSrc.get(img);
                        if (originalSrc) {
                            img.src = originalSrc;
                        }
                        const originalDisplay = originalImageStyles.get(img);
                        if (originalDisplay) {
                            img.style.display = originalDisplay;
                        }
                    });
                }
            }
            
            alert(t("chat.exportError") || "Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setShowActionMenu(false);
            }
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
                setShowModelMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getLanguageIcon = (lang: string) => {
        const l = lang.toLowerCase();
        // Python
        if (l === "python" || l === "py") return (
            <svg className="w-4 h-4 text-[#3776AB]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 2a8 8 0 100 16 8 8 0 000-16zm-1 2h2v2h-2V6zm0 4h2v6h-2v-6z" />
            </svg>
        );
        // JavaScript
        if (l === "javascript" || l === "js") return (
            <svg className="w-4 h-4 text-[#F7DF1E]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h18v18H3V3zm14.5 15c.828 0 1.5-.672 1.5-1.5S18.328 15 17.5 15s-1.5.672-1.5 1.5.672 1.5 1.5 1.5zM12 15c.828 0 1.5-.672 1.5-1.5S12.828 12 12 12s-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
            </svg>
        );
        // TypeScript
        if (l === "typescript" || l === "ts") return (
            <svg className="w-4 h-4 text-[#3178C6]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h18v18H3V3zm14.5 15c.828 0 1.5-.672 1.5-1.5S18.328 15 17.5 15s-1.5.672-1.5 1.5.672 1.5 1.5 1.5zM12 15c.828 0 1.5-.672 1.5-1.5S12.828 12 12 12s-1.5.672-1.5 1.5.672 1.5 1.5 1.5z" />
            </svg>
        );
        // HTML
        if (l === "html") return (
            <svg className="w-4 h-4 text-[#E34F26]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
        );
        // CSS
        if (l === "css") return (
            <svg className="w-4 h-4 text-[#1572B6]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
        );
        // Rust
        if (l === "rust" || l === "rs") return (
            <svg className="w-4 h-4 text-[#DEA584]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
        );
        // Go
        if (l === "go" || l === "golang") return (
            <svg className="w-4 h-4 text-[#00ADD8]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
        );
        // Java
        if (l === "java") return (
            <svg className="w-4 h-4 text-[#007396]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
        );
        // PHP
        if (l === "php") return (
            <svg className="w-4 h-4 text-[#777BB4]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
        );
        // Shell
        if (l === "shell" || l === "bash" || l === "sh") return (
            <svg className="w-4 h-4 text-[#4EAA25]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
        );
        // SQL
        if (l === "sql") return (
            <svg className="w-4 h-4 text-[#336791]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
        );
        // Markdown
        if (l === "markdown" || l === "md") return (
            <svg className="w-4 h-4 text-[#000000] dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
        );
        // JSON
        if (l === "json") return (
            <svg className="w-4 h-4 text-[#000000] dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M20 8V6a2 2 0 00-2-2h-2M20 16v2a2 2 0 01-2 2h-2" />
            </svg>
        );
        // Default code icon
        return (
            <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        );
    };

    const CodeBlock = memo(({ node, inline, className, children, theme, t, ...props }: any) => {
        const [copied, setCopied] = useState(false);
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : "";
        const content = String(children).replace(/\n$/, "");

        const handleCopy = async () => {
            try {
                await navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        };

        if (inline) {
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        }

        return (
            <div className="code-block-wrapper">
                <div className="code-block-header">
                    <div className="flex items-center space-x-2">
                        {getLanguageIcon(language)}
                        <span className="language-label font-bold">{language || "code"}</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`copy-button ${copied ? "copied" : ""}`}
                        title={copied ? "Copied!" : "Copy code"}
                    >
                        {copied ? (
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="code-block-content">
                    <SyntaxHighlighter
                        language={language}
                        style={{
                            ...(theme === "dark" ? vscDarkPlus : oneLight),
                            'pre[class*="language-"]': {
                                ...(theme === "dark" ? vscDarkPlus : oneLight)['pre[class*="language-"]'],
                                background: "var(--code-bg)",
                            },
                            'code[class*="language-"]': {
                                ...(theme === "dark" ? vscDarkPlus : oneLight)['code[class*="language-"]'],
                                background: "var(--code-bg)",
                            },
                        }}
                        showLineNumbers={true}
                        PreTag="div"
                        customStyle={{
                            background: "var(--code-bg)",
                            padding: "1rem",
                            margin: 0,
                        }}
                        lineNumberStyle={{
                            minWidth: "2.5em",
                            paddingRight: "1em",
                            color: "var(--text-muted)",
                            opacity: 0.5,
                            textAlign: "right",
                            userSelect: "none",
                        }}
                        {...props}
                    >
                        {content}
                    </SyntaxHighlighter>
                </div>
            </div>
        );
    });

    CodeBlock.displayName = "CodeBlock";

    const MessageContent = memo(({ content, theme, t }: { content: any, theme: string, t: any }) => {
        const markdownComponents = useMemo(() => ({
            code: (props: any) => <CodeBlock {...props} theme={theme} t={t} />,
            pre: ({ children }: any) => <>{children}</>
        }), [theme, t]);

        if (typeof content === "string") {
            return (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                >
                    {content}
                </ReactMarkdown>
            );
        }

        if (Array.isArray(content)) {
            return content.map((item, i) => {
                if (item.type === "text") {
                    return (
                        <ReactMarkdown
                            key={i}
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {item.text}
                        </ReactMarkdown>
                    );
                }
                if (item.type === "image_url") {
                    return (
                        <img
                            key={i}
                            src={item.image_url.url}
                            alt="Uploaded content"
                            className="max-w-full rounded-lg my-2 border border-[var(--glass-border)]"
                        />
                    );
                }
                return null;
            });
        }

        return null;
    });

    MessageContent.displayName = "MessageContent";

    const ChatMessage = memo(({ msg, user, selectedModel, theme, t }: { msg: Message, user: any, selectedModel: string, theme: string, t: any }) => {
        return (
            <div
                className={`flex items-start space-x-2 sm:space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
            >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1 min-w-[28px] sm:min-w-[32px]">
                    {msg.role === "user" ? (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shadow-sm">
                            {user?.username?.slice(0, 2).toUpperCase() || "U"}
                        </div>
                    ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--hover-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[10px] sm:text-xs font-bold text-[var(--accent-primary)] shadow-sm">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
                    <div className={`flex items-center mb-1 space-x-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-[var(--text-muted)]">
                            {msg.role === "user" ? user?.username : (MODELS.find(m => m.id === selectedModel)?.name || selectedModel)}
                        </span>
                    </div>
                    <div
                        className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm ${msg.role === "user"
                            ? "bg-[var(--chat-bubble-user)] text-white"
                            : "bg-[var(--chat-bubble-ai)] border border-[var(--glass-border)]"
                            }`}
                    >
                        <div className={`prose prose-sm max-w-none leading-relaxed ${msg.role === "user" 
                            ? "prose-invert text-white" 
                            : "text-[var(--chat-bubble-ai-text)] prose-zinc dark:prose-invert"
                            }`}>
                            <MessageContent content={msg.content} theme={theme} t={t} />
                        </div>
                    </div>
                </div>
            </div>
        );
    });

    ChatMessage.displayName = "ChatMessage";

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Header - Cleaned up */}
            <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none px-4 no-export">
                {/* ModelSelector removed from here */}
            </div>

            {/* Messages Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto pt-16 sm:pt-20 pb-32 sm:pb-40 md:pb-44 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
                <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-10 space-y-3 sm:space-y-4 md:space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-3 sm:space-y-4 px-3 sm:px-4 text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[var(--hover-bg)] flex items-center justify-center">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-base sm:text-lg font-medium">{t("chat.startChat")}</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <ChatMessage
                                key={idx}
                                msg={msg}
                                user={user}
                                selectedModel={selectedModel}
                                theme={theme}
                                t={t}
                            />
                        ))
                    )}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-[var(--chat-bubble-ai)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium italic text-[var(--text-muted)]">{t("chat.thinking") || "Thinking..."}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Bottom Spacer to ensure last message is above the input area */}
                    <div className="h-8 sm:h-12 md:h-16" />
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 lg:p-8 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/90 to-transparent no-export">
                <div className="max-w-5xl mx-auto space-y-3">
                    {/* Status Bar - Shows selected model and uploaded images */}
                    <div className="bg-[var(--panel-bg)]/60 backdrop-blur-xl border border-[var(--glass-border)]/60 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Model Selection - Clickable */}
                        <div className="relative min-w-0 flex-1 w-full sm:w-auto" ref={modelMenuRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModelMenu(!showModelMenu);
                                    setShowActionMenu(false);
                                }}
                                className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 w-full sm:w-auto hover:opacity-80 transition-opacity"
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] truncate">
                                    {t("chat.modelSelection")}:
                                </span>
                                <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground)] truncate opacity-90">
                                    {MODELS.find(m => m.id === selectedModel)?.name || MODELS[0]?.name || selectedModel}
                                </span>
                                <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${showModelMenu ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Model Selection Dropdown */}
                            {showModelMenu && (
                                <div className="absolute bottom-full left-0 mb-2 w-[calc(100vw-2rem)] sm:w-64 max-w-[280px] py-2 rounded-xl sm:rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="px-3 sm:px-4 py-2 border-b border-[var(--glass-border)]/10">
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t("chat.modelSelection")}</p>
                                    </div>
                                    <div className="max-h-[8rem] sm:max-h-[10rem] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--glass-border)]/60 scrollbar-track-transparent">
                                        {MODELS.map((model) => (
                                            <button
                                                key={model.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedModel(model.id);
                                                    setShowModelMenu(false);
                                                }}
                                                className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-between transition-all duration-150 first:rounded-t-xl last:rounded-b-xl ${selectedModel === model.id
                                                    ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold"
                                                    : "text-[var(--foreground)] hover:bg-[var(--hover-bg)]/70"
                                                    }`}
                                            >
                                                <span className="truncate">{model.name}</span>
                                                {selectedModel === model.id && (
                                                    <svg className="w-4 h-4 flex-shrink-0 ml-2 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Uploaded Images Preview */}
                        {files.length > 0 && (
                            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 w-full sm:w-auto justify-start sm:justify-end">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none">
                                    {files.slice(0, 3).map((file, displayIdx) => {
                                        const originalIdx = displayIdx;
                                        return (
                                        <div key={originalIdx} className="relative group flex flex-col items-center space-y-0.5 sm:space-y-1 flex-shrink-0">
                                            <div className="relative">
                                                {file.type.startsWith("image/") && imageUrlMap.has(originalIdx) ? (
                                                    <img
                                                        src={imageUrlMap.get(originalIdx)!}
                                                        alt={file.name}
                                                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-[var(--glass-border)]/50"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[var(--hover-bg)] border border-[var(--glass-border)]/50 flex items-center justify-center">
                                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => removeFile(originalIdx)}
                                                    className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] sm:text-[10px] hover:bg-red-600"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] max-w-[50px] sm:max-w-[60px] truncate" title={file.name}>
                                                {file.name}
                                            </span>
                                        </div>
                                        );
                                    })}
                                    {files.length > 3 && (
                                        <div className="flex flex-col items-center space-y-0.5 sm:space-y-1 flex-shrink-0">
                                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[var(--hover-bg)] border border-[var(--glass-border)]/50 flex items-center justify-center text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)]">
                                                +{files.length - 3}
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">
                                                more
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Unified Input Container */}
                    <div className="bg-[var(--panel-bg)]/70 backdrop-blur-2xl border border-[var(--glass-border)] rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Input Section */}
                        <form onSubmit={handleSubmit} className="relative bg-transparent flex items-end p-2 sm:p-3 md:p-4 gap-1 sm:gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                multiple
                                accept="image/*"
                            />

                            {/* Consolidated Action Button */}
                            <div className="relative" ref={actionMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowActionMenu(!showActionMenu);
                                        setActiveSubmenu(null);
                                    }}
                                    className={`p-2.5 sm:p-3 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-xl transition-all mb-1 flex items-center justify-center ${showActionMenu ? 'bg-[var(--hover-bg)] text-[var(--foreground)]' : ''}`}
                                    title={t("chat.actions")}
                                >
                                    <svg className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${showActionMenu ? 'rotate-45' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>

                                {showActionMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 sm:mb-4 w-[calc(100vw-2rem)] sm:w-64 max-w-[280px] py-2 rounded-xl sm:rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="px-4 py-2 border-b border-[var(--glass-border)]/10">
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t("chat.actions")}</p>
                                        </div>

                                        {/* Upload Image - Single Action */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                fileInputRef.current?.click();
                                                setShowActionMenu(false);
                                                setActiveSubmenu(null);
                                            }}
                                            className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-all flex items-center space-x-2 sm:space-x-3 group text-[var(--foreground)] hover:bg-[var(--hover-bg)]"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>{t("chat.uploadImage")}</span>
                                        </button>

                                        {/* Export Chat - Single Action */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportImage();
                                                setActiveSubmenu(null);
                                            }}
                                            disabled={isExporting}
                                            className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-all flex items-center space-x-2 sm:space-x-3 group text-[var(--foreground)] hover:bg-[var(--hover-bg)] disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>{isExporting ? t("chat.exporting") : t("chat.saveAsImage")}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setInput(newValue);
                                }}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={() => setIsComposing(false)}
                                onKeyDown={(e) => {
                                    // 中文输入法组合输入期间不处理回车键
                                    if (isComposing) return;
                                    
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        // 防止重复提交，检查是否已经在加载中
                                        if (!isLoading) {
                                            handleSubmit();
                                        }
                                    }
                                }}
                                rows={1}
                                placeholder={t("chat.placeholder")}
                                className="w-full bg-transparent border-none px-2 sm:px-3 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base text-[var(--foreground)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-0 resize-none max-h-[150px] sm:max-h-[200px] md:max-h-[300px] overflow-y-auto scrollbar-none"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={(!input.trim() && files.length === 0) || isLoading}
                                onClick={(e) => {
                                    // 防止重复点击
                                    if (isLoading) {
                                        e.preventDefault();
                                        return;
                                    }
                                }}
                                className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 mb-1 ml-1 sm:ml-2 flex-shrink-0"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p className="text-xs text-[var(--text-muted)]">
                        {t("chat.disclaimer")}
                    </p>
                </div>
            </div>
        </div>
    );
}
