import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Game.module.css'
import { useState, useEffect, useRef } from 'react'
import { FiPlay } from 'react-icons/fi'

const inter = Inter({ subsets: ['latin'] })

export default function SurvivorGame() {
  const canvasRef = useRef(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isStartAnimation, setIsStartAnimation] = useState(false)
  const [cameraShake, setCameraShake] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [newHighScore, setNewHighScore] = useState(false)
  const gameRef = useRef({
    player: {
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      speed: 5,
      collisionRadius: 15
    },
    missiles: [], // Will store active missiles
    warningMissiles: [], // Will store warnings before missile drops
    background: {
      stars: [],
      starSpeed: 2 // Speed at which stars move
    },
    animationFrame: null,
    touchState: {
      isLeftTouching: false,
      isRightTouching: false,
      isUpTouching: false,
      isDownTouching: false,
      leftDuration: 0,
      rightDuration: 0,
      upDuration: 0,
      downDuration: 0
    },
    difficulty: {
      missileFrequency: 40, // Reduced from 80 to spawn more missiles
      missileWarningTime: 50, // frames to show warning
      missileSpeed: 6,
      missileSize: 12,
      missileBaseCount: 3 // Base number of missiles to spawn
    },
    frameCount: 0
  })

  useEffect(() => {
    const storedHighScore = typeof window !== 'undefined' ? parseInt(localStorage.getItem('survivorHighScore') || '0') : 0
    setHighScore(storedHighScore)
  }, [])

  // Handle keyboard and touch controls
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (!gameStarted) return
      
      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY
      const canvas = canvasRef.current
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2
      
      // Detect which quadrant was touched
      if (touchX < centerX && touchY < centerY) {
        // Upper left - move left
        gameRef.current.touchState.isLeftTouching = true
        gameRef.current.touchState.leftDuration = 0
      } else if (touchX >= centerX && touchY < centerY) {
        // Upper right - move up
        gameRef.current.touchState.isUpTouching = true
        gameRef.current.touchState.upDuration = 0
      } else if (touchX < centerX && touchY >= centerY) {
        // Lower left - move down
        gameRef.current.touchState.isDownTouching = true
        gameRef.current.touchState.downDuration = 0
      } else {
        // Lower right - move right
        gameRef.current.touchState.isRightTouching = true
        gameRef.current.touchState.rightDuration = 0
      }
    }
    
    const handleTouchEnd = (e) => {
      if (!gameStarted) return
      
      // Reset all touch states if no touches left
      if (e.touches.length === 0) {
        gameRef.current.touchState.isLeftTouching = false
        gameRef.current.touchState.isRightTouching = false
        gameRef.current.touchState.isUpTouching = false
        gameRef.current.touchState.isDownTouching = false
        gameRef.current.touchState.leftDuration = 0
        gameRef.current.touchState.rightDuration = 0
        gameRef.current.touchState.upDuration = 0
        gameRef.current.touchState.downDuration = 0
      }
    }

    const handleKeyDown = (e) => {
      if (!gameStarted) return
      
      if (e.key === 'ArrowLeft') {
        gameRef.current.touchState.isLeftTouching = true
      } else if (e.key === 'ArrowRight') {
        gameRef.current.touchState.isRightTouching = true
      } else if (e.key === 'ArrowUp') {
        gameRef.current.touchState.isUpTouching = true
      } else if (e.key === 'ArrowDown') {
        gameRef.current.touchState.isDownTouching = true
      }
    }
    
    const handleKeyUp = (e) => {
      if (!gameStarted) return
      
      if (e.key === 'ArrowLeft') {
        gameRef.current.touchState.isLeftTouching = false
        gameRef.current.touchState.leftDuration = 0
      } else if (e.key === 'ArrowRight') {
        gameRef.current.touchState.isRightTouching = false
        gameRef.current.touchState.rightDuration = 0
      } else if (e.key === 'ArrowUp') {
        gameRef.current.touchState.isUpTouching = false
        gameRef.current.touchState.upDuration = 0
      } else if (e.key === 'ArrowDown') {
        gameRef.current.touchState.isDownTouching = false
        gameRef.current.touchState.downDuration = 0
      }
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStarted])

  // Init the canvas and setup game
  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas to full width and nice height
    canvas.width = Math.min(window.innerWidth, 500)
    canvas.height = window.innerHeight * 0.8
    
    // Center player horizontally and vertically
    gameRef.current.player.x = canvas.width / 2 - gameRef.current.player.width / 2
    gameRef.current.player.y = canvas.height / 2 - gameRef.current.player.height / 2
    
    // Generate initial stars
    generateStars()
    
    function generateStars() {
      gameRef.current.background.stars = []
      const numStars = Math.floor(canvas.width * canvas.height / 800) // Increased star count
      
      for (let i = 0; i < numStars; i++) {
        gameRef.current.background.stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 2 + 1, // Random speed for each star
          alpha: Math.random() * 0.5 + 0.3
        })
      }
    }

    // Handle window resizing
    const handleResize = () => {
      canvas.width = Math.min(window.innerWidth, 500)
      canvas.height = window.innerHeight * 0.8
      gameRef.current.player.x = canvas.width / 2 - gameRef.current.player.width / 2
      gameRef.current.player.y = canvas.height / 2 - gameRef.current.player.height / 2
      generateStars()
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (gameRef.current.animationFrame) {
        cancelAnimationFrame(gameRef.current.animationFrame)
      }
    }
  }, [])

  const startGame = () => {
    setIsStartAnimation(true)
    setIsGameOver(false)
    setNewHighScore(false)
    setScore(0)
    
    // Reset player position to center
    const canvas = canvasRef.current
    if (canvas) {
      gameRef.current.player.x = canvas.width / 2 - gameRef.current.player.width / 2
      gameRef.current.player.y = canvas.height / 2 - gameRef.current.player.height / 2
    }
    
    // Zoom in animation
    setTimeout(() => {
      setIsStartAnimation(false)
      setGameStarted(true)
      gameLoop()
    }, 2000) // Animation duration
  }

  const gameLoop = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const game = gameRef.current
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw black background
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Update and draw stars with backward movement
    ctx.fillStyle = 'gray'
    game.background.stars.forEach((star, index) => {
      // Move stars downward to create forward motion effect
      star.y += star.speed
      
      // Reset star position when it goes off screen
      if (star.y > canvas.height) {
        star.y = 0
        star.x = Math.random() * canvas.width
      }
      
      ctx.globalAlpha = star.alpha
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0
    
    // Handle movement controls
    if (game.touchState.isLeftTouching) {
      game.touchState.leftDuration++
      const moveSpeed = Math.min(game.touchState.leftDuration / 10, 1) * game.player.speed
      game.player.x = Math.max(0, game.player.x - moveSpeed)
    }
    
    if (game.touchState.isRightTouching) {
      game.touchState.rightDuration++
      const moveSpeed = Math.min(game.touchState.rightDuration / 10, 1) * game.player.speed
      game.player.x = Math.min(canvas.width - game.player.width, game.player.x + moveSpeed)
    }
    
    if (game.touchState.isUpTouching) {
      game.touchState.upDuration++
      const moveSpeed = Math.min(game.touchState.upDuration / 10, 1) * game.player.speed
      game.player.y = Math.max(0, game.player.y - moveSpeed)
    }
    
    if (game.touchState.isDownTouching) {
      game.touchState.downDuration++
      const moveSpeed = Math.min(game.touchState.downDuration / 10, 1) * game.player.speed
      game.player.y = Math.min(canvas.height - game.player.height, game.player.y + moveSpeed)
    }
    
    // Increase frame count
    game.frameCount++
    
    // Create new missile warnings
    if (game.frameCount % game.difficulty.missileFrequency === 0) {
      // Calculate number of missile warnings - increase by 2 every 20 points
      const missileCount = game.difficulty.missileBaseCount + (Math.floor(score / 20) * 2)
      
      for (let i = 0; i < missileCount; i++) {
        // Random position that's ahead of the player's current position
        let x, y
        do {
          // Spawn missiles more towards the top of the screen
          y = Math.random() * (canvas.height * 0.3) // Only in top 30% of screen
          x = Math.random() * (canvas.width - game.difficulty.missileSize)
        } while (Math.abs(x - game.player.x) < 100 && Math.abs(y - game.player.y) < 100)
        
        game.warningMissiles.push({
          x: x,
          y: y,
          size: game.difficulty.missileSize,
          warningTime: game.difficulty.missileWarningTime,
          alpha: 0.2,
          horizontalSpeed: (Math.random() * 2 - 1) * 0.5 // Random horizontal drift
        })
      }
    }
    
    // Update and draw missile warnings
    game.warningMissiles.forEach((warning, index) => {
      warning.warningTime--
      warning.alpha = 0.2 + (1 - warning.warningTime / game.difficulty.missileWarningTime) * 0.8
      
      // Draw warning indicator (red square)
      ctx.fillStyle = `rgba(255, 0, 0, ${warning.alpha})`
      ctx.fillRect(warning.x, warning.y, warning.size, warning.size)
      
      if (warning.warningTime <= 0) {
        game.missiles.push({
          x: warning.x,
          y: warning.y,
          size: warning.size,
          collisionRadius: warning.size / 2,
          alpha: 1,
          fallSpeed: Math.random() * 3 + 2, // Faster fall speed (2-5)
          horizontalSpeed: warning.horizontalSpeed
        })
        game.warningMissiles.splice(index, 1)
      }
    })
    
    // Update and draw active missiles
    game.missiles = game.missiles.filter(missile => {
      // Move missile downward and with slight horizontal movement
      missile.y += missile.fallSpeed
      missile.x += missile.horizontalSpeed
      
      // Fade out more slowly
      missile.alpha = Math.max(0, missile.alpha - 0.002)
      
      // Draw missile
      ctx.fillStyle = `rgba(255, 255, 255, ${missile.alpha})`
      ctx.fillRect(missile.x, missile.y, missile.size, missile.size)
      
      // If missile goes off screen or fades away completely, increment score
      if (missile.alpha <= 0 || 
          missile.y >= canvas.height || 
          missile.x <= -missile.size || 
          missile.x >= canvas.width) {
        setScore(prevScore => prevScore + 1)
        return false
      }
      
      // Keep missile if it's still visible and on screen
      return missile.alpha > 0 && 
             missile.y < canvas.height && 
             missile.x > -missile.size && 
             missile.x < canvas.width
    })
    
    // Check for collisions
    for (const missile of game.missiles) {
      const dx = (game.player.x + game.player.width/2) - (missile.x + missile.size/2)
      const dy = (game.player.y + game.player.height/2) - (missile.y + missile.size/2)
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < game.player.collisionRadius + missile.collisionRadius) {
        // Draw hit effect
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)' // Red overlay
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw the hitting missile in black
        ctx.fillStyle = 'black'
        ctx.fillRect(missile.x, missile.y, missile.size, missile.size)
        
        // Trigger game over with shake effect
        setCameraShake(true)
        setTimeout(() => {
          setCameraShake(false)
          gameOver()
        }, 500)
        return
      }
    }
    
    // Increase difficulty based on score
    if (score > 0) {
      // Increase missile frequency (spawn more often)
      game.difficulty.missileFrequency = Math.max(30, 80 - Math.floor(score / 500))
      
      // Decrease warning time
      game.difficulty.missileWarningTime = Math.max(30, 50 - Math.floor(score / 800))
      
      // Increase missile size
      game.difficulty.missileSize = Math.min(20, 12 + Math.floor(score / 2000))
      
      // Increase player speed slightly
      game.player.speed = Math.min(8, 5 + (score / 2000))
    }

    // Draw player (plane)
    const planeImg = document.getElementById('survivor-plane')
    if (planeImg.complete) {
      ctx.drawImage(
        planeImg,
        game.player.x,
        game.player.y,
        game.player.width,
        game.player.height
      )
    } else {
      planeImg.onload = () => {
        ctx.drawImage(
          planeImg,
          game.player.x,
          game.player.y,
          game.player.width,
          game.player.height
        )
      }
    }
    
    game.animationFrame = requestAnimationFrame(gameLoop)
  }

  const gameOver = () => {
    // Cancel the animation frame
    cancelAnimationFrame(gameRef.current.animationFrame)
    
    // Update high score if needed
    const isNewHighScore = score > highScore
    if (isNewHighScore) {
      setHighScore(score)
      typeof window !== 'undefined' && localStorage.setItem('survivorHighScore', score.toString())
      setNewHighScore(true)
    }
    
    // Reset game state
    gameRef.current = {
      ...gameRef.current,
      missiles: [],
      warningMissiles: [],
      frameCount: 0,
      difficulty: {
        missileFrequency: 40,
        missileWarningTime: 50,
        missileSpeed: 6,
        missileSize: 12,
        missileBaseCount: 3
      },
      player: {
        ...gameRef.current.player,
        speed: 5
      }
    }
    
    setGameStarted(false)
    setIsGameOver(true)
  }

  return (
    <>
      <Head>
        <title>Pixel Survivor Game</title>
        <meta name="description" content="Avoid pixel missiles in this plane survival game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph meta tags for better social sharing */}
        <meta property="og:title" content="Pixel Survivor Game" />
        <meta property="og:description" content="Navigate a pixel plane to avoid incoming missiles!" />
        <meta property="og:url" content="https://games.nishu.dev/survivor" />
        <meta property="og:type" content="website" />
      </Head>
      
      <main className={`${styles.main} ${inter.className}`}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <h1>Pixel Survivor</h1>
          <p className={styles.description}>Navigate through a field of pixel missiles!</p>
        </div>
        
        <div className={styles.center} style={{ 
          position: 'relative', 
          overflow: 'hidden',
          animation: cameraShake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
          border: '1px solid #333',
          marginTop: 10
        }}>
          {/* Hidden image element to load the plane SVG */}
          <img 
            id="survivor-plane" 
            src="/plane.svg" 
            alt="Plane" 
            style={{ display: 'none' }}
          />
          
          {!gameStarted ? (
            <div style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 10
            }}>
              {isGameOver ? (
                <>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '20px'
                  }}>
                    {newHighScore ? 'NEW HIGH SCORE!' : 'GAME OVER'}
                  </div>
                  
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}>
                    SCORE: {score}
                  </div>
                  
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: newHighScore ? '#ffdd00' : 'white',
                    textAlign: 'center',
                    marginBottom: '30px'
                  }}>
                    HIGHSCORE: {highScore}
                  </div>
                  
                  <button 
                    onClick={startGame} 
                    style={{ 
                      cursor: 'pointer', 
                      fontSize: 24, 
                      padding: '15px 30px', 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white', 
                      fontWeight: 700, 
                      border: 'none', 
                      borderRadius: 10,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  >
                    PLAY AGAIN
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={startGame} 
                    style={{ 
                      cursor: 'pointer', 
                      fontSize: 40, 
                      padding: 20, 
                      backgroundColor: 'transparent', 
                      color: 'white', 
                      fontWeight: 900, 
                      border: 'none', 
                      borderRadius: 10, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10,
                      animation: isStartAnimation ? 'zoom-in 2s forwards' : 'none'
                    }}
                  >
                    <FiPlay />
                  </button>
                  
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginTop: '20px'
                  }}>
                    HIGHSCORE: {highScore}
                  </div>
                  
                  <div style={{
                    fontSize: '18px',
                    color: 'white',
                    marginTop: '20px',
                    textAlign: 'center',
                    padding: '0 20px'
                  }}>
                    Use arrow keys or touch the screen to move.<br/>
                    Red warnings show where missiles will appear.<br/>
                    Avoid the white pixel missiles!
                  </div>
                </>
              )}
            </div>
          ) : null}
          
          {isStartAnimation && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20
            }}>
              <img 
                src="/plane.svg"
                alt="Plane Zooming"
                style={{
                  width: '60px',
                  height: '60px',
                  animation: 'zoom-in-out 2s forwards'
                }}
              />
            </div>
          )}
          
          <canvas 
            ref={canvasRef} 
            style={{ 
              display: 'block',
              touchAction: 'none' // Prevent default touch actions
            }}
          />
          
          {gameStarted && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              {score}
            </div>
          )}
          
          <style jsx>{`
            @keyframes zoom-in {
              0% { transform: scale(1); }
              100% { transform: scale(20); opacity: 0; }
            }
            
            @keyframes zoom-in-out {
              0% { transform: scale(0.1); opacity: 0; }
              50% { transform: scale(3); opacity: 1; }
              100% { transform: scale(0.1); opacity: 0; }
            }
            
            @keyframes shake {
              10%, 90% { transform: translate3d(-2px, 0, 0); }
              20%, 80% { transform: translate3d(4px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
              40%, 60% { transform: translate3d(6px, 0, 0); }
            }
          `}</style>
        </div>
      </main>
    </>
  )
}