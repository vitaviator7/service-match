import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Contact Us | ServiceMatch',
    description: 'Get in touch with the ServiceMatch team.',
};

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Contact Info */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6 flex items-start gap-4">
                            <Mail className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold mb-1">Email</h3>
                                <p className="text-sm text-muted-foreground mb-1">General Inquiries</p>
                                <a href="mailto:support@servicematch.com" className="text-primary hover:underline">support@servicematch.com</a>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-start gap-4">
                            <Phone className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold mb-1">Phone</h3>
                                <p className="text-sm text-muted-foreground mb-1">Mon-Fri, 9am-5pm</p>
                                <a href="tel:+442012345678" className="text-primary hover:underline">+44 20 1234 5678</a>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-start gap-4">
                            <MapPin className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h3 className="font-semibold mb-1">Office</h3>
                                <p className="text-muted-foreground text-sm">
                                    ServiceMatch Ltd<br />
                                    123 Innovation Way<br />
                                    London, EC1A 1BB
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Form */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Send us a message</CardTitle>
                            <CardDescription>
                                Have a question or feedback? Fill out the form below and we'll get back to you as soon as possible.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                                        <Input id="name" placeholder="Your name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                                        <Input id="email" type="email" placeholder="Your email" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                    <Input id="subject" placeholder="What is this regarding?" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                                    <Textarea id="message" placeholder="Type your message here..." className="min-h-[150px]" />
                                </div>
                                <Button type="submit" size="lg" className="w-full sm:w-auto">
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
