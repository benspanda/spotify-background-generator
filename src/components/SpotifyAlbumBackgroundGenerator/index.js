import React, { Component } from 'react';
import _ from 'underscore';

import domtoimage from 'dom-to-image';
import Loader from 'react-loaders'
import queryString from 'query-string';
import $ from 'jquery';

import Checkbox from 'rc-checkbox';

import 'rc-checkbox/assets/index.css';

export default class SpotifyAlbumBackgroundGenerator extends Component {

  constructor(props) {
    super(props);

    // get code from spotify link
    var query = queryString.parse(window.location.hash);

    this.state = {backgroundImage: null, images: [], access_token: query.access_token, artists: true, albums: true, error: false, errorRedirect: false};

    this.includeArtists = true;
    this.includeAlbums = true;

    this.makeSpotifyBackgroundImage = this.makeSpotifyBackgroundImage.bind(this);
    this.getArtists = this.getArtists.bind(this);
    this.getTracks = this.getTracks.bind(this);
    this.getArtistsAndTracks = this.getArtistsAndTracks.bind(this);
    this.getImages = this.getImages.bind(this);
  }

  getArtists() {
    var params = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + this.state.access_token
      }
    }
    return fetch('https://api.spotify.com/v1/me/top/artists?limit=50', params).then((result) => result.json());
  }

  getTracks() {
    var params = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + this.state.access_token
      }
    }
    return fetch('https://api.spotify.com/v1/me/top/tracks?limit=50', params).then((result) => result.json());
  }

  getArtistsAndTracks() {
    return Promise.all([this.getArtists(), this.getTracks()]);
  }

  getImages() {
    this.setState({
      backgroundImage: 'loading'
    });

    var withArtists = $('.spotify-toggle-artists input').is(':checked');
    var withAlbums = $('.spotify-toggle-albums input').is(':checked');

    var images = [];
    if(withArtists && withAlbums) {
      this.getArtistsAndTracks()
      .then(([artists, tracks]) => {
        // both have loaded!
        if(artists.error) {
          this.setState({
            'access_token': null,
            'backgroundImage': null,
            'error': 'There was an error connecting to Spotify. Please try connecting your account again.',
          });

          return;
        }
        images = _.union(this.formatArtistImages(artists), this.formatTrackImages(tracks));
        this.makeSpotifyBackgroundImage(images);
      })
    } else if(withArtists) {
      this.getArtists()
      .then((artists) => {
        // loaded!
        images = _.uniq(this.formatArtistImages(artists));
        this.makeSpotifyBackgroundImage(images);
      })
    } else {
      this.getTracks()
      .then((tracks) => {
        // loaded!
        images = _.uniq(this.formatTrackImages(tracks));
        this.makeSpotifyBackgroundImage(images);
      })
    }
  }

  formatArtistImages(artists) {
    var images = [];
    for(var i = 0; i < artists.items.length; i++) {
      images.push(artists.items[i].images[0].url);
    }
    return images;
  }

  formatTrackImages(tracks) {
    var images = [];
    for(var i = 0; i < tracks.items.length; i++) {
      images.push(tracks.items[i].album.images[0].url);
    }
    return images;
  }

  makeSpotifyBackgroundImage(image_urls) {

        if(image_urls.length === 0) {
          this.setState({
            'backgroundImage': null,
            'error': 'Spotify returned 0 results for your selection. Better start listening to some more music.',
          });

          return;
        }
         image_urls = _.shuffle(image_urls);

         var images = [];
         var image_set = [];
         var image_index = 0;
         for(var i = 0; i < 20; i++) {
           if(image_index >= image_urls.length) {
             image_index = 0;
           }
           if(image_set.length === 4) {
             images.push(<div key={image_index} className="spotify-four-image-group" style={{order: images.length + 2}}>{image_set}</div>);
             image_set = [];
           }
           image_set.push(<div key={image_index} style={{backgroundImage: 'url(' + image_urls[image_index] + ')'}}></div>);
           image_index++;
         }

         images.push(<div key={image_index+5} className="spotify-large-image" style={{order: 1}}><div style={{backgroundImage: 'url(' + image_urls[image_urls.length-2] + ')'}}></div></div>);
         images.push(<div key={image_index+10} className="spotify-large-image" style={{order: 6}}><div style={{backgroundImage: 'url(' + image_urls[image_urls.length-1] + ')'}}></div></div>);

         this.setState({
           images: images
         });

         var node = document.getElementById('spotifyBackgroundWrapper');

         var _this = this;

         domtoimage.toPng(node)
         .then(function (dataUrl) {
             _this.setState({
               backgroundImage: dataUrl
             });
         })
         .catch(function (error) {
             console.error('oops, something went wrong!', error);
         });

         return;
  }

  render() {
    return (
      <div className="wrapper sbg-wrapper">
        {this.state.error &&
          <p className="error-message"><i className="fa fa-warning"></i> {this.state.error}</p>
        }
        {!this.state.access_token &&
          <a className="link-spotify-button" href="https://accounts.spotify.com/authorize/?client_id=34320fc38715493192bf156081d3f6ae&response_type=token&redirect_uri=http://localhost:3000/trinkets/favourite-spotify-albums-background-generator&scope=user-top-read&state=34fFs29kd09"><i className="fa fa-spotify"></i> <span>Link Spotify</span></a>
        }
        {this.state.access_token &&
          <div className="spotify-background-options">
            <button className="spotify-make-background-trigger" onClick={this.getImages}>Generate Background</button>
            <label>
              <Checkbox defaultChecked className="spotify-toggle-artists"/>
              Artists
            </label>
            <label>
              <Checkbox defaultChecked className="spotify-toggle-albums"/>
              Albums
            </label>
          </div>
        }

        {this.state.backgroundImage === "loading" &&
          <Loader type="ball-pulse-sync" color="#9e9e9e" className="spotify-background-loader" />
        }

        {this.state.backgroundImage !== "loading" && this.state.backgroundImage &&
          <div>
            <h2 className="section-title">RESULT</h2>
            <div className="spotify-background-preview wrapper">
              <img alt="Generated spotify background component" src={this.state.backgroundImage} className="spotify-background-image"/>
            </div>
          </div>
        }

        <div style={{height:0, width: 0, overflow: "hidden"}}>
          <div className="spotify-background-wrapper" id="spotifyBackgroundWrapper">{this.state.images}</div>
        </div>
      </div>
    );
  }
}
