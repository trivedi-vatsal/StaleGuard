import "./App.css";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { useHashRoute } from "./hooks/useHashRoute";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { HowItWorks } from "./pages/HowItWorks";
import { Implementation } from "./pages/Implementation";
import { Diagnostics } from "./pages/Diagnostics";
import { EdgeCases } from "./pages/EdgeCases";

function NotFound() {
  return (
    <div className="container page">
      <div className="section-head">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <p className="lede">
          That route doesn't exist. <a href="#/">Back to home →</a>
        </p>
      </div>
    </div>
  );
}

function App() {
  const route = useHashRoute();
  const versionCheck = useVersionCheck();

  let page = <NotFound />;
  if (route === "/") page = <Home />;
  else if (route === "/how-it-works") page = <HowItWorks />;
  else if (route === "/implementation") page = <Implementation />;
  else if (route === "/diagnostics")
    page = <Diagnostics versionCheck={versionCheck} />;
  else if (route === "/edge-cases") page = <EdgeCases />;

  return (
    <div className="app-shell">
      <Nav route={route} />
      <main className="main-content">{page}</main>
      <Footer />
    </div>
  );
}

export default App;
