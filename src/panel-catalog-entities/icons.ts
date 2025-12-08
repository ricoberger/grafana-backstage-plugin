import apiIcon from '../img/icons/api.svg';
import componentIcon from '../img/icons/component.svg';
import domainIcon from '../img/icons/domain.svg';
import groupIcon from '../img/icons/group.svg';
import locationIcon from '../img/icons/location.svg';
import resourceIcon from '../img/icons/resource.svg';
import systemIcon from '../img/icons/system.svg';
import templateIcon from '../img/icons/template.svg';
import userIcon from '../img/icons/user.svg';

export const getIcon = (kind: string) => {
  switch (kind.toLowerCase()) {
    case 'api':
      return apiIcon;
    case 'component':
      return componentIcon;
    case 'domain':
      return domainIcon;
    case 'group':
      return groupIcon;
    case 'location':
      return locationIcon;
    case 'resource':
      return resourceIcon;
    case 'system':
      return systemIcon;
    case 'template':
      return templateIcon;
    case 'user':
      return userIcon;
    default:
      return '';
  }
};
