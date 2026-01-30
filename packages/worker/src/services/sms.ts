import twilio from 'twilio';

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER!;

interface SendSMSParams {
    to: string;
    message: string;
}

export async function sendSMS({ to, message }: SendSMSParams) {
    // Normalize UK phone number
    let normalizedPhone = to.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+44' + normalizedPhone.slice(1);
    } else if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+44' + normalizedPhone;
    }

    // In development, just log
    if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Would send SMS to ${normalizedPhone}: ${message}`);
        return;
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: FROM_NUMBER,
            to: normalizedPhone,
        });

        console.log(`SMS sent: ${result.sid}`);
        return result;
    } catch (error) {
        console.error('Twilio error:', error);
        throw error;
    }
}

// Send verification code
export async function sendVerificationCode(phone: string, code: string) {
    await sendSMS({
        to: phone,
        message: `Your ServiceMatch verification code is: ${code}. This code expires in 10 minutes.`,
    });
}

// Send booking reminder
export async function sendBookingReminderSMS(
    phone: string,
    data: {
        service: string;
        date: string;
        time: string;
        providerName: string;
    }
) {
    await sendSMS({
        to: phone,
        message: `Reminder: Your ${data.service} appointment with ${data.providerName} is tomorrow at ${data.time}. Reply HELP for support.`,
    });
}

// Send new quote notification
export async function sendNewQuoteSMS(
    phone: string,
    data: {
        providerName: string;
        amount: string;
    }
) {
    await sendSMS({
        to: phone,
        message: `New quote received! ${data.providerName} quoted £${data.amount}. View quotes in the ServiceMatch app.`,
    });
}

// Send booking confirmation
export async function sendBookingConfirmationSMS(
    phone: string,
    data: {
        service: string;
        date: string;
        time: string;
    }
) {
    await sendSMS({
        to: phone,
        message: `Booking confirmed! Your ${data.service} is scheduled for ${data.date} at ${data.time}. View details in ServiceMatch.`,
    });
}
