import puter from '@heyputer/puter.js';

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const getDemoPath = () => {
  if (puter.appDataPath && puter.path?.join) {
    return puter.path.join(puter.appDataPath, 'puterjs-demo.txt');
  }
  return 'puterjs-demo.txt';
};

export const formatJSON = (data: Record<string, unknown>) => JSON.stringify(data, null, 2);

export const extractText = (response: unknown): string => {
  if (!response || typeof response !== 'object') return 'No response received.';
  const maybe = response as { message?: { content?: unknown } };
  const content = maybe.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const first = content.find(part => typeof part === 'string');
    if (typeof first === 'string') return first;
  }
  return JSON.stringify(content ?? response, null, 2);
};
