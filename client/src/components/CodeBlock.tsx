
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Basic syntax highlighting for common languages
  const highlightCode = (code: string, language: string) => {
    const lines = code.split('\n');
    
    return lines.map((line: string, index: number) => {
      let highlightedLine = line;
      
      // Simple highlighting patterns
      if (language === 'javascript' || language === 'typescript' || language === 'jsx' || language === 'tsx') {
        // Keywords
        highlightedLine = highlightedLine.replace(
          /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch)\b/g,
          '<span class="text-purple-400">$1</span>'
        );
        // Strings
        highlightedLine = highlightedLine.replace(
          /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
          '<span class="text-emerald-400">$1$2$1</span>'
        );
        // Comments
        highlightedLine = highlightedLine.replace(
          /(\/\/.*$|\/\*.*?\*\/)/g,
          '<span class="text-gray-500 italic">$1</span>'
        );
      } else if (language === 'python') {
        // Keywords
        highlightedLine = highlightedLine.replace(
          /\b(def|class|if|else|elif|for|while|import|from|return|try|except|with|as|async|await)\b/g,
          '<span class="text-purple-400">$1</span>'
        );
        // Strings
        highlightedLine = highlightedLine.replace(
          /(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
          '<span class="text-emerald-400">$1$2$1</span>'
        );
        // Comments
        highlightedLine = highlightedLine.replace(
          /(#.*$)/g,
          '<span class="text-gray-500 italic">$1</span>'
        );
      }
      
      return (
        <div key={index} className="flex">
          <span className="text-gray-600 text-right w-8 mr-4 select-none font-mono text-xs">
            {index + 1}
          </span>
          <span 
            className="flex-1"
            dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }}
          />
        </div>
      );
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-800/50 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-xs text-gray-400 font-mono ml-2">{language}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700/50"
        >
          {isCopied ? (
            <CheckIcon className="w-3 h-3" />
          ) : (
            <CopyIcon className="w-3 h-3" />
          )}
        </Button>
      </div>
      <div className="bg-gray-950/80 p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code>
            {highlightCode(code, language)}
          </code>
        </pre>
      </div>
    </div>
  );
}
