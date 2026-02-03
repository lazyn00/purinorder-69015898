import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook để capture referral code từ URL ở bất kỳ trang nào
 * Lưu vào localStorage với timestamp để theo dõi affiliate orders
 */
export function useReferralCapture() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Lưu referral code vào localStorage
      localStorage.setItem('purin_referral_code', refCode);
      localStorage.setItem('purin_referral_timestamp', Date.now().toString());
      console.log('Referral code captured:', refCode);
    }
  }, [searchParams]);
}
