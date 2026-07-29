import assert from "node:assert/strict";
import { test } from "node:test";
import { isDecisive, matchQuestion } from "./match.ts";
import { SCENARIOS } from "./scenarios.ts";

/**
 * The router's contract. What matters here is not recall on every phrasing —
 * it is that a match is always a scenario the engine can actually answer, and
 * that "I don't know what you're asking" stays a reachable, honest outcome.
 */

const ALL = [...SCENARIOS];
const top = (q: string) => matchQuestion(q, ALL)[0]?.scenario.id;

test("plain language reaches the right scenario", () => {
  assert.equal(top("can I buy a house next year"), "home");
  assert.equal(top("I want to quit and travel for a year"), "career-break");
  assert.equal(top("should I put more away each month"), "contribute-more");
  assert.equal(top("thinking about taking a pay cut for a new job"), "pay-cut");
  assert.equal(top("should I pay off my credit card first"), "debt-first");
});

test("wording North never scripted still lands", () => {
  assert.equal(top("is it dumb to buy a place right now"), "home");
  assert.equal(top("I might go part-time"), "pay-cut");
  assert.equal(top("what about my 401k"), "contribute-more");
});

test("a question about nothing North models returns no match", () => {
  assert.deepEqual(matchQuestion("what stock should I buy", ALL), []);
  assert.deepEqual(matchQuestion("how is the market doing", ALL), []);
  assert.deepEqual(matchQuestion("", ALL), []);
  assert.deepEqual(matchQuestion("ok", ALL), []);
});

test("a scenario hidden for this profile can never be offered", () => {
  const withoutDebt = ALL.filter((s) => s.id !== "debt-first");
  const matches = matchQuestion("should I pay off my loan first", withoutDebt);
  assert.ok(matches.every((m) => m.scenario.id !== "debt-first"));
});

test("phrases outrank single words, so a clear question wins clearly", () => {
  const matches = matchQuestion("I want to take a pay cut", ALL);
  assert.equal(matches[0].scenario.id, "pay-cut");
  assert.equal(isDecisive(matches), true);
});

test("an ambiguous question is NOT decisive — it must ask, not guess", () => {
  // Two scenarios named with equal weight, so neither may auto-open.
  const matches = matchQuestion("buy a house or quit my job", ALL);
  assert.ok(matches.length >= 2);
  assert.equal(isDecisive(matches), false);
});

test("a question that IS one scenario stays decisive even when it names two things", () => {
  // "Clear my debt before saving" is literally the debt-first question —
  // matching it confidently is correct, not over-eager.
  const matches = matchQuestion("should I clear my debt before saving", ALL);
  assert.equal(matches[0].scenario.id, "debt-first");
  assert.equal(isDecisive(matches), true);
});

test("matching is case and punctuation insensitive", () => {
  assert.equal(top("CAN I BUY A HOUSE?!"), "home");
  assert.equal(top("  quit...  and travel  "), "career-break");
});

test("every match is a real, answerable scenario", () => {
  const matches = matchQuestion("buy a home or take a career break", ALL);
  for (const match of matches) {
    assert.ok(SCENARIOS.some((s) => s.id === match.scenario.id));
  }
});
