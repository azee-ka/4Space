// Import useState and useEffect from React
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './createPost.css';
import apiUrl from '../../../utils/config';
import crossIcon from '../../../assets/cross-icon.png';
import createPost from './handleAPI';

const CreatePost = ({}) => {
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);

  const [content, setContent] = useState('');
  const textAreaRef = useRef(null);
  const [mediaUploaded, setMediaUploaded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(true);
  const [uploadedMedia, setUploadedMedia] = useState(null); // Initially, set to null

  const onClose = () => {
    // Use the history object to go back to the previous page
    navigate(-1);
    setOverlayOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createPost(text, media, navigate);
    /*
    event.preventDefault();
    console.log(JSON.stringify({ content }));
    fetch(`${apiUrl}create-post/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Post created successfully, close the overlay and navigate to the new post's page
        onClose();
        console.log(data);
        navigate(`/post/${data.id}`);
      })
      .catch((error) => console.error('Error creating post:', error));*/
  };

 /* const handleContentChange = (event) => {
    setContent(event.target.value);
  };

  const handleMediaUpload = () => {
    setMediaUploaded(true);
    // Trigger the file input click when the user clicks on the "Upload Media" area
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // Set the accepted file types as needed
    fileInput.addEventListener('change', handleSelectedMedia);
    fileInput.click();
  };

  const handleSelectedMedia = (event) => {
    const selectedFile = event.target.files[0];
  
    // Check if a file was actually selected
    if (selectedFile) {
      // Check if the selected file is an image
      if (selectedFile.type.startsWith('image/')) {
        // Handle the selected file here (e.g., upload it)
        // You can also update the UI to display the uploaded media.
        setMediaUploaded(true); // Set the state to indicate media has been uploaded
        setUploadedMedia(URL.createObjectURL(selectedFile)); // Create an object URL from the selected image
      } else {
        // Handle the case where a non-image file was selected (if needed)
        alert('Please select an image file.');
      }
    }
  };
  

  };*/
    const handleButtonClick = (command, value = null) => {
        document.execCommand(command, false, value);
    };
    // Close the overlay when the user clicks outside the content area
    const handleCloseOverlay = (event) => {
        if (event.target.classList.contains('create-post-overlay')) {
            onClose();
        };
    }

    const handleMediaContainerClose = () => {
        setMediaUploaded(false);
      };

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleMediaUpload = (event) => {
    setMediaUploaded(true);
    setMedia(event.target.files[0]);
  };


  useEffect(() => {
    document.addEventListener('mousedown', handleCloseOverlay);
    return () => document.removeEventListener('mousedown', handleCloseOverlay);
  }, [onClose]);

  const buttons = [
    { label: 'B', command: 'bold', style: { fontWeight: 'bold' } },
    { label: 'I', command: 'italic', style: { fontStyle: 'italic' } },
    { label: 'U', command: 'underline', style: { textDecoration: 'underline' } },
    { label: 'S', command: 'strikeThrough', style: { textDecoration: 'line-through' } },
    { label: 'Link', command: 'createLink', promptValue: true },
  ];

  return (
    <div className="create-post-overlay">
      <div className="create-post-content">
        <button className="createPost-close-button" onClick={onClose}>
          <img src={crossIcon} alt="Clear" />
        </button>
        <h2>Create a New Post</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={handleTextChange}
            placeholder="Write your post here..."
            required
          ></textarea>
          <div className="menubar">
            {buttons.map((button, index) => (
              <React.Fragment key={index}>
                {button.promptValue ? (
                  <button
                    style={button.style}
                    onClick={() => handleButtonClick(button.command, prompt(`Enter ${button.label} value:`))}
                  >
                    {button.label}
                  </button>
                ) : (
                  <button style={button.style} onClick={() => handleButtonClick(button.command)}>
                    {button.label}
                  </button>
                )}
              </React.Fragment>
            ))}
            <select onChange={(e) => handleButtonClick('formatBlock', e.target.value)}>
              <option value="p">Normal Text</option>
              <option value="h1">Header 1</option>
              <option value="h2">Header 2</option>
              <option value="h3">Header 3</option>
            </select>
            <button onClick={() => handleButtonClick('undo')}>{String.fromCharCode(8630)}</button>
            <button onClick={() => handleButtonClick('redo')}>{String.fromCharCode(8631)}</button>
          </div>
          <div className="create-post-buttons">
            <button type="submit">Post</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
      <div className="media-container">
        {/* Conditionally display the uploaded media card */}
        {mediaUploaded ? (
            <div className="uploaded-media-card">
            <button className="close-media-button" onClick={handleMediaContainerClose}>
                <img src={crossIcon} alt="Clear" />
            </button>
            {/* Display the uploaded media here */}
            {uploadedMedia && <img src={uploadedMedia} alt="Uploaded Media" />}
            </div>
        ) : null}
        {/* Always show the plus container for more media uploads */}
        <div className="media-upload-container" onClick={handleMediaUpload}>
            <div className="upload-icon" onClick={handleMediaUpload}>
            +
            </div>
            <div className="upload-text" onClick={handleMediaUpload}>
            Upload Media
            </div>
        </div>
        </div>
    </div>
  );
};

export default CreatePost;
