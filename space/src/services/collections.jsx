// src/services/collections.js
import apiCall from '../utils/api';


/**
 * Remove an object from one of the user's collections.
 * @param {{ collection_id: string, content_type: string, object_id: string }} data
 */
export const removeItemFromCollection = async (data) => {
  const response = await apiCall(
    'collection/remove-item/',
    'POST',
    data
  );
  return response.data;
};



/**
 * Add an arbitrary object into one of the user's collections.
 * @param {{ collection_id: string, content_type: string, object_id: string, visibility?: string }} data
 */
export const addItemToCollection = async (data) => {
  const response = await apiCall(
    'collection/add-item/',
    'POST',
    data
  );
  return response.data;
};

/**
 * Create a new collection.
 * @param {{ title: string, description?: string, visibility: string }} data
 */
export const createCollection = async (data) => {
  const response = await apiCall(
    'collection/create/',
    'POST',
    data
  );
  return response.data;
};

/**
 * Fetch the current user's collections,
 * optionally marking which ones already contain a given object.
 */
export const fetchMyCollections = async ({ contentType, objectId } = {}) => {
  // always start with the collection/ route
  let endpoint = 'collection/';
  if (contentType && objectId) {
    const qs = new URLSearchParams({ content_type: contentType, object_id: objectId });
    endpoint += `?${qs.toString()}`;
  }
  const response = await apiCall(endpoint, 'GET');
  return response.data;
};

/**
 * Fetch items in one collection, filtered by content type.
 * @param {{ collectionId: string, model: string, pageParam?: number, pageSize?: number }} params
 */
export const fetchCollectionItemsByType = async ({
  collectionId,
  model,
  pageParam = 0,
  pageSize = 20
}) => {
  const params = new URLSearchParams({
    model,
    limit: pageSize,
    offset: pageParam
  });
  const endpoint = `collection/${collectionId}/items/?${params.toString()}`
  const response = await apiCall(
    endpoint,
    'GET'
  );
  return response.data;
};

/**
 * Fetch someone else's collections (public / follower‐only filtered on the backend).
 * @param {{ username: string, type: string, pageParam?: number, pageSize?: number }} params
 */
export const fetchUserCollections = async ({
  username,
  type,
  pageParam = 0,
  pageSize = 20
}) => {
  const endpoint = `collection/${username}/list/?model=${type}&limit=${pageSize}&offset=${pageParam}`;
  const response = await apiCall(
    endpoint,
    'GET'
  );
  return response.data;
};
