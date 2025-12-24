import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface PreviewPaneProps {
  html: string;
}

export function PreviewPane({ html }: PreviewPaneProps) {
  const sanitized = useMemo(() => {
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [html]);

  const srcDoc = useMemo(() => {
    return `<!doctype html><html><head><style>body{margin:0;font-family:system-ui,sans-serif;padding:16px;background:#ffffff;color:#0f172a}</style></head><body>${sanitized}</body></html>`;
  }, [sanitized]);

  return (
    <iframe
      title="Preview"
      className="h-[360px] w-full rounded-2xl border border-slate-200 bg-white shadow-inner"
      sandbox=""
      srcDoc={srcDoc}
    />
  );
}
