import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ruleCards from '../../content/bb-rule-cards.json';
import type { RuleCardsFile } from '../../src/content/types';
import { buildRulesSql, latestRulesMigration } from '../generate-rules-migration';

const file = ruleCards as unknown as RuleCardsFile;

describe('rules migration generator', () => {
  it('committed rules migration matches content/bb-rule-cards.json', () => {
    const latest = latestRulesMigration();
    expect(latest).toBeDefined();
    const committed = readFileSync(join(__dirname, '..', '..', 'supabase', 'migrations', latest!), 'utf8');
    expect(committed).toBe(buildRulesSql(file));
  });

  it('escapes single quotes', () => {
    const tricky: RuleCardsFile = {
      ...file,
      rules: [{ ...file.rules[0], title: "Don't quit" }],
    };
    expect(buildRulesSql(tricky)).toContain("'Don''t quit'");
  });

  it('carries every card field verbatim', () => {
    const sql = buildRulesSql(file);
    for (const r of file.rules) {
      for (const text of [r.title, r.chapter, r.why_it_matters, r.scorecard, r.mantra, ...Object.values(r.drills)]) {
        expect(sql).toContain(`'${text.replace(/'/g, "''")}'`);
      }
    }
  });
});
