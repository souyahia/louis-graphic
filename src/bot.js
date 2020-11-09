process.env.NTBA_FIX_319 = '1';

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const config = require('./conf');
const logger = require('./logger');
const { getComment, checkIfSubredditExists } = require('./reddit');

const bot = new TelegramBot(config.get('Telegram:Secret'), { polling: true });
const referenceTs = Date.now() / 1000;

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }

function processMedia(message) {
  try {
    if (message.date >= referenceTs) {
      const postIndex = getRandomInt(0, config.get('Reddit:MaxPostRank'));
      const commentIndex = getRandomInt(0, config.get('Reddit:MaxCommentRank'));
      let subreddit = config.get(`State:Subreddits:${message.chat.id}`);
      if (!subreddit) { subreddit = config.get('State:Subreddits:Default'); }
      getComment(subreddit, postIndex, commentIndex).then((comment) => {
        bot.sendMessage(
          message.chat.id,
          comment,
          { reply_to_message_id: message.message_id },
        ).then(() => {
          logger.info(`# Processed media in chat ${message.chat.id} with comment #${commentIndex} in post #${postIndex} in r/${subreddit}.`);
          logger.info(comment);
        });
      });
    } else {
      logger.info(`# Old media received in chat ${message.chat.id} but not processed.`);
    }
  } catch(err) {
    logger.error(`# Error while processing media in chat ${message.chat.id} :`, err);
  }
}

function processCommand(message) {
  if (message.text.startsWith('/subreddit ')) {
    const subreddit = message.text.substring(11);
    checkIfSubredditExists(subreddit).then((exists) => {
      if (exists) {
        config.set(`State:Subreddits:${message.chat.id}`, subreddit);
        config.save();
        bot.sendMessage(
          message.chat.id,
          `I successfully changed your subreddit source to ${subreddit.substring(2)}.`,
          { reply_to_message_id: message.message_id },
        );
      } else {
        bot.sendMessage(
          message.chat.id,
          'Sorry, this subreddit does not seem to exist. The syntax of the command is : /subreddit r/mySubreddit',
          { reply_to_message_id: message.message_id },
        );
        logger.error(`# Unknown subreddit for command /subreddit : ${subreddit}`);
      }
    });
  } else if (message.text.startsWith('/help')) {
    bot.sendMessage(
      message.chat.id,
      `Louis Graphic is a bot that will answer to your photos / videos messages with random comments obtained from Reddit. The comments are selected from the top 200 posts of a certain subreddit. The default subreddit is ${config.get('State:Subreddits:Default')}, but you can change the subreddit with the /subreddit command.`,
      { reply_to_message_id: message.message_id },
    );
    logger.info(`# Answered to a help message in ${message.chat.id}`);
  } else if (message.text.startsWith('/admin ') && message.chat.type === 'private') {
    const secret = message.text.substring(7);
    if (secret === config.get('Telegram:Secret')) {
      const configStr = fs.readFileSync(path.join(__dirname, 'config.json'));
      bot.sendMessage(
        message.chat.id,
        configStr
      );
      logger.info(`# Sent full config to ${message.chat.first_name} ${message.chat.last_name}`);
    } else {
      bot.sendMessage(
        message.chat.id,
        'Sorry, wrong Telegram Secret.',
        { reply_to_message_id: message.message_id },
      );
      logger.error(`# Bad telegram secret from ${message.chat.first_name} ${message.chat.last_name}`);
    }
  }
}

logger.info('Start bot polling...');
bot.on('message', (message) => {
  if (message.photo || message.video) { processMedia(message); }
  else if (message.text && message.text.startsWith('/')) { processCommand(message); }
});