import Navbar from '../components/Navbar';
import Hero from '../components/hero';
import TheWorkspace from '../components/TheWorkspace/TheWorkspace';
import HowItWorks from '../components/HowItWorks';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import './Home.scss';
import Pricing from '../components/Pricing';
import { Support } from '../components/Support';

const Home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <TheWorkspace />
      <HowItWorks />
      <Pricing />
      <Support />
      <FAQ />
      <Footer />
    </>
  );
};

export default Home;
