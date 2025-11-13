import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import { AnchorPage } from "./pages/AnchorPage";
import { CommandCenter } from "./pages/CommandCenter";
import { ZonePage } from "./pages/ZonePage";

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/zones/:zoneId" element={<ZonePage />} />
          <Route path="/anchors/:anchorId" element={<AnchorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
