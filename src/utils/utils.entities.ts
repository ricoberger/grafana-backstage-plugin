/**
 * Formats an entity reference string to ensure that the reference can be used
 * to query the backstage API.
 */
export const formatEntityRef = (
  entityRef: string,
  defaultKind: string,
): string => {
  const refParts = entityRef.split(':');
  if (refParts.length === 2) {
    const kind = refParts[0].toLowerCase();
    const namespaceName = refParts[1].split('/');

    if (namespaceName.length === 2) {
      return `${kind}:${namespaceName[0]}/${namespaceName[1]}`;
    } else {
      return `${kind}:default/${namespaceName[0]}`;
    }
  } else if (refParts.length === 1) {
    const namespaceName = refParts[0].split('/');
    if (namespaceName.length === 2) {
      return `${defaultKind.toLowerCase()}:${namespaceName[0]}/${namespaceName[1]}`;
    } else {
      return `${defaultKind.toLowerCase()}:default/${namespaceName[0]}`;
    }
  } else {
    return entityRef;
  }
};
