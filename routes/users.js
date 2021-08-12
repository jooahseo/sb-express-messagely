const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const ExpressError = require("../expressError");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth")

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/", (req, res, next) => {
  try {
    const allUsers = User.all();
    return res.json({ users: allUsers });
  } catch (e) {
    return next(e);
  }
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 * only that user can view their get-user-detail route.
 **/

router.get("/:username", ensureCorrectUser, (req, res, next) => {
  try {
    const userInfo = User.get(req.params.username);
    return res.json({ user: userInfo });
  } catch (e) {
    return next(e);
  }
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 * only that user can view their from-messages or to-messages routes.
 **/

router.get("/:username/to", ensureCorrectUser, (req, res, next) => {
  try {
    const messagesTo = User.messagesTo(req.params.username);
    return res.json({ messages: messagesTo });
  } catch (e) {
    return next(e);
  }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 * only that user can view their from-messages or to-messages routes.
 **/

router.get("/:username/from", ensureCorrectUser, (req, res, next) => {
  try {
    const messagesFrom = User.messagesFrom(req.params.username);
    return res.json({ messages: messagesFrom });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
