# Phase 2: WhatsApp OTP Implementation

This document outlines how to upgrade from SMS OTP to WhatsApp OTP using the Vonage Messages API.

## 🎯 Overview

WhatsApp OTP offers several advantages over SMS:
- **Higher engagement**: Better open rates (98% vs 90% for SMS)
- **Lower cost**: Often cheaper than SMS in many regions
- **Rich formatting**: Support for buttons, templates, and media
- **Two-way communication**: Enable customer support conversations
- **Verified sender**: Business profile with verified checkmark

## 📋 Prerequisites

1. **Vonage Messages API Account**
   - Upgrade from Vonage SMS to Messages API
   - WhatsApp Business API access

2. **WhatsApp Business Account**
   - Register at [Facebook Business Manager](https://business.facebook.com/)
   - Complete business verification
   - Connect WhatsApp number to Vonage

3. **Message Templates**
   - Create and get approval for OTP message template
   - Templates must follow WhatsApp Business Policy

## 🔧 Implementation Steps

### Step 1: Install Vonage Messages SDK

Update `package.json`:

```bash
npm install @vonage/messages
```

### Step 2: Configure WhatsApp in Environment

Add to `.env`:

```env
# WhatsApp Configuration
VONAGE_APPLICATION_ID=your_vonage_application_id
VONAGE_PRIVATE_KEY_PATH=./private.key
WHATSAPP_NUMBER=+212XXXXXXXXX
```

### Step 3: Create WhatsApp OTP Sender

Create `src/utils/vonageWhatsApp.ts`:

```typescript
import { Messages } from '@vonage/messages';
import { config } from '../config/index.js';

class VonageWhatsAppService {
  private messages: Messages;

  constructor() {
    this.messages = new Messages({
      applicationId: config.vonage.applicationId,
      privateKey: config.vonage.privateKey,
    });
  }

  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Send OTP using WhatsApp template
      const response = await this.messages.send({
        to: phone,
        from: config.whatsapp.number,
        channel: 'whatsapp',
        message_type: 'template',
        template: {
          name: 'otp_verification', // Your approved template name
          language: {
            code: 'ar', // or 'fr' for French, 'en' for English
            policy: 'deterministic',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp,
                },
                {
                  type: 'text',
                  text: config.otp.ttlMinutes.toString(),
                },
              ],
            },
          ],
        },
      });

      return {
        success: true,
        messageId: response.message_uuid,
      };
    } catch (error: any) {
      console.error('WhatsApp OTP error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send WhatsApp OTP',
      };
    }
  }

  async sendOTPFallback(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Fallback: Send as simple text message (for testing)
      const response = await this.messages.send({
        to: phone,
        from: config.whatsapp.number,
        channel: 'whatsapp',
        message_type: 'text',
        text: `Your TopAffaireImmo verification code is: ${otp}. Valid for ${config.otp.ttlMinutes} minutes. Do not share this code.`,
      });

      return {
        success: true,
        messageId: response.message_uuid,
      };
    } catch (error: any) {
      console.error('WhatsApp OTP fallback error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send WhatsApp OTP',
      };
    }
  }
}

export const vonageWhatsApp = new VonageWhatsAppService();
```

### Step 4: Create WhatsApp Message Template

Go to [WhatsApp Manager](https://business.facebook.com/wa/manage/message-templates/):

**Template Name**: `otp_verification`

**Category**: Authentication

**Language**: Arabic (or French/English based on your needs)

**Template Body**:
```
رمز التحقق الخاص بك في TopAffaireImmo هو: {{1}}
صالح لمدة {{2}} دقائق. لا تشارك هذا الرمز.

Your TopAffaireImmo verification code is: {{1}}
Valid for {{2}} minutes. Do not share this code.
```

**Submit for approval** (usually takes 24-48 hours)

### Step 5: Update OTP Controller

Modify `src/controllers/otpController.ts` to support both SMS and WhatsApp:

```typescript
import { vonageSMS } from '../utils/vonageSMS.js';
import { vonageWhatsApp } from '../utils/vonageWhatsApp.js';

// In requestOTP method, replace SMS sending with:

// Determine channel (SMS or WhatsApp)
const channel = req.body.channel || 'sms'; // Allow client to choose

let otpResult;
if (channel === 'whatsapp') {
  otpResult = await vonageWhatsApp.sendOTP(formattedPhone, otp);
  
  // Fallback to SMS if WhatsApp fails
  if (!otpResult.success) {
    console.log('WhatsApp failed, falling back to SMS');
    otpResult = await vonageSMS.sendOTP(formattedPhone, otp);
  }
} else {
  otpResult = await vonageSMS.sendOTP(formattedPhone, otp);
}

if (!otpResult.success) {
  res.status(500).json({
    success: false,
    error: 'Failed to send OTP. Please try again.',
  });
  return;
}
```

### Step 6: Update API Request Schema

The `/auth/otp/request` endpoint now accepts an optional `channel` parameter:

```json
{
  "phone": "+2126XXXXXXXX",
  "channel": "whatsapp"  // or "sms" (default)
}
```

### Step 7: Test WhatsApp OTP

```bash
curl -X POST http://localhost:3001/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2126XXXXXXXX", "channel": "whatsapp"}'
```

## 🎨 Frontend Integration

Update your frontend to allow users to choose between SMS and WhatsApp:

```typescript
const [channel, setChannel] = useState<'sms' | 'whatsapp'>('whatsapp');

const requestOTP = async (phone: string) => {
  const response = await fetch('http://localhost:3001/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, channel })
  });
  return response.json();
};
```

UI Example:
```tsx
<div className="channel-selector">
  <button 
    onClick={() => setChannel('whatsapp')}
    className={channel === 'whatsapp' ? 'active' : ''}
  >
    📱 WhatsApp
  </button>
  <button 
    onClick={() => setChannel('sms')}
    className={channel === 'sms' ? 'active' : ''}
  >
    💬 SMS
  </button>
</div>
```

## 💰 Cost Comparison

| Region | SMS Cost | WhatsApp Cost | Savings |
|--------|----------|---------------|---------|
| Morocco | $0.05 | $0.01-0.02 | 60-80% |
| MENA | $0.03-0.10 | $0.01-0.03 | 50-70% |
| Global | $0.05-0.15 | $0.01-0.05 | 60-80% |

*Costs are approximate and vary by provider and volume.

## 🔒 Security Considerations

1. **Rate Limiting**: Same rate limits apply for WhatsApp
2. **Template Security**: Use approved templates only
3. **Business Verification**: Complete Facebook business verification
4. **Opt-in Required**: Users must opt-in to receive WhatsApp messages
5. **24-hour Window**: WhatsApp conversations have a 24-hour messaging window

## 📊 Analytics & Monitoring

Track delivery metrics:

```typescript
// In vonageWhatsApp.ts
async getDeliveryStatus(messageId: string) {
  try {
    const status = await this.messages.get(messageId);
    return {
      status: status.status,
      timestamp: status.timestamp,
    };
  } catch (error) {
    console.error('Status check error:', error);
    return null;
  }
}
```

Monitor:
- Delivery rate (target: >98%)
- Read rate (target: >90%)
- Response time (target: <5 seconds)
- Failure reasons
- User preferences (SMS vs WhatsApp)

## 🚀 Advanced Features (Future Enhancements)

### 1. Interactive OTP Buttons

Use WhatsApp Interactive Messages for one-tap verification:

```typescript
{
  message_type: 'custom',
  custom: {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: `Your verification code is: ${otp}`
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'verify',
              title: 'Verify Now'
            }
          }
        ]
      }
    }
  }
}
```

### 2. Webhook for Delivery Status

Set up webhook to receive delivery confirmations:

```typescript
// Add route in src/routes/webhook.ts
router.post('/vonage/status', (req, res) => {
  const { message_uuid, status, timestamp } = req.body;
  
  // Update delivery status in database
  console.log(`Message ${message_uuid}: ${status} at ${timestamp}`);
  
  res.status(200).send('OK');
});
```

### 3. Rich Media Support

Send images or PDFs alongside OTP:

```typescript
{
  message_type: 'image',
  image: {
    url: 'https://example.com/welcome-banner.jpg',
    caption: `Welcome! Your code: ${otp}`
  }
}
```

## 📖 Additional Resources

- [Vonage Messages API Docs](https://developer.vonage.com/messages/overview)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [Vonage WhatsApp Quick Start](https://developer.vonage.com/messages/concepts/whatsapp)

## 🐛 Troubleshooting

### Template not approved
- Ensure template follows WhatsApp policies
- Avoid promotional content in authentication templates
- Use clear, concise language
- Include opt-out instructions if required

### WhatsApp number not connected
- Verify number in Facebook Business Manager
- Check Vonage application configuration
- Ensure number is verified with WhatsApp Business API

### Messages not delivering
- Check WhatsApp opt-in status
- Verify user has WhatsApp installed
- Fall back to SMS if WhatsApp fails
- Monitor Vonage dashboard for errors

### High costs
- Negotiate volume discounts with Vonage
- Implement smart fallback (WhatsApp first, SMS if failed)
- Monitor usage patterns
- Consider user preference settings

## ✅ Migration Checklist

- [ ] Register WhatsApp Business account
- [ ] Complete business verification on Facebook
- [ ] Connect WhatsApp number to Vonage
- [ ] Create and approve OTP message template
- [ ] Install @vonage/messages package
- [ ] Implement WhatsApp sender utility
- [ ] Update OTP controller with channel support
- [ ] Add channel selection in frontend
- [ ] Test WhatsApp OTP flow end-to-end
- [ ] Set up delivery status webhooks
- [ ] Monitor delivery rates and costs
- [ ] Implement fallback to SMS
- [ ] Update user documentation
- [ ] Train support team on WhatsApp troubleshooting

## 🎯 Recommended Rollout Strategy

1. **Phase 2a: Test with internal users** (Week 1-2)
   - Limited rollout to team members
   - Verify template approval
   - Test delivery rates
   - Monitor costs

2. **Phase 2b: Beta with power users** (Week 3-4)
   - Invite 10-20% of active users
   - Collect feedback
   - Optimize template
   - Fine-tune fallback logic

3. **Phase 2c: Gradual rollout** (Month 2)
   - 25% → 50% → 75% → 100%
   - Monitor metrics at each stage
   - Keep SMS as fallback
   - A/B test SMS vs WhatsApp

4. **Phase 2d: Full deployment** (Month 3)
   - WhatsApp as default
   - SMS as fallback or user preference
   - Optimize costs
   - Measure user satisfaction

---

**Estimated Implementation Time**: 2-3 weeks (including template approval)

**Estimated Cost Savings**: 60-80% reduction in OTP delivery costs

**Expected User Satisfaction**: +15-20% improvement in delivery experience
