import ListHamburger from '@/components/list-hamburger';
import ContactMap from '@/components/map';
import SafeAreaScrollableView from '@/components/safe-area-scrollable-view';

const List = () => {
  return (
    <SafeAreaScrollableView>
      < ListHamburger/>
      <ContactMap/>
    </SafeAreaScrollableView>
  );
};

export default List;
