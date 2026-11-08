import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css"
import AppLayout from "./AppLayout";
import Conversation from "./desktop/pages/Conversation";
import Study from "./desktop/pages/Study";
import SoundClone from "./desktop/pages/SoundClone";
import Settings from "./desktop/pages/Settings";
import Setup from "./desktop/pages/Setup";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<Setup />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/conversation" replace />} />
          <Route path="/conversation" element={<Conversation />} />
          <Route path="/study" element={<Study />} />
          <Route path="/sound-clone" element={<SoundClone />} />
          <Route path="/settings/*" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
