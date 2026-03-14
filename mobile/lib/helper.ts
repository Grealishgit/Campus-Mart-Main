// Utility function for text formatting
export const formatAIResponse = (text: string | null | undefined): string => {
    if (!text) return '';

    // Step 1: Remove all markdown syntax
    let cleaned = text
        // Remove bold/italic markers
        .replace(/\*\*|\*|__|_/g, '')
        // Remove headers
        .replace(/^#+\s*/gm, '')
        // Convert bullet points to simple format
        .replace(/^[\s]*[-*+]\s+/gm, '• ')
        // Remove numbered list markers
        .replace(/^\s*\d+\.\s+/gm, '')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code
        .replace(/`(.*?)`/g, '$1')
        // Remove markdown links
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Remove horizontal rules
        .replace(/^---+$/gm, '');

    // Step 2: Clean up whitespace
    cleaned = cleaned
        .replace(/\n{3,}/g, '\n\n') // Max 2 line breaks
        .replace(/[ \t]+$/gm, '')    // Remove trailing spaces
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();

    return cleaned;
};

// Type for Gemini API response
interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
    error?: {
        message: string;
    };
}