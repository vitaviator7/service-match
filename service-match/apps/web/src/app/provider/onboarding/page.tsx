'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    MapPin,
    Briefcase,
    CreditCard,
    Upload,
    CheckCircle,
    Loader2,
    AlertCircle,
} from 'lucide-react';

type Step = 'business' | 'services' | 'location' | 'verification' | 'stripe';

export default function ProviderOnboardingPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [currentStep, setCurrentStep] = useState<Step>('business');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);

    // Form data
    const [formData, setFormData] = useState({
        // Business info
        businessName: '',
        shortBio: '',
        description: '',
        businessPhone: '',
        businessEmail: '',
        website: '',

        // Services
        selectedCategories: [] as string[],
        selectedServices: [] as string[],

        // Location
        postcode: '',
        city: '',
        radius: 15,

        // Verification
        idDocument: null as File | null,
        insuranceDocument: null as File | null,
    });

    // Fetch categories
    useEffect(() => {
        fetch('/api/categories')
            .then((res) => res.json())
            .then(setCategories)
            .catch(console.error);
    }, []);

    const steps: { key: Step; label: string; icon: React.ElementType }[] = [
        { key: 'business', label: 'Business Info', icon: Building2 },
        { key: 'services', label: 'Services', icon: Briefcase },
        { key: 'location', label: 'Location', icon: MapPin },
        { key: 'verification', label: 'Verification', icon: Upload },
        { key: 'stripe', label: 'Payments', icon: CreditCard },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

    const goNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].key);
        }
    };

    const goBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].key);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            // Create or update provider profile
            const profileResponse = await fetch('/api/provider/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: formData.businessName,
                    shortBio: formData.shortBio,
                    description: formData.description,
                    businessPhone: formData.businessPhone,
                    businessEmail: formData.businessEmail,
                    website: formData.website,
                    postcode: formData.postcode,
                    city: formData.city,
                    serviceRadius: formData.radius,
                    categoryIds: formData.selectedCategories,
                }),
            });

            if (!profileResponse.ok) {
                throw new Error('Failed to save profile');
            }

            const { providerId } = await profileResponse.json();

            // Create Stripe Connect account
            const stripeResponse = await fetch('/api/provider/stripe/connect', {
                method: 'POST',
            });

            if (!stripeResponse.ok) {
                throw new Error('Failed to create payment account');
            }

            const { accountLinkUrl } = await stripeResponse.json();

            // Redirect to Stripe onboarding
            window.location.href = accountLinkUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 'business':
                return (
                    formData.businessName.length >= 3 &&
                    formData.businessPhone.length >= 10
                );
            case 'services':
                return formData.selectedCategories.length > 0;
            case 'location':
                return /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(formData.postcode);
            case 'verification':
                return true; // Optional for now
            case 'stripe':
                return true;
            default:
                return false;
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        router.push('/auth/signin?callbackUrl=/provider/onboarding');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <span className="text-2xl font-bold text-primary">Serious Control</span>
                    </Link>
                    <h1 className="text-2xl font-bold mt-4">Become a Provider</h1>
                    <p className="text-muted-foreground">
                        Set up your profile and start receiving leads
                    </p>
                </div>

                {/* Progress */}
                <div className="flex justify-between mb-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div
                                key={step.key}
                                className={`flex-1 ${index < steps.length - 1 ? 'relative' : ''}`}
                            >
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isCurrent
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="h-6 w-6" />
                                        ) : (
                                            <Icon className="h-6 w-6" />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs mt-2 ${isCurrent ? 'font-medium text-primary' : 'text-muted-foreground'
                                            }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`absolute top-6 left-[60%] right-[-40%] h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Form Card */}
                <Card>
                    <CardContent className="p-8">
                        {/* Business Info Step */}
                        {currentStep === 'business' && (
                            <div>
                                <h2 className="text-xl font-bold mb-6">Business Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Business Name *
                                        </label>
                                        <Input
                                            value={formData.businessName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, businessName: e.target.value })
                                            }
                                            placeholder="Your business name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Short Bio
                                        </label>
                                        <Input
                                            value={formData.shortBio}
                                            onChange={(e) =>
                                                setFormData({ ...formData, shortBio: e.target.value })
                                            }
                                            placeholder="A brief tagline for your business"
                                            maxLength={150}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            placeholder="Tell customers about your experience, services, and what makes you stand out..."
                                            className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background"
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Business Phone *
                                            </label>
                                            <Input
                                                type="tel"
                                                value={formData.businessPhone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, businessPhone: e.target.value })
                                                }
                                                placeholder="07xxx xxxxxx"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Business Email
                                            </label>
                                            <Input
                                                type="email"
                                                value={formData.businessEmail}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, businessEmail: e.target.value })
                                                }
                                                placeholder="contact@yourbusiness.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Website (optional)
                                        </label>
                                        <Input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) =>
                                                setFormData({ ...formData, website: e.target.value })
                                            }
                                            placeholder="https://www.yourbusiness.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Services Step */}
                        {currentStep === 'services' && (
                            <div>
                                <h2 className="text-xl font-bold mb-2">What services do you offer?</h2>
                                <p className="text-muted-foreground mb-6">
                                    Select all categories that apply to your business
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {categories.map((category) => {
                                        const isSelected = formData.selectedCategories.includes(
                                            category.id
                                        );
                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        selectedCategories: isSelected
                                                            ? formData.selectedCategories.filter(
                                                                (id) => id !== category.id
                                                            )
                                                            : [...formData.selectedCategories, category.id],
                                                    });
                                                }}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <span className="text-2xl mb-2 block">
                                                    {category.icon}
                                                </span>
                                                <span className="font-medium">{category.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {formData.selectedCategories.length > 0 && (
                                    <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <span>
                                            {formData.selectedCategories.length} categor
                                            {formData.selectedCategories.length === 1 ? 'y' : 'ies'}{' '}
                                            selected
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Location Step */}
                        {currentStep === 'location' && (
                            <div>
                                <h2 className="text-xl font-bold mb-2">Where do you work?</h2>
                                <p className="text-muted-foreground mb-6">
                                    Set your service area to receive relevant leads
                                </p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Postcode *
                                        </label>
                                        <Input
                                            value={formData.postcode}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    postcode: e.target.value.toUpperCase(),
                                                })
                                            }
                                            placeholder="e.g., SW1A 1AA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            City
                                        </label>
                                        <Input
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            placeholder="e.g., London"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Service Radius: {formData.radius} miles
                                        </label>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            value={formData.radius}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    radius: parseInt(e.target.value),
                                                })
                                            }
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>5 miles</span>
                                            <span>50 miles</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Verification Step */}
                        {currentStep === 'verification' && (
                            <div>
                                <h2 className="text-xl font-bold mb-2">Verification Documents</h2>
                                <p className="text-muted-foreground mb-6">
                                    Upload documents to get verified and build trust with customers
                                </p>
                                <div className="space-y-4">
                                    <div className="p-6 border-2 border-dashed rounded-xl text-center">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="font-medium">ID Document</p>
                                        <p className="text-sm text-muted-foreground">
                                            Passport, driving licence, or national ID
                                        </p>
                                        <Button variant="outline" className="mt-4">
                                            Upload Document
                                        </Button>
                                    </div>
                                    <div className="p-6 border-2 border-dashed rounded-xl text-center">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="font-medium">Insurance Certificate</p>
                                        <p className="text-sm text-muted-foreground">
                                            Public liability insurance (recommended)
                                        </p>
                                        <Button variant="outline" className="mt-4">
                                            Upload Document
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-4">
                                    You can skip this step and upload documents later from your dashboard.
                                </p>
                            </div>
                        )}

                        {/* Stripe Step */}
                        {currentStep === 'stripe' && (
                            <div>
                                <h2 className="text-xl font-bold mb-2">Set Up Payments</h2>
                                <p className="text-muted-foreground mb-6">
                                    Connect your account to receive payments from customers
                                </p>
                                <div className="space-y-4">
                                    <div className="p-6 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-[#635BFF] rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold text-xl">S</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">Stripe Connect</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Secure payments powered by Stripe
                                                </p>
                                            </div>
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Receive payments directly to your bank
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Weekly automatic payouts
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                Track earnings in your dashboard
                                            </li>
                                        </ul>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        You'll be redirected to Stripe to complete your account setup.
                                    </p>
                                </div>

                                {error && (
                                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>

                    {/* Navigation */}
                    <div className="border-t p-6 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={goBack}
                            disabled={currentStepIndex === 0}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>

                        {currentStep === 'stripe' ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button onClick={goNext} disabled={!canProceed()}>
                                Continue
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
