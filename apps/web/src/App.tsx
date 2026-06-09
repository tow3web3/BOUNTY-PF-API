import { useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Endpoints from "./components/Endpoints";
import Tokenomics from "./components/Tokenomics";
import Footer from "./components/Footer";
import Docs from "./components/Docs";
import BountiesPage from "./components/BountiesPage";

export type Page = "home" | "docs" | "bounties";

export default function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div style={{ background: "#060606", minHeight: "100vh", overflowX: "hidden" }}>
      <Nav page={page} onNavigate={setPage} />

      {page === "docs" && (
        <Docs onBack={() => setPage("home")} />
      )}

      {page === "bounties" && (
        <BountiesPage onBack={() => setPage("home")} />
      )}

      {page === "home" && (
        <>
          <Hero onNavigate={setPage} />
          <HowItWorks />
          <Endpoints />
          <Tokenomics />
          <Footer />
        </>
      )}
    </div>
  );
}
