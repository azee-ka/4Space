// src/components/saveToCollectionDropdown/SaveToCollectionDropdown.jsx

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DropdownButton from '../../utils/popperButton/DropdownButton';
import {
  fetchMyCollections,
  addItemToCollection,
  removeItemFromCollection
} from '../../services/collections';
import { MY_COLLECTIONS } from '../../services/queryKeys';
import './saveToCollectionDropdown.css';

export default function SaveToCollectionDropdown({
  contentType,
  objectId,
  toggleContent
}) {
  const queryClient = useQueryClient();

  // ① load collections & mark which already contain this item
  const { data: collections = [], isLoading } = useQuery({
    queryKey: [MY_COLLECTIONS, contentType, objectId],
    queryFn: () => fetchMyCollections({ contentType, objectId })
  });

  // ② mutations
  const addMut = useMutation({
    mutationFn: addItemToCollection,
    onSuccess: () =>
      queryClient.invalidateQueries([MY_COLLECTIONS, contentType, objectId])
  });

  const removeMut = useMutation({
    mutationFn: removeItemFromCollection,
    onSuccess: () =>
      queryClient.invalidateQueries([MY_COLLECTIONS, contentType, objectId])
  });

  if (isLoading) return <div>Loading…</div>;

  return (
    <DropdownButton 
      toggleContent={toggleContent}
      placement='bottom-end'
    >
      {({ closeDropdown }) => (
        <ul className="save-dropdown-list">
          {collections.map(col => {
            const contains = col.contains === true;
            const handler = () => {
              const payload = {
                collection_id: col.id,
                content_type: contentType,
                object_id: objectId
              };
              if (contains) {
                removeMut.mutate(payload, { onSuccess: closeDropdown });
              } else {
                addMut.mutate(
                  { ...payload, visibility: col.visibility },
                  { onSuccess: closeDropdown }
                );
              }
            };

            return (
              <li key={col.id}>
                <button
                  className={`save-dropdown-item ${contains ? 'checked' : ''}`}
                  onClick={handler}
                  disabled={addMut.isLoading || removeMut.isLoading}
                >
                  {contains && <span className="checkmark">✓</span>}
                  {col.title}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DropdownButton>
  );
}
