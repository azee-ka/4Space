// app/messages/utils/messageGrouping.ts
export const shouldGroupMessages = (
  currentMessage: { sent_at: string; sender_username: string },
  previousMessage: { sent_at: string; sender_username: string } | undefined
) => {
  if (!previousMessage || !currentMessage) return false;
  const timeDifference =
    new Date(currentMessage.sent_at).getTime() -
    new Date(previousMessage.sent_at).getTime();
  const senderChanged =
    currentMessage.sender_username !== previousMessage.sender_username;
  return !senderChanged && timeDifference < 5 * 60 * 1000;
};

export const isFirstGroupedMessage = (
  currentMessage: { sent_at: string; sender_username: string },
  previousMessage: { sent_at: string; sender_username: string } | undefined
) => {
  if (!currentMessage || !previousMessage) return true;
  const timeDifference =
    new Date(currentMessage.sent_at).getTime() -
    new Date(previousMessage.sent_at).getTime();
  const senderChanged =
    currentMessage.sender_username !== previousMessage.sender_username;
  return senderChanged || timeDifference >= 5 * 60 * 1000;
};

export const isLastGroupedMessage = (
  currentMessage: { sent_at: string; sender_username: string },
  nextMessage: { sent_at: string; sender_username: string } | undefined
) => {
  if (!currentMessage || !nextMessage) return true;
  const timeDifference =
    new Date(nextMessage.sent_at).getTime() -
    new Date(currentMessage.sent_at).getTime();
  const senderChanged =
    currentMessage.sender_username !== nextMessage.sender_username;
  return senderChanged || timeDifference >= 5 * 60 * 1000;
};
