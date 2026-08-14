import Background from "./components/Background";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import { PrivacyPolicyProvider } from "./context/privacyPolicy";
import Hero from "./sections/Hero";
import Prices from "./sections/Prices";
import RequestForm from "./sections/RequestForm";
import Services from "./sections/Services";

function App() {
 return (
    <PrivacyPolicyProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <Background />
        {/* Симметричная виньетка: одинаковая по всему экрану, улучшает читаемость текста поверх фона без направленных перепадов */}
        <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,4,18,0.55))]" />

        <div className="relative z-10 pb-[calc(env(safe-area-inset-bottom)+112px)] sm:pb-24 md:pb-28 lg:pb-0">
          <Header />
          <Navbar />
          <Hero />
          <Services />
          <Prices />
          <RequestForm />
          <Footer />
        </div>
      </div>
    </PrivacyPolicyProvider>
 );
}

export default App;
