import { Image, StyleSheet, Platform } from 'react-native';
import * as React from 'react';
import { Searchbar } from 'react-native-paper';

import ParallaxScrollView from '@/components/ParallaxScrollView';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (

<Searchbar
placeholder="Search"
onChangeText={setSearchQuery}
value={searchQuery}
style={{  paddingTop: 60 }} // Added paddingTop here
/>

  );
}


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
