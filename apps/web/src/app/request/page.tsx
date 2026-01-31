'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    ArrowLeft,
    ArrowRight,
    Upload,
    CheckCircle,
    Clock,
    Zap,
    Calendar,
    AlertCircle,
    Loader2,
} from 'lucide-react';

type Step = 'category' | 'details' | 'urgency' | 'location' | 'photos' | 'review';

interface FormData {
    categoryId: string;
    subcategoryId?: string;
    title: string;
    description: string;
    urgency: string;
    postcode: string;
    preferredDate?: string;
    preferredTime?: string;
    budgetMin?: number;
    budgetMax?: number;
    photos: string[];
}

const urgencyOptions = [
    {
        value: 'EMERGENCY',
        label: 'Emergency',
        description: "Need help within 24 hours",
        icon: AlertCircle,
        className: 'border-red-200 bg-red-50 hover:border-red-400',
    },
    {
        value: 'URGENT',
        label: 'Urgent',
        description: 'Within 2-3 days',
        icon: Zap,
        className: 'border-orange-200 bg-orange-50 hover:border-orange-400',
    },
    {
        value: 'THIS_WEEK',
        label: 'This Week',
        description: 'Within the next 7 days',
        icon: Clock,
        className: 'border-yellow-200 bg-yellow-50 hover:border-yellow-400',
    },
    {
        value: 'THIS_MONTH',
        label: 'This Month',
        description: 'Within the next 30 days',
        icon: Calendar,
        className: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    },
    {
        value: 'FLEXIBLE',
        label: 'Flexible',
        description: "I'm not in a rush",
        icon: CheckCircle,
        className: 'border-slate-200 bg-slate-50 hover:border-slate-400',
    },
];

export default function RequestQuotePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [currentStep, setCurrentStep] = useState<Step>('category');
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        categoryId: searchParams.get('category') || '',
        title: searchParams.get('title') || '',
        description: searchParams.get('description') || '',
        urgency: '',
        postcode: '',
        budgetMax: searchParams.get('budgetMax') ? parseInt(searchParams.get('budgetMax')!) : undefined,
        photos: [],
    });

    // Fetch categories on mount
    useEffect(() => {
        fetch('/api/categories')
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch(console.error);
    }, []);

    // Fetch subcategories when category changes
    useEffect(() => {
        if (formData.categoryId) {
            fetch(`/api/categories/${formData.categoryId}/subcategories`)
                .then((res) => res.json())
                .then((data) => setSubcategories(data))
                .catch(console.error);
        }
    }, [formData.categoryId]);

    const steps: { key: Step; label: string }[] = [
        { key: 'category', label: 'Category' },
        { key: 'details', label: 'Details' },
        { key: 'urgency', label: 'Urgency' },
        { key: 'location', label: 'Location' },
        { key: 'photos', label: 'Photos' },
        { key: 'review', label: 'Review' },
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
        if (status === 'unauthenticated') {
            // Store form data and redirect to signin
            sessionStorage.setItem('pending_quote_request', JSON.stringify(formData));
            router.push('/auth/signin?callbackUrl=/request/complete');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/quote-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit request');
            }

            const { quoteRequestId } = await response.json();
            router.push(`/dashboard/quotes/${quoteRequestId}?success=true`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find((c) => c.id === formData.categoryId);

    const canProceed = () => {
        switch (currentStep) {
            case 'category':
                return !!formData.categoryId;
            case 'details':
                return formData.title.length >= 5 && formData.description.length >= 20;
            case 'urgency':
                return !!formData.urgency;
            case 'location':
                return /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(formData.postcode);
            case 'photos':
                return true; // Optional step
            case 'review':
                return true;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {steps.map((step, index) => (
                            <div
                                key={step.key}
                                className={`flex-1 ${index < steps.length - 1 ? 'relative' : ''}`}
                            >
                                <div className="flex items-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${index < currentStepIndex
                                            ? 'bg-green-500 text-white'
                                            : index === currentStepIndex
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-slate-200 text-slate-600'
                                            }`}
                                    >
                                        {index < currentStepIndex ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`flex-1 h-1 mx-2 transition-colors ${index < currentStepIndex
                                                ? 'bg-green-500'
                                                : 'bg-slate-200'
                                                }`}
                                        />
                                    )}
                                </div>
                                <span
                                    className={`absolute -bottom-6 text-xs whitespace-nowrap left-0 ${index === currentStepIndex
                                        ? 'text-primary font-medium'
                                        : 'text-muted-foreground'
                                        }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <Card className="mt-12">
                    <CardContent className="p-8">
                        {/* Category Step */}
                        {currentStep === 'category' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">
                                    What do you need help with?
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    Select the category that best describes your job
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    {categories.slice(0, 12).map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    categoryId: category.id,
                                                })
                                            }
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${formData.categoryId === category.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className="text-2xl mb-2 block">
                                                {category.icon}
                                            </span>
                                            <span className="font-medium">{category.name}</span>
                                        </button>
                                    ))}
                                </div>

                                {subcategories.length > 0 && (
                                    <div className="border-t pt-6">
                                        <h3 className="font-medium mb-4">
                                            What type of {selectedCategory?.name.toLowerCase()}{' '}
                                            work?
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {subcategories.map((sub) => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            subcategoryId: sub.id,
                                                            title: sub.name,
                                                        })
                                                    }
                                                    className={`px-4 py-2 rounded-full border transition-all ${formData.subcategoryId === sub.id
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Details Step */}
                        {currentStep === 'details' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Describe your job</h2>
                                <p className="text-muted-foreground mb-6">
                                    The more detail you provide, the better quotes you'll receive
                                </p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Job title
                                        </label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) =>
                                                setFormData({ ...formData, title: e.target.value })
                                            }
                                            placeholder="e.g., Fix leaking kitchen tap"
                                            maxLength={200}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formData.title.length}/200 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Describe what you need done
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="Include details like what needs fixing, the current condition, any access considerations, etc."
                                            className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background"
                                            maxLength={2000}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formData.description.length}/2000 characters (min 20)
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Budget minimum (optional)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    £
                                                </span>
                                                <Input
                                                    type="number"
                                                    value={formData.budgetMin || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            budgetMin: e.target.value
                                                                ? parseInt(e.target.value)
                                                                : undefined,
                                                        })
                                                    }
                                                    className="pl-7"
                                                    placeholder="Min"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Budget maximum (optional)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    £
                                                </span>
                                                <Input
                                                    type="number"
                                                    value={formData.budgetMax || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            budgetMax: e.target.value
                                                                ? parseInt(e.target.value)
                                                                : undefined,
                                                        })
                                                    }
                                                    className="pl-7"
                                                    placeholder="Max"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Urgency Step */}
                        {currentStep === 'urgency' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">How urgent is this?</h2>
                                <p className="text-muted-foreground mb-6">
                                    This helps providers understand your timeline
                                </p>

                                <div className="space-y-3">
                                    {urgencyOptions.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        urgency: option.value,
                                                    })
                                                }
                                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${formData.urgency === option.value
                                                    ? 'border-primary bg-primary/5'
                                                    : option.className
                                                    }`}
                                            >
                                                <Icon className="h-6 w-6" />
                                                <div>
                                                    <span className="font-medium block">
                                                        {option.label}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {option.description}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {(formData.urgency === 'THIS_WEEK' ||
                                    formData.urgency === 'THIS_MONTH' ||
                                    formData.urgency === 'FLEXIBLE') && (
                                        <div className="mt-6 grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Preferred date (optional)
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={formData.preferredDate || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            preferredDate: e.target.value,
                                                        })
                                                    }
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Preferred time (optional)
                                                </label>
                                                <select
                                                    value={formData.preferredTime || ''}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            preferredTime: e.target.value,
                                                        })
                                                    }
                                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                                >
                                                    <option value="">Any time</option>
                                                    <option value="morning">Morning (8am-12pm)</option>
                                                    <option value="afternoon">Afternoon (12pm-5pm)</option>
                                                    <option value="evening">Evening (5pm-8pm)</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Location Step */}
                        {currentStep === 'location' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Where is the job?</h2>
                                <p className="text-muted-foreground mb-6">
                                    We'll match you with providers in your area
                                </p>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Postcode
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
                                        maxLength={10}
                                        className="text-lg"
                                    />
                                    {formData.postcode &&
                                        !/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(
                                            formData.postcode
                                        ) && (
                                            <p className="text-sm text-red-500 mt-1">
                                                Please enter a valid UK postcode
                                            </p>
                                        )}
                                </div>
                            </div>
                        )}

                        {/* Photos Step */}
                        {currentStep === 'photos' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Add photos (optional)</h2>
                                <p className="text-muted-foreground mb-6">
                                    Photos help providers give more accurate quotes
                                </p>

                                <div
                                    className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
                                    onClick={() => {
                                        // TODO: Implement file upload
                                    }}
                                >
                                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="font-medium">Click to upload photos</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        PNG, JPG, HEIC up to 10MB each
                                    </p>
                                </div>

                                {formData.photos.length > 0 && (
                                    <div className="mt-6 grid grid-cols-3 gap-4">
                                        {formData.photos.map((photo, index) => (
                                            <div
                                                key={index}
                                                className="aspect-square rounded-lg bg-slate-100 relative"
                                            >
                                                <img
                                                    src={photo}
                                                    alt=""
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <button
                                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            photos: formData.photos.filter(
                                                                (_, i) => i !== index
                                                            ),
                                                        })
                                                    }
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Review Step */}
                        {currentStep === 'review' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Review your request</h2>
                                <p className="text-muted-foreground mb-6">
                                    Check the details before submitting
                                </p>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Category</p>
                                        <p className="font-medium">
                                            {selectedCategory?.icon} {selectedCategory?.name}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Job title</p>
                                        <p className="font-medium">{formData.title}</p>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Description</p>
                                        <p className="whitespace-pre-wrap">{formData.description}</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Urgency</p>
                                            <p className="font-medium">
                                                {
                                                    urgencyOptions.find(
                                                        (o) => o.value === formData.urgency
                                                    )?.label
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Location</p>
                                            <p className="font-medium">{formData.postcode}</p>
                                        </div>
                                    </div>

                                    {(formData.budgetMin || formData.budgetMax) && (
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-muted-foreground">Budget</p>
                                            <p className="font-medium">
                                                {formData.budgetMin && `£${formData.budgetMin}`}
                                                {formData.budgetMin && formData.budgetMax && ' - '}
                                                {formData.budgetMax && `£${formData.budgetMax}`}
                                            </p>
                                        </div>
                                    )}
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

                        {currentStep === 'review' ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : status === 'authenticated' ? (
                                    'Submit Request'
                                ) : (
                                    'Sign in & Submit'
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

                {/* Benefits */}
                <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-medium">Free to use</h3>
                        <p className="text-sm text-muted-foreground">
                            No fees for customers, ever
                        </p>
                    </div>
                    <div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-medium">Quick quotes</h3>
                        <p className="text-sm text-muted-foreground">
                            Receive quotes within hours
                        </p>
                    </div>
                    <div>
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                            <Zap className="h-6 w-6 text-purple-600" />
                        </div>
                        <h3 className="font-medium">Verified providers</h3>
                        <p className="text-sm text-muted-foreground">
                            All tradespeople are vetted
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
