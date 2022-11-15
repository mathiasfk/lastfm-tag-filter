import './PlaycountBar.css';

type Props = {
    playcount: number,
    maxPlaycount: number,
}

export default function PlaycountBar({playcount, maxPlaycount} : Props){
    const percentage = `${playcount / maxPlaycount * 100}%`;
    return (
        <span className='chartlist-count-bar'>
            <span className='chartlist-count-bar-slug' style={{width: percentage}}></span>
            <span className='chartlist-count-bar-value'>{playcount}</span>
        </span>
    )
}