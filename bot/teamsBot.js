
const { TeamsActivityHandler, TurnContext } = require("botbuilder");

const path = require('path');

// Read botFilePath and botFileSecret from .env file.
require('dotenv').config({ path: '../env/.env.local' }); // If deploying or provisioning the sample, please replace this with with .env.dev

class TeamsBot extends TeamsActivityHandler {
  constructor(conversationReferences) {
    super();
    // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
    this.conversationReferences = conversationReferences;

    this.onConversationUpdate(async (context, next) => {
      this.addConversationReference(context.activity);

      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
          const welcomeMessage = `Welcome from the Pull Request Bot.`;
          await context.sendActivity(welcomeMessage);
        }
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMessage(async (context, next) => {
      this.addConversationReference(context.activity);

      await context.sendActivity(`Hello. Make a post request to ${process.env.PROVISIONOUTPUT__BOTOUTPUT__SITEENDPOINT}/api/notify with conversationId:${context.activity.conversation.id} and message in the request body to proactively message.`);
      await next();
    });

  }

  addConversationReference(activity) {
    const conversationReference = TurnContext.getConversationReference(activity);
    this.conversationReferences[conversationReference.conversation.id] = conversationReference;
  }

}

module.exports.TeamsBot = TeamsBot;
