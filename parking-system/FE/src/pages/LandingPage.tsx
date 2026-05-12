import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <header className="bg-surface/70 backdrop-blur-md border-b border-outline-variant/30 fixed full-width top-0 w-full z-50 h-20">
        <nav className="flex justify-between items-center w-full max-w-container-max mx-auto px-margin-edge h-full">
          <div className="flex items-center gap-12">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface">ParkIntel</span>
            <div className="hidden md:flex gap-8">
              <Link className="text-primary font-semibold border-b-2 border-primary pb-1 font-body-md text-body-md" to="/">Home</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" to="#">Reserve Parking</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" to="/status">Parking Status</Link>

              <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Dashboard</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Contact</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-variant hover:bg-surface-container-low rounded-lg px-4 py-2 transition-all font-body-md text-body-md">Login</button>
            <button className="bg-primary-container text-on-primary font-semibold px-6 py-2 rounded transition-all hover:opacity-90 active:scale-95 font-body-md text-body-md">Register</button>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-margin-edge py-24 flex flex-col md:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2 space-y-8"
          >
            <h1 className="font-display-lg text-display-lg text-on-surface max-w-xl">Smart Parking Building Management System</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">Optimize your infrastructure with architectural precision. Our AI-driven allocation engine reduces congestion and maximizes revenue with silent, automated efficiency.</p>
            <div className="flex gap-4">
              <button className="bg-primary-container text-on-primary px-8 py-4 rounded font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20">Reserve Slot</button>
              <button className="border border-outline-variant bg-surface text-on-surface px-8 py-4 rounded font-semibold hover:bg-surface-container-low transition-all">View Status</button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full md:w-1/2 relative"
          >
            <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl"></div>
            <img 
              alt="Modern Architecture" 
              className="relative w-full h-[500px] object-cover rounded-xl border border-outline-variant/30 shadow-2xl" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaR247_YgsjdI_HzS0afb1u-s22EAq0OfEeeK1ZCD6sD2uNTMNdAORgr6Y3KyOmcJIQX1pPHfCBQMXlsqlIeb4VLLziKCikVMGoUKszad0NB-Cd6kU-kn3ByoGvgNQFffz1V_ARWR0Ra_5VcBVrV-DwOJsV1v-O4Su4lljhQCpkMHbs9UqTwoMzjqFuxulz8Bqp4cTFKRTc2GpCPGxjmOaEosZzvrksU2DqEw5f3zt8Q46QO-Ndqduj_0Wki2mAJ5t8g7Rzc6l_w"
            />
          </motion.div>
        </section>

        {/* Stats Bento Grid */}
        <section className="max-w-container-max mx-auto px-margin-edge py-section-gap">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            {[
              { label: 'Available', value: '124', progress: '66%', color: 'bg-primary' },
              { label: 'Reserved', value: '42', progress: '25%', color: 'bg-primary-fixed-dim' },
              { label: 'Occupied', value: '310', progress: '85%', color: 'bg-on-surface' },
              { label: 'Total Reservations', value: '1,892', sub: '+12% from last month' }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-lowest border border-outline-variant/30 p-8 rounded-xl hover:shadow-xl transition-shadow duration-300"
              >
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
                <h2 className="font-display-lg text-display-lg mt-4">{stat.value}</h2>
                {stat.progress ? (
                  <div className="w-full h-1 bg-surface-container mt-6">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: stat.progress }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${stat.color}`}
                    />
                  </div>
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-4">{stat.sub}</p>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-container-max mx-auto px-margin-edge py-section-gap">
          <div className="mb-16">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Capabilities</span>
            <h2 className="font-headline-xl text-headline-xl mt-4">Precision Engineering for Modern Logisitics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: 'qr_code_2', title: 'QR Reservation', desc: 'Instant entry and exit via encrypted QR codes, eliminating hardware dependency and physical contact.' },
              { icon: 'precision_manufacturing', title: 'Smart Allocation', desc: 'Intelligent slot assignment based on vehicle size, duration, and proximity to building exits.' },
              { icon: 'sensors', title: 'Real-time Status', desc: 'Zero-latency updates on parking availability across multiple levels and structures.' },
              { icon: 'directions_car', title: 'Walk-in Parking', desc: 'Seamless support for unreserved vehicles with automated plate recognition and billing.' },
              { icon: 'bar_chart', title: 'Analytics', desc: 'Comprehensive dashboards providing insights into peak hours, turnover rates, and revenue.' },
              { icon: 'admin_panel_settings', title: 'Secure Management', desc: 'Enterprise-grade security protocols ensuring data integrity and financial transparency.' }
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4 p-4 hover:bg-surface-container-low transition-all rounded-lg group cursor-default"
              >
                <span className="material-symbols-outlined text-primary text-4xl group-hover:scale-110 transition-transform duration-300">{feature.icon}</span>
                <h3 className="font-headline-lg text-headline-lg">{feature.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* AI Highlight Section */}
        <section className="bg-surface-container-high py-24">
          <div className="max-w-container-max mx-auto px-margin-edge flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-2/5 space-y-6">
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">AI Recommendation Engine</span>
              <h2 className="font-headline-xl text-headline-xl">Optimized Spatial Intelligence</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">Our proprietary neural network analyzes historical traffic patterns to predict occupancy and dynamically adjust pricing and allocation in real-time.</p>
              <ul className="space-y-4">
                {['Predictive Slot Opening alerts', 'CO2 emission reduction routing', 'VIP priority pathing'].map((item, i) => (
                  <motion.li 
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                    <span className="font-body-md text-body-md">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-full md:w-3/5 bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 shadow-sm"
            >
              <div className="flex justify-between items-center mb-8">
                <h4 className="font-headline-lg text-headline-lg">Level B2 Floor Plan</h4>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-on-surface text-surface rounded-full text-xs">Occupied</div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary text-on-primary rounded-full text-xs">Optimal</div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {[...Array(12)].map((_, i) => {
                  const isOptimal = i === 2 || i === 7;
                  const isOccupied = !isOptimal && [0,1,3,8,9,10].includes(i);
                  return (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className={`h-20 rounded border transition-all duration-300 flex items-center justify-center
                        ${isOccupied ? 'bg-on-surface/90 border-outline-variant/20' : 
                          isOptimal ? 'bg-primary border-primary-fixed shadow-lg shadow-primary/20 cursor-pointer' : 
                          'bg-surface-container border-outline-variant/20 hover:border-primary/50 cursor-pointer'}`}
                    >
                      {isOptimal && (
                        <span className="material-symbols-outlined text-white">
                          {i === 2 ? 'bolt' : 'recommend'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Workflow Step Journey */}
        <section className="max-w-container-max mx-auto px-margin-edge py-section-gap">
          <div className="text-center mb-16">
            <h2 className="font-headline-xl text-headline-xl">Unified User Journey</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-4">A streamlined 6-step flow from entry to completion.</p>
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant/20 -translate-y-1/2 hidden md:block"></div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-8 relative z-10">
              {[
                { step: '01', title: 'Login', desc: 'Secure authentication' },
                { step: '02', title: 'Locate', desc: 'Select building level' },
                { step: '03', title: 'Schedule', desc: 'Set arrival window' },
                { step: '04', title: 'Reserve', desc: 'Confirm optimal slot', highlight: true },
                { step: '05', title: 'Navigate', desc: 'In-app floor guidance' },
                { step: '06', title: 'Checkout', desc: 'Automated payment' }
              ].map((step, i) => (
                <motion.div 
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center text-center space-y-4"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-data-mono
                    ${step.highlight ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-on-surface text-surface'}`}>
                    {step.step}
                  </div>
                  <h5 className="font-body-md text-body-md font-semibold">{step.title}</h5>
                  <p className="text-xs text-on-surface-variant">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-outline-variant/30">
        <div className="w-full max-w-container-max mx-auto px-margin-edge py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-headline-md text-headline-md font-semibold text-on-surface">ParkIntel</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">© 2024 ParkIntel Infrastructure. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {['Privacy Policy', 'Terms of Service', 'Accessibility', 'Cookie Settings'].map(link => (
              <a key={link} className="text-on-surface-variant hover:text-primary transition-colors font-body-sm text-body-sm" href="#">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
