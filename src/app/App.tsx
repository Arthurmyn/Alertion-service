import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell.tsx';
import { RequireOwner } from '../components/RequireOwner.tsx';
import { Dashboard } from '../pages/Dashboard.tsx';
import { Defense } from '../pages/Defense/Defense.tsx';
import { Domain } from '../pages/Domain.tsx';
import { Login } from '../pages/Login.tsx';
import { NotFound } from '../pages/NotFound.tsx';
import { Plan } from '../pages/Plan.tsx';
import { Preview } from '../pages/Preview.tsx';
import { PublicSite } from '../pages/PublicSite.tsx';
import { Upload } from '../pages/Upload.tsx';
import { Versions } from '../pages/Versions.tsx';
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
