import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from '../components/layout/Layout.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import Spinner from '../components/common/Spinner.jsx';

import Login from '../pages/Login.jsx';
import RequesterDashboard from '../pages/requester/RequesterDashboard.jsx';
import NewRequest from '../pages/requester/NewRequest.jsx';
import MyRequests from '../pages/requester/MyRequests.jsx';
import RequestDetails from '../pages/requester/RequestDetails.jsx';
import ProcessorDashboard from '../pages/processor/ProcessorDashboard.jsx';
import RequestQueue from '../pages/processor/RequestQueue.jsx';
import ProcessRequest from '../pages/processor/ProcessRequest.jsx';
import Reports from '../pages/processor/Reports.jsx';

function HomeRedirect() {
  const { isProcessor, loading } = useAuth();
  if (loading) return <Spinner full />;
  return isProcessor ? <ProcessorDashboard /> : <RequesterDashboard />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />

        {/* Requester */}
        <Route path="/requests/new" element={<NewRequest />} />
        <Route path="/requests" element={<MyRequests />} />
        <Route path="/requests/:id" element={<RequestDetails />} />

        {/* Processor */}
        <Route
          path="/queue"
          element={
            <ProtectedRoute allowedRoles={['Processor', 'Admin']}>
              <RequestQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue/:id"
          element={
            <ProtectedRoute allowedRoles={['Processor', 'Admin']}>
              <ProcessRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['Processor', 'Admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
