import { Text } from 'react-native';

/**
 * Ask Mark answers come back as light Markdown (paragraphs, **bold**, "- "
 * lists). Render just that, as plain Text: no links, no HTML.
 */
export function AnswerText({ text, className }: { text: string; className: string }) {
  const paragraphs = text.trim().split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((p, i) => (
        <Text key={i} className={`${className} ${i > 0 ? 'mt-3' : ''}`}>
          {inline(p.replace(/^[-*] /gm, '• '))}
        </Text>
      ))}
    </>
  );
}

function inline(p: string) {
  const parts = p.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <Text key={i} className="font-bold">
        {part.slice(2, -2)}
      </Text>
    ) : (
      part
    ),
  );
}
