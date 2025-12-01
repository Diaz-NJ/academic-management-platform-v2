// frontend/src/utils/notificationSound.js

// ✅ Create notification sound using Web Audio API
export const playNotificationSound = () => {
  try {
    // Check if user has interacted with the page (required for audio)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create a simple "ding" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';
    
    // Fade in/out for smoother sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

// ✅ Alternative: Use a more pleasant notification sound
export const playNotificationSoundEnhanced = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create two tones for a pleasant "notification" sound
    const playTone = (frequency, startTime, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Play a pleasant two-tone notification
    const now = audioContext.currentTime;
    playTone(600, now, 0.15);
    playTone(800, now + 0.1, 0.2);
    
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};