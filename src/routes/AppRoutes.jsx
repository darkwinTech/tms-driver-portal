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
import OperationsQueue from '../pages/operations/OperationsQueue.jsx';
import OperationsRequestDetails from '../pages/operations/OperationsRequestDetails.jsx';

function HomeRedirect() {
  const { isProcessor, isOperations, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (isOperations) return <Navigate to="/ops/queue" replace />;
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

        {/* Requester - each gets a distinct `key` so navigating between them
            (e.g. via the sidebar, without a full page reload) forces React
            to unmount/remount NewRequest instead of reusing the same
            instance and leaving its internal state stuck on whichever type
            loaded first. */}
        <Route path="/requests/create-driver" element={<NewRequest key="create-driver" requestType="Create Driver" />} />
        <Route path="/requests/modify-driver" element={<NewRequest key="modify-driver" requestType="Modify Driver" />} />
        <Route path="/requests/disable-driver" element={<NewRequest key="disable-driver" requestType="Disable Driver" />} />
        <Route path="/requests" element={<MyRequests />} />
        <Route path="/requests/:id" element={<RequestDetails />} />
        <Route path="/requests/:id/edit" element={<NewRequest />} />

        {/* Operations - first stage of the review workflow, separate from
            the generic Processor experience. */}
        <Route
          path="/ops/queue"
          element={
            <ProtectedRoute allowedRoles={['Operations', 'Admin']}>
              <OperationsQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ops/queue/:id"
          element={
            <ProtectedRoute allowedRoles={['Operations', 'Admin']}>
              <OperationsRequestDetails />
            </ProtectedRoute>
          }
        />

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
