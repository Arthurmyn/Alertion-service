import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.tsx';
import { RequireAccount } from '../components/layout/RequireAccount.tsx';
import { RequireOwner } from '../components/layout/RequireOwner.tsx';
import { Dashboard } from '../pages/project/Dashboard.tsx';
import { Defense } from '../pages/defense/Defense.tsx';
import { Domain } from '../pages/project/Domain.tsx';
import { Login } from '../pages/auth/Login.tsx';
import { NotFound } from '../pages/NotFound.tsx';
import { Overview } from '../pages/overview/Overview.tsx';
import { Plan } from '../pages/project/Plan.tsx';
import { Preview } from '../pages/project/Preview.tsx';
import {
  Observability,
  Logs,
  Query,
} from '../pages/workspace/Observability.tsx';
import { Security } from '../pages/workspace/Security.tsx';
import { Storage } from '../pages/workspace/Storage.tsx';
import { PublicSite } from '../pages/public/PublicSite.tsx';
import { Upload } from '../pages/project/Upload.tsx';
import { Versions } from '../pages/project/Versions.tsx';
import {
  ProjectAttestations,
  ProjectBuilds,
  ProjectLogs,
  ProjectSettings,
} from '../pages/project/ProjectPages.tsx';
import { WorkspaceDeployments } from '../pages/workspace/WorkspaceDeployments.tsx';
import {
  Attestations,
  Billing,
  Builds,
  Compute,
  Connections,
  Networking,
  Reports,
  Secrets,
  Team,
  WorkspaceSettings,
} from '../pages/workspace/WorkspacePages.tsx';
import { homePath } from './routing.ts';
import { StoreProvider, useStore } from '../state/store.tsx';

function HomeRedirect() {
  const { state } = useStore();
  const { search } = useLocation();
  // `?scenario=` is applied by the shell, which knows where it should land.
  // Redirecting here as well would flash the overview on the way.
  if (new URLSearchParams(search).has('scenario')) return null;
  return <Navigate to={homePath(state.sessionAccountId)} replace />;
}

export function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/site/:slug" element={<PublicSite />} />
          <Route path="/defense" element={<Defense />} />
          <Route element={<RequireAccount />}>
            <Route path="/manage" element={<Overview />} />
            <Route
              path="/manage/projects"
              element={<Navigate to="/manage" replace />}
            />
            <Route path="/manage/storage" element={<Storage />} />
            <Route path="/manage/security" element={<Security />} />
            <Route path="/manage/connections" element={<Connections />} />
            <Route path="/manage/observability/logs" element={<Logs />} />
            <Route path="/manage/observability/query" element={<Query />} />
            <Route
              path="/manage/deployments"
              element={<WorkspaceDeployments />}
            />
            <Route path="/manage/compute" element={<Compute />} />
            <Route path="/manage/attestations" element={<Attestations />} />
            <Route path="/manage/builds" element={<Builds />} />
            <Route path="/manage/reports" element={<Reports />} />
            <Route path="/manage/networking" element={<Networking />} />
            <Route path="/manage/secrets" element={<Secrets />} />
            <Route path="/manage/observability" element={<Observability />} />
            <Route path="/manage/team" element={<Team />} />
            <Route path="/manage/billing" element={<Billing />} />
            <Route path="/manage/settings" element={<WorkspaceSettings />} />
          </Route>
          <Route element={<RequireOwner />}>
            <Route path="/manage/:slug" element={<Dashboard />} />
            <Route path="/manage/:slug/upload" element={<Upload />} />
            <Route path="/manage/:slug/preview" element={<Preview />} />
            <Route path="/manage/:slug/versions" element={<Versions />} />
            <Route path="/manage/:slug/domain" element={<Domain />} />
            <Route path="/manage/:slug/plan" element={<Plan />} />
            <Route path="/manage/:slug/builds" element={<ProjectBuilds />} />
            <Route
              path="/manage/:slug/attestations"
              element={<ProjectAttestations />}
            />
            <Route path="/manage/:slug/logs" element={<ProjectLogs />} />
            <Route
              path="/manage/:slug/settings"
              element={<ProjectSettings />}
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </StoreProvider>
  );
}
