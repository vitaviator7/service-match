'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, CheckCircle2, ScanLine, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

interface DiagnosisResult {
    id?: string;
    mediaUrl: string;
    issue: string;
    confidence: number;
    category: string;
    urgency: string;
    diagnosis: string;
    recommendations: string[];
    estimatedCost?: {
        low: number;
        avg: number;
        high: number;
    };
    detectedBrand?: string | null;
    detectedModel?: string | null;
    detectedAge?: string | null;
    location?: string | null;
}

export default function SnapFix() {
    const [state, setState] = useState<'idle' | 'uploading' | 'scanning' | 'complete' | 'error'>('idle');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [result, setResult] = useState<DiagnosisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            setError('Please upload an image or video file');
            setState('error');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            setState('error');
            return;
        }

        // Create preview
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        // Upload and analyze
        setState('uploading');
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('additionalNotes', '');

            const response = await fetch('/api/snapfix/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to analyze image');
            }

            const data = await response.json();

            if (data.success && data.diagnosis) {
                setState('scanning');

                // Simulate scanning animation for UX
                setTimeout(() => {
                    setResult(data.diagnosis);
                    setState('complete');
                }, 2000);
            } else {
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (err) {
            console.error('SnapFix error:', err);
            setError('Unable to analyze image. Please try again.');
            setState('error');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const reset = () => {
        setState('idle');
        setPreviewUrl(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'EMERGENCY': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
            case 'URGENT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
            case 'STANDARD': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
            case 'LOW': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
        }
    };

    return (
        <Card className="relative overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 min-h-[300px] flex flex-col items-center justify-center p-8 transition-colors hover:border-blue-400 group">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                capture="environment"
            />

            <AnimatePresence mode="wait">
                {state === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Camera className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">SnapFix AI™</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            Don't know the technical term? Just take a photo or video of the problem. Our AI will diagnose it and match the right pro.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button size="lg" onClick={triggerFileInput} className="bg-blue-600 hover:bg-blue-700">
                                <Camera className="w-4 h-4 mr-2" />
                                Take Photo
                            </Button>
                            <Button size="lg" variant="outline" onClick={triggerFileInput}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Media
                            </Button>
                        </div>
                    </motion.div>
                )}

                {(state === 'uploading' || state === 'scanning') && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white p-6 z-10"
                    >
                        {/* Preview Image */}
                        {previewUrl && (
                            <div className="relative w-64 h-48 bg-slate-800 rounded-lg overflow-hidden mb-6 border border-slate-700">
                                <Image
                                    src={previewUrl}
                                    alt="Uploaded media"
                                    fill
                                    className="object-contain"
                                />

                                {/* Scanning Laser Line */}
                                {state === 'scanning' && (
                                    <motion.div
                                        className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                )}

                                {/* Scanning Icon overlay */}
                                {state === 'scanning' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ScanLine className="w-12 h-12 text-blue-400/50 animate-pulse" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2 text-center">
                            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-400 animate-spin-slow" />
                                {state === 'uploading' ? 'Analyzing Visual Data...' : 'AI Diagnosis in Progress...'}
                            </h3>
                            <p className="text-slate-400 text-sm">
                                {state === 'uploading' ? 'Uploading media to secure cloud.' : 'Matching against thousands of repair patterns.'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {state === 'complete' && result && (
                    <motion.div
                        key="complete"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center w-full max-w-md mx-auto"
                    >
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>

                        <h3 className="text-2xl font-bold mb-1">Diagnosis Complete</h3>
                        <p className="text-slate-500 mb-6">AI has analyzed your issue.</p>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 text-left mb-6">
                            <div className="flex items-start gap-4 mb-4">
                                {result.mediaUrl && (
                                    <div className="w-20 h-20 bg-slate-200 rounded-lg shrink-0 relative overflow-hidden">
                                        <Image
                                            src={result.mediaUrl}
                                            alt="Diagnosed issue"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h4 className="font-bold text-lg">{result.issue}</h4>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                            {result.confidence}% Confidence
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getUrgencyColor(result.urgency)}`}>
                                            {result.urgency}
                                        </span>
                                    </div>
                                    {(result.detectedBrand || result.detectedModel) && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                            {result.detectedBrand} {result.detectedModel}
                                            {result.detectedAge && ` • ${result.detectedAge}`}
                                            {result.location && ` • ${result.location}`}
                                        </p>
                                    )}
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {result.diagnosis}
                                    </p>
                                </div>
                            </div>

                            {result.recommendations && result.recommendations.length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-3">
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Recommendations:</p>
                                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                        {result.recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-blue-500 mt-0.5">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.estimatedCost && (
                                <div className="flex items-center gap-3 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Est. Repair: £{result.estimatedCost.low} - £{result.estimatedCost.high}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Link
                                href={`/request?category=${result.category}&title=${encodeURIComponent(result.issue)}&description=${encodeURIComponent(result.diagnosis)}`}
                                className="w-full"
                            >
                                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                                    Find Specialists
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="w-full" onClick={reset}>
                                Scan Another Item
                            </Button>
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-4">
                            *AI-powered diagnosis. Professional inspection recommended.
                        </p>
                    </motion.div>
                )}

                {state === 'error' && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center w-full max-w-md mx-auto"
                    >
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                        <p className="text-slate-500 mb-6">{error || 'Unable to analyze the image'}</p>
                        <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
                            Try Again
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
