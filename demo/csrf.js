const crypto = require("crypto");

const max_age = 5 * 60 * 1000;
const token_cache = {};

function md5(str) {
  return crypto
    .createHash("md5")
    .update(str.toString())
    .digest("hex");
}

module.exports = function(secret) {
  return {
    create() {
      let token = md5(`${secret}-${Math.random()}-${Date.now()}`);
      token_cache[token] = 1;
      setTimeout(() => {
        delete token_cache[token];
      }, max_age);
      return token;
    },
    verify(token) {
      if (token_cache[token]) {
        delete token_cache[token];
        return true;
      }
      return false;
    }
  };
};
