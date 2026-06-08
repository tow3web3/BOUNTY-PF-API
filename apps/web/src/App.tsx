import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Endpoints from "./components/Endpoints";
import Bounties from "./components/Bounties";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="bg-bg text-slate-100 min-h-screen overflow-x-hidden">
      <Nav />
      <Hero />
      <HowItWorks />
      <Endpoints />
      <Bounties />
      <Footer />
    </div>
  );
}
