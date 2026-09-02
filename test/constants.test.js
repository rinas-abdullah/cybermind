"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { ROUTES, LEVELS, SERVER_CONFIG } = require("../backend/config/constants");

describe("config/constants", () => {
  it("exposes frozen API prefix", () => {
    assert.equal(ROUTES.API.PREFIX, "/api");
    assert.equal(ROUTES.API.HEALTH, "/api/health");
  });

  it("defines core page routes", () => {
    assert.equal(ROUTES.PAGES.HOME, "/");
    assert.equal(ROUTES.PAGES.AUTH, "/auth");
    assert.equal(ROUTES.PAGES.ADMIN, "/admin");
  });

  it("has ordered level progression", () => {
    assert.ok(Array.isArray(LEVELS));
    assert.ok(LEVELS.length >= 2);
    for (let i = 1; i < LEVELS.length; i++) {
      assert.ok(
        LEVELS[i].minScore > LEVELS[i - 1].minScore,
        `minScore should increase at level ${i}`
      );
    }
  });

  it("server defaults are sane", () => {
    assert.equal(SERVER_CONFIG.DEFAULT_PORT, 3001);
    assert.equal(SERVER_CONFIG.API_PREFIX, "/api");
  });
});
