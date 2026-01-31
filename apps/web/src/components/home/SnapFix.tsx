'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, CheckCircle2, ScanLine, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SnapFix() {
    const [state, setState] = useState<'idle' | 'uploading' | 'scanning' | 'complete'>('idle');

    const handleSimulateUpload = () => {
        setState('uploading');
        setTimeout(() => {
            setState('scanning');
            setTimeout(() => {
                setState('complete');
            }, 2500); // 2.5s scanning simulation
        }, 1500); // 1.5s upload simulation
    };

    const reset = () => setState('idle');

    return (
        <Card className="relative overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 min-h-[300px] flex flex-col items-center justify-center p-8 transition-colors hover:border-blue-400 group">

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
                            <Button size="lg" onClick={handleSimulateUpload} className="bg-blue-600 hover:bg-blue-700">
                                <Camera className="w-4 h-4 mr-2" />
                                Take Photo
                            </Button>
                            <Button size="lg" variant="outline" onClick={handleSimulateUpload}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Video
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
                        {/* Scanning Simulation Image */}
                        <div className="relative w-64 h-48 bg-slate-800 rounded-lg overflow-hidden mb-6 border border-slate-700">
                            {/* Checkered pattern to simulate transparency/image placeholder */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                            {/* Mockup Boiler Image (CSS Shapes) */}
                            <div className="absolute inset-x-10 top-10 bottom-4 bg-slate-600 rounded-md"></div>
                            <div className="absolute left-14 top-14 w-8 h-8 rounded-full bg-slate-500"></div>

                            {/* Scanning Laser Line */}
                            {state === 'scanning' && (
                                <motion.div
                                    className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                            )}

                            {/* Scanning Icons overlay */}
                            {state === 'scanning' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ScanLine className="w-12 h-12 text-blue-400/50 animate-pulse" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 text-center">
                            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-400 animate-spin-slow" />
                                {state === 'uploading' ? 'Analyzing Visual Data...' : 'Identifying Issue...'}
                            </h3>
                            <p className="text-slate-400 text-sm">
                                {state === 'uploading' ? 'Uploading media to secure cloud.' : 'Matching against 50,000+ repair patterns.'}
                            </p>
                        </div>
                    </motion.div>
                )}

                {state === 'complete' && (
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
                        <p className="text-slate-500 mb-6">We've identified the potential issue.</p>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 text-left mb-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-20 h-20 bg-slate-200 rounded-lg shrink-0"></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-lg">Potterton Boiler</h4>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Confidence: 98%</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Likely <b className="text-slate-900 dark:text-white">Diverter Valve Fault</b> based on visual leakage pattern.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                Est. Repair: £180 - £250 (Parts included)
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700">
                                Find Boiler Specialists
                            </Button>
                            <Button variant="outline" size="lg" className="w-full" onClick={reset}>
                                Scan Another Item
                            </Button>
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-4">
                            *Estimated cost based on local market rates (FairPrice™ AI)
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

