import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

interface MessageContentProps {
    content: any;
    theme: string;
    t: any;
}

const MessageContent = memo(({ content, theme, t }: MessageContentProps) => {
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

export default MessageContent;
