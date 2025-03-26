import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import './profilePictureEditor.css';
import { v4 as uuidv4 } from 'uuid';
import API_BASE_URL from '../../../../config';
import default_profile_picture from '../../../../assets/default_profile_picture.png';
import axios from 'axios';
import { useAuth } from '../../../../reducers/auth/useAuth';

const ProfilePictureEditor = ({ selectedProfilePicture, setSelectedProfilePicture, onClose, onSave, currentProfilePicture, setCurrentProfilePicture }) => {
  const { authState } = useAuth();
  const [crop, onCropChange] = useState({ x: 0, y: 0 });
  const [zoom, onZoomChange] = useState(1);
  const [imageSrc, setImageSrc] = useState(null);

  const [croppedArea, setCroppedArea] = useState({ x: 0, y: 0 });

  console.log(currentProfilePicture.includes("default_profile"));

  useEffect(() => {
    if (imageSrc === null && !currentProfilePicture.includes("default_profile")) {
      const img = new Image();
      img.src = `${API_BASE_URL}${currentProfilePicture}`;

      img.onload = () => {
        setImageSrc({
          src: img.src,
          width: img.width,
          height: img.height,
        });
      }
      img.onerror = (error) => {
        console.error("Error loading image:", error);
      };
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleCloseProfilePictureEditorOverlay);
    return () => document.removeEventListener('mousedown', handleCloseProfilePictureEditorOverlay);
  }, [onClose]);


  const handleCloseProfilePictureEditorOverlay = (event) => {
    if (event.target.classList.contains('profile-picture-editor-overlay')) {
      onClose();
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
          console.log(img.naturalWidth);
          setImageSrc({
            src: img.src,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };

      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };


  const handleProfilePictureChange = (event) => {
    handleFileChange(event);
  };

  const handleProfilePictureClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = false;
    fileInput.id = 'profile-picture-input';
    fileInput.click();
    fileInput.addEventListener('change', handleProfilePictureChange);
  };



  const generateProfilePictureName = async (croppedImage) => {
    setSelectedProfilePicture(croppedImage);
    await onSave(croppedImage); // Wait for onSave to complete before closing
    onClose();
  };



  const handleSave = async () => {
    console.log(imageSrc);
    try {
      const croppedImage = await getCroppedImg(imageSrc.src, croppedArea);
      await generateProfilePictureName(croppedImage);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${authState.token}`
        }
      };

      const response = await axios.delete(`${API_BASE_URL}remove-profile-picture/`, config);
      console.log(response.data);
      setCurrentProfilePicture(default_profile_picture);
      window.location.reload();
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  }


  const getCroppedImg = async (image, croppedArea) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = image;
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const pixelCrop = {
          x: croppedArea.x * scaleX,
          y: croppedArea.y * scaleY,
          width: croppedArea.width * scaleX,
          height: croppedArea.height * scaleY,
        };

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
          img,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        const croppedImage = canvas.toDataURL('image/jpeg');
        resolve(croppedImage);
      };

      img.onerror = (error) => {
        reject(error);
      };
    });
  };






  return (
    <div className="profile-picture-editor-overlay">
      <div className="editor-container">
        <div className="editor-header">
          <h2>Edit Profile Picture</h2>
        </div>
        <div className="editor-content">
          <div className="editor-preview">
            {imageSrc ? (
              <Cropper
                className={'cropper-box'}
                image={imageSrc.src}
                crop={crop}
                zoom={zoom}
                aspect={4 / 4}
                onCropChange={onCropChange}
                onCropComplete={onCropComplete}
                onZoomChange={onZoomChange}
                classes={{
                  containerClassName: 'cropper-container',
                  cropAreaClassName: 'crop-area',
                }}
              />
            ) : (
              //(currentProfilePicture.includes("default_profile")) ?
              (
                <div className="profile-picture-editor-default-profile-picture">
                  <img
                    src={currentProfilePicture}
                    alt="Current Profile Picture"
                  />
                </div>
              )
            )}
          </div>
          <div className="editor-buttons">
            <button onClick={handleProfilePictureClick}>Choose Image</button>
            {imageSrc !== null &&
              <button onClick={handleSave}>Done</button>
            }
            <button onClick={onClose}>Cancel</button>
            {imageSrc !== null &&
              <button onClick={handleRemovePhoto}>Remove Photo</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureEditor;
