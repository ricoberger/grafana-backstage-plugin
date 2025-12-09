/**
 * Formats an entity reference string to ensure the kind is in lowercase.
 */
export const formatEntityRef = (entityRef: string): string => {
  const parts = entityRef.split(':');
  if (parts.length !== 2) {
    return entityRef;
  }

  return `${parts[0].toLowerCase()}:${parts[1]}`;
};
