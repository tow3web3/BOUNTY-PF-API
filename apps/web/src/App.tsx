import { useState, useEffect } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Endpoints from "./components/Endpoints";
import Bounties from "./components/Bounties";
import Footer from "./components/Footer";
import Docs from "./components/Docs";

type Page = "home" | "docs";

function getPage(): Page {
  return window.location.hash === "#docs" ? "docs" : "home";
}

export default function App() {
  const [page, setPage] = useState<Page>(getPage);

  useEffect(() => {
    const fn = () => setPage(getPage());
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  return (
    <div className="bg-bg text-slate-100 min-h-screen overflow-x-hidden">
      <Nav page={page} />
      {page === "docs" ? (
        <Docs />
      ) : (
        <>
          <Hero />
          <HowItWorks />
          <Endpoints />
          <Bounties />
        </>
      )}
      <Footer />
    </div>
  );
}
