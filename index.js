import 'react-native-get-random-values'; // Needs to be imported at the top
import 'react-native-gesture-handler'; // Needs to be imported at the top
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
