import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { rimraf } from 'rimraf';
import { getPlaiceholder } from 'plaiceholder';
import { getColor, getPalette } from 'colorthief';

// reset/intialize directories
async function resetDirectories() {
  const playlistDataDir = path.join(path.resolve(), 'src', 'content', 'playlists');
  const playlistCoversDir = path.join(path.resolve(), 'public', 'images', 'covers');
  // remove directories
  await rimraf(playlistDataDir);
  await rimraf(playlistCoversDir);
  // create directories
  await fs.promises.mkdir(playlistDataDir, { recursive: true });
  await fs.promises.mkdir(playlistCoversDir, { recursive: true });
}

// store playlist cover locally
async function storePlaylistCover(url, playlistId) {
  try {
    // create buffer from remote file
    const buffer = await fetch(url).then(async (res) => {
      if (!res.ok) throw new Error(`Ran into an error fetching ${url}.`);
      return Buffer.from(await res.arrayBuffer());
    });
    // get extra image data from plaiceholder
    const { css, color, metadata } = await getPlaiceholder(buffer);
    // write buffer to file
    const imagePath = path.join(path.resolve(), 'public', 'images', 'covers', `${playlistId}.${metadata.format}`);
    await fs.promises.writeFile(imagePath, buffer, (error) => { if (error) throw error; });
    // extract image colors
    const primaryColor = await getColor(imagePath);
    const colorPalette = await getPalette(imagePath);
    // return image data
    return {src: `./images/covers/${playlistId}.${metadata.format}`, metadata, placeholder: {css}, colors: {primary: primaryColor, palette: colorPalette}};
  } catch (error) {
    throw error;
  }
}

// fetch spotify access token from worker
async function getAccessToken() {
  return await fetch(process.env.SPOTIFY_TOKEN_URL)
  .then(response => response.json())
  .then(({token}) => {
    return token;
  })
  .catch(error => { throw error; });
}

// fetch all (paginated) data from spotify api
async function getSpotifyData(queryUrl, spotifyData = []) {
  return await fetch(queryUrl, {
    method: 'GET',
    headers: new Headers({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
  })
  .then(response => response.json())
  .then(data => {
    spotifyData = spotifyData.concat(data.items);
    return data.next ? getSpotifyData(data.next, spotifyData) : spotifyData;
  })
  .catch(error => { throw error });
}

// fetch oEmbed data from spotify api
async function getSpotifyOembedData(playlistUrl) {
  return await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(playlistUrl)}`, {
    method: 'GET',
    headers: new Headers({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }),
  })
  .then(response => response.json())
  .then(data => {
    return data;
  })
  .catch(error => { throw error });
}

// handle playlist processing
async function processPlaylists(playlists) {
  for (const playlist of playlists) {
    // store plalist cover locally
    const coverImageData = await storePlaylistCover(playlist.images[0].url, playlist.id);
    // get oEmbed data from api to store with playlist data
    const oembedData = await getSpotifyOembedData(playlist.external_urls.spotify);
    // regex for parsing release info from playlist name
    const nameRegex = playlist.name.match(/(TSL|BDP|BPD)(\d+)(?:.*?(\d{4}-\d{1,2}-\d{1,2}))?/);
    // set up playlist data to be stored locally
    let playlistData = {
      id: playlist.id,
      release: {
        name: nameRegex[1].replace('BPD', 'BDP'), // some playlist names have typos
        number: nameRegex[2],
        date: nameRegex[3]
      },
      name: playlist.name.replace('BPD', 'BDP'), // some playlist names have typos
      description: playlist.description,
      url: playlist.external_urls.spotify,
      uri: playlist.uri,
      image: {
        src: coverImageData.src,
        metadata: coverImageData.metadata,
        placeholder: coverImageData.placeholder,
        colors: coverImageData.colors
      },
      owner: playlist.owner,
      oembed: oembedData,
    }
    // write file to astro content collection
    const dataFilePath = path.join(path.resolve(), 'src', 'content', 'playlists', `${playlist.id}.json`);
    fs.writeFile(dataFilePath, JSON.stringify(playlistData), (error) => { if (error) throw error; });
  }
}

// get spotify access token
console.log('getting access token...');
const accessToken = await getAccessToken();
// reset directories
console.log('resetting directories...');
resetDirectories();
// get all playlists from spotify
console.log('pulling playlist data...');
const playlists = await getSpotifyData(`${process.env.SPOTIFY_PLAYLIST_URL}?limit=50`);
// process all playlists
console.log('processing playlists...');
processPlaylists(playlists);
