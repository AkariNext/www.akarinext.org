
import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';

/**
 * Basic Lexical to HTML converter for Astro
 * 
 * Supports standard nodes:
 * - root
 * - paragraph
 * - heading
 * - text (bold, italic, underline, strikethrough, code)
 * - link
 * - list (unordered, ordered)
 * - listitem
 * - quote
 * - upload (image) - basic support
 */
export async function lexicalToHtml(editorState: SerializedEditorState | null | undefined): Promise<string> {
    if (!editorState?.root) return '';

    return serialize(editorState.root.children);
}

function serialize(children: SerializedLexicalNode[]): string {
    return children
        .map((node: any) => {
            if (node.type === 'text') {
                let text = escapeHTML(node.text);

                if (node.format & 1) text = `<strong>${text}</strong>`;
                if (node.format & 2) text = `<em>${text}</em>`;
                if (node.format & 8) text = `<s>${text}</s>`; // Adjusted bitmask if needed, lexical usually uses 8 for strikethrough, 4 for underline
                if (node.format & 4) text = `<u>${text}</u>`;
                if (node.format & 16) text = `<code>${text}</code>`;

                return text;
            }

            if (!node) return '';

            const content = node.children ? serialize(node.children) : '';
            const alignment = node.format && ['left', 'center', 'right', 'justify', 'start', 'end'].includes(node.format)
                ? `text-align: ${node.format};`
                : '';
            const indentation = node.indent && node.indent > 0
                ? `padding-left: ${node.indent * 40}px;`
                : '';

            const style = (alignment || indentation) ? ` style="${alignment}${indentation}"` : '';

            switch (node.type) {
                case 'paragraph':
                    // Check for empty paragraphs
                    if (!content || content.trim() === '') return `<p${style}><br></p>`;
                    return `<p${style}>${content}</p>`;

                case 'heading':
                    const tag = node.tag || 'h1';
                    return `<${tag}${style}>${content}</${tag}>`;

                case 'list':
                    const listTag = node.listType === 'number' ? 'ol' : 'ul';
                    return `<${listTag}${style}>${content}</${listTag}>`;

                case 'listitem':
                    return `<li${style}>${content}</li>`;

                case 'quote':
                    return `<blockquote${style}>${content}</blockquote>`;

                case 'link':
                case 'autolink':
                    const href = node.fields?.url || node.url;
                    const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
                    return `<a href="${href}"${target}>${content}</a>`;

                case 'upload':
                    // Handle uploaded images
                    // This assumes the 'value' field contains the media object
                    if (node.value && typeof node.value === 'object') {
                        const { url, alt, width, height } = node.value;
                        // Resolve URL properly if it's relative
                        const src = url?.startsWith('http') ? url : `${import.meta.env.PUBLIC_PAYLOAD_URL || ''}${url}`;
                        const imgHtml = `<img src="${src}" alt="${alt || ''}" width="${width}" height="${height}" class="post-image" />`;

                        return style ? `<div${style}>${imgHtml}</div>` : imgHtml;
                    }
                    return '';

                case 'horizontalrule':
                    return '<hr />';

                case 'linebreak':
                    return '<br />';

                default:
                    return content;
            }
        })
        .join('');
}

// Simple HTML escaper
function escapeHTML(str: string): string {
    return str.replace(
        /[&<>'"]/g,
        (tag) =>
        ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;',
        }[tag] || tag)
    );
}

/**
 * Basic Lexical to Plain Text converter for excerpts
 */
export function lexicalToPlainText(editorState: SerializedEditorState | null | undefined): string {
    if (!editorState?.root) return '';

    return extractText(editorState.root.children);
}

function extractText(children: SerializedLexicalNode[]): string {
    return children
        .map((node: any) => {
            if (node.type === 'text') {
                return node.text || '';
            }
            if (node.children) {
                return extractText(node.children);
            }
            return '';
        })
        .join(' ');
}
