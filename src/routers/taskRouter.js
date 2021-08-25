const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = express.Router();

// for creating a new task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// get all tasks
// /tasks?completed=true
// pagination with limit and skip
// /tasks?limit=5&skip=0
// /tasks?sortBy=createdAt_asc or desc
// /tasks?sortBy=completed_true
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split("_");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }
  try {
    const user = req.user;

    await user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.status(201).send(user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

//get a task by id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) return res.status(404).send();

    res.status(201).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// updating task
router.patch("/tasks/:id", auth, async (req, res) => {
  const fields = ["completed", "description"];
  const updates = Object.keys(req.body);
  const isValidUpdate = updates.every((update) => fields.includes(update));

  if (!isValidUpdate)
    return res.status(404).send({ error: "Invalid update fields" });
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) return res.status(404).send({ error: "No task found with id" });

    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    await task.save();

    res.send(task);
  } catch (e) {
    return res.status(500).send();
  }
});

//delete tasks
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) return res.status(404).send({ error: "No task with id found" });
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
