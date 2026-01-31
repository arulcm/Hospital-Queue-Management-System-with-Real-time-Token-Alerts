import React from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Bell,
    ShieldCheck,
    Users,
    Hospital,
    ArrowRight,
    CheckCircle2,
    Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="saas-landing">

            {/* Hero Section - The Problem & Solution */}
            <header className="hero-section">
                <div className="container-standard">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="hero-inner"
                    >
                        <h1>Hospital waiting rooms are stressful, crowded, and inefficient.</h1>
                        <p>WaitLess sends real-time alerts to patients' phones when their turn is near. Let them wait comfortably while you manage queues efficiently.</p>

                        <div className="hero-ctas">
                            <Link to="/login" className="btn-primary-lg">
                                Hospital Login
                                <ArrowRight size={20} />
                            </Link>
                            <Link to="/select-hospital" className="btn-secondary-lg">
                                Get Token
                                <Activity size={20} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </header>

            {/* Core Value Pillars */}
            <section className="features-section">
                <div className="container-standard">
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon-box"><CheckCircle2 size={24} /></div>
                            <h3>No Missed Tokens</h3>
                            <p>Patients can step away from crowded waiting areas without fear. We alert them exactly when it's time to return.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-box"><Bell size={24} /></div>
                            <h3>Real-time Alerts</h3>
                            <p>Browser notifications and audio cues keep patients and staff synchronized. No more shouting names or missed calls.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon-box"><ShieldCheck size={24} /></div>
                            <h3>Zero Cost SaaS</h3>
                            <p>No expensive hardware, kiosk machines, or app installations. Works on any device with a browser.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="container-standard">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="section-header"
                    >
                        <h2>How It Works</h2>
                        <p>Simple setup, immediate impact</p>
                    </motion.div>

                    <div className="steps-grid">
                        <div className="step-item">
                            <div className="step-number">1</div>
                            <h3>Hospital Registers</h3>
                            <p>Create your hospital account and set up departments in minutes</p>
                        </div>
                        <div className="step-item">
                            <div className="step-number">2</div>
                            <h3>Patient Gets Token</h3>
                            <p>Patients scan QR code or visit your link to receive a digital token</p>
                        </div>
                        <div className="step-item">
                            <div className="step-number">3</div>
                            <h3>Smart Notifications</h3>
                            <p>System automatically alerts patients when their turn approaches</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="trust-section">
                <div className="container-standard">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="trust-content"
                    >
                        <div className="trust-stats">
                            <div className="stat-item">
                                <div className="stat-number">60%</div>
                                <div className="stat-label">Reduced Wait Times</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">0</div>
                                <div className="stat-label">Hardware Required</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">100%</div>
                                <div className="stat-label">Browser Compatible</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta">
                <div className="container-standard">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="cta-content"
                    >
                        <h2>Ready to improve your patient experience?</h2>
                        <p>Join hospitals that are already reducing wait times and improving satisfaction</p>
                        <div className="cta-buttons">
                            <Link to="/register" className="btn-primary-lg">
                                Start Free Trial
                                <ArrowRight size={20} />
                            </Link>
                            <Link to="/patient" className="btn-outline-lg">
                                Try Patient View
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
