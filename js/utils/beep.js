t.module(async () => {
  const beepSoundData = await t.requireAsync('js/utils/beepSoundData');
  const beepSound = new Audio(beepSoundData);
  
  return {
    playBeep: () => {
      // Plays a beep sound
      beepSound.play();
    },
  };
});
