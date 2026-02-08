import { Vonage } from '@vonage/server-sdk';
import { config } from '../config/index.js';

class VonageSMSService {
  private vonage: Vonage;

  constructor() {
    this.vonage = new Vonage({
      apiKey: config.vonage.apiKey,
      apiSecret: config.vonage.apiSecret,
    });
  }

  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!config.vonage.apiKey || !config.vonage.apiSecret) {
        throw new Error('Vonage credentials not configured');
      }

      const from = 'TopAffaire';
      const text = `Your TopAffaireImmo verification code is: ${otp}. Valid for ${config.otp.ttlMinutes} minutes. Do not share this code.`;

      const response = await this.vonage.sms.send({
        to: phone,
        from,
        text,
      });

      if (response.messages && response.messages[0].status === '0') {
        return {
          success: true,
          messageId: response.messages[0]['message-id'],
        };
      } else {
        return {
          success: false,
          error: response.messages?.[0]['error-text'] || 'Failed to send SMS',
        };
      }
    } catch (error: any) {
      console.error('Vonage SMS error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }
}

export const vonageSMS = new VonageSMSService();
