/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateMandarinSpeech, normalizeChinese } from '../speechEvaluation';

describe('speechEvaluation engine', () => {
  it('strips Chinese and ASCII punctuation cleanly', () => {
    assert.equal(normalizeChinese('你好，你叫什么名字？'), '你好你叫什么名字');
    assert.equal(normalizeChinese(' 我 喝 茶. '), '我喝茶');
  });

  it('scores an exact spoken match as 100% across alternatives', () => {
    const res = evaluateMandarinSpeech(['我喝茶了', '我想喝一杯茶'], '我想喝一杯茶。');
    assert.equal(res.matched, true);
    assert.equal(res.score, 100);
    assert.equal(res.bestTranscript, '我想喝一杯茶');
    assert.deepEqual(res.charMatchedMask, [true, true, true, true, true, true]);
  });

  it('provides per-character match flags for partial pronunciation', () => {
    const res = evaluateMandarinSpeech(['我明去中国'], '我明天去中国');
    assert.equal(res.score, 83); // 5 out of 6 matched
    assert.equal(res.matched, true);
    assert.deepEqual(res.charMatchedMask, [true, true, false, true, true, true]);
  });

  it('rejects unrelated or empty transcripts', () => {
    const res = evaluateMandarinSpeech(['谢谢再见'], '我明天去中国');
    assert.equal(res.matched, false);
    assert.equal(res.score, 0);

    const emptyRes = evaluateMandarinSpeech([], '你好');
    assert.equal(emptyRes.matched, false);
    assert.equal(emptyRes.score, 0);
  });
});
