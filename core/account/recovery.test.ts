import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BUNDLE_VERSION,
  checksum,
  decodeBundle,
  encodeBundle,
  formatCode,
  makeAccountKey,
  type RecoveryBundle,
} from "./recovery.ts";
import { initials, looksLikeEmail, passwordProblem } from "./types.ts";

const BUNDLE: RecoveryBundle = {
  version: BUNDLE_VERSION,
  exportedAt: "2026-08-04T00:00:00.000Z",
  account: {
    id: "acc_1",
    // Deliberately not ASCII: a name and a goal carrying an em dash and an
    // umlaut are exactly what a naive btoa mangles.
    name: "Zoë Ashworth—Bell",
    email: "zoe@example.com",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  profile: { openingConcern: { value: "Cash — piling up", confidence: "stated" } },
  history: [{ at: "2026-06-01T00:00:00.000Z" }],
  decisions: [{ id: "d1", summary: "Build the buffer first" }],
  membership: { tier: "plus" },
};

describe("moving an account between devices", () => {
  it("survives the round trip exactly", () => {
    const restored = decodeBundle(encodeBundle(BUNDLE));
    assert.deepEqual(restored, BUNDLE);
  });

  /**
   * The reason base64 runs over UTF-8 bytes rather than `btoa` alone. A
   * user's own words are the payload, and that is where the em dashes live.
   */
  it("carries words that are not ASCII", () => {
    const restored = decodeBundle(encodeBundle(BUNDLE))!;
    assert.equal(restored.account.name, "Zoë Ashworth—Bell");
    assert.match(JSON.stringify(restored.profile), /Cash — piling up/);
  });

  it("survives the whitespace a paste actually arrives with", () => {
    const code = encodeBundle(BUNDLE);
    const mangled = `  ${formatCode(code)}\n\n`;
    assert.deepEqual(decodeBundle(mangled), BUNDLE);
  });

  it("refuses a code that was cut short", () => {
    // The failure that happens for real: a chat client truncates it, or half
    // the selection was copied. Better to say so than to restore half a life.
    const code = encodeBundle(BUNDLE);
    assert.equal(decodeBundle(code.slice(0, code.length - 12)), null);
  });

  it("refuses a code from something that is not North", () => {
    assert.equal(decodeBundle("hello"), null);
    assert.equal(decodeBundle(""), null);
    assert.equal(decodeBundle("NORTH-1-"), null);
  });

  it("refuses a bundle from a future version rather than guessing", () => {
    const future = encodeBundle({ ...BUNDLE, version: BUNDLE_VERSION + 1 });
    assert.equal(decodeBundle(future), null);
  });

  it("the checksum actually notices a changed payload", () => {
    assert.notEqual(checksum("aaaa"), checksum("aaab"));
    assert.equal(checksum("stable"), checksum("stable"));
  });

  it("wraps for the eye without changing what it means", () => {
    const code = encodeBundle(BUNDLE);
    const wrapped = formatCode(code, 24);
    assert.ok(wrapped.includes("\n"), "never wrapped");
    assert.ok(
      wrapped.split("\n").every((line) => line.length <= 24),
      "a line ran past the width",
    );
    assert.deepEqual(decodeBundle(wrapped), BUNDLE);
  });
});

describe("the account key", () => {
  it("is grouped, and drawn from an alphabet you can read aloud", () => {
    // A fixed generator, so every character is pinned rather than sampled.
    let n = 0;
    const key = makeAccountKey(() => ((n++ * 7) % 31) / 31);
    assert.match(key, /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/);
    // The characters a handwritten key gets wrong.
    assert.ok(!/[O0I1L]/.test(key), `ambiguous character in ${key}`);
  });

  it("varies", () => {
    const a = makeAccountKey(Math.random);
    const b = makeAccountKey(Math.random);
    assert.notEqual(a, b);
  });
});

describe("what the signup form can check", () => {
  it("catches an email typo without pretending to validate an address", () => {
    for (const good of ["a@b.co", "zoe.ashworth@example.co.uk", "x+tag@y.io"]) {
      assert.ok(looksLikeEmail(good), good);
    }
    for (const bad of ["", "zoe", "zoe@", "@example.com", "zoe@example", "a b@c.d"]) {
      assert.ok(!looksLikeEmail(bad), bad);
    }
  });

  it("asks for length, which is the thing that helps", () => {
    assert.ok(passwordProblem("")); // says something
    assert.ok(passwordProblem("short"));
    assert.equal(passwordProblem("longenough"), null);
  });

  it("draws initials from whatever shape a name arrives in", () => {
    assert.equal(initials("Tanmay Jain"), "TJ");
    assert.equal(initials("avery"), "AV");
    assert.equal(initials("  Zoë  Ashworth  Bell "), "ZB");
    assert.equal(initials(""), "");
  });
});
