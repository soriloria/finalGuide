// App.js
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/authentication/Login";
import Register from "./components/authentication/Register";
import Homepage from "./components/Homepage";
import Places from "./components/Places";
import Favorites from "./components/Favorites";
import MyGoogleMap from "./components/Zones";
import MyPlan from './components/MyPlan';
import PasswordReset from "./components/authentication/PasswordReset";
import PasswordResetConfirm from "./components/authentication/PasswordResetConfirm";
import Activate from "./components/authentication/Activate";
import RegisterSuccess from "./components/authentication/RegisterSuccess";
import PasswordResetSuccess from "./components/authentication/PasswordResetSuccess";
import PasswordResetSuccess2 from "./components/authentication/PasswordResetSuccess2";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/:cityName" element={<Places />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/zones" element={<MyGoogleMap />} />
        <Route path="/my-plan" element={<MyPlan />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
        <Route path="/password-changed-success" element={<PasswordResetSuccess2 />} />
        <Route path="/reset-password/:uid/:token" element={<PasswordResetConfirm />} />
        <Route path="/activate/:token" element={<Activate />} />
        <Route path="/register-success" element={<RegisterSuccess />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
