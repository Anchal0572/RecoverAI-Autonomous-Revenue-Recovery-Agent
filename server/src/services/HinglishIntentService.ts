/**
 * HinglishIntentService — Phase 7 Optional Multilingual Intent Detection
 * Supports English, Hindi, and Hinglish (code-mixed) customer messages.
 *
 * Keyword-based classification — no external NLP dependency.
 * Non-blocking: failures return UNKNOWN intent gracefully.
 */

export type IntentType =
  | 'PAY_LATER'
  | 'CANCEL_PAYMENT'
  | 'RETRY_PAYMENT'
  | 'CHECK_STATUS'
  | 'NEED_HELP'
  | 'REFUND_REQUEST'
  | 'UNKNOWN';

export type LanguageType = 'english' | 'hindi' | 'hinglish';

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  language: LanguageType;
  originalMessage: string;
  matchedPatterns: string[];
}

interface PatternRule {
  intent: IntentType;
  patterns: string[];
  weight: number;
}

export class HinglishIntentService {
  private rules: PatternRule[];

  constructor() {
    this.rules = this.buildRules();
  }

  /**
   * Detect intent from user message
   */
  detect(message: string): IntentResult {
    try {
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return this.unknownResult(message || '');
      }

      const normalized = message.toLowerCase().trim();
      const language = this.detectLanguage(normalized);

      const scores: { intent: IntentType; score: number; patterns: string[] }[] = [];

      for (const rule of this.rules) {
        let score = 0;
        const matched: string[] = [];

        for (const pattern of rule.patterns) {
          if (normalized.includes(pattern.toLowerCase())) {
            score += rule.weight;
            matched.push(pattern);
          }
        }

        if (score > 0) {
          scores.push({ intent: rule.intent, score, patterns: matched });
        }
      }

      if (scores.length === 0) {
        return this.unknownResult(message);
      }

      scores.sort((a, b) => b.score - a.score);
      const best = scores[0];

      // Calculate confidence based on number of patterns matched and total score
      const maxPossibleScore = this.rules
        .filter(r => r.intent === best.intent)
        .reduce((sum, r) => sum + r.patterns.length * r.weight, 0);
      const confidence = Math.min(0.95, Math.max(0.3, best.score / Math.max(maxPossibleScore, 1)));

      return {
        intent: best.intent,
        confidence: Math.round(confidence * 100) / 100,
        language,
        originalMessage: message,
        matchedPatterns: best.patterns
      };
    } catch {
      return this.unknownResult(message);
    }
  }

  /**
   * Detect language of the message
   */
  private detectLanguage(text: string): LanguageType {
    const hindiChars = /[\u0900-\u097F]/;
    const hasHindi = hindiChars.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);

    // Check for romanized Hindi/Hinglish words
    const hinglishWords = [
      'nahi', 'abhi', 'baad', 'mein', 'karunga', 'karo', 'karna',
      'raha', 'rahi', 'ho', 'hai', 'hoga', 'karenge', 'chahiye',
      'paisa', 'paise', 'wapas', 'kyun', 'kyu', 'kab', 'kaise',
      'dekho', 'batao', 'bata', 'madad', 'karo', 'bhejo',
      'rupaiya', 'rupaye', 'paisaa', 'theek', 'thik', 'accha',
      'yaar', 'bhai', 'ji', 'haan', 'nahin', 'kyuki', 'isliye',
      'phir', 'dobara', 'wapis', 'ruk', 'ruko', 'aaj', 'kal'
    ];

    const words = text.split(/\s+/);
    const hinglishCount = words.filter(w => hinglishWords.includes(w)).length;

    if (hasHindi && hasEnglish) return 'hinglish';
    if (hasHindi) return 'hindi';
    if (hinglishCount >= 2 || (hinglishCount >= 1 && words.length <= 5)) return 'hinglish';
    return 'english';
  }

  private unknownResult(message: string): IntentResult {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      language: this.detectLanguage((message || '').toLowerCase()),
      originalMessage: message || '',
      matchedPatterns: []
    };
  }

  /**
   * Build pattern rules for all intents across languages
   */
  private buildRules(): PatternRule[] {
    return [
      // PAY_LATER — Customer wants to defer payment
      {
        intent: 'PAY_LATER',
        patterns: [
          'pay later', 'pay tomorrow', 'pay next week', 'pay after',
          'not now', 'later', 'will pay later', 'can i pay later',
          'defer', 'postpone', 'delay payment',
          // Hinglish
          'baad mein', 'baad me', 'kal karunga', 'kal karenge',
          'abhi nahi', 'abhi nahin', 'baad mein karunga',
          'phir karunga', 'agle hafte', 'next week karunga',
          // Hindi (romanized)
          'baad me karunga', 'kal karta hu', 'kal kar dunga',
          'kuch din baad'
        ],
        weight: 1
      },

      // CANCEL_PAYMENT — Customer wants to cancel
      {
        intent: 'CANCEL_PAYMENT',
        patterns: [
          'cancel', 'cancel payment', 'don\'t want', 'dont want',
          'stop payment', 'cancel order', 'cancel transaction',
          'no longer needed', 'remove', 'abort',
          // Hinglish
          'cancel karo', 'cancel kar do', 'band karo',
          'nahi chahiye', 'nahin chahiye', 'roko', 'rok do',
          'mat karo', 'hatao', 'hata do',
          'nahi karna', 'nahin karna'
        ],
        weight: 1
      },

      // RETRY_PAYMENT — Customer wants to try again
      {
        intent: 'RETRY_PAYMENT',
        patterns: [
          'retry', 'try again', 'attempt again', 'redo payment',
          'pay again', 'reprocess', 'charge again', 'debit again',
          // Hinglish
          'dobara karo', 'dobara', 'phir se karo', 'fir se', 'dubara',
          'phir try karo', 'ek baar aur', 'ek aur baar',
          'again karo', 'retry karo', 'wapas try'
        ],
        weight: 1
      },

      // CHECK_STATUS — Customer wants status update
      {
        intent: 'CHECK_STATUS',
        patterns: [
          'status', 'check status', 'payment status', 'where is',
          'what happened', 'update', 'tracking', 'progress',
          'is it done', 'processed',
          // Hinglish
          'kya hua', 'kya ho raha', 'status batao', 'bata do',
          'kahan tak', 'kab hoga', 'kab tak', 'kitna time',
          'ho gaya', 'ho gaya kya', 'hua kya'
        ],
        weight: 1
      },

      // NEED_HELP — Customer needs assistance
      {
        intent: 'NEED_HELP',
        patterns: [
          'help', 'assist', 'support', 'issue', 'problem',
          'facing issue', 'not working', 'error', 'failed',
          'unable to', 'can\'t pay', 'cannot pay',
          // Hinglish
          'madad', 'madad karo', 'help chahiye', 'dikkat',
          'problem ho rahi', 'nahi ho raha', 'kaam nahi kar raha',
          'error aa raha', 'fail ho gaya', 'ho nahi raha',
          'kuch gadbad', 'galti ho gayi'
        ],
        weight: 1
      },

      // REFUND_REQUEST — Customer wants refund
      {
        intent: 'REFUND_REQUEST',
        patterns: [
          'refund', 'money back', 'return money', 'get refund',
          'want refund', 'give refund', 'process refund',
          'charged twice', 'double charged', 'wrong amount',
          // Hinglish
          'paisa wapas', 'paise wapas', 'refund karo',
          'refund kar do', 'paisa laut do', 'rupaye wapas',
          'wapas karo', 'wapas chahiye', 'paise de do'
        ],
        weight: 1
      }
    ];
  }
}
