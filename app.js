// Require the Bolt package (github.com/slackapi/bolt)
const { App } = require("@slack/bolt");
const http = require("http");
const express = require("express");
const jp = require("jsonpath");
const https = require("https");
const je = require("./jsonEdit.js");
const fs = require("fs");
const { JSONPath } = require("jsonpath-plus");

const users = "./json/users.json";

const userToken = process.env.SLACK_USER_TOKEN;
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const tbaToken = process.env.TBA_TOKEN; // Token for The Blue Alliance API

const toaToken = process.env.TOA_TOKEN; // Token for The Orange Alliance API
var cust_channel ="";
const spamChannel = "GRVE7TBT3"; // Channel ID of channel where spammy commands are allowed
const randomChannel = "CQG1F0H9B";
const doorbellChannel = "CSF0Z49EH"; // Channel ID of doorbell channel

app.command("/tba", async ({ command, say, context, ack }) => {
  try {
    ack();
    
    var teamNum = command.text;
    console.log(teamNum);
    var options = {
      host: "www.thebluealliance.com",
      path: `/api/v3/team/frc${teamNum}`,
      method: "GET",
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_TOKEN,
        "User-Agent": "TB Slack Bot"
      }
    };
    var tbaResponse = " ";

    https.get(options, function(res) {
      console.log("Connected to TBA");
      var body = " ";
      res.on("data", function(chunk) {
        body += chunk;
      });
      res.on("end", function(done) {
        tbaResponse = JSON.parse(body);
        console.log(tbaResponse.nickname);
        say({
          blocks: [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: `Here's what I found on team ${teamNum}`,
                emoji: true
              }
            },
            { type: "divider" },
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Team ${teamNum}*` }
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `https://www.thebluealliance.com/team/frc${teamNum}`
                }
              ]
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: "*Nickname:*" },
                { type: "plain_text", text: `${tbaResponse.nickname}` },
                { type: "mrkdwn", text: "*Location:*" },
                {
                  type: "plain_text",
                  text: `${tbaResponse.city}, ${tbaResponse.state_prov}, ${tbaResponse.country}`
                },
                { type: "mrkdwn", text: "*Rookie Year:*" },
                { type: "plain_text", text: `${tbaResponse.rookie_year}` },
                { type: "mrkdwn", text: "*Website:*" },
                { type: "plain_text", text: `${tbaResponse.website}` }
              ]
            }
          ]
        });
      });
    });
    
  } catch (error) {
    console.error(error);
  }
});

app.command("/toa", async ({ command, say, context, ack }) => {
  try {
    ack();
    var teamNum = command.text;
    console.log(teamNum);
    var options = {
      host: "theorangealliance.org",
      path: `/api/team/${teamNum}`,
      method: "GET",
      headers: {
        "X-TOA-Key": process.env.TOA_TOKEN,
        "X-Application-Origin": "TB Slack Bot",
        "Content-Type": "application/json"
      }
    };
    var toaResponse = " ";

    https.get(options, function(res) {
      console.log("Connected to TOA");
      var body = " ";
      res.on("data", function(chunk) {
        body += chunk;
      });
      res.on("end", function(done) {
        toaResponse = JSON.parse(body);
        console.log(toaResponse);
        console.log(toaResponse[0].team_key);
        say({
          blocks: [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: `Here's what I found on team ${teamNum}`,
                emoji: true
              }
            },
            { type: "divider" },
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Team ${teamNum}*` }
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `https://www.theorangealliance.org/teams/${teamNum}`
                }
              ]
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: "*Nickname:*" },
                {
                  type: "plain_text",
                  text: `${toaResponse[0].team_name_short}`
                },
                { type: "mrkdwn", text: "*Location:*" },
                {
                  type: "plain_text",
                  text: `${toaResponse[0].city}, ${toaResponse[0].state_prov}, ${toaResponse[0].country}`
                },
                { type: "mrkdwn", text: "*Rookie Year:*" },
                { type: "plain_text", text: `${toaResponse[0].rookie_year}` },
                { type: "mrkdwn", text: "*Website:*" },
                { type: "plain_text", text: `${toaResponse[0].website}` }
              ]
            }
          ]
        });
      });
    });
  } catch (error) {
    console.error(error);
  }
});

// app.command("/cb-debug", async ({ command, say, context, ack }) => {
//   try {
//     ack();
//     var args = command.text.split(" ");
//     if (args[0] == "chanID.log") {
//       console.log("Channel ID requested: " + command.channel_id);
//     }
//   } catch (error) {
//     console.error(error);
//   }
// });

app.command("/lmi", async ({ payload, command, say, context, ack }) => {
  try {
    ack();
    if (
      (command.channel_id == doorbellChannel) |
      (command.channel_id == spamChannel) |
      (command.user_id == "UR6SF5B97")
    ) {
      say(`<@${command.user_id}> has requested to be let into the facility.`);
      console.log(`${command.user_id} request for entry`);
      let raw = {};
      var usersArray = [];
      fs.readFile(users, "utf-8", function(err, data) {
        if (err) throw err;

        let objects = JSON.parse(data);
        console.log(objects);
        var usersPing = JSONPath("$.members[?(@.ping == true)].id", objects);
        console.log(usersPing);
        if (usersPing !== null) {
          var usersString = "";
          for (let n = 0; n < usersPing.length; n++) {
            usersString = usersString + `<@${usersPing[n]}>`;
          }
          say(
            usersString +
              ", <!channel> please let <@" +
              command.user_id +
              "> into the facility."
          );
        } else {
          app.client.chat.postEphemeral({
            token: context.botToken,
            channel: command.channel_id,
            user: command.user_id,
            text: `There are no users checked in, so no users will be pinged`
          });
        }
      });
      // console.log(usersArray);
      // say(usersString + `Please open the door.`);
    } else {
      app.client.chat.postEphemeral({
        token: context.botToken,
        channel: command.channel_id,
        user: command.user_id,
        text: `Sorry, this command is restricted to <#${doorbellChannel}>.`
      });
    }
  } catch (error) {
    console.error(error);
  }
});

app.command("/attpoll", async ({ command, say, context, ack }) => {
  try {
  } catch (error) {
    console.error(error);
  }
});

app.command("/checkin", async ({ command, say, context, ack }) => {
  try {
    ack();
    // je.setFile('./json/users.json');
    var raw = fs.readFile(users, "utf-8", function(err, data) {
      if (err) throw err;

      var objects = JSON.parse(data);
      console.log(
        jp.query(objects, `$.members[?(@.id == ${command.user_id})]`)
      );
      if (
        jp.query(objects, `$.members[?(@.id == ${command.user_id})]`) == true
      ) {
        app.client.chat.postEphemeral({
          token: context.botToken,
          channel: command.channel_id,
          user: command.user_id,
          text: `You're already checked in!`
        });
      } else {
        var userInfo = {
          id: command.user_id,
          ping: true
        };
        objects.members.push(userInfo);
        var toWrite = JSON.stringify(objects);
        fs.writeFile(users, toWrite, err => {
          if (err) {
            console.log("Error writing file", err);
          } else {
            console.log("Successfully wrote new user info");
          }
        });
      }
      return objects;
    });

    // console.log(JSON.stringify(je.get("members[0]")));
    // file.set(`members.${command.user_id}.ping`, true);
    // console.log(file.get(`members.${command.user_id}.ping`));
    // console.log(`member ${command.user_id} has checked in.`);
  } catch (error) {
    console.error(error);
  }
});

app.command("/cb-debug", async ({ command, say, context, ack }) => {
  ack();
  try{
    const result = await app.client.views.open({
      /* retrieves your xoxb token from context */
      token: context.botToken,

      trigger_id: command.trigger_id,

      /* the view payload that appears in the app home*/
      view: {
        "type": "modal",
        callback_id: "custom_message",
        "title": {
          "type": "plain_text",
          "text": "Custom Message",
          "emoji": true
        },
        "submit": {
          "type": "plain_text",
          "text": "Send",
          "emoji": true
        },
        "close": {
          "type": "plain_text",
          "text": "Cancel",
          "emoji": true
        },
        "blocks": [
          {
            "type": "input",
            block_id: "icon_type",
            "element": {
              "type": "static_select",
              action_id: "type_icon",
              "placeholder": {
                "type": "plain_text",
                "text": "Select a user",
                "emoji": true
              },
              "options": [
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Emoji"
                  },
                  "value": "emoji"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "URL"
                  },
                  "value": "url"
                },
                {
                  "text": {
                    "type": "plain_text",
                    "text": "Default"
                  },
                  "value": "default"
                }
              ]
            },
            "label": {
              "type": "plain_text",
              "text": "Icon Type",
              "emoji": true
            }
          },
          {
            "type": "input",
            block_id: "icon_string",
            "element": {
              "type": "plain_text_input",
              action_id: "string_icon"
            },
            "label": {
              "type": "plain_text",
              "text": "URL or Emoji",
              "emoji": true
            }
          },
          {
            "type": "input",
            block_id: "user_name",
            "element": {
              "type": "plain_text_input",
              action_id: "name_user"
            },
            "label": {
              "type": "plain_text",
              "text": "Username",
              "emoji": true
            }
          },
          {
            "type": "input",
            block_id: "message_text",
            "element": {
              "type": "plain_text_input",
              "multiline": true,
              action_id: "text_message"
            },
            "label": {
              "type": "plain_text",
              "text": "Message",
              "emoji": true
            }
          }
        ]
      }
    });
    console.log(command.channel_id);
    cust_channel = command.channel_id;
    
    // console.log(result.response_metadata.messages);
  }
  catch(error){
    console.error(error);
  }
});

app.view("custom_message", async ({ ack, body, view, context }) => {
  // Acknowledge the view_submission event
  await ack();
  console.log(cust_channel);
  // Do whatever you want with the input data - here we're saving it to a DB then sending the user a verifcation of their submission

  // Assume there's an input block with `block_1` as the block_id and `input_a`
  const type = view['state']['values']['icon_type']['type_icon']['selected_option']['value'];
  const string = view['state']['values']['icon_string']['string_icon']['value'];
  const username = view['state']['values']['user_name']['name_user']['value'];
  const text = view['state']['values']['message_text']['text_message']['value'];
  
  console.log(string);
  console.log(username);
  console.log(text);
  console.log(context);
  
  try {
    if(type == 'emoji')  {
      const result = await app.client.chat.postMessage({
        // The token you used to initialize your app is stored in the `context` object
        token: context.botToken,
        // Payload message should be posted in the channel where original message was heard
        channel: cust_channel,
        text: text,
        icon_emoji: string,
        username: username
      });
    }
    else if(type == 'url') {
      const result = await app.client.chat.postMessage({
        // The token you used to initialize your app is stored in the `context` object
        token: context.botToken,
        // Payload message should be posted in the channel where original message was heard
        channel: cust_channel,
        text: text,
        icon_url: string,
        username: username
      });
    }
    else {
      const result = await app.client.chat.postMessage({
        // The token you used to initialize your app is stored in the `context` object
        token: context.botToken,
        // Payload message should be posted in the channel where original message was heard
        channel: cust_channel,
        text: text

      });
    }
    
  }
  catch (error) {
    console.error(error);
  }

});
app.message("cb.listAllCheckedIn", async ({ message, say, ack }) => {
  try {
    // var fileContents = file.get();
    // console.log(fileContents);
    // var checkedIn = jp.query(fileContents, '$.members[?(@.ping=true)].id');
    // console.log(checkedIn);
  } catch (error) {
    console.error(error);
  }
});

app.message("cb.getchannelid", async ({ message, say, context }) => {
  try{
    say(message.channel);
  }
  catch (error){
    console.error(error);
  }
});


app.message(/^cb.catfact$/, async ({ message, say, context }) => {
  try{
    var options = {
      host: "catfact.ninja",
      path: `/fact`,
      method: "GET",
    };
    var response = " ";

    https.get(options, function(res) {
      console.log("Generating CatFact");
      var body = " ";
      res.on("data", function(chunk) {
        body += chunk;
      });
      res.on("end", function(done) {
        response = JSON.parse(body);
        console.log(response);
        say({
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Here's a Cat Fact!*"
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": response.fact,
                "verbatim": false
              }
            },
            {
              "type": "context",
              "elements": [
                {
                  "type": "mrkdwn",
                  "text": `This message triggered by <@${message.user}>`
                }
              ]
            }
          ]
        });
      });
    });
  }
  catch(error) {
    console.error(error)
  }
});
    
app.message(/^cb.joke$/, async ({ message, say, context }) => {
  try{
    var options = {
      host: "icanhazdadjoke.com",
      headers:{
        Accept: 'application/json'
      },
      path: ``,
      method: "GET",
    };
    var response = " ";

    https.get(options, function(res) {
      console.log("Generating Dad Joke");
      var body = " ";
      res.on("data", function(chunk) {
        body += chunk;
      });
      res.on("end", function(done) {
        response = JSON.parse(body);
        console.log(response);
        say({
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "*Here's a Joke!*"
              }
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": response.joke,
                "verbatim": false
              }
            },
            {
              "type": "context",
              "elements": [
                {
                  "type": "mrkdwn",
                  "text": `This message triggered by <@${message.user}>`
                }
              ]
            }
          ]
        });
      });
    });
  }
  catch(error){
    console.error(error);
  }
});

app.message("filthy weeb", async ({ message, context }) => {
  try{
    // react as self
    const result = await app.client.reactions.add({
      token: context.botToken,
      botId: context.botId,
      channel: message.channel,
      name: 'thumbsdown',
      timestamp: message.ts
    });
    
    // react as user
    const result2 = await app.client.reactions.add({
      token: userToken,
      channel: message.channel,
      name: 'thumbsdown',
      timestamp: message.ts
    });
  }
  catch(error) {
    console.error(error);
  }
});

app.message(/teddy/i, async ({ message, context }) => {
  try{
    app.client.chat.postEphemeral({
          token: context.botToken,
          channel: message.channel,
          user: message.user,
          text: `<@${message.user}>, please use the correct name for Tessa!`
        });
    console.log(`Deadname by <@${message.user}> corrected. Original text: "${message.text}".`)
  }
  catch(error) {
    console.error(error);
  }
})
app.event("app_home_opened", async ({ event, context }) => {
  console.log("App Home Opened");
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await app.client.views.publish({
      /* retrieves your xoxb token from context */
      token: context.botToken,

      botId: context.botId,
      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view payload that appears in the app home*/
      view: {
        type: "home",
        callback_id: "home_view",

        /* body of the view */
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Welcome to CircuitBot*"
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                "I'm a bot programmed to be of assistance to The CircuitRunners. As such, I have several commands related to robotics!\n `/tba [team #]` gets information about a specified FRC Team from The Blue Alliance.\n `/toa [team #]` gets information about a specified FTC Team from The Orange Alliance.\n Please contact <@UR6SF5B97> if you have any questions about this bot!"
            }
          }
          
        ]
      }
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
