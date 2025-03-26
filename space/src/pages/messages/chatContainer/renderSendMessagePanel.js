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
    handleSendMessage
) => {

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

    if (conversationDetails?.view_type === 'inbox') {
        if (conversationDetails?.conversation_status === 'invite') {
            return (
                <div className="request-warning-container invite">
                    As per the settings, you can only send 1 message in this conversation as an invitation until your request is accepted.
                </div>
            )
        } else if (conversationDetails?.conversation_status === 'blocked') {
            return (
                <div className="request-warning-container">
                    As per the end settings, you cannot send any messages in this conversation.
                </div>
            )
        } else if (conversationDetails?.participants[0]?.status !== 'active'
            && messagesLength === 1 &&
            conversationDetails?.conversation_status !== 'allowed'
        ) {
            return (
                <div className="request-warning-container">
                    <h3>Invite Sent</h3>
                    You will be able to send more messags once your request is accepted.
                </div>
            )
        }
        else {
            return (
                <div className="write-message-container">
                    <EmojiButton />
                    <div className="write-message-field">
                        <CustomEditor
                            content={typeMessageContent}
                            onContentChange={setTypeMessageContent}
                            placeholder='Type message...'
                            isPlainText={true}
                        />
                    </div>
                    <button className="send-message-btn" onClick={handleSendMessage}>
                        <FaPaperPlane />
                    </button>
                </div>
            )
        }
    } else if (conversationDetails?.view_type === 'request') {
        <div className="message-request-btns">
            <div>
                <button onClick={handleAcceptRequest} className="accept-request-btn">
                    Accept
                </button>
            </div>
            <div>
                <button onClick={handleRejectRequest} className="reject-request-btn">
                    Reject
                </button>
            </div>
            <div>
                <button onClick={handleBlockRequest} className="block-request-btn">
                    Block
                </button>
            </div>
            <div>
                <button onClick={handleReportBlockRequest} className="report-request-btn">
                    Report and Block
                </button>
            </div>
        </div>
    }
}


export default renderSendMessagePanel;