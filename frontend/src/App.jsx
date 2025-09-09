import { Routes, Route } from "react-router-dom";
import Register from "./Components/Register";
import Login from "./Components/Login";
import LiveUsers from "./Components/LiveUsers";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/live-users" element={<LiveUsers />} />
    </Routes>
  );
}
