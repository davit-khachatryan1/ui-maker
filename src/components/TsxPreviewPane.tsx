import { useEffect, useState } from 'react';
import * as esbuild from 'esbuild-wasm';

let esbuildReady: Promise<void> | null = null;

async function ensureEsbuild(): Promise<void> {
  if (!esbuildReady) {
    esbuildReady = esbuild.initialize({
      wasmURL: new URL('esbuild-wasm/esbuild.wasm', import.meta.url).toString(),
      worker: true
    });
  }
  return esbuildReady;
}

interface TsxPreviewPaneProps {
  tsx: string;
}

export function TsxPreviewPane({ tsx }: TsxPreviewPaneProps) {
  const [srcDoc, setSrcDoc] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let moduleUrl: string | null = null;

    const buildPreview = async () => {
      if (!tsx.trim()) {
        setSrcDoc('');
        setError(null);
        return;
      }

      const unsafeMessage = getUnsafeReason(tsx);
      if (unsafeMessage) {
        setError(unsafeMessage);
        setSrcDoc('');
        return;
      }

      try {
        await ensureEsbuild();
        const wrapped = wrapTsx(tsx);
        const result = await esbuild.transform(wrapped, {
          loader: 'tsx',
          format: 'esm',
          jsx: 'automatic'
        });

        moduleUrl = URL.createObjectURL(new Blob([result.code], { type: 'text/javascript' }));
        const html = buildSrcDoc(moduleUrl);

        if (!isActive) {
          return;
        }

        setSrcDoc(html);
        setError(null);
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : 'TSX preview failed.';
        setError(message);
        setSrcDoc('');
      }
    };

    buildPreview();

    return () => {
      isActive = false;
      if (moduleUrl) {
        URL.revokeObjectURL(moduleUrl);
      }
    };
  }, [tsx]);

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        {error}
      </div>
    );
  }

  if (!srcDoc) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        TSX preview is unavailable.
      </div>
    );
  }

  return (
    <iframe
      title="TSX Preview"
      className="h-[360px] w-full rounded-2xl border border-slate-200 bg-white shadow-inner"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
    />
  );
}

function wrapTsx(tsx: string): string {
  const match = tsx.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
  if (match) {
    return tsx;
  }

  if (tsx.includes('export default')) {
    const stripped = tsx.replace(/export\s+default\s+/, '');
    return `const PreviewComponent = ${stripped};\nexport default PreviewComponent;`;
  }

  return `const PreviewComponent = () => (${tsx});\nexport default PreviewComponent;`;
}

function buildSrcDoc(moduleUrl: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; padding: 16px; background: #ffffff; color: #0f172a; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import React from '/@id/react';
      import { createRoot } from '/@id/react-dom/client';
      import Component from '${moduleUrl}';
      const root = createRoot(document.getElementById('root'));
      root.render(React.createElement(Component));
    </script>
  </body>
</html>`;
}

function getUnsafeReason(code: string): string | null {
  if (/<script/i.test(code)) {
    return 'TSX preview blocked: scripts are not allowed.';
  }
  if (/on[A-Z][a-zA-Z]+\s*=/.test(code)) {
    return 'TSX preview blocked: event handlers are not allowed.';
  }
  if (/dangerouslySetInnerHTML/.test(code)) {
    return 'TSX preview blocked: dangerouslySetInnerHTML is not allowed.';
  }
  return null;
}
