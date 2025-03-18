import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Game.module.css'
import { useState, useEffect, useRef } from 'react'
import { FiPlay } from 'react-icons/fi'

const inter = Inter({ subsets: ['latin'] })

export default function HigherGame() {
  const canvasRef = useRef(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isStartAnimation, setIsStartAnimation] = useState(false)
  const [cameraShake, setCameraShake] = useState(false)
  const gameRef = useRef({
    player: {
      x: 0,
      y: 0,
      width: 80,      // Increased from 40 to 80
      height: 80,     // Increased from 40 to 80
      speed: 5,
      brightness: 0,
      collisionRadius: 15  // Actual collision radius is smaller than visual size
    },
    obstacles: [],
    background: {
      y: 0,
      stars: []
    },
    animationFrame: null,
    touchState: {
      isLeftTouching: false,
      isRightTouching: false,
      leftDuration: 0,
      rightDuration: 0
    },
    difficulty: {
      obstacleFrequency: 120, // frames between obstacles
      obstacleSpeed: 5,
      visibility: 1 // 1 means full visibility
    },
    frameCount: 0
  })

  useEffect(() => {
    const storedHighScore = typeof window !== 'undefined' ? parseInt(localStorage.getItem('higherHighScore') || '0') : 0
    setHighScore(storedHighScore)
  }, [])

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (!gameStarted) return
      
      const touchX = e.touches[0].clientX
      const canvasWidth = canvasRef.current.width
      
      if (touchX < canvasWidth / 2) {
        gameRef.current.touchState.isLeftTouching = true
        gameRef.current.touchState.leftDuration = 0
      } else {
        gameRef.current.touchState.isRightTouching = true
        gameRef.current.touchState.rightDuration = 0
      }
    }
    
    const handleTouchEnd = (e) => {
      if (!gameStarted) return
      
      // Check if there are any remaining touches
      const remainingTouches = Array.from(e.touches)
      
      if (remainingTouches.some(touch => touch.clientX < canvasRef.current.width / 2)) {
        // Still touching left side
        gameRef.current.touchState.isLeftTouching = true
      } else {
        gameRef.current.touchState.isLeftTouching = false
        gameRef.current.touchState.leftDuration = 0
      }
      
      if (remainingTouches.some(touch => touch.clientX >= canvasRef.current.width / 2)) {
        // Still touching right side
        gameRef.current.touchState.isRightTouching = true
      } else {
        gameRef.current.touchState.isRightTouching = false
        gameRef.current.touchState.rightDuration = 0
      }
    }

    const handleKeyDown = (e) => {
      if (!gameStarted) return
      
      if (e.key === 'ArrowLeft') {
        gameRef.current.touchState.isLeftTouching = true
      } else if (e.key === 'ArrowRight') {
        gameRef.current.touchState.isRightTouching = true
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
    
    // Center player horizontally
    gameRef.current.player.x = canvas.width / 2 - gameRef.current.player.width / 2
    gameRef.current.player.y = canvas.height - gameRef.current.player.height - 20
    
    // Generate initial stars
    generateStars()
    
    function generateStars() {
      gameRef.current.background.stars = []
      const numStars = Math.floor(canvas.height / 8) // More stars for larger screens
      
      for (let i = 0; i < numStars; i++) {
        gameRef.current.background.stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 2, // Some stars below viewport
          size: Math.random() * 1.5 + 0.5, // Smaller stars (0.5 to 2.0)
          speed: Math.random() * 0.5 + 0.1
        })
      }
    }

    // Handle window resizing
    const handleResize = () => {
      canvas.width = Math.min(window.innerWidth, 500)
      canvas.height = window.innerHeight * 0.8
      gameRef.current.player.x = canvas.width / 2 - gameRef.current.player.width / 2
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
    
    // Update background gradient based on score
    const gradientTop = Math.min(0.4 + (score / 5000), 0.8) // Darkens as score increases
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, `rgba(25, 25, 112, ${gradientTop})`) // Midnight blue at top
    gradient.addColorStop(1, 'rgba(135, 206, 235, 0.7)') // Sky blue at bottom
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Update player brightness based on score (gets brighter as score increases)
    game.player.brightness = Math.min(255, Math.floor(score / 500) * 25)
    
    // Draw and update stars
    ctx.fillStyle = 'white'
    game.background.stars.forEach((star, index) => {
      star.y += star.speed
      
      // If star goes out of view, reset it to the top
      if (star.y > canvas.height) {
        star.y = -10
        star.x = Math.random() * canvas.width
      }
      
      // Draw star with opacity based on game visibility
      ctx.globalAlpha = game.difficulty.visibility * (0.4 + (star.size / 3))
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1.0
    
    // Handle touch controls
    if (game.touchState.isLeftTouching) {
      game.touchState.leftDuration++
      // Calculate movement speed based on duration of touch
      const moveSpeed = Math.min(game.touchState.leftDuration / 10, 1) * game.player.speed
      game.player.x = Math.max(0, game.player.x - moveSpeed)
    }
    
    if (game.touchState.isRightTouching) {
      game.touchState.rightDuration++
      // Calculate movement speed based on duration of touch
      const moveSpeed = Math.min(game.touchState.rightDuration / 10, 1) * game.player.speed
      game.player.x = Math.min(canvas.width - game.player.width, game.player.x + moveSpeed)
    }
    
    // Create new obstacles
    game.frameCount++
    if (game.frameCount % game.difficulty.obstacleFrequency === 0) {
      // Calculate number of obstacles based on score (more as game progresses)
      const obstacleCount = 1 + Math.floor(score / 1000)
      
      // Select positions for obstacles that aren't too close together
      const positions = []
      for (let i = 0; i < obstacleCount; i++) {
        let validPos = false
        let attempts = 0
        let newX
        
        while (!validPos && attempts < 10) {
          newX = Math.random() * (canvas.width - 40)
          validPos = true
          
          // Check if this position is far enough from other selected positions
          for (const pos of positions) {
            if (Math.abs(newX - pos) < 100) { // Minimum distance between obstacles
              validPos = false
              break
            }
          }
          
          attempts++
        }
        
        if (validPos) {
          positions.push(newX)
        }
      }
      
      // Add the obstacles at selected positions
      positions.forEach(x => {
        game.obstacles.push({
          x: x,
          y: -80, // Start above the canvas (increased from -40 to -80)
          width: 80,  // Increased from 40 to 80
          height: 80, // Increased from 40 to 80
          collisionRadius: 15, // Actual collision radius is smaller than visual size
          color: getRandomObstacleColor() // Assign random color to obstacle
        })
      })
    }
    
    // Update obstacle positions and draw them
    game.obstacles.forEach((obstacle, index) => {
      obstacle.y += game.difficulty.obstacleSpeed
      
      // Draw the down arrow using the same SVG but rotated and with color
      ctx.save()
      ctx.translate(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2)
      ctx.rotate(Math.PI) // Rotate 180 degrees
      ctx.globalAlpha = game.difficulty.visibility
      
      // Color the obstacle arrow
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = obstacle.width
      tempCanvas.height = obstacle.height
      const tempCtx = tempCanvas.getContext('2d')
      
      // Draw original arrow
      tempCtx.drawImage(
        document.getElementById('higherarrow'),
        0, 
        0,
        obstacle.width,
        obstacle.height
      )
      
      // Apply color
      tempCtx.fillStyle = obstacle.color
      tempCtx.globalCompositeOperation = 'source-atop'
      tempCtx.fillRect(0, 0, obstacle.width, obstacle.height)
      
      // Draw to main canvas
      ctx.drawImage(
        tempCanvas,
        -obstacle.width/2,
        -obstacle.height/2,
        obstacle.width,
        obstacle.height
      )
      
      ctx.restore()
      
      // Remove obstacles that have gone off screen
      if (obstacle.y > canvas.height) {
        game.obstacles.splice(index, 1)
        // Increase score as obstacles are avoided
        setScore(prevScore => prevScore + 10)
      }
      
      // Debug collision areas (uncomment to see collision boundaries)
      /*
      ctx.beginPath();
      ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, obstacle.collisionRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'red';
      ctx.stroke();
      */
    })
    
    // Draw player (up arrow) - with brightness adjustment
    if (game.player.brightness > 0) {
      // Create a colored version of the arrow
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = game.player.width
      tempCanvas.height = game.player.height
      const tempCtx = tempCanvas.getContext('2d')
      
      // Draw the original arrow
      tempCtx.drawImage(
        document.getElementById('higherarrow'),
        0, 
        0,
        game.player.width,
        game.player.height
      )
      
      // Apply brightness
      const brightness = game.player.brightness
      tempCtx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, 0.5)`
      tempCtx.globalCompositeOperation = 'source-atop'
      tempCtx.fillRect(0, 0, game.player.width, game.player.height)
      
      // Draw to main canvas
      ctx.drawImage(
        tempCanvas,
        game.player.x,
        game.player.y,
        game.player.width,
        game.player.height
      )
    } else {
      // Draw regular black arrow
      ctx.drawImage(
        document.getElementById('higherarrow'),
        game.player.x,
        game.player.y,
        game.player.width,
        game.player.height
      )
    }
    
    // Debug player collision area (uncomment to see collision boundaries)
    /*
    ctx.beginPath();
    ctx.arc(game.player.x + game.player.width/2, game.player.y + game.player.height/2, game.player.collisionRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'green';
    ctx.stroke();
    */
    
    // Check for collisions using the collision radius instead of rectangle collision
    for (const obstacle of game.obstacles) {
      const dx = (game.player.x + game.player.width/2) - (obstacle.x + obstacle.width/2);
      const dy = (game.player.y + game.player.height/2) - (obstacle.y + obstacle.height/2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < game.player.collisionRadius + obstacle.collisionRadius) {
        // Collision detected - Game Over
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
      // Reduce obstacle frequency (spawn more often)
      game.difficulty.obstacleFrequency = Math.max(60, 120 - Math.floor(score / 500))
      
      // Increase obstacle speed
      game.difficulty.obstacleSpeed = Math.min(8, 3 + (score / 800))
      
      // Increase player speed gradually
      game.player.speed = Math.min(9, 5 + (score / 1000))
      
      // Decrease visibility (make it harder to see)
      game.difficulty.visibility = Math.max(0.3, 1 - (score / 10000))
    }
    
    // Continue the game loop
    game.animationFrame = requestAnimationFrame(gameLoop)
  }

  const gameOver = () => {
    // Cancel the animation frame
    cancelAnimationFrame(gameRef.current.animationFrame)
    
    // Update high score if needed
    if (score > highScore) {
      setHighScore(score)
      typeof window !== 'undefined' && localStorage.setItem('higherHighScore', score.toString())
    }
    
    // Reset game
    gameRef.current.obstacles = []
    gameRef.current.frameCount = 0
    gameRef.current.difficulty = {
      obstacleFrequency: 120,
      obstacleSpeed: 3,
      visibility: 1
    }
    
    setGameStarted(false)
    setTimeout(() => setScore(0), 100)
  }

  // Function to generate random colors for obstacles (avoiding black which is the player color)
  const getRandomObstacleColor = () => {
    const colors = [
      '#e74c3c', // Red
      '#d35f5f', // Blue
      '#ce4b4b', // Green
      '#ce4b4b', // Purple
      '#b43131', // Orange
      '#8c2626', // Turquoise
      '#3c1010'  // Dark Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <>
      <Head>
        <title>Higher Arrow Game</title>
        <meta name="description" content="A simple arrow dodging game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Farcaster Frames meta tags */}
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="https://games.nishu.dev/higher-preview.png" />
        <meta name="fc:frame:button:1" content="How high can you go?" />
        <meta name="fc:frame:button:1:action" content="post_redirect" />
        <meta name="fc:frame:button:1:target" content="https://games.nishu.dev/higher" />
        <meta name="fc:frame:post_url" content="https://games.nishu.dev/api/higher-stats" />
        
        {/* Open Graph meta tags for better social sharing */}
        <meta property="og:title" content="Higher Arrow Game" />
        <meta property="og:description" content="A simple arrow dodging game - see how high you can go!" />
        <meta property="og:image" content="https://games.nishu.dev/higher-preview.png" />
        <meta property="og:url" content="https://games.nishu.dev/higher" />
        <meta property="og:type" content="website" />
        
        {/* Twitter card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Higher Arrow Game" />
        <meta name="twitter:description" content="A simple arrow dodging game - see how high you can go!" />
        <meta name="twitter:image" content="https://games.nishu.dev/higher-preview.png" />
      </Head>
      
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.description}>
          <h1>Higher Arrow</h1>
          <p style={{ border: 'none' }}>Dodge the arrows as you rise higher into the sky!</p>
        </div>
        
        <div className={styles.center} style={{ 
          position: 'relative', 
          overflow: 'hidden',
          animation: cameraShake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none'
        }}>
          {/* Hidden image element to load the arrow SVG */}
          <img 
            id="higherarrow" 
            src="/higherarrow.svg" 
            alt="Arrow" 
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
              backgroundColor: 'rgba(0,0,0,0.75)',
              zIndex: 10
            }}>
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
                Touch left/right side of screen to move.<br/>
                The longer you hold, the faster you move.
              </div>
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
                src="/higherarrow.svg"
                alt="Arrow Zooming"
                style={{
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
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
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
