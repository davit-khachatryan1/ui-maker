import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: 'html' | 'tsx';
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  language = 'html',
  className
}: CodeEditorProps) {
  const extensions = [
    language === 'tsx' ? javascript({ jsx: true, typescript: true }) : html()
  ];
  const safeValue = typeof value === 'string' ? value : '';

  return (
    <div className={className}>
      <CodeMirror
        value={safeValue}
        height="360px"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: false,
          foldGutter: false
        }}
        editable={!readOnly}
        extensions={extensions}
        onChange={(val) => onChange?.(val)}
      />
    </div>
  );
}
