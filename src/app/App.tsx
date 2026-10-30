import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell.tsx';
import { RequireOwner } from '../components/layout/RequireOwner.tsx';
import { Dashboard } from '../pages/project/Dashboard.tsx';
import { Defense } from '../pages/defense/Defense.tsx';
import { Domain } from '../pages/project/Domain.tsx';
import { Login } from '../pages/auth/Login.tsx';
import { NotFound } from '../pages/NotFound.tsx';
import { Plan } from '../pages/project/Plan.tsx';
import { Preview } from '../pages/project/Preview.tsx';
import { PublicSite } from '../pages/public/PublicSite.tsx';
import { Upload } from '../pages/project/Upload.tsx';
import { Versions } from '../pages/project/Versions.tsx';
import { homePath } from './routing.ts';
import { StoreProvider, useStore } from '../state/store.tsx';

function HomeRedirect() {
  const { state } = useStore();
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
          <Route element={<RequireOwner />}>
            <Route path="/manage/:slug" element={<Dashboard />} />
            <Route path="/manage/:slug/upload" element={<Upload />} />
            <Route path="/manage/:slug/preview" element={<Preview />} />
            <Route path="/manage/:slug/versions" element={<Versions />} />
            <Route path="/manage/:slug/domain" element={<Domain />} />
            <Route path="/manage/:slug/plan" element={<Plan />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </StoreProvider>
  );
}
