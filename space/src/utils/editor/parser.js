export const parseContent = (content) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const entryRegex = /e\/([a-zA-Z0-9_]+)/g;
    const exchangeRegex = /x\/([a-zA-Z0-9_]+)/g;
  
    // Use placeholders to prevent overlapping replacements
    content = content.replace(mentionRegex, '__MENTION__$1__ENDMENTION__');
    content = content.replace(hashtagRegex, '__HASHTAG__$1__ENDHASHTAG__');
    content = content.replace(entryRegex, '__ENTRY__$1__ENDENTRY__');
    content = content.replace(exchangeRegex, '__EXCHANGE__$1__ENDEXCHANGE__');
  
    // Replace placeholders with actual HTML links, adding class names for styling
    content = content.replace(/__MENTION__(.*?)__ENDMENTION__/g, '<a href="/profile/$1" class="mention">@$1</a>');
    content = content.replace(/__HASHTAG__(.*?)__ENDHASHTAG__/g, '<a href="/tags/$1" class="hashtag">#$1</a>');
    content = content.replace(/__ENTRY__(.*?)__ENDENTRY__/g, '<a href="/entries/$1" class="entry">e/$1</a>');
    content = content.replace(/__EXCHANGE__(.*?)__ENDEXCHANGE__/g, '<a href="/exchanges/$1" class="exchange">x/$1</a>');
  
    return content;
  };