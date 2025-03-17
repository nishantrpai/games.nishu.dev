import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Game.module.css'
import { useState, useEffect } from 'react'
import { FiPlay, FiPause } from 'react-icons/fi'

const inter = Inter({ subsets: ['latin'] })

const OPEPEN_PATH = '/OPEPENS'
const INITIAL_MAX_TIME = 10 // Initial maximum time in seconds
const TIME_DECREASE_FACTOR = 0.99 // Factor to decrease time by with each score
const LEVEL_UP_SCORE = 10 // Score to level up
const INITIAL_GRID_SIZE = 2 // Initial grid size (2x2)
const TIME_INCREASE_FACTOR = 2.5 // Factor to increase time by with each grid size increase

export default function Home() {
  let tmpAllOpepens = ["1.avif","10.png","11.jpeg","12.avif","13.avif","14.png","15.png","17.jpg","18.webp","19.avif","2.svg","20.webp","21.webp","22.webp","23.jpg","23.webp","24.jpg","25.avif","26.jpg_large","27.jpg","28.avif","29.avif","3.png","30.avif","4.avif","5.avif","6.svg","7.png","8.jpg","9.png"];
  const [allOpepens, setAllOpepens] = useState(tmpAllOpepens.map(opepen => `${OPEPEN_PATH}/${opepen}`))
  const [gameState, setGameState] = useState({
    fixedOpepenSet: [],
    timer: INITIAL_MAX_TIME,
    isComplete: false,
    score: 0,
    maxTime: INITIAL_MAX_TIME,
    gridSize: INITIAL_GRID_SIZE
  })
  const [moveableOpepens, setMoveableOpepens] = useState([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gamePaused, setGamePaused] = useState(false)
  const [squishyIndex, setSquishyIndex] = useState(null)
  const [cameraShake, setCameraShake] = useState(false)
  const [winEffect, setWinEffect] = useState(false)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    const storedHighScore = typeof window !== 'undefined' ? localStorage.getItem('highScore') || 0 : 0;
    setHighScore(storedHighScore);
  }, []);

  function startNewGame(gridSize) {
    const shuffled = [...allOpepens].sort(() => 0.5 - Math.random())
    const selectedOpepens = shuffled.slice(0, gridSize ** 2)
    console.log(selectedOpepens, 'selectedOpepens');
    setGameState(prev => ({
      fixedOpepenSet: selectedOpepens,
      timer: prev.maxTime,
      isComplete: false,
      score: prev.score,
      maxTime: prev.maxTime,
      gridSize: gridSize
    }))
    setMoveableOpepens([...selectedOpepens])
  }

  useEffect(() => {
    let interval
    if (gameStarted && !gamePaused && !gameState.isComplete && gameState.timer > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timer: Math.max(prev.timer - 0.1, 0),
          isComplete: prev.timer <= 0
        }))
      }, 100)
    } else if (gameState.timer <= 0) {
      setCameraShake(true)
      setTimeout(() => {
        setCameraShake(false)
        setGameState(prev => ({
          ...prev,
          score: 0,
          maxTime: INITIAL_MAX_TIME,
          gridSize: INITIAL_GRID_SIZE
        }))
        startNewGame(INITIAL_GRID_SIZE)
      }, 500)
    }
    return () => clearInterval(interval)
  }, [gameState.isComplete, gameState.timer, allOpepens, gameStarted, gamePaused])

  function handleOpepenClick(index) {
    if (index === 0 || gamePaused) return;

    setSquishyIndex(index)
    setTimeout(() => setSquishyIndex(null), 50)

    const newMoveableOpepens = [...moveableOpepens];
    const currentIndex = gameState.fixedOpepenSet.indexOf(newMoveableOpepens[index]);
    const nextIndex = (currentIndex + 1) % (gameState.gridSize ** 2);
    newMoveableOpepens[index] = gameState.fixedOpepenSet[nextIndex];

    setMoveableOpepens(newMoveableOpepens);

    let isComplete = newMoveableOpepens.every(opepen => opepen === newMoveableOpepens[0]);

    if (isComplete) {
      setWinEffect(true)
      setTimeout(() => {
        setWinEffect(false)
        setGameState(prevState => {
          const newScore = prevState.score + 1;
          const newGridSize = Math.floor(newScore / LEVEL_UP_SCORE) + INITIAL_GRID_SIZE;
          const newMaxTime = prevState.maxTime * TIME_DECREASE_FACTOR * (newGridSize > prevState.gridSize ? TIME_INCREASE_FACTOR : 1);
          return {
            ...prevState,
            score: newScore,
            isComplete: true,
            maxTime: newMaxTime,
            timer: newMaxTime,
            gridSize: newGridSize
          };
        })
        if (gameState.score + 1 > highScore) {
          setHighScore(gameState.score + 1)
          typeof window !== 'undefined' && localStorage.setItem('highScore', gameState.score + 1)
        }
        startNewGame(Math.floor((gameState.score + 1) / LEVEL_UP_SCORE) + INITIAL_GRID_SIZE)
      }, 1000)
    }
  }

  const getObjectTransform = (index) => {
    const gridSize = gameState.gridSize;
    console.log(gridSize, 'gridSize')
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    let division = Math.floor(100/gridSize);
    console.log(col, row, 'col, row', `translate(${-division*(col-1)}%, ${-division*(row-1)}%)`)
    return `translate(${-division*(col)}%, ${-division*(row)}%)`;
  }

  const handleStartGame = () => {
    setGameStarted(true)
    setGamePaused(false)
    startNewGame(INITIAL_GRID_SIZE)
  }

  const handlePauseGame = () => {
    setGamePaused(!gamePaused)
  }

  return (
    <>
      <Head>
        <title>Opepen Matching Game</title>
        <meta name="description" content="Match the Opepen images" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.description} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1>Opepen Matching Game</h1>
          <p style={{ border: 'none' }}>To win, match all the Opepens to the first Opepen.</p>
        </div>
        {!gameStarted ? (
          <div className={styles.center} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', marginTop: 20, padding: '40px' }}>
            <button onClick={handleStartGame} style={{ cursor: 'pointer', fontSize: 40, padding: 20, backgroundColor: 'transparent', color: 'white', fontWeight: 900, border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiPlay />
            </button>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              marginTop: '10px'
            }}>
              HIGHSCORE: {highScore}
            </div>
          </div>
        ) : (
          <div
            className={styles.center}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.75)',
              marginTop: 20,
              position: 'relative',
              animation: cameraShake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : winEffect ? 'pulse 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none'
            }}
          >
            <style jsx>{`
              @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
              }
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
              }
            `}</style>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '10px'
              }}>
                {gameState.score}
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: '#333',
                transition: 'width 0.1s linear'
              }}>
                <div style={{
                  width: `${(gameState.timer / gameState.maxTime) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(to right, #333, #888)',
                  transition: 'width 0.1s linear',
                }} />
              </div>
            </div>
            <button
              onClick={handlePauseGame}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                cursor: 'pointer',
                fontSize: 24,
                padding: 10,
                backgroundColor: 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: 5
              }}
            >
              {gamePaused ? <FiPlay /> : <FiPause />}
            </button>
            {gameState.fixedOpepenSet.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${gameState.gridSize}, 1fr)`, 
                gridTemplateRows: `repeat(${gameState.gridSize}, 1fr)`, 
                gap: '1px', 
                marginTop: '70px' 
              }}>
                {moveableOpepens.map((opepen, index) => (
                  <div key={index} style={{ width: 500 / gameState.gridSize, height: 500 / gameState.gridSize, overflow: 'hidden' }}>
                    <img
                      src={opepen}
                      alt={`Moveable Opepen ${index}`}
                      width={500} 
                      height={500}
                      onClick={() => handleOpepenClick(index)}
                      style={{
                        cursor: index === 0 || gamePaused ? 'default' : 'pointer',
                        border: index === 0 ? '1px solid #888' : 'none',
                        transform: `${getObjectTransform(index)} ${squishyIndex === index ? 'scaleX(0.95) scaleY(1.04)' : 'scale(1)'}`,
                        transition: 'transform 1ms ease-in-out',
                      }}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}