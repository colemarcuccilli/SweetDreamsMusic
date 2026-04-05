'use client';

import { useMemo } from 'react';

interface BlogContentProps {
  content: string;
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseInline(text: string): string {
  let result = escapeHtml(text);

  // Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

  // Italic: *text*
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');

  // Inline code: `code`
  result = result.replace(
    /`(.+?)`/g,
    '<code class="bg-black/5 text-black/80 px-1.5 py-0.5 text-sm font-mono rounded">$1</code>'
  );

  // Links: [text](url)
  result = result.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="text-[#F4C430] hover:underline font-semibold" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return result;
}

function renderMarkdown(content: string): string {
  const lines = content.split('\n');
  const html: string[] = [];
  let inList = false;
  let inOrderedList = false;
  let inBlockquote = false;
  let inCallout = false;
  let calloutContent: string[] = [];

  function closeList() {
    if (inList) { html.push('</ul>'); inList = false; }
    if (inOrderedList) { html.push('</ol>'); inOrderedList = false; }
  }

  function closeBlockquote() {
    if (inBlockquote) { html.push('</blockquote>'); inBlockquote = false; }
  }

  function closeCallout() {
    if (inCallout) {
      html.push(
        `<div class="bg-[#F4C430]/10 border-l-4 border-[#F4C430] p-6 my-8">
          <p class="font-mono text-xs font-semibold tracking-[0.2em] uppercase text-[#F4C430] mb-2">Sweet Dreams Recommends</p>
          <div class="text-black/80 font-mono text-sm space-y-2">${calloutContent.map(l => `<p>${parseInline(l)}</p>`).join('')}</div>
        </div>`
      );
      inCallout = false;
      calloutContent = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Callout blocks: :::recommend ... :::
    if (line.trim() === ':::recommend') {
      closeList();
      closeBlockquote();
      inCallout = true;
      calloutContent = [];
      continue;
    }
    if (line.trim() === ':::' && inCallout) {
      closeCallout();
      continue;
    }
    if (inCallout) {
      if (line.trim()) calloutContent.push(line.trim());
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      closeBlockquote();
      continue;
    }

    // Headings
    const h3Match = line.match(/^###\s+(.+)/);
    if (h3Match) {
      closeList();
      closeBlockquote();
      const text = h3Match[1];
      const id = generateId(text);
      html.push(`<h3 id="${id}" class="text-lg sm:text-xl font-bold uppercase tracking-wide mt-10 mb-4 scroll-mt-24">${parseInline(text)}</h3>`);
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      closeList();
      closeBlockquote();
      const text = h2Match[1];
      const id = generateId(text);
      html.push(`<h2 id="${id}" class="text-xl sm:text-2xl font-bold uppercase tracking-wide mt-12 mb-5 scroll-mt-24">${parseInline(text)}</h2>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeList();
      closeBlockquote();
      html.push('<hr class="border-t border-black/10 my-8" />');
      continue;
    }

    // Blockquote
    const bqMatch = line.match(/^>\s*(.*)/);
    if (bqMatch) {
      closeList();
      if (!inBlockquote) {
        html.push('<blockquote class="border-l-4 border-[#F4C430] pl-5 my-6 italic text-black/60">');
        inBlockquote = true;
      }
      html.push(`<p class="font-mono text-sm">${parseInline(bqMatch[1])}</p>`);
      continue;
    } else {
      closeBlockquote();
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (inOrderedList) { html.push('</ol>'); inOrderedList = false; }
      if (!inList) {
        html.push('<ul class="list-disc pl-6 my-4 space-y-2">');
        inList = true;
      }
      html.push(`<li class="font-mono text-sm text-black/70 leading-relaxed">${parseInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (inList) { html.push('</ul>'); inList = false; }
      if (!inOrderedList) {
        html.push('<ol class="list-decimal pl-6 my-4 space-y-2">');
        inOrderedList = true;
      }
      html.push(`<li class="font-mono text-sm text-black/70 leading-relaxed">${parseInline(olMatch[1])}</li>`);
      continue;
    }

    // Image: ![alt](url)
    const imgMatch = line.match(/^!\[(.*)?\]\((.+?)\)/);
    if (imgMatch) {
      closeList();
      const alt = imgMatch[1] || '';
      const src = imgMatch[2];
      html.push(`<figure class="my-8"><img src="${src}" alt="${escapeHtml(alt)}" class="w-full rounded border border-black/10" loading="lazy" />${alt ? `<figcaption class="font-mono text-xs text-black/40 mt-2 text-center">${escapeHtml(alt)}</figcaption>` : ''}</figure>`);
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p class="font-mono text-sm sm:text-base text-black/70 leading-relaxed mb-4">${parseInline(line)}</p>`);
  }

  closeList();
  closeBlockquote();
  closeCallout();

  return html.join('\n');
}

export default function BlogContent({ content }: BlogContentProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className="blog-content max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Export for use by TableOfContents
export function extractHeadings(content: string): { id: string; text: string; level: 2 | 3 }[] {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      headings.push({ id: generateId(h2[1]), text: h2[1], level: 2 });
      continue;
    }
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      headings.push({ id: generateId(h3[1]), text: h3[1], level: 3 });
    }
  }

  return headings;
}
