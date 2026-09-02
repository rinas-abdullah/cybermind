"use strict";

/**
 * Loads backend/config/environment with NODE_ENV=test.
 * Must run before other tests that might cache a different NODE_ENV.
 */
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

describe("config/environment (test profile)", () => {
  let config;
  let validateConfig;

  before(() => {
    process.env.NODE_ENV = "test";
    process.env.DB_TYPE = "in-memory";
    delete process.env.CORS_ORIGIN;
    delete process.env.SITE_URL;

    const envPath = path.join(__dirname, "..", "backend", "config", "environment.js");
    delete require.cache[require.resolve(envPath)];
    const mod = require(envPath);
    config = mod.config;
    validateConfig = mod.validateConfig;
  });

  it("exports config with expected shape", () => {
    assert.ok(config.server);
    assert.ok(config.database);
    assert.ok(config.security);
    assert.ok(config.cors);
    assert.ok(config.public);
    assert.equal(config.server.nodeEnv, "test");
    assert.equal(config.database.type, "in-memory");
  });

  it("public site helpers are strings", () => {
    assert.equal(typeof config.public.localDomain, "string");
    assert.equal(typeof config.public.suggestedLocalUrl, "string");
  });

  it("validateConfig runs without throw in test", () => {
    assert.doesNotThrow(() => validateConfig && validateConfig());
  });
});
