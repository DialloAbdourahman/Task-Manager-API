const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendGoodbyeMessage } = require('../emails/account');
const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send();
  }
});

// All we do here is to delete the token from the database.
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  }
});

// An example here is logging out all users using your netflix account
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    res.status(400).send({ error: 'Invalid updates' });
    return;
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();

    res.send(req.user);
  } catch (error) {
    res.status(400).send();
  }
});

// We have a middleware to handle this even though I could've just written the whole code here
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();
    sendGoodbyeMessage(req.user.email, req.user.name);
    res.send(req.user);
  } catch (error) {
    res.status(400).send();
  }
});

// This is a middleware that allows us to upload images thanks to the multer library.
const upload = multer({
  // dest: 'avatars', // we won't store it in the file system so that it should be available to use in the req.file and also we will lose all out images once we upload our api.
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, callback) {
    if (
      !file.originalname.endsWith('.jpg') &&
      !file.originalname.endsWith('.png') &&
      !file.originalname.endsWith('.jpeg')
    ) {
      callback(new Error('Please upload a .jpg, .jpeg or a .png image'));
    }
    callback(undefined, true);
  },
});

// what we are recieving here is a form-body not a json data, so we set it up in a different request and not combining it in the update route for example.
// To display this in html, use the <img src="data:image;base64,then the binary data"/>
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    // we can also crop the image in the client side
    const buffer = await sharp(req.file.buffer)
      .resize({
        width: 250,
        height: 250,
      })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.status(200).send();
  }
);

router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.status(200).send();
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    // telling the user the type of response they will get user the header
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;
