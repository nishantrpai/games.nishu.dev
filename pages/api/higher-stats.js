export default function handler(req, res) {
  // Get data from Farcaster Frame
  const { untrustedData } = req.body;
  
  // Log frame interaction (optional)
  console.log('Frame interaction:', untrustedData);
  
  // Return a response image or redirect
  res.status(200).json({
    frameVersion: 'vNext',
    image: 'https://games.nishu.dev/higher-preview.png',
    buttons: [
      {
        label: 'Play Now',
        action: 'post_redirect',
        target: 'https://games.nishu.dev/higher'
      }
    ]
  });
}
