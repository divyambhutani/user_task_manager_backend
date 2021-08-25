const express = require("express");
const User = require("../models/user");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");

// for creating a new user
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.getAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// logging in a user
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    if (!user) return res.status(404).send("Unable to login");

    const token = await user.getAuthToken();
    res.send({ user, token });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

//logging out a user
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    console.log(req.user.tokens.length);
    await req.user.save();
    res.status(200).send("User logged out!");
  } catch (e) {
    res.status("401").send("Please Authenticate");
  }
});

//logging out all sessions of a user
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send("Logged out of all sessions");
  } catch (e) {
    res.status("401").send("Please authenticate");
  }
});

// for reading all users
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.get("/users/me/avatar", auth, async (req, res) => {
  const user = req.user;
  if (!user.avatar) {
    return res.status(404).send();
  }
  res.set("Content-Type", "images/jpg");
  res.send(req.user.avatar);
});

// updating a user data
router.patch("/users/me", auth, async (req, res) => {
  const fields = ["email", "name", "age", "password"];
  const updates = Object.keys(req.body);
  const isValidUpdate = updates.every((update) => fields.includes(update));
  if (!isValidUpdate) {
    return res.status(404).send({ error: "Invalid fields" });
  }
  try {
    const user = req.user;

    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();

    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error("Please upload an image "));
    }
    // undefined tells no error and true means uploaded successfully
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = sharp(req.file.buffer)
      .resize({ height: 250, width: 250 })
      .png()
      .toBuffer();
    req.user.avatar = req.file.buffer;
    try {
      await req.user.save();
    } catch (e) {
      console.log(e);
      return res.status(500).send();
    }
    return res.status(200).send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    return res.status(200).send("Removed avatar");
  } catch (e) {
    console.log(e.message);
    return res.status(500).send();
  }
});

// delete a user
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
