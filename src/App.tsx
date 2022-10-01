import { useState } from 'react';
import './App.css';

const API_KEY = "31ba5b46e9e1e977ff751412f7088504";
const LIMIT = 1000;
const RATE_LIMIT_MS = 100;
const MIN_CONFIABILITY = 5;
const TOP_TAGS_FILTER = 10;
const TOP_TAGS_SHOW = 5;
const TOP_ARTISTS_SHOW = 10;



const getTags = async (mbid: string, name: string) => {
  await new Promise(f => setTimeout(f, RATE_LIMIT_MS));

  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(name).replace('%20','+')}&api_key=31ba5b46e9e1e977ff751412f7088504&format=json&limit=10`;
  const topTags = await fetch(url)
  .then(res => {
    if(res.ok){
      return res.json();
    }
    throw res;
  })
  .then(data => {
    if(!data.toptags || !data.toptags.tag)
      throw data;
    return data.toptags.tag.slice(0, TOP_TAGS_FILTER)
  })
  .catch(error => console.error(mbid, name, url, error))

  return topTags;
}

const sumPlaycountByTag = (artistsWithTags: any[]) => {
  const playCountByTag = artistsWithTags.reduce((result, artist) => {
    
    artist.tags.forEach((tag: any) => {
      if(!result[tag.name]){
        result[tag.name] = {};
        result[tag.name].weightedPlaycount = 0;
        result[tag.name].playcount = 0;
        result[tag.name].artists = new Set();
      }
      result[tag.name].weightedPlaycount += Math.round(parseInt(artist.playcount) * tag.count/100);
      result[tag.name].playcount += parseInt(artist.playcount);
      result[tag.name].artists.add(artist.name);
    });
    return result;
  }, {});

  const tagArray = Object.keys(playCountByTag).map(tag => ({
    name: tag, 
    weightedPlaycount: playCountByTag[tag].weightedPlaycount,
    playcount: playCountByTag[tag].playcount,
    artists: playCountByTag[tag].artists,
  }));
  return tagArray.sort((a, b) => b.weightedPlaycount - a.weightedPlaycount);
}

function App() {
  const [user, setUser] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [artists, setArtists] = useState<any[]>([]);
  const [topTags, setTopTags] = useState<any[]>([]);
  const [mode, setMode] = useState<'artists'|'tags'>('artists');

  const search = async (searchedTag: string, user: string) => {
    const data = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${user}&api_key=${API_KEY}&format=json&limit=${LIMIT}`)
    .then(res => {
      if(res.ok){
        return res.json()
      }
      throw res
    })
    .then(data => {
      if(!data.topartists || ! data.topartists.artist)
        throw data;
      return data.topartists.artist
    })
    .catch(error => console.error(error));
  
    const artistsWithTags = await Promise.all(data.map(
      async (artist:any) => ({
        ...artist,
        tags: await getTags(artist.mbid, artist.name)
      })
    ));
  
    const filteredByTag = artistsWithTags.filter(
      (artist: any) => {
        const matches = artist.tags.slice(0,TOP_TAGS_FILTER).filter(
          (tag:any) => tag.name.toLowerCase() === searchedTag.toLowerCase() && tag.count >= MIN_CONFIABILITY)
        return matches.length > 0;
      }
    )

    setArtists(filteredByTag);
    setTopTags(sumPlaycountByTag(filteredByTag));
  }

  return (
    <div className="App">
      <header className="search">
        <h1>Last.fm Tag Filter</h1>
        <label htmlFor="user">User:</label>
        <input id="user" type="text" value={user} onChange={e => setUser(e.target.value)}></input>
        <label htmlFor="tag">Tag:</label>
        <input id="tag" type="text" value={tag} onChange={e => setTag(e.target.value)}></input>
        <button onClick={() => search(tag, user)}>Search</button>
        <button onClick={() => setMode(mode === 'artists' ? 'tags' : 'artists')}>Toggle view</button>
      </header>
      <div className="results">
        {
        artists.length === 0 ? 
        <h2>No results found</h2> :
        mode === 'artists' ? 
        <>
          <h2>Artists</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Playcount</th>
                <th>Top Tags</th>
              </tr>
            </thead>
            <tbody>
              {artists.map((artist: any) => (
              <tr key={artist.name}>
                <td>{artist.name}</td>
                <td>{artist.playcount}</td>
                <td>{artist.tags.slice(0,TOP_TAGS_SHOW).map((tag: { name: string; }) => tag.name).join(", ")}</td>
              </tr>))}
            </tbody>
          </table>
        </>
        :
        <>
          <h2>Tags</h2>
          <table>
            <thead>
              <tr>
                <th>Tag</th>
                <th>Weighted Playcount</th>
                <th>Playcount</th>
                <th>Artists</th>
              </tr>
            </thead>
            <tbody>
              {topTags.map((tag: any) => (
              <tr key={tag.name}>
                <td>{tag.name}</td>
                <td>{tag.weightedPlaycount}</td>
                <td>{tag.playcount}</td>
                <td>{Array.from(tag.artists).slice(0,TOP_ARTISTS_SHOW).join(", ")}</td>
              </tr>))}
            </tbody>
          </table>
        </>
        }
      </div>
    </div>
  );
}

export default App;
