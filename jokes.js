// const { App } = require("@slack/bolt");
// const app = new App({
//   token: process.env.SLACK_BOT_TOKEN,
//   signingSecret: process.env.SLACK_SIGNING_SECRET
// });
const host = require("./app.js");
export run() {
  host.app.message("cb.config test", async ({ message, say, context }) => {
    try {
      say("Testing is successful.");
    } catch (error) {
      console.error(error);
    }
  });
};
