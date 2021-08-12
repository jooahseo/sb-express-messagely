const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const ExpressError = require("../expressError");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", async (req, res, next) => {
  try {
    const m = await Message.get(req.params.id);
    if (
      req.user.username === m.from_user.username ||
      req.user.username === m.to_user.username
    ) {
      return res.json({ message: m });
    }
    throw new ExpressError("Unauthorized", 401);
  } catch (e) {
    return next(e);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const { to_username, body } = req.body;
    const from_username = req.user.username;
    if (!to_username || !body) {
      throw new ExpressError("to_username and body are required", 400);
    }
    const messageObj = { from_username, to_username, body };
    const m = await Message.create(messageObj);
    return res.json({ message: m });
  } catch (e) {
    return next(e);
  }
});
/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", async (req, res, next) => {
  try {
    const m = await Message.get(req.params.id);
    if (m.to_user.username !== req.user.username) {
      throw new ExpressError("Unauthorized", 401);
    }
    const read = await Message.markRead(req.params.id);
    return res.json({ message: read });
  } catch (e) {
    return next(e);
  }
});
module.exports = router;
