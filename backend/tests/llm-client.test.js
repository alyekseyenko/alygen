import { describe, expect, it } from 'vitest';
import { parseJsonFromLlm } from '../services/llm-client.js';

describe('parseJsonFromLlm', () => {
  it('parses raw JSON', () => {
    expect(parseJsonFromLlm('{"a":1}')).toEqual({ a: 1 });
  });

  it('extracts JSON from markdown noise', () => {
    const out = parseJsonFromLlm('Here:\n```json\n{"quality":8}\n```');
    expect(out.quality).toBe(8);
  });
});
