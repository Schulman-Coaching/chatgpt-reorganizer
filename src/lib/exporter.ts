import { Message, ConversationAnalysis, TopicCluster, CodeSnippet, OutlineNode } from './types';

function formatOutline(nodes: OutlineNode[], depth: number = 0): string {
  const indent = '  '.repeat(depth);
  let output = '';

  for (const node of nodes) {
    output += `${indent}- **${node.title}**: ${node.description}\n`;
    if (node.children && node.children.length > 0) {
      output += formatOutline(node.children, depth + 1);
    }
  }

  return output;
}

export function exportToMarkdown(
  title: string,
  messages: Message[],
  analysis: ConversationAnalysis
): string {
  let md = '';

  // Title
  md += `# ${title}\n\n`;

  // TL;DR
  if (analysis.summary?.tldr) {
    md += `## TL;DR\n\n${analysis.summary.tldr}\n\n`;
  }

  // Summary Outline
  if (analysis.summary?.outline && analysis.summary.outline.length > 0) {
    md += `## Summary\n\n`;
    md += formatOutline(analysis.summary.outline);
    md += '\n';
  }

  // Topics
  if (analysis.topics && analysis.topics.length > 0) {
    md += `## Topics\n\n`;
    for (const topic of analysis.topics) {
      md += `### ${topic.name}\n\n`;
      md += `${topic.description}\n\n`;

      md += `**Related messages:**\n`;
      for (const idx of topic.messageIndices) {
        const msg = messages[idx];
        if (msg) {
          const preview = msg.content.length > 100
            ? msg.content.substring(0, 100) + '...'
            : msg.content;
          md += `- [${idx + 1}] ${msg.role}: ${preview.replace(/\n/g, ' ')}\n`;
        }
      }
      md += '\n';
    }
  }

  // Code Snippets
  if (analysis.codeSnippets && analysis.codeSnippets.length > 0) {
    md += `## Code Snippets\n\n`;
    for (const snippet of analysis.codeSnippets) {
      md += `### ${snippet.context}\n\n`;
      md += `**Language:** ${snippet.language}\n\n`;
      md += '```' + snippet.language + '\n';
      md += snippet.code + '\n';
      md += '```\n\n';
    }
  }

  // Full Conversation
  md += `## Full Conversation\n\n`;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const roleLabel = msg.role === 'user' ? '**You**' : '**Assistant**';
    md += `### ${i + 1}. ${roleLabel}\n\n`;
    md += msg.content + '\n\n';
    md += '---\n\n';
  }

  return md;
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
