import Ticket from '@/components/tickets';
import SafeAreaScrollableView from '@/components/safe-area-scrollable-view';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

  const mockBus = {
    id: busId as string,
    numberPlate: busNumber as string,
    from: from as string,
    to: to as string,
    departureTime: departureTime as string,
    estimatedTime: estimatedTime as string,
    price: price as string,
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