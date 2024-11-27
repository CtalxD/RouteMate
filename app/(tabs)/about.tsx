import * as React from 'react';
import { Searchbar } from 'react-native-paper';


export default function About(){
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

