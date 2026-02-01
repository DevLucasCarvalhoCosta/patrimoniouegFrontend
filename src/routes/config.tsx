import type { FC, ReactElement } from 'react';
import type { RouteProps } from 'react-router';

import PrivateRoute from './privateRoute';

export interface WrapperRouteProps extends RouteProps {
  /** document title */
  title: string;
  /** authorization? */
  auth?: boolean;
  /** admin only route? */
  adminOnly?: boolean;
}

const WrapperRouteComponent: FC<WrapperRouteProps> = ({ title, auth, adminOnly, ...props }) => {
  if (title) {
    document.title = title;
  }

  return auth ? <PrivateRoute adminOnly={adminOnly} {...props} /> : (props.element as ReactElement);
};

export default WrapperRouteComponent;
