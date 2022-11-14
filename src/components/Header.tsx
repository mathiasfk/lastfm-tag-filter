type Props = {
    search: () => void,
    setMode: () => void,
    setUser: (user: string) => void,
    setTag: (tag: string) => void,
    loading: boolean,
    user: string,
    tag: string,
}


export default function Header({
    search, 
    setMode, 
    setUser,
    setTag,
    loading,
    user,
    tag,
}: Props){
    
    const keyUphandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter'){
            search();
        }
    }

    return (
    <header className="search">
        <h1>Last.fm Tag Filter</h1>
        <label htmlFor="user">User:</label>
        <input id="user" type="text" value={user} onChange={e => setUser(e.target.value)}></input>
        <label htmlFor="tag">Tag:</label>
        <input id="tag" type="text" value={tag} onChange={e => setTag(e.target.value)} onKeyUp={keyUphandler}></input>
        <button onClick={search} disabled={loading}>Search</button>
        <button onClick={setMode}>Toggle view</button>
    </header>
  )
}