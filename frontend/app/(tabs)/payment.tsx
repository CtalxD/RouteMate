import Ticket from '@/components/tickets';
import SafeAreaScrollableView from '@/components/safe-area-scrollable-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

const Payment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { 
    busId,
    busNumber,
    from,
    to,
    departureTime,
    estimatedTime,
    price,
  } = params;

  // Calculate valid from (current date/time) and valid to (end of day)
  const [validityDates, setValidityDates] = useState({
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    // Set up validity dates when component mounts
    const now = new Date();
    const validFrom = now.toISOString();
    
    // Set validTo to end of the same day (23:59:59.999)
    const validTo = new Date(now);
    validTo.setHours(23, 59, 59, 999);
    
    setValidityDates({
      validFrom: validFrom,
      validTo: validTo.toISOString()
    });
  }, []);

  const mockBus = {
    id: busId as string,
    numberPlate: busNumber as string,
    from: from as string,
    to: to as string,
    departureTime: departureTime as string,
    estimatedTime: estimatedTime as string,
    price: price as string,
    // Add validity dates to the bus object
    validFrom: validityDates.validFrom,
    validTo: validityDates.validTo
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaScrollableView>
      <Ticket 
        bus={mockBus}
        onBack={handleBack}
      />
    </SafeAreaScrollableView>
  );
};

export default Payment;