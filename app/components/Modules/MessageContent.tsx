import { memo, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

interface MessageContentProps {
    content: any;
    theme: string;
    t: (key: string) => string;
}

const MessageContent = memo(({ content, theme, t }: MessageContentProps) => {
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

    const markdownComponents = useMemo(() => ({
        code: (props: any) => <CodeBlock {...props} theme={theme} t={t} />,
        pre: ({ children }: any) => <div className="not-prose my-4">{children}</div>,
        p: ({ children, node }: any) => {
            // 检查子元素中是否包含块级元素（如代码块），避免 p > div 嵌套错误
            const hasBlockElement = (child: any): boolean => {
                if (!child) return false;

                // 检查是否是 div 元素
                if (child?.type === 'div') return true;

                // 检查是否包含 code-block 类名
                if (child?.props?.className?.includes?.('code-block')) return true;

                // 检查是否是 pre 或 code 元素（非 inline）
                if (child?.type === 'pre') return true;
                if (child?.type?.displayName === 'CodeBlock') return true;

                // 检查 props.inline 属性，如果是 false 或 undefined（但有 className），说明是代码块
                if (child?.props?.inline === false ||
                    (child?.props?.inline === undefined && child?.props?.className?.startsWith?.('language-'))) {
                    return true;
                }

                // 递归检查子元素
                if (child?.props?.children) {
                    const subChildren = Array.isArray(child.props.children)
                        ? child.props.children
                        : [child.props.children];
                    return subChildren.some(hasBlockElement);
                }

                return false;
            };

            const childArray = Array.isArray(children) ? children : [children];
            if (childArray.some(hasBlockElement)) {
                return <>{children}</>;
            }

            return <p className="my-1 leading-normal">{children}</p>;
        }
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
        return (
            <>
                {content.map((item, i) => {
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
                                className="max-w-[200px] h-auto rounded-lg my-2 border border-[var(--glass-border)] cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setEnlargedImage(item.image_url.url)}
                            />
                        );
                    }
                    return null;
                })}

                {/* Image Modal with Backdrop */}
                {enlargedImage && typeof window !== 'undefined' && createPortal(
                    <div
                        className="animate-fade-in"
                        onClick={() => setEnlargedImage(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            zIndex: 999999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(128, 128, 128, 0.85)',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        {/* Centered Image Container */}
                        <div
                            className="relative"
                            style={{
                                zIndex: 1000000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                maxWidth: '90vw',
                                maxHeight: '90vh'
                            }}
                        >
                            <img
                                src={enlargedImage}
                                alt="Enlarged view"
                                className="rounded-lg shadow-2xl"
                                style={{
                                    maxWidth: '90vw',
                                    maxHeight: '90vh',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Close Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEnlargedImage(null);
                                }}
                                className="bg-red-500 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg font-bold"
                                style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    right: '-12px',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    zIndex: 1000001
                                }}
                                title="关闭"
                            >
                                ×
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
            </>
        );
    }

    return null;
});

MessageContent.displayName = "MessageContent";

export default MessageContent;
