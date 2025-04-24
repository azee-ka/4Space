import CustomEditor from "../../../utils/editor/editor";
import EmojiButton from "../../../utils/editor/EmojiButton";
import { FaEllipsisH, FaEllipsisV, FaPaperPlane, FaReply } from "react-icons/fa";

const renderSendMessagePanel = (
    conversationId,
    conversationDetails,
    setConversationDetails,
    messagesLength,
    typeMessageContent,
    setTypeMessageContent,
    callApi,
    navigate,
    handleSendMessage,
    currentUserId,
) => {


    const { view_type, participant_records = [] } = conversationDetails || {};

    const isBlocked = conversationDetails?.conversation_status === 'blocked';
    const isInvite = conversationDetails?.conversation_status ===  'invite';
    const isInviteAccepted = conversationDetails?.conversation_status ===  'allowed';
    const inviteWasSent = messagesLength >= 1;

    const handleAcceptRequest = async () => {
        try {
            const response = await callApi(`messages/request/${conversationId}/accept/`, 'POST');
            console.log(response.data);
            setConversationDetails(prevDetails => ({
                ...prevDetails,
                view_type: response.data.view_type
            }));

        } catch (err) {
            console.error('Error accepting request', err);
        }
    };
    const handleRejectRequest = async () => {
        try {
            const response = await callApi(`messages/request/${conversationId}/reject/`, 'POST');
            console.log(response.data);
            navigate(`/messages/requests`);
        } catch (err) {
            console.error('Error accepting request', err);
        }
    };
    const handleBlockRequest = async () => {
        try {
            const response = await callApi(`messages/request/${conversationId}/block/`, 'POST');
            console.log(response.data);
        } catch (err) {
            console.error('Error accepting request', err);
        }
    };
    const handleReportBlockRequest = async () => {
        handleBlockRequest();
        // openReportOverlay();
    };

    // === HANDLE BLOCKED ===
    if (isBlocked) {
        return (
            <div className="request-warning-container">
                You cannot send messages in this conversation.
            </div>
        );
    }

    // === HANDLE ONE-TIME INVITE ===
    if (isInvite && inviteWasSent) {
        return (
            <div className="request-warning-container">
                <h3>Invite Sent</h3>
                You can send more messages once your request is accepted.
            </div>
        );
    }

    // === SHOW EDITOR IF USER CAN SEND MESSAGE ===
    if ( ((isInvite && !inviteWasSent) && view_type === 'inbox') || (isInviteAccepted && view_type === 'inbox') ) {
        return (
            <>
                {isInvite && messagesLength === 0 && (
                    <div className="request-warning-container invite">
                        You can only send <strong>one</strong> message as an invitation until your request is accepted.
                    </div>
                )}
                <div className="write-message-container">
                    <EmojiButton />
                    <div className="write-message-field">
                        <CustomEditor
                            content={typeMessageContent}
                            onContentChange={setTypeMessageContent}
                            placeholder="Type a message..."
                            isPlainText={true}
                        />
                    </div>
                    <button className="send-message-btn" onClick={handleSendMessage}>
                        <FaPaperPlane />
                    </button>
                </div>
            </>
        );
    }

    // === HANDLE PENDING REQUEST SCREEN ===
    if (view_type === 'request') {
        return (
            <div className="message-request-btns">
                <button onClick={handleAcceptRequest} className="accept-request-btn">Accept</button>
                <button onClick={handleRejectRequest} className="reject-request-btn">Reject</button>
                <button onClick={handleBlockRequest} className="block-request-btn">Block</button>
                <button onClick={handleReportBlockRequest} className="report-request-btn">Report and Block</button>
            </div>
        );
    }
}


export default renderSendMessagePanel;