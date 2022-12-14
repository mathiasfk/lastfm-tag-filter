import { useState } from 'react';
import './App.css';
import Loader from './components/Loader';
import Header from './components/Header';
import Table from './components/Table';
import PlaycountBar from './components/PlaycountBar';

const API_KEY = "31ba5b46e9e1e977ff751412f7088504";
const LIMIT = 500;
const RATE_LIMIT_MAX_DELAY_MS = 5000;
const MIN_CONFIABILITY = 5;
const TOP_TAGS_FILTER = 10;
const TOP_TAGS_SHOW = 5;
const TOP_ARTISTS_SHOW = 10;
const BLACKLISTED_TAGS = ['seen live'];


const getTags = async (mbid: string, name: string) => {
  await new Promise(f => setTimeout(f, Math.random() * RATE_LIMIT_MAX_DELAY_MS));

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
    return data.toptags.tag.filter((tag: any) => !BLACKLISTED_TAGS.includes(tag.name)).slice(0, TOP_TAGS_FILTER)
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
  const [loading, setLoading] = useState(false);

  const search = async (searchedTag: string, user: string) => {
    setLoading(true)
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
    .catch(error => console.error(error))
  
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
    setLoading(false);
  }

  const maxArtitsPlaycount = artists.length ? Math.max(...artists.map(artist => artist.playcount)) : 0;
  const maxTagPlaycount = topTags.length ? Math.max(...topTags.map(tag => tag.playcount)) : 0;

  const artistsTableData = artists.map(
    (artist: any) => [
      artist.name, 
      <PlaycountBar playcount={artist.playcount} maxPlaycount={maxArtitsPlaycount}></PlaycountBar>,
      artist.tags.slice(0,TOP_TAGS_SHOW).map((tag: { name: string; }) => tag.name).join(", ")
    ]
  );

  const tagsTableData = topTags.map(
    (tag: any) => [
      tag.name, 
      <PlaycountBar playcount={tag.playcount} maxPlaycount={maxTagPlaycount}></PlaycountBar>,
      Array.from(tag.artists).slice(0,TOP_ARTISTS_SHOW).join(", ")
    ]
  );

  return (
    <div className="App">
      <Header 
        user={user}
        setUser={setUser}
        tag={tag}
        setTag={setTag}
        loading={loading}
        search={() => search(tag, user)}
        setMode={() => setMode(mode === 'artists' ? 'tags' : 'artists')} 
      />
      <div className="results">
        {
          loading ? 
          <Loader />
          :
          artists.length === 0 ? 
          <h2>No results found</h2>
          :
          mode === 'artists' ? 
          <>
            <h2>Artists</h2>
            <p><em>Ordered by playcount</em></p>
            <Table
              headers={['Name', 'Playcount', 'Top Tags']}
              values={artistsTableData}
            />
          </>
          :
          <>
            <h2>Tags</h2>
            <p><em>Ordered by relevance</em></p>
            <Table
              headers={['Tag', 'Playcount', 'Artists']}
              values={tagsTableData}
            />
          </>
        }
      </div>
    </div>
  );
}

export default App;
