import React from "react";
import { lazy, Suspense, useEffect } from "react";
import Index from "./router/index";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store/store";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from "./pages/Home";




const SignUp = lazy(() => import("./pages/authentication/Registration"));
const Login = lazy(() => import("./pages/authentication/Login"));

function App() {
  let routeblog = (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      {/* Add more protected routes */}
    </Routes>
  );
  return (
    
    <Suspense
      fallback={
        <div id="preloader">
          Loading...
        </div>
      }
    >
      {routeblog}
      <Index />
    </Suspense>
    
  );
}

export default App;
