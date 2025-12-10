import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Override paragraph to handle block math spacing nicely if needed
          p: ({ node, children }) => <p className="mb-2 last:mb-0">{children}</p>,
          // Ensure code blocks are styled cleanly
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <code className={`${className} bg-slate-100 rounded px-1 py-0.5 text-sm font-mono`} {...props}>
                {children}
              </code>
            ) : (
              <code className="bg-slate-100 rounded px-1 py-0.5 text-sm font-mono text-pink-600" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;