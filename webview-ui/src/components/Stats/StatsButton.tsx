interface DailyStats {
  date: string
  keystrokes: number
  lines: number
  commits: number
  xpGained: number
}


interface StatsProps {
    history: DailyStats[]
    onClose: () => void 
}


export default function Stats({history, onClose}: StatsProps){
    
    return(
        <div onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose}>
                    x
                </button>
                <h2>Your Stats</h2>
                {history.length === 0 ? (
                    <p>No Stats Yet! Start coding!</p>
                ) : (
                    history.map((day) => (
                        <div key={day.date}>
                            <p>{day.date}</p>
                            <p>Keystrokes: {day.keystrokes}</p>
                            <p>Lines: {day.lines}</p>
                            <p>Commits: {day.commits}</p>
                            <p>XP Gained: {day.xpGained}</p>
                        </div>
                    ))
                )} 
            </div>
        </div>
    );
}