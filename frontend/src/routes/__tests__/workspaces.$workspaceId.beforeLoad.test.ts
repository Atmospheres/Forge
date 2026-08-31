import { Route } from '../workspaces.$workspaceId';
import { describeBeforeLoadGuard, type BeforeLoad } from './beforeLoadGuard';

// Route.options.beforeLoad's real type requires the full router context;
// the shared helper only supplies the fields it actually reads.
describeBeforeLoadGuard('workspaces.$workspaceId', () => Route.options.beforeLoad as BeforeLoad | undefined);
