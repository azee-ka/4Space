import React, { useState, useEffect } from 'react';

// Utility function to parse plain text and replace mentions, hashtags, etc. with links
const parsePlainText = (content) => {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const entryRegex = /e\/([a-zA-Z0-9_]+)/g;
  const exchangeRegex = /x\/([a-zA-Z0-9_]+)/g;

  content = content.replace(mentionRegex, (match, username) => {
    return `<a href="/profile/${username}" class="mention-link" data-hover="${username}">@${username}</a>`;
  });

  content = content.replace(hashtagRegex, (match, hashtag) => {
    return `<a href="/tags/${hashtag}" class="hashtag-link" data-hover="${hashtag}">#${hashtag}</a>`;
  });

  content = content.replace(entryRegex, (match, entry) => {
    return `<a href="/entries/${entry}" class="entry-link" data-hover="${entry}">e/${entry}</a>`;
  });

  content = content.replace(exchangeRegex, (match, exchange) => {
    return `<a href="/exchanges/${exchange}" class="exchange-link" data-hover="${exchange}">x/${exchange}</a>`;
  });

  return content;
};

const ContentRenderer = ({ content, isRichText = false }) => {
  const [parsedContent, setParsedContent] = useState('');

  useEffect(() => {
    if (isRichText) {
      // For rich text, we assume it's already in HTML format (with classes)
      setParsedContent(content);
    } else {
      // Parse plain text into HTML with links
      setParsedContent(parsePlainText(content));
    }
  }, [content, isRichText]);

  return (
    <div
      className="content-renderer"
      dangerouslySetInnerHTML={{ __html: parsedContent }} // Renders the parsed HTML content
    />
  );
};

export default ContentRenderer;
