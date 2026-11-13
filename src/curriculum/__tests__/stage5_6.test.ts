/// <reference types="node" />
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

import { evaluateStepAnswer } from '../../engines/lessonStateMachine';
import { CORPUS_ATTACH_MERGE_SQL } from '../../storage/corpusMigrationSql';
import { HSK4_5_LESSONS } from '../hsk4_5';
import { HSK5_LESSONS } from '../hsk5';
import { HSK6_LESSONS } from '../hsk6';
import { HSK6_9_LESSONS } from '../hsk6_9';
import type { GradedReaderStep } from '../types';

describe('Stages 5–6 HSK 4–9 & Graded Reader integrity', () => {
  it('evaluates graded_reader steps strictly against targetOptionId', () => {
    const readerStep = HSK4_5_LESSONS[1].steps.find(
      (s): s is GradedReaderStep => s.type === 'graded_reader'
    );
    assert.ok(readerStep, 'Expected a graded_reader step in HSK 4-5');

    assert.equal(evaluateStepAnswer(readerStep, readerStep.targetOptionId), true);
    assert.equal(evaluateStepAnswer(readerStep, 'wrong_option'), false);
    assert.equal(evaluateStepAnswer(readerStep, null), false);
  });

  it('ships a complete offline HSK 3.0 & Make Me a Hanzi SQLite corpus asset', () => {
    const corpusPath = path.resolve('assets/data/chinese_corpus.db');
    assert.equal(fs.existsSync(corpusPath), true, 'Missing assets/data/chinese_corpus.db');

    const db = new DatabaseSync(corpusPath, { readOnly: true });
    try {
      const vocabCount = db.prepare('SELECT COUNT(*) AS c FROM vocabulary').get() as { c: number };
      const hanziCount = db.prepare('SELECT COUNT(*) AS c FROM hanzi').get() as { c: number };
      const hskBands = db
        .prepare('SELECT hsk_level, COUNT(*) AS c FROM vocabulary GROUP BY hsk_level ORDER BY hsk_level')
        .all() as { hsk_level: number; c: number }[];

      assert.ok(vocabCount.c >= 10900, `Expected full HSK 3.0 corpus, got ${vocabCount.c}`);
      assert.equal(hanziCount.c, 3000, `Expected 3000 HSK 3.0 Hanzi, got ${hanziCount.c}`);
      assert.equal(hskBands.length, 7, 'Expected all 7 HSK 3.0 bands (1..6 and 7-9)');

      // Every non-punctuation word token inside Stage 5-6 graded readers must resolve in SQLite
      const checkWord = db.prepare('SELECT simplified FROM vocabulary WHERE simplified = ?');
      for (const lesson of [...HSK4_5_LESSONS, ...HSK5_LESSONS, ...HSK6_LESSONS, ...HSK6_9_LESSONS]) {
        for (const step of lesson.steps) {
          if (step.type !== 'graded_reader') continue;
          for (const para of step.paragraphs) {
            for (const seg of para.segments) {
              if (seg.isPunctuation) continue;
              const hit = checkWord.get(seg.text);
              assert.ok(
                hit,
                `Graded reader token "${seg.text}" (${lesson.id}/${step.id}) missing from corpus DB`
              );
            }
          }
        }
      }
    } finally {
      db.close();
    }
  });

  it('merges attached chinese_corpus.db cleanly into v3 user schema with zero type mismatches', () => {
    const corpusPath = path.resolve('assets/data/chinese_corpus.db');
    const memDb = new DatabaseSync(':memory:');

    try {
      // Simulate existing v3 user database with pre-existing vocabulary & SRS card
      memDb.exec(`
        CREATE TABLE vocabulary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          simplified TEXT NOT NULL,
          traditional TEXT,
          pinyin TEXT NOT NULL,
          pinyin_numbered TEXT NOT NULL,
          tone_pattern TEXT NOT NULL,
          english TEXT NOT NULL,
          hsk_level INTEGER NOT NULL DEFAULT 1,
          part_of_speech TEXT,
          frequency_rank INTEGER NOT NULL DEFAULT 99999,
          classifiers TEXT NOT NULL DEFAULT ''
        );
        CREATE UNIQUE INDEX idx_vocab_simplified ON vocabulary(simplified);

        CREATE TABLE hanzi (
          char TEXT PRIMARY KEY NOT NULL,
          radical TEXT,
          stroke_count INTEGER NOT NULL DEFAULT 0,
          strokes_svg_json TEXT,
          medians_json TEXT,
          decomposition TEXT,
          etymology_hint TEXT,
          hsk_level INTEGER NOT NULL DEFAULT 0,
          pinyin TEXT NOT NULL DEFAULT '',
          meaning TEXT NOT NULL DEFAULT ''
        );

        INSERT INTO vocabulary (simplified, traditional, pinyin, pinyin_numbered, tone_pattern, english, hsk_level, part_of_speech)
        VALUES ('朋友', '朋友', 'péngyou', 'peng2you5', '2-5', 'friend', 1, 'noun');

        INSERT INTO hanzi (char, radical, stroke_count, strokes_svg_json, medians_json, decomposition, etymology_hint)
        VALUES ('一', '一', 1, '[]', '[[[14,50],[86,50]]]', '一', 'Single horizontal line');
      `);

      const startMs = Date.now();
      const attachStmt = memDb.prepare('ATTACH DATABASE ? AS corpus;');
      attachStmt.run(corpusPath);

      memDb.exec('BEGIN;');
      memDb.exec(CORPUS_ATTACH_MERGE_SQL);
      memDb.exec('COMMIT;');
      memDb.exec('DETACH DATABASE corpus;');
      const elapsedMs = Date.now() - startMs;

      assert.ok(elapsedMs < 3000, `Expected indexed SQL merge < 3000ms, took ${elapsedMs}ms`);

      const friendRow = memDb
        .prepare('SELECT id, english, frequency_rank, classifiers FROM vocabulary WHERE simplified = ?')
        .get('朋友') as { id: number; english: string; frequency_rank: number; classifiers: string };
      assert.equal(friendRow.id, 1, 'Pre-existing user row id must remain unchanged');
      assert.equal(friendRow.english, 'friend', 'Custom beginner definition should be preserved');
      assert.ok(friendRow.frequency_rank < 99999, 'Frequency rank should enrich existing rows');
      assert.ok(friendRow.classifiers.length > 0, 'Classifiers should enrich existing rows');

      const hanziYi = memDb
        .prepare('SELECT hsk_level, pinyin, etymology_hint FROM hanzi WHERE char = ?')
        .get('一') as { hsk_level: number; pinyin: string; etymology_hint: string };
      assert.equal(hanziYi.hsk_level, 1, 'HSK level should enrich curated Dojo character');
      assert.equal(hanziYi.etymology_hint, 'Single horizontal line');

      const total = memDb.prepare('SELECT COUNT(*) AS c FROM vocabulary').get() as { c: number };
      assert.ok(total.c >= 10969, `Expected merged corpus >= 10969 rows, got ${total.c}`);
    } finally {
      memDb.close();
    }
  });
});
