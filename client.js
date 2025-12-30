if (typeof globalThis.File === 'undefined') {
  const { Blob } = require('buffer');
  globalThis.File = class File extends Blob {
    constructor(chunks, name, options = {}) {
      super(chunks, options);
      this.name = name;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}
// si y'a une seul erreur w'allay que je cry
if (!String.prototype.toWellFormed) {
  String.prototype.toWellFormed = function() {
    return String(this).replace(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
      '\uFFFD'
    );
  };
}
// si y'a une seul erreur w'allay que je cry
if (!String.prototype.isWellFormed) {
  String.prototype.isWellFormed = function() {
    return !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(String(this));
  };
}
// si y'a une seul erreur w'allay que je cry
// si y'a une seul erreur w'allay que je cry
const { Client } = require('discord.js-selfbot-v13');
const config = require('./config2');

const selfClient = new Client({
  checkUpdate: false
});
// si y'a une seul erreur w'allay que je cry
selfClient.once('ready', () => {
  console.log(`c pret : ${selfClient.user.tag}`);
});
// si y'a une seul erreur w'allay que je cry
selfClient.login(config.client.token).catch(err => {
  console.error('erreur de neuille freure :', err);
  process.exit(1);
});
// si y'a une seul erreur w'allay que je cry
module.exports = selfClient;
