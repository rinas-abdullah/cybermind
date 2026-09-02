const express = require("express");
const authRoutes = require("./authRoutes");
const scenarioRoutes = require("./scenarioRoutes");
const aiRoutes = require("./aiRoutes");
const progressRoutes = require("./progressRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(aiRoutes);
router.use(scenarioRoutes);
router.use(progressRoutes);
router.use(leaderboardRoutes);

module.exports = router;
