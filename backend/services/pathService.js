const db = require("../db");

class PathService {
  normalizeString(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  normalizePositiveInt(value, fallback = 1) {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) return fallback;
    return n;
  }

  async createPath(name, description) {
    const safeName = this.normalizeString(name);
    const safeDescription = this.normalizeString(description, "");

    const { rows } = await db.query(
      `INSERT INTO paths (name, description) VALUES ($1, $2) RETURNING *`,
      [safeName, safeDescription]
    );

    return rows[0];
  }

  async createModule(pathId, name, description, orderIndex = 1) {
    const safePathId = this.normalizePositiveInt(pathId);
    const safeName = this.normalizeString(name);
    const safeDescription = this.normalizeString(description, "");
    const safeOrderIndex = this.normalizePositiveInt(orderIndex);

    const { rows } = await db.query(
      `INSERT INTO modules (path_id, name, description, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [safePathId, safeName, safeDescription, safeOrderIndex]
    );

    return rows[0];
  }

  async createTask(
    moduleId,
    {
      name,
      description = "",
      expectedOutput = "",
      difficultyLevel = 3,
      orderIndex = 1,
    }
  ) {
    const safeModuleId = this.normalizePositiveInt(moduleId);
    const safeName = this.normalizeString(name);
    const safeDescription = this.normalizeString(description, "");
    const safeExpectedOutput = this.normalizeString(expectedOutput, "");
    const safeDifficultyLevel = Math.min(
      Math.max(this.normalizePositiveInt(difficultyLevel, 3), 1),
      10
    );
    const safeOrderIndex = this.normalizePositiveInt(orderIndex);

    const { rows } = await db.query(
      `INSERT INTO tasks
       (module_id, name, description, expected_output, difficulty_level, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        safeModuleId,
        safeName,
        safeDescription,
        safeExpectedOutput,
        safeDifficultyLevel,
        safeOrderIndex,
      ]
    );

    return rows[0];
  }

  async getPaths() {
    const { rows } = await db.query(`SELECT * FROM paths ORDER BY name ASC`);
    return rows;
  }

  async getPathById(pathId) {
    const safePathId = this.normalizePositiveInt(pathId);
    const { rows } = await db.query(`SELECT * FROM paths WHERE id = $1`, [safePathId]);
    return rows[0] || null;
  }

  async getModulesByPath(pathId) {
    const safePathId = this.normalizePositiveInt(pathId);
    const { rows } = await db.query(
      `SELECT * FROM modules WHERE path_id = $1 ORDER BY order_index ASC`,
      [safePathId]
    );
    return rows;
  }

  async getTasksByModule(moduleId) {
    const safeModuleId = this.normalizePositiveInt(moduleId);
    const { rows } = await db.query(
      `SELECT * FROM tasks WHERE module_id = $1 ORDER BY order_index ASC`,
      [safeModuleId]
    );
    return rows;
  }

  async getTaskById(taskId) {
    const safeTaskId = this.normalizePositiveInt(taskId);
    const { rows } = await db.query(`SELECT * FROM tasks WHERE id = $1`, [safeTaskId]);
    return rows[0] || null;
  }

  async getTaskStatusForUser(userId, moduleTasks = []) {
    if (!moduleTasks.length) return [];

    const safeUserId = this.normalizePositiveInt(userId);
    const taskIds = moduleTasks.map((t) => t.id);

    const { rows } = await db.query(
      `SELECT task_id, status
       FROM task_progress
       WHERE user_id = $1 AND task_id = ANY($2::int[])`,
      [safeUserId, taskIds]
    );

    const statusMap = rows.reduce((acc, item) => {
      acc[item.task_id] = item.status;
      return acc;
    }, {});

    let unlocked = true;

    return moduleTasks.map((task) => {
      const existing = statusMap[task.id];
      let currentStatus = existing || "locked";

      if (existing === "completed") {
        currentStatus = "completed";
        unlocked = true;
      } else if (unlocked) {
        currentStatus = "unlocked";
        unlocked = false;
      } else {
        currentStatus = "locked";
      }

      return { ...task, status: currentStatus };
    });
  }

  async getPathStructure(pathId, userId) {
    const path = await this.getPathById(pathId);
    if (!path) return null;

    const modules = await this.getModulesByPath(pathId);
    const structure = [];

    for (const moduleItem of modules) {
      const tasks = await this.getTasksByModule(moduleItem.id);
      const tasksWithStatus = await this.getTaskStatusForUser(userId, tasks);
      structure.push({ ...moduleItem, tasks: tasksWithStatus });
    }

    return {
      path,
      modules: structure,
    };
  }

  async markTaskAttempt(userId, taskId, isCompleted) {
    const safeUserId = this.normalizePositiveInt(userId);
    const safeTaskId = this.normalizePositiveInt(taskId);

    const progress = await db.query(
      `SELECT * FROM task_progress WHERE user_id = $1 AND task_id = $2`,
      [safeUserId, safeTaskId]
    );

    const now = new Date().toISOString();

    if (progress.rows.length === 0) {
      const status = isCompleted ? "completed" : "in-progress";

      await db.query(
        `INSERT INTO task_progress
         (user_id, task_id, status, attempts, last_attempt_at, completed_at)
         VALUES ($1, $2, $3, 1, $4, $5)`,
        [safeUserId, safeTaskId, status, now, isCompleted ? now : null]
      );

      return { status, attempts: 1 };
    }

    const current = progress.rows[0];
    const attempts = (current.attempts || 0) + 1;
    const status = isCompleted ? "completed" : "in-progress";

    await db.query(
      `UPDATE task_progress
       SET status = $1, attempts = $2, last_attempt_at = $3, completed_at = $4
       WHERE id = $5`,
      [status, attempts, now, isCompleted ? now : current.completed_at, current.id]
    );

    return { status, attempts };
  }

  async unlockNextTask(userId, moduleId, taskOrderIndex) {
    const safeUserId = this.normalizePositiveInt(userId);
    const safeModuleId = this.normalizePositiveInt(moduleId);
    const safeTaskOrderIndex = this.normalizePositiveInt(taskOrderIndex);

    const { rows } = await db.query(
      `SELECT id FROM tasks WHERE module_id = $1 AND order_index = $2`,
      [safeModuleId, safeTaskOrderIndex + 1]
    );

    if (!rows[0]) return null;

    const nextTaskId = rows[0].id;

    const existing = await db.query(
      `SELECT * FROM task_progress WHERE user_id = $1 AND task_id = $2`,
      [safeUserId, nextTaskId]
    );

    if (existing.rows.length === 0) {
      await db.query(
        `INSERT INTO task_progress (user_id, task_id, status, attempts, last_attempt_at)
         VALUES ($1, $2, 'unlocked', 0, NULL)`,
        [safeUserId, nextTaskId]
      );

      return { taskId: nextTaskId, status: "unlocked" };
    }

    if (existing.rows[0].status === "locked") {
      await db.query(`UPDATE task_progress SET status = 'unlocked' WHERE id = $1`, [
        existing.rows[0].id,
      ]);

      return { taskId: nextTaskId, status: "unlocked" };
    }

    return { taskId: nextTaskId, status: existing.rows[0].status };
  }

  async getPathIdByTask(taskId) {
    const safeTaskId = this.normalizePositiveInt(taskId);

    const { rows } = await db.query(
      `SELECT p.id AS path_id
       FROM tasks t
       JOIN modules m ON t.module_id = m.id
       JOIN paths p ON m.path_id = p.id
       WHERE t.id = $1`,
      [safeTaskId]
    );

    return rows[0]?.path_id || null;
  }

  async isPathCompletedForUser(userId, pathId) {
    const safeUserId = this.normalizePositiveInt(userId, 0);
    const safePathId = this.normalizePositiveInt(pathId, 0);

    if (!safePathId || !safeUserId) return false;

    const totalTasksResult = await db.query(
      `SELECT COUNT(*)::int AS total_tasks
       FROM tasks t
       JOIN modules m ON t.module_id = m.id
       WHERE m.path_id = $1`,
      [safePathId]
    );

    const completedTasksResult = await db.query(
      `SELECT COUNT(*)::int AS completed_tasks
       FROM task_progress tp
       JOIN tasks t ON tp.task_id = t.id
       JOIN modules m ON t.module_id = m.id
       WHERE tp.user_id = $1 AND m.path_id = $2 AND tp.status = 'completed'`,
      [safeUserId, safePathId]
    );

    const totalTasks = Number(totalTasksResult.rows[0]?.total_tasks || 0);
    const completedTasks = Number(completedTasksResult.rows[0]?.completed_tasks || 0);

    return totalTasks > 0 && completedTasks >= totalTasks;
  }
}

module.exports = new PathService();