import { Database, LockKeyhole, ShieldCheck } from 'lucide-react';

export function AuthStory() {
  return (
    <section className="auth-story" aria-label="About SOAIRD App">
      <div className="auth-brand">
        <div className="auth-mark">
          <Database size={22} />
        </div>
        <div>
          <strong>AI-Ready Africa</strong>
          <span>Research command</span>
        </div>
      </div>
      <div className="auth-copy">
        <p className="eyebrow">State of AI-Ready Data in Africa</p>
        <h1>Evidence for better AI decisions.</h1>
        <p>
          Assess African datasets with context, document every conclusion and
          collaborate without losing the research trail.
        </p>
      </div>
      <div className="auth-principles">
        <div>
          <ShieldCheck size={17} />
          <span>
            <strong>Transparent by design</strong>
            <small>Every score points back to evidence.</small>
          </span>
        </div>
        <div>
          <LockKeyhole size={17} />
          <span>
            <strong>Human-reviewed</strong>
            <small>Automated findings never silently replace judgment.</small>
          </span>
        </div>
      </div>
      <span className="auth-coordinate">
        01°17′S · 36°49′E · NAIROBI
      </span>
    </section>
  );
}