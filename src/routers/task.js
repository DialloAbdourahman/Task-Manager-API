const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/task');

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(e);
  }
});

router.get('/tasks', auth, async (req, res) => {
  const { completed, limit, skip, sortBy } = req.query;
  const match = {};
  const sort = {};

  if (completed) {
    match.completed = completed === 'true' ? true : false;
  }

  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

// router.get('/tasks', auth, async (req, res) => {
//   let { page, sortBy } = req.query;

//   const itemPerPage = 2;
//   page = parseInt(page) - 1;

//   const sort = {};
//   if (sortBy) {
//     const parts = sortBy.split(':');
//     sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
//   }

//   try {
//     const tasks = await Task.find({ owner: req.user._id })
//       .limit(itemPerPage)
//       .skip(itemPerPage * page)
//       .sort(sort);
//     res.send(tasks);
//   } catch (error) {
//     res.status(500).send();
//   }
// });

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      res.status(404).send();
      return;
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    res.status(400).send({ error: 'Invalid updates' });
    return;
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      res.status(404).send();
      return;
    }

    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send();
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      res.status(404).send();
    }

    res.send(task);
  } catch (error) {
    res.status(400).send();
  }
});

module.exports = router;
