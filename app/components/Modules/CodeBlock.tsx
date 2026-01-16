import { useState, memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
    theme?: string;
    t?: any;
    [key: string]: any;
}

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

const CodeBlock = memo(({ node, inline, className, children, theme, t, ...props }: CodeBlockProps) => {
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

export default CodeBlock;
