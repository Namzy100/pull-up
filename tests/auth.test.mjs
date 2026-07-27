import assert from "node:assert/strict";
import test from "node:test";
import {
  isCampusEmail,
  displayNameFromEmail,
  safeReturnTo,
  parseCallbackParams,
} from "../app/lib/authRules.ts";

test("campus email gate accepts only @illinois.edu", () => {
  assert.equal(isCampusEmail("sarah@illinois.edu"), true);
  assert.equal(isCampusEmail("Sarah.Patel@Illinois.edu"), true);
  assert.equal(isCampusEmail(" sarah@illinois.edu "), true); // trimmed
  assert.equal(isCampusEmail("sarah@gmail.com"), false);
  assert.equal(isCampusEmail("sarah@mail.illinois.edu"), false); // subdomain not allowed
  assert.equal(isCampusEmail("sarah@illinois.edu.evil.com"), false);
  assert.equal(isCampusEmail("illinois.edu"), false);
  assert.equal(isCampusEmail(""), false);
});

test("displayNameFromEmail humanises the local part", () => {
  assert.equal(displayNameFromEmail("sarah.patel@illinois.edu"), "Sarah Patel");
  assert.equal(displayNameFromEmail("dev_kumar@illinois.edu"), "Dev Kumar");
  assert.equal(displayNameFromEmail("maya@illinois.edu"), "Maya");
});

test("safeReturnTo only allows same-origin, non-auth paths", () => {
  assert.equal(safeReturnTo("/student"), "/student");
  assert.equal(safeReturnTo("/host"), "/host");
  assert.equal(safeReturnTo(null), "/student");
  assert.equal(safeReturnTo("//evil.com"), "/student"); // protocol-relative
  assert.equal(safeReturnTo("https://evil.com"), "/student"); // absolute
  assert.equal(safeReturnTo("/auth/callback"), "/student"); // auth path
});

test("parseCallbackParams classifies each auth callback shape", () => {
  assert.equal(parseCallbackParams("", "?code=abc123").kind, "code");
  assert.equal(parseCallbackParams("", "?code=abc123").code, "abc123");

  assert.equal(parseCallbackParams("", "?token_hash=xyz&type=signup").kind, "token_hash");
  assert.equal(parseCallbackParams("", "?token=xyz&type=recovery").type, "recovery");

  const hash = parseCallbackParams("#access_token=aaa&refresh_token=bbb&type=signup", "");
  assert.equal(hash.kind, "tokens");
  assert.equal(hash.accessToken, "aaa");
  assert.equal(hash.refreshToken, "bbb");

  const err = parseCallbackParams("#error=access_denied&error_code=otp_expired", "");
  assert.equal(err.kind, "error");
  assert.equal(err.errorCode, "otp_expired");

  assert.equal(parseCallbackParams("", "").kind, "none");
});
