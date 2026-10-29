import "./index.css";
import { isTauri } from "@tauri-apps/api/core";
import WebApp from "./web/WebApp";
import DesktopApp from "./desktop/DesktopApp";

export default function App() {
  return isTauri() ? <DesktopApp /> : <WebApp />;
}
