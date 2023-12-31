// index.js is used to setup and configure your bot

// Import required packages
const restify = require("restify");

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const {  BotFrameworkAdapter } = require("botbuilder");
const { TeamsBot } = require("./teamsBot");


// // Create adapter.
// // See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
  appId: process.env.BOT_ID,
  appPassword: process.env.BOT_PASSWORD,
});


adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights. See https://aka.ms/bottelemetry for telemetry
  //       configuration instructions.
    console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Uncomment below commented line for local debugging..
  // await context.sendActivity(`Sorry, it looks like something went wrong. Exception Caught: ${error}`);

};

// Create the bot that will handle incoming messages.
const conversationReferences = {};
const bot = new TeamsBot(conversationReferences);

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`\nBot started, ${server.name} listening to ${server.url}`);
});

// Listen for incoming requests.
server.post("/api/messages", async (req, res) => {
  await adapter.processActivity(req, res, async (context) => {
    await bot.run(context);
  });
});

// Listen for incoming notifications and send proactive messages to users.
server.post('/api/notify', async (req, res) => {
  const conversationId = req.body['conversationId'];
  const message = req.body['message'] || "hello \n conversationId: " + conversationId;

  console.log(JSON.stringify(conversationReferences));
  if(conversationReferences[conversationId]){
    await adapter.continueConversation(conversationReferences[conversationId], async (context) => {
      await context.sendActivity(message);
    });
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Message has been sent.</h1></body></html>');
    res.end();
  }
  else{
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(404);
    res.write('<html><body><h1>Please install the bot in the conversation(group chat/channel/personal chat). If already installed, please try again after uninstalling and installing it back.</h1></body></html>');
    res.end();
  }

});

// Gracefully shutdown HTTP server
["exit", "uncaughtException", "SIGINT", "SIGTERM", "SIGUSR1", "SIGUSR2"].forEach((event) => {
  process.on(event, () => {
    server.close();
  });
});
