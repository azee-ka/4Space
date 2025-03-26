// utils/messageGrouping.js
export const shouldGroupMessages = (currentMessage, previousMessage) => {
    if (!previousMessage || !currentMessage) return false;
    const timeDifference = new Date(currentMessage.sent_at) - new Date(previousMessage.sent_at);
    const senderChanged = currentMessage.sender_username !== previousMessage.sender_username;
    return !senderChanged && timeDifference < 5 * 60 * 1000;
};

export const isFirstGroupedMessage = (currentMessage, previousMessage) => {
    if (!currentMessage || !previousMessage) return true;
    const timeDifference = new Date(currentMessage.sent_at) - new Date(previousMessage.sent_at);
    const senderChanged = currentMessage.sender_username !== previousMessage.sender_username;
    return senderChanged || timeDifference >= 5 * 60 * 1000;
};

export const isLastGroupedMessage = (currentMessage, nextMessage) => {
    if (!currentMessage || !nextMessage) return true;
    const timeDifference = new Date(nextMessage.sent_at) - new Date(currentMessage.sent_at);
    const senderChanged = currentMessage.sender_username !== nextMessage.sender_username;
    return senderChanged || timeDifference >= 5 * 60 * 1000;
};
