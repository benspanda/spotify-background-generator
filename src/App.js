import React, { Component } from 'react';
import './App.css';
import 'loaders.css/loaders.min.css'

import SpotifyAlbumBackgroundGenerator from './components/SpotifyAlbumBackgroundGenerator'

class App extends Component {
  render() {
    return (
      <SpotifyAlbumBackgroundGenerator/>
    );
  }
}

export default App;
