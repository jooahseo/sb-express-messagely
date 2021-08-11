/** User class for message.ly */
const bcrypt = require("bcrypt");
const db = require("../db");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const ExpressError = require("../expressError");
/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users 
      (username, password, first_name,last_name,phone,join_at)
      VALUES ($1,$2,$3,$4,$5, current_timestamp)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPw, first_name, last_name, phone]
    );
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password
        FROM users
        WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    db.query(
      `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone
        FROM users;`
    );
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (!user) {
      throw new ExpressError("User not found", 404);
    }
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id, 
              m.to_username, 
              t.first_name, t.last_name, t.phone,
              m.body, m.sent_at, m.read_at
        FROM messages AS m
          JOIN users AS t ON m.to_username = t.username
        WHERE m.from_username = $1`,
      [username]
    );
    if (!result.rows.length) {
      throw new ExpressError(`${username} has no sent messages`, 404);
    }
    const messages = result.rows.map((obj) => {
      return {
        id: obj.id,
        to_user: {
          username: obj.to_username,
          first_name: obj.first_name,
          last_name: obj.last_name,
          phone: obj.phone,
        },
        body: obj.body,
        sent_at: obj.sent_at,
        read_at: obj.read_at,
      };
    });
    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id, 
        m.from_username, 
        f.first_name, f.last_name, f.phone,
        m.body, m.sent_at, m.read_at
        FROM messages AS m
        JOIN users AS f ON m.from_username = f.username
        WHERE m.to_username = $1`,
      [username]
    );
    if (!result.rows.length) {
      throw new ExpressError(`${username} has no received messages`, 404);
    }
    const messages = result.rows.map((obj) => {
      return {
        id: obj.id,
        from_user: {
          username: obj.from_username,
          first_name: obj.first_name,
          last_name: obj.last_name,
          phone: obj.phone,
        },
        body: obj.body,
        sent_at: obj.sent_at,
        read_at: obj.read_at,
      };
    });
    return messages;
  }
}

module.exports = User;
