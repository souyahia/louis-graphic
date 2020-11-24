const bent = require('bent');
const htt = require('html-to-text');
const Entities = require('html-entities').AllHtmlEntities;
const logger = require('./logger');

const getJSON = bent('json');
const getString = bent('string');
const htmlEntities = new Entities();

const baseUrl = 'https://www.reddit.com';

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }

function isValidComment(comment) {
  if (!comment) { return false; }
  if (comment.data.body === '[deleted]') { return false; }
  return comment.data.author_fullname !== 't2_6l4z3';
}

async function getComment(subreddit, maxPostRank, maxCommentRank) {
  let postRank = getRandomInt(0, maxPostRank);

  let listing = null;
  let url = `${baseUrl}/${subreddit}/top.json?sort=top&t=all&limit=100`;
  listing = await getJSON(url);

  while (postRank >= 100) {
    postRank -= 100;
    url = `${baseUrl}/${subreddit}/top.json?sort=top&t=all&limit=100&after=${listing.data.after}`;
    listing = await getJSON(url);
  }

  const postId = listing.data.children[postRank].data.name.substring(3);
  url = `${baseUrl}/${subreddit}/comments/${postId}/top.json?sort=top&t=all`;
  const commentListings = await getJSON(url);

  let commentRank = Math.floor(Math.random() * maxCommentRank + 1);
  while (!isValidComment(commentListings[1].data.children[commentRank])) {
    commentRank = Math.floor(Math.random() * maxCommentRank + 1);
  }
  const html = htmlEntities.decode(commentListings[1].data.children[commentRank].data.body_html);
  return htt.fromString(html, {
    wordwrap: false,
  });
}

async function checkIfSubredditExists(subreddit) {
  try {
    if (!subreddit.startsWith('r/')) { return false; }
    const listing = await getJSON(`${baseUrl}/${subreddit}.json?limit=1`);
    return listing.data.children.length > 0;
  } catch(err) {
    // logger.error(`# Error while processing /subreddit command with value : ${subreddit}`, err);
    return false;
  }
}

module.exports = {
  getComment,
  checkIfSubredditExists,
};