/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  analyzeToneSandhi,
  getToneFromPinyin,
  numberedToMarkedPinyin,
  setSyllableTone,
  stripToneMarks,
} from '../pinyin';

describe('pinyin utilities', () => {
  it('converts numbered pinyin to tone-marked pinyin following placement rules', () => {
    assert.equal(numberedToMarkedPinyin('ma1'), 'mā');
    assert.equal(numberedToMarkedPinyin('ma2'), 'má');
    assert.equal(numberedToMarkedPinyin('ma3'), 'mǎ');
    assert.equal(numberedToMarkedPinyin('ma4'), 'mà');
    assert.equal(numberedToMarkedPinyin('ma5'), 'ma');
    assert.equal(numberedToMarkedPinyin('hao3'), 'hǎo');
    assert.equal(numberedToMarkedPinyin('lv4'), 'lǜ');
    assert.equal(numberedToMarkedPinyin('dui4'), 'duì');
    assert.equal(numberedToMarkedPinyin('liu2'), 'liú');
    assert.equal(numberedToMarkedPinyin('gou3'), 'gǒu');
  });

  it('extracts tone numbers and strips tone marks accurately', () => {
    assert.equal(getToneFromPinyin('hǎo'), 3);
    assert.equal(getToneFromPinyin('lǜ'), 4);
    assert.equal(getToneFromPinyin('ma'), 5);

    assert.deepEqual(stripToneMarks('nǐ'), { base: 'ni', tone: 3 });
    assert.equal(setSyllableTone('nǐ', 2), 'ní');
  });

  it('applies 3rd + 3rd tone sandhi (nǐ hǎo -> ní hǎo)', () => {
    const res = analyzeToneSandhi([
      { hanzi: '你', basePinyin: 'ni', citationTone: 3 },
      { hanzi: '好', basePinyin: 'hao', citationTone: 3 },
    ]);
    assert.equal(res[0].spokenTone, 2);
    assert.equal(res[0].spokenPinyin, 'ní');
    assert.equal(res[0].changed, true);
    assert.equal(res[1].spokenTone, 3);
    assert.equal(res[1].changed, false);
  });

  it('applies 不 (bù) tone sandhi before 4th tone', () => {
    const res = analyzeToneSandhi([
      { hanzi: '不', basePinyin: 'bu', citationTone: 4 },
      { hanzi: '是', basePinyin: 'shi', citationTone: 4 },
    ]);
    assert.equal(res[0].spokenTone, 2);
    assert.equal(res[0].spokenPinyin, 'bú');
    assert.equal(res[0].changed, true);
  });

  it('applies 一 (yī) tone sandhi before 4th vs 1st/2nd/3rd tones', () => {
    const beforeFourth = analyzeToneSandhi([
      { hanzi: '一', basePinyin: 'yi', citationTone: 1 },
      { hanzi: '个', basePinyin: 'ge', citationTone: 4 },
    ]);
    assert.equal(beforeFourth[0].spokenTone, 2);
    assert.equal(beforeFourth[0].spokenPinyin, 'yí');

    const beforeFirst = analyzeToneSandhi([
      { hanzi: '一', basePinyin: 'yi', citationTone: 1 },
      { hanzi: '天', basePinyin: 'tian', citationTone: 1 },
    ]);
    assert.equal(beforeFirst[0].spokenTone, 4);
    assert.equal(beforeFirst[0].spokenPinyin, 'yì');
  });
});
