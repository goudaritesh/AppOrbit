import React from 'react';
import { CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';

/**
 * Visual multi-stage scan progress stepper
 */
export const ScanProgressTimeline = ({ status, currentStage = 8 }) => {
  const stages = [
    { id: 1, title: 'Binary Integrity Check', desc: 'SHA-256 digest validation' },
    { id: 2, title: 'Malware Scanning', desc: 'Antivirus heuristic engine' },
    { id: 3, title: 'Signature Analysis', desc: 'APK v1/v2/v3/v4 scheme verification' },
    { id: 4, title: 'Certificate Analysis', desc: 'X.509 fingerprint & key renewal check' },
    { id: 5, title: 'Permission Risk Profiling', desc: 'Sensitive API & combination checks' },
    { id: 6, title: 'Static Code Inspection', desc: 'Manifest, exported components & libs' },
    { id: 7, title: 'Package Identity Check', desc: 'Identity stability & monotonic sequence' },
    { id: 8, title: 'Policy Verdict', desc: 'Risk scoring & distribution gatekeeper' },
  ];

  const isTerminal = [
    'PASSED',
    'APPROVED',
    'SUSPICIOUS',
    'MALICIOUS',
    'PENDING_MANUAL_REVIEW',
    'QUARANTINED',
    'BLOCKED',
    'FAILED',
  ].includes(status);

  return (
    <div className="py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage) => {
          let stepStatus = 'pending';
          if (isTerminal) {
            stepStatus = status === 'FAILED' && stage.id === currentStage ? 'failed' : 'completed';
          } else if (stage.id < currentStage) {
            stepStatus = 'completed';
          } else if (stage.id === currentStage) {
            stepStatus = 'active';
          }

          return (
            <div
              key={stage.id}
              className={`p-3 rounded-xl border transition-all ${
                stepStatus === 'completed'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-content-primary'
                  : stepStatus === 'active'
                  ? 'bg-blue-500/10 border-blue-500/30 text-content-primary shadow-glow-cyan/5'
                  : stepStatus === 'failed'
                  ? 'bg-rose-500/10 border-rose-500/25 text-content-primary'
                  : 'bg-white/[0.02] border-white/5 text-content-dim'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {stepStatus === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {stepStatus === 'active' && (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                )}
                {stepStatus === 'pending' && (
                  <Clock className="w-4 h-4 text-content-dim shrink-0" />
                )}
                {stepStatus === 'failed' && (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="text-xs font-semibold font-mono">Stage {stage.id}</span>
              </div>
              <p className="text-xs font-medium text-content-primary truncate">{stage.title}</p>
              <p className="text-[10px] text-content-secondary mt-0.5 truncate">{stage.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScanProgressTimeline;
