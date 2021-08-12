const express = require("express");
const router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError("username and password are required", 400);
    }
    const response = await User.authenticate(username, password);
    if (response) {
      User.updateLoginTimestamp(username);
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ message: `Welcome! ${username}`, token });
    } else {
      throw new ExpressError("Invalid username or password", 400);
    }
  } catch (e) {
    return next(e);
  }
});
/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async (req, res, next) => {
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    if (!username || !password || !first_name || !last_name || !phone) {
      throw new ExpressError(
        "username, password, first_name, last_name, and phone are required",
        400
      );
    }
    const response = await User.register({username, password, first_name, last_name, phone});
    if (response) {
        User.updateLoginTimestamp(username);
        const token = jwt.sign({ username }, SECRET_KEY);
        return res.json({message: `Welcome! ${username}`, token})
    }
  } catch (e) {
    if (e.code === "23505") {
      return next(new ExpressError("Username taken. Please pick another!", 400));
    }
    return next(e);
  }
});

module.exports = router;