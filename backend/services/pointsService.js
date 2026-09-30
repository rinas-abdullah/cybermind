// Server-side XP awarding. Shared by /api/update-score (scenario flow) and
// the lab service, so both update the user's total and level the same way.

const { updateUserProgress } = require("../data/progress");
const demoAuthService = require("../services/demoAuthService");
const { calculateLevel } = require("../utils/userUtils");
const { getAuthUserOrNull } = require("../utils/userAccess");

async function awardPoints(username, amount) {
  const authUser = await getAuthUserOrNull(username);
  if (!authUser) return null;

  const numericAmount = Number(amount) || 0;
  const currentTotal = Number(authUser.profile?.totalScore || authUser.points || 0);
  const newTotal = Math.max(0, currentTotal + numericAmount);
  const newLevel = calculateLevel(newTotal);

  const updatedUser =
    demoAuthService.updateDemoUserProfile?.(authUser.id, { totalScore: newTotal, level: newLevel }) ||
    demoAuthService.updateUserProfile?.(authUser.id, { totalScore: newTotal, level: newLevel });

  await updateUserProgress(username, { totalScore: newTotal });

  return {
    username: updatedUser?.username || authUser.username,
    points: updatedUser?.profile?.totalScore || newTotal,
    level: updatedUser?.profile?.level || newLevel,
  };
}

module.exports = { awardPoints };
