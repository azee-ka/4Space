// src/utils/autoCompleteInput/renderText.jsx
import React from 'react';
import DOMPurify from 'dompurify';
import './renderText.css';

const convertTextToLinks = (text) => {
    // username must start/end alphanumeric, and may contain . _ - in between
    const userHandle = '[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?';
    
    // c/community-slug  → community pages
    const communityPattern = new RegExp(`\\bc\\/([A-Za-z0-9][A-Za-z0-9_-]*)\\b`, 'g');
    // u/username
    const uPattern = new RegExp(`\\bu\\/(${userHandle})\\b`, 'g');
    // @username
    const mentionPattern = new RegExp(`@(${userHandle})\\b`, 'g');
    // #hashtag (word chars only)
    const hashtagPattern = /\#(\w+)\b/g;
    // x/exchange (allow word chars and dashes)
    const exchangePattern = /\bx\/([\w-]+)\b/g;

    // convert in order
    return text
      .replace(communityPattern, (_m, slug) =>
        `<a href="/communities/c/${slug}" class="community-link">c/${slug}</a>`
      )
      .replace(uPattern, (_m, name) =>
        `<a href="/profile/${name}" class="mention-link">u/${name}</a>`
      )
      .replace(mentionPattern, (_m, name) =>
        `<a href="/profile/${name}" class="mention-link">@${name}</a>`
      )
      .replace(hashtagPattern, (_m, tag) =>
        `<a href="/hashtag/${tag}" class="hashtag-link">#${tag}</a>`
      )
      .replace(exchangePattern, (_m, id) =>
        `<a href="/exchange/${id}" class="exchange-link">x/${id}</a>`
      );
};

const RenderText = ({ text }) => {
    if (!text) return null;
    const withLinks = convertTextToLinks(text);
    const safe = DOMPurify.sanitize(withLinks);
    return <div className="render-text" dangerouslySetInnerHTML={{ __html: safe }} />;
};

export default RenderText;
