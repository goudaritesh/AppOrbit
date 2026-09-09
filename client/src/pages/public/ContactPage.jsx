import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please complete all required fields.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success('Thank you! Your message has been received.');
    }, 600);
  };

  return (
    <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[85vh]">
      <SEOHead
        title="Contact AppOrbit — Developer Support & Platform Inquiries"
        description="Get in touch with the AppOrbit support, developer relations, or security triage teams."
      />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-3">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Support & Inquiries</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-content-primary tracking-tight mb-3">
          Contact the AppOrbit Team
        </h1>
        <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
          Have a question about publishing an application, security auditing, or partnership opportunities? Reach out and we'll respond promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {/* Contact Information Cards */}
        <div className="flex flex-col gap-4">
          <Card padding="md" className="flex flex-col gap-2 border border-white/10">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold font-mono uppercase text-content-primary">
              Developer Support
            </h3>
            <p className="text-xs text-content-muted">
              For assistance with APK builds, version uploads, or developer dashboard issues.
            </p>
            <span className="text-xs font-mono text-primary mt-1">support@apporbit.dev</span>
          </Card>

          <Card padding="md" className="flex flex-col gap-2 border border-white/10">
            <div className="w-9 h-9 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center text-accent-rose mb-1">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold font-mono uppercase text-content-primary">
              Security Triage
            </h3>
            <p className="text-xs text-content-muted">
              To report suspicious APK behavior, potential security vulnerabilities, or policy concerns.
            </p>
            <span className="text-xs font-mono text-accent-rose mt-1">security@apporbit.dev</span>
          </Card>
        </div>

        {/* Form Card */}
        <Card padding="lg" className="lg:col-span-2 border border-white/10">
          {submitted ? (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-content-primary">
                Message Sent Successfully
              </h3>
              <p className="text-xs text-content-secondary max-w-sm">
                Our support team typically responds within 24 business hours. Thank you for contacting AppOrbit!
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-content-dim mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-content-dim mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-content-dim mb-1.5">
                  Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Developer Account">Developer Account & Verification</option>
                  <option value="App Review">Application Review Status</option>
                  <option value="Security Report">Security or Abuse Report</option>
                  <option value="Partnership">Partnership Opportunities</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-content-dim mb-1.5">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry in detail..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
                className="mt-2"
                icon={<Send className="w-4 h-4" />}
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;
