import React from 'react';
import DOMPurify from 'dompurify'; // Import DOMPurify for sanitizing HTML
import './renderText.scss';

// Helper function to convert mentions, hashtags, and exchange references to links
const convertTextToLinks = (text) => {
    const mentionPattern = /@(\w+)/g;
    const hashtagPattern = /#(\w+)/g;
    const exchangePattern = /x\/(\w+)/g;

    // Replace mentions, hashtags, and exchanges with <a> tags
    text = text.replace(mentionPattern, (match, username) => {
        return `<a href="/profile/${username}" class="mention-link">${match}</a>`;
    });
    text = text.replace(hashtagPattern, (match, hashtag) => {
        return `<a href="/hashtag/${hashtag}" class="hashtag-link">${match}</a>`;
    });
    text = text.replace(exchangePattern, (match, exchange) => {
        return `<a href="/exchange/${exchange}" class="exchange-link">${match}</a>`;
    });

    return text;
};

// Main component for rendering the post content
const RenderText = ({ text }) => {
    if (!text) return null;

    // Step 1: Convert mentions, hashtags, and exchange references to links
    const textWithLinks = convertTextToLinks(text);

    // Step 2: Sanitize the text content with DOMPurify to prevent XSS
    const sanitizedText = DOMPurify.sanitize(textWithLinks);

    // Step 3: Render the sanitized content as raw HTML
    return (
        <div
            dangerouslySetInnerHTML={{ __html: sanitizedText }}
        />
    );
};

export default RenderText;
