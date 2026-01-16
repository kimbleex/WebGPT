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
import SysPrompt from "./Modules/SysPrompt";

export interface Message {
    role: "user" | "assistant" | "system";
    content: any;
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
    
    // 内存优化配置
    const MAX_MESSAGES = 20; // 限制消息数量，防止无限增长
    const MESSAGE_BATCH_SIZE = 5; // 分页加载的批次大小
    
    const [messages, setMessages] = useState<Message[]>(initialMessages.slice(-MAX_MESSAGES));
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
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
    const [memoryUsage, setMemoryUsage] = useState<{ used: number; limit: number } | null>(null);
    const [cleanupFeedback, setCleanupFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
    const [exportFeedback, setExportFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
    const [sysPrompt, setSysPrompt] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const modelMenuRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 初始化可见消息
    useEffect(() => {
        const totalMessages = messages.length;
        const startIndex = Math.max(0, totalMessages - MESSAGE_BATCH_SIZE);
        const initialVisible = messages.slice(startIndex);
        setVisibleMessages(initialVisible);
        setCurrentBatch(1);
        setHasMoreMessages(totalMessages > MESSAGE_BATCH_SIZE);
        
        // 延迟滚动到底部，确保DOM已更新
        setTimeout(() => scrollToBottom(), 100);
    }, [messages]);

    // 懒加载更多消息
    useEffect(() => {
        if (!loadMoreRef.current) return;

        // 清理之前的观察器
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreMessages) {
                    loadMoreMessages();
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(loadMoreRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMoreMessages, messages]);

    const loadMoreMessages = () => {
        const totalMessages = messages.length;
        const nextBatch = currentBatch + 1;
        const startIndex = Math.max(0, totalMessages - (nextBatch * MESSAGE_BATCH_SIZE));
        const endIndex = totalMessages - (currentBatch * MESSAGE_BATCH_SIZE);
        
        if (startIndex <= 0) {
            setVisibleMessages(messages);
            setHasMoreMessages(false);
        } else {
            const newVisible = messages.slice(startIndex, endIndex);
            setVisibleMessages(prev => [...newVisible, ...prev]);
            setCurrentBatch(nextBatch);
            setHasMoreMessages(startIndex > 0);
        }
    };

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

    // 优化：创建和管理图片URL，防止内存泄漏
    const [imageUrlMap, setImageUrlMap] = useState<Map<number, string>>(new Map());
    
    useEffect(() => {
        const newImageUrlMap = new Map<number, string>();
        const currentUrlMap = imageUrlMap;
        
        // 为当前文件重新创建URL映射
        files.forEach((file, idx) => {
            if (file.type.startsWith("image/")) {
                // 复用已有的URL，或创建新的
                if (currentUrlMap.has(idx)) {
                    newImageUrlMap.set(idx, currentUrlMap.get(idx)!);
                } else {
                    const url = URL.createObjectURL(file);
                    newImageUrlMap.set(idx, url);
                }
            }
        });
        
        // 释放不再使用的旧URL
        currentUrlMap.forEach((url, idx) => {
            if (!newImageUrlMap.has(idx)) {
                URL.revokeObjectURL(url);
            }
        });
        
        setImageUrlMap(newImageUrlMap);
        
        return () => {
            // 组件卸载时清理所有URL
            newImageUrlMap.forEach(url => URL.revokeObjectURL(url));
        };
    }, [files]);

    // 内存监控功能
     useEffect(() => {
         if (typeof window === 'undefined') return;
         
         // 检查是否支持内存 API
         const isMemoryApiSupported = (performance as any).memory !== undefined;
         
         if (!isMemoryApiSupported) {
             console.log('当前浏览器不支持 memory API，内存监控不可用');
             return;
         }
         
         const monitorMemory = () => {
             // 检查内存使用情况
             const memoryInfo = (performance as any).memory;
             if (memoryInfo) {
                 const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1048576);
                 const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1048576);
                 
                 // 更新内存使用状态
                 setMemoryUsage({ used: usedMB, limit: limitMB });
                 
                 // 如果内存使用超过80%，触发清理
                 if (usedMB > limitMB * 0.8) {
                     console.warn(`内存使用过高: ${usedMB}MB/${limitMB}MB，触发清理`);
                     
                     // 清理图片缓存
                     imageUrlMap.forEach(url => URL.revokeObjectURL(url));
                     setImageUrlMap(new Map());
                     
                     // 强制垃圾回收（如果可用）
                     if ((window as any).gc) {
                         (window as any).gc();
                     }
                 }
             }
         };
         
         // 立即检查一次内存
         monitorMemory();
         
         // 每2秒检查一次内存（实时更新）
         const interval = setInterval(monitorMemory, 2000);
         
         return () => clearInterval(interval);
     }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
            // 清空 input value，确保可以重复上传同一文件
            e.target.value = "";
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => {
            const fileToRemove = prev[index];
            
            // 如果是图片，先释放URL并重新索引
            if (fileToRemove && fileToRemove.type.startsWith("image/")) {
                setImageUrlMap((prevMap) => {
                    const reindexedMap = new Map<number, string>();
                    
                    // 先释放被删除文件的URL
                    if (prevMap.has(index)) {
                        URL.revokeObjectURL(prevMap.get(index)!);
                    }
                    
                    // 重新索引：只处理原数组中在被删除索引之前的文件
                    prevMap.forEach((url, idx) => {
                        if (idx < index) {
                            // 保持原索引
                            reindexedMap.set(idx, url);
                        } else if (idx > index) {
                            // 索引减1
                            reindexedMap.set(idx - 1, url);
                        }
                        // idx === index 的是被删除的，已经释放了
                    });
                    
                    return reindexedMap;
                });
            }
            
            return prev.filter((_, i) => i !== index);
        });
    };

    // 清理会话历史，释放内存
    const clearChatHistory = () => {
        const beforeMemory = memoryUsage?.used || 0;
        
        // 清理所有图片URL
        const imageCount = imageUrlMap.size;
        imageUrlMap.forEach(url => URL.revokeObjectURL(url));
        setImageUrlMap(new Map());
        
        // 清理文件
        const fileCount = files.length;
        setFiles([]);
        
        // 清理消息
        const messageCount = messages.length;
        setMessages([]);
        setVisibleMessages([]);
        setCurrentBatch(0);
        setHasMoreMessages(false);
        
        // 通知父组件
        onMessagesChange?.([]);
        
        // 显示清理反馈
        let feedbackMessage = t("chat.cleanupSuccess");
        
        // 如果翻译键不存在，使用默认消息
        if (feedbackMessage === "chat.cleanupSuccess") {
            feedbackMessage = `清理成功！释放了 ${messageCount} 条消息，${fileCount} 个文件，${imageCount} 张图片`;
        } else {
            // 替换占位符
            feedbackMessage = feedbackMessage
                .replace(/{messageCount}/g, messageCount.toString())
                .replace(/{fileCount}/g, fileCount.toString())
                .replace(/{imageCount}/g, imageCount.toString());
        }
        
        setCleanupFeedback({
            message: feedbackMessage,
            type: 'success'
        });
        
        // 3秒后自动隐藏反馈
        setTimeout(() => {
            setCleanupFeedback(null);
        }, 3000);
        
        console.log('会话历史已清理，内存已释放');
    };

    // 自动隐藏反馈消息
    useEffect(() => {
        if (cleanupFeedback) {
            const timer = setTimeout(() => {
                setCleanupFeedback(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [cleanupFeedback]);

    // 自动隐藏导出反馈消息
    useEffect(() => {
        if (exportFeedback) {
            const timer = setTimeout(() => {
                setExportFeedback(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [exportFeedback]);

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

        // 提升变量到函数作用域，使其在catch块中可用
        let trimmedMessages: Message[] = [];
        
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
            
            // 优化：限制消息数量，防止内存无限增长
            const newMessages = [...messages, userMessage];
            trimmedMessages = newMessages.length > MAX_MESSAGES 
                ? newMessages.slice(-MAX_MESSAGES)
                : newMessages;

            setMessages(trimmedMessages);
            onMessagesChange?.(trimmedMessages);

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-access-password": accessPassword || "",
                },
                body: JSON.stringify({
                    messages: (() => {
                        let apiMessages = trimmedMessages.map((m, idx) => {
                            if (idx === trimmedMessages.length - 1) return m;
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
                        });
                        if (sysPrompt) {
                            apiMessages = [{ role: "system", content: sysPrompt }, ...apiMessages];
                        }
                        return apiMessages;
                    })(),
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
            let lastUpdateTime = Date.now(); // 添加时间戳变量

            // 添加助手消息到临时变量，避免频繁更新状态
            const tempMessages = [...trimmedMessages, { role: "assistant" as const, content: "" }];
            setMessages(tempMessages);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                // 优化：减少状态更新频率，每100ms更新一次
                const now = Date.now();
                if (now - lastUpdateTime > 100) {
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
                        return updated;
                    });
                    lastUpdateTime = now;
                }
            }

            // 最终更新一次完整消息
            const finalMessages = [...trimmedMessages, { role: "assistant" as const, content: assistantMessage }];
            const finalTrimmedMessages = finalMessages.length > MAX_MESSAGES 
                ? finalMessages.slice(-MAX_MESSAGES)
                : finalMessages;
            
            setMessages(finalTrimmedMessages);
            onMessagesChange?.(finalTrimmedMessages);

        } catch (error: any) {
            console.error("Chat error:", error);
            const errorMsg = `Error: ${error.message || "Something went wrong."}`;
            
            // 优化：限制错误消息的数量
            const errorMessages = [...trimmedMessages, { role: "assistant" as const, content: errorMsg }];
            const finalErrorMessages = errorMessages.length > MAX_MESSAGES 
                ? errorMessages.slice(-MAX_MESSAGES)
                : errorMessages;
                
            setMessages(finalErrorMessages);
            onMessagesChange?.(finalErrorMessages);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportImage = async () => {
        if (!chatContainerRef.current) {
            setExportFeedback({
                message: t("chat.exportNoContainer") || "Export failed: chat container not found",
                type: 'info'
            });
            return;
        }
        
        if (messages.length === 0) {
            setExportFeedback({
                message: t("chat.exportNoMessages") || "No chat messages to export",
                type: 'info'
            });
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
                        className={`rounded-lg sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-sm ${msg.role === "user"
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
                        <>
                            {/* 懒加载更多消息的触发点 */}
                            {hasMoreMessages && (
                                <div ref={loadMoreRef} className="flex justify-center py-3 sm:py-4">
                                    <button 
                                        onClick={loadMoreMessages}
                                        className="px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors active:scale-95 touch-manipulation"
                                    >
                                        {t("chat.loadMore") || "Load More Messages"}
                                    </button>
                                </div>
                            )}
                            
                            {/* 渲染可见消息 */}
                            {visibleMessages.map((msg, idx) => (
                                <ChatMessage
                                    key={idx}
                                    msg={msg}
                                    user={user}
                                    selectedModel={selectedModel}
                                    theme={theme}
                                    t={t}
                                />
                            ))}
                        </>
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
                    {/* Cleanup Feedback */}
                    {cleanupFeedback && (
                        <div className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                            cleanupFeedback.type === 'success' 
                                ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                        }`}>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {cleanupFeedback.type === 'success' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                            {cleanupFeedback.message}
                        </div>
                    )}

                    {/* Export Feedback */}
                    {exportFeedback && (
                        <div className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                            exportFeedback.type === 'success' 
                                ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                                : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                        }`}>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {exportFeedback.message}
                        </div>
                    )}

                    {/* Status Bar - Shows selected model, memory usage, and uploaded images */}
                    <div className="bg-[var(--panel-bg)]/60 backdrop-blur-xl border border-[var(--glass-border)]/60 rounded-xl px-2 sm:px-4 py-1.5 sm:py-1.5 shadow-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Left Section - Model Selection */}
                        <div className="flex items-center min-w-0">
                            {/* Model Selection - Clickable */}
                            <div className="relative" ref={modelMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModelMenu(!showModelMenu);
                                        setShowActionMenu(false);
                                    }}
                                    className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity px-1.5 sm:px-2 py-1 rounded-lg border border-transparent hover:border-[var(--glass-border)]/30 active:scale-95"
                                >
                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] truncate">
                                        {t("chat.modelSelection")}:
                                    </span>
                                    <span className="text-[10px] sm:text-xs md:text-sm font-medium text-[var(--foreground)] truncate opacity-90 max-w-[50px] sm:max-w-[100px]">
                                        {MODELS.find(m => m.id === selectedModel)?.name || MODELS[0]?.name || selectedModel}
                                    </span>
                                    <svg className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${showModelMenu ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                </button>

                                {/* Model Selection Dropdown */}
                                {showModelMenu && (
                                    <div className="absolute bottom-full left-0 mb-3 w-64 max-w-[280px] rounded-xl sm:rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-2xl z-[101] overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="px-3 sm:px-4 py-2 border-b border-[var(--glass-border)]/30">
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t("chat.modelSelection")}</p>
                                        </div>
                                        <div className="max-h-[8rem] sm:max-h-[10rem] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--glass-border)]/60 scrollbar-track-transparent">
                                            {MODELS.map((model) => (
                                                <button
                                                    key={model.id}
                                                    onClick={() => {
                                                        setSelectedModel(model.id);
                                                        setShowModelMenu(false);
                                                    }}
                                                    className={`w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center justify-between transition-all duration-150 first:rounded-t-xl last:rounded-b-xl ${selectedModel === model.id
                                                        ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-semibold"
                                                        : "text-[var(--foreground)] hover:bg-[var(--hover-bg)]/70"
                                                        }`}
                                                >
                                                    <span className="truncate">{model.name}</span>
                                                    {selectedModel === model.id && (
                                                        <svg className="w-3.5 h-3.5 flex-shrink-0 ml-2 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* System Prompt */}
                            <div className="h-4 w-px border-r border-[var(--glass-border)]/30 flex-shrink-0" />
                            <SysPrompt sysPrompt={sysPrompt} onSysPromptChange={setSysPrompt} />
                        </div>

                        {/* Right Section - Memory Cleanup */}
                        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                            {/* Memory Usage Display - Hidden on very small screens */}
                            {memoryUsage ? (
                                <div 
                                    className="hidden sm:flex items-center space-x-1 text-[10px] md:text-xs text-[var(--text-muted)] border-r border-[var(--glass-border)]/30 pr-2 sm:pr-3 cursor-pointer hover:text-[var(--foreground)] transition-colors group"
                                    onClick={() => {
                                        const memoryInfo = (performance as any).memory;
                                        if (memoryInfo) {
                                            const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1048576);
                                            const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1048576);
                                            setMemoryUsage({ used: usedMB, limit: limitMB });
                                        }
                                    }}
                                    title="点击刷新内存状态"
                                >
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="font-medium transition-all">
                                        {memoryUsage.used}MB
                                    </span>
                                    <span className={`px-1 py-0.5 rounded text-[7px] font-bold transition-colors ${
                                        memoryUsage.used / memoryUsage.limit > 0.8 
                                            ? 'bg-red-500/20 text-red-500' 
                                            : memoryUsage.used / memoryUsage.limit > 0.6 
                                            ? 'bg-yellow-500/20 text-yellow-500'
                                            : 'bg-green-500/20 text-green-500'
                                    }`}>
                                        {Math.round((memoryUsage.used / memoryUsage.limit) * 100)}%
                                    </span>
                                </div>
                            ) : (
                                <div className="hidden sm:flex items-center space-x-1 text-[10px] md:text-xs text-[var(--text-muted)] border-r border-[var(--glass-border)]/30 pr-2 sm:pr-3">
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>N/A</span>
                                </div>
                            )}

                            {/* Memory Cleanup Button */}
                            <button
                                type="button"
                                onClick={clearChatHistory}
                                className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-500 hover:text-red-600 transition-colors active:scale-95"
                                title={t("chat.cleanupMemory") || "Clear chat history"}
                            >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="hidden sm:inline ml-1">{t("chat.cleanupMemory") || "Clean"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Unified Input Container */}
                    <div className="bg-[var(--panel-bg)]/70 backdrop-blur-2xl border border-[var(--glass-border)] rounded-xl sm:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-visible animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Input Section */}
                        <form onSubmit={handleSubmit} className="relative bg-transparent flex items-center p-2 sm:p-3 md:p-4 gap-1 sm:gap-2">
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
                                    className={`p-2.5 sm:p-3 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-xl transition-all mb-1 flex items-center justify-center active:scale-90 touch-manipulation ${showActionMenu ? 'bg-[var(--hover-bg)] text-[var(--foreground)]' : ''}`}
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

                            {/* Image Preview between Action Button and Textarea */}
                            {files.length > 0 && (
                                <div className="flex items-center gap-0.5 px-0 py-2 bg-[var(--hover-bg)]/50 rounded-xl max-w-[280px] sm:max-w-[380px] md:max-w-[480px] overflow-visible flex-shrink-0 max-h-[150px] sm:max-h-[200px] md:max-h-[300px]">
                                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none h-full">
                                        {files.slice(0, 4).map((file, displayIdx) => {
                                            const originalIdx = displayIdx;
                                            return (
                                                <div key={originalIdx} className="relative group flex-shrink-0 p-2">
                                                    <div className="relative">
                                                        {file.type.startsWith("image/") && imageUrlMap.has(originalIdx) ? (
                                                            <img
                                                                src={imageUrlMap.get(originalIdx)!}
                                                                alt={file.name}
                                                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover border border-[var(--glass-border)]"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center">
                                                                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => removeFile(originalIdx)}
                                                            className="absolute -top-2 -right-2 w-4.5 h-4.5 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 transition-all text-[10px] sm:text-xs hover:bg-red-600 shadow-md hover:scale-110 z-20"
                                                            title="Remove"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {files.length > 4 && (
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] flex-shrink-0">
                                                +{files.length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                                        {files.length}
                                    </span>
                                </div>
                            )}

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
                                    if (isComposing) return;
                                    
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (!isLoading) {
                                            handleSubmit();
                                        }
                                    }
                                }}
                                rows={1}
                                placeholder={t("chat.placeholder")}
                                className="w-full bg-transparent border-none px-2 sm:px-3 py-2.5 text-sm sm:text-base text-[var(--foreground)] placeholder-[var(--text-muted)]/70 focus:outline-none focus:ring-0 resize-none max-h-[150px] sm:max-h-[200px] md:max-h-[300px] overflow-y-auto scrollbar-none leading-relaxed"
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
                                className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 ml-1 sm:ml-2 flex-shrink-0 self-center active:scale-90 touch-manipulation"
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
