/**
 * Legacy Auth Adapter
 * 
 * This file exists for backward compatibility.
 * It forwards all auth-related calls to demoAuthService.
 * 
 * TODO:
 * - Remove this file once all legacy imports are migrated.
 */

module.exports = require("../services/demoAuthService");