import { useState } from 'react';
import { toPng } from 'html-to-image';
import { useLanguage } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Message } from '../types';

/**
 * useChatExport Hook
 * 
 * 功能 (What):
 * 处理聊天记录的导出功能，将聊天界面转换为图片并下载。
 * Handles the export functionality of chat history, converting the chat interface to an image and downloading it.
 * 
 * 生效范围 (Where):
 * 仅在 ChatInterface 组件中使用。
 * Used only within the ChatInterface component.
 * 
 * 使用方法 (How):
 * const { isExporting, exportFeedback, handleExportImage } = useChatExport(chatContainerRef, messages);
 * 
 * @param chatContainerRef - 聊天容器的引用
 * @param messages - 当前的消息列表
 */
export function useChatExport(
    chatContainerRef: React.RefObject<HTMLDivElement | null>,
    messages: Message[]
) {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [isExporting, setIsExporting] = useState(false);
    const [exportFeedback, setExportFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

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
                        }
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
                console.error('toPng error details:', pngError);

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

            setExportFeedback({
                message: t("chat.exportSuccess") || "Export successful!",
                type: 'success'
            });

        } catch (error: any) {
            console.error('Export failed with details:', error);

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

            setExportFeedback({
                message: t("chat.exportError") || "Export failed. Please try again.",
                type: 'info'
            });
        } finally {
            setIsExporting(false);
            // Clear feedback after 3 seconds
            setTimeout(() => {
                setExportFeedback(null);
            }, 3000);
        }
    };

    return {
        isExporting,
        exportFeedback,
        handleExportImage
    };
}
