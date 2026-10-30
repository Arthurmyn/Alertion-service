import { accounts } from '../../data/accounts.ts';
import { useStore } from '../../state/store.tsx';
import { addSiteNotice } from '../project/PlanText.ts';

/**
 * Creating a project goes through the same rule as the plan page: the pilot
 * plan allows one site, so the attempt is refused and the notice says why.
 */
export function useCreateProject() {
  const { state, dispatch } = useStore();
  const account = accounts.find((item) => item.id === state.sessionAccountId);
  return {
    create: () => dispatch({ type: 'addSite' }),
    notice: addSiteNotice(state.lastResult, account?.businessName),
  };
}
