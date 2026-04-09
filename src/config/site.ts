export const SITE_CONFIG = {
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || '+48 503 420 551',
  phoneHref: process.env.NEXT_PUBLIC_PHONE_HREF || '+48503420551',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'kontakt@wilczechatki.pl',
  facebookUrl:
    process.env.NEXT_PUBLIC_FACEBOOK_URL ||
    'https://facebook.com/profile.php?id=61584455637648',
  bankAccountNumber:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT || '20 1020 5226 0000 6702 0486 0336',
} as const;
