/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ALL_LESSONS, ALL_VOCAB } from '../index';
import { getHanziDef } from '../hanziData';
import { numberedToMarkedPinyin } from '../../engines/pinyin';

describe('Curriculum integrity (Stages 0–6)', () => {
  it('has unique lesson and step IDs with valid target answers, Hanzi, and HSK 1–3 vocab links', () => {
    const lessonIds = new Set<string>();
    const stepIds = new Set<string>();
    const vocabSet = new Set(ALL_VOCAB.map((v) => v.simplified));

    for (const lesson of ALL_LESSONS) {
      assert.equal(lessonIds.has(lesson.id), false, `Duplicate lesson ID: ${lesson.id}`);
      lessonIds.add(lesson.id);
      assert.ok(lesson.steps.length > 0, `Lesson ${lesson.id} has no steps`);

      if (lesson.vocabRewards) {
        for (const w of lesson.vocabRewards) {
          assert.ok(
            vocabSet.has(w),
            `Lesson ${lesson.id}: vocabReward "${w}" missing from HSK1_VOCAB`
          );
        }
      }

      for (const step of lesson.steps) {
        assert.equal(stepIds.has(step.id), false, `Duplicate step ID: ${step.id}`);
        stepIds.add(step.id);

        if (step.type === 'tone_contour') {
          assert.ok(
            step.availableTones.includes(step.targetTone),
            `${step.id}: targetTone missing from availableTones`
          );
          assert.equal(
            numberedToMarkedPinyin(`${step.targetBasePinyin}${step.targetTone}`),
            step.targetPinyin,
            `${step.id}: targetPinyin mismatch`
          );
        }

        if (
          step.type === 'minimal_pair' ||
          step.type === 'tone_sandhi_lab' ||
          step.type === 'radical_breakdown' ||
          step.type === 'stroke_order_rule' ||
          step.type === 'cloze_blank' ||
          step.type === 'dialogue_read' ||
          step.type === 'graded_reader'
        ) {
          assert.ok(
            step.options.some((o) => o.id === step.targetOptionId),
            `${step.id}: targetOptionId missing from options`
          );
        }

        if (step.type === 'dialogue_read') {
          assert.ok(step.lines.length > 0, `${step.id}: dialogue has no lines`);
        }

        if (step.type === 'graded_reader') {
          assert.ok(step.paragraphs.length > 0, `${step.id}: graded_reader has no paragraphs`);
          for (const para of step.paragraphs) {
            assert.ok(para.segments.some((s) => !s.isPunctuation), `${step.id}: paragraph has no word segments`);
          }
        }

        if (step.type === 'word_intro') {
          assert.ok(step.hanzi.length > 0, `${step.id}: empty hanzi`);
          assert.ok(step.pinyin.length > 0, `${step.id}: empty pinyin`);
          assert.ok(step.english.length > 0, `${step.id}: empty english`);
          assert.ok(step.explanation.length > 0, `${step.id}: empty explanation`);
        }

        if (step.type === 'speaking_drill') {
          assert.ok(step.targetHanzi.length > 0, `${step.id}: empty targetHanzi`);
        }

        if (step.type === 'sentence_scramble') {
          const tileIds = new Set(step.tiles.map((t) => t.id));
          assert.ok(step.expectedTileIds.length > 0, `${step.id}: empty expectedTileIds`);
          for (const id of step.expectedTileIds) {
            assert.ok(tileIds.has(id), `${step.id}: expected tile "${id}" missing from tiles`);
          }
        }

        if (step.type === 'pinyin_builder') {
          assert.ok(step.initialsPool.includes(step.targetInitial), `${step.id}: missing initial`);
          assert.ok(step.finalsPool.includes(step.targetFinal), `${step.id}: missing final`);
          assert.ok(step.tonesPool.includes(step.targetTone), `${step.id}: missing tone`);
          assert.equal(
            numberedToMarkedPinyin(`${step.targetInitial}${step.targetFinal}${step.targetTone}`),
            step.targetPinyin,
            `${step.id}: targetPinyin mismatch`
          );
        }

        if (step.type === 'stroke_trace') {
          const def = getHanziDef(step.targetChar);
          assert.ok(def, `${step.id}: missing HANZI_DATABASE entry for ${step.targetChar}`);
          assert.ok(def.strokes.length > 0, `${step.id}: character ${step.targetChar} has 0 strokes`);
        }
      }
    }
  });
});
