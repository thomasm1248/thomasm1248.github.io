t.module('brainCode', () => ({ code: `
->start

TODO: This path hasn't been coded yet \\:
.okay: Okay. End the conversation.

start: WHO AWAKENS ME FROM MY SLUMBER?!
.me: I do.
->whoAreYou

whoAreYou: Who are you, and from whence do you come to bother me?!!
.visitor: Just a visitor stopping by...
->doYouKnowMe
.thomas: Thomas
->whatToDoMaster

doYouKnowMe: Peon of the dust, DO YOU KNOW WHO I AM?!!!!!
.yes: Yeah, I've already met you
->ohOkay
.no: No, who are you?
->whoIAm

ohOkay: Oh, okay. How can I be of service?
.somethingCool: Show me something cool
->https://omni.vi/demos/diffuse
->https://tokipona.org/
->https://www.window-swap.com/
->https://onio.club/
->https://melonland.net/
.master: Take me to your master
->mailto:thomasm1248@gmail.com
.nothing: No need. I'm done

whoIAm: I AM THE LORD OF THIS GREAT SQUARE! I own every rectangle in this province and I rule from the left edge all the way to the right edge, and from the top edge all the way to the bottom edge! BOW BEFORE ME PEASANT!!! It is by my good-will that you are granted passage through this place.
.okay: Okay???

waterReminder: MWAAAHAAHAHAHAHAHAAAAA!!! You have gone long enough without the life-giving essence of water that you're mortal body is already beginning to SHRIVEL AND DIE!!
~15m
.done: Okay, I just drank some water
.alreadyDone: Actually, I just had a drink pretty recently
->ohIThoughtYouWereDehydrated

ohIThoughtYouWereDehydrated: Oh, I could have sworn I felt your soul slowly diminishing. It must have been someone else. I'LL BE BACK!!!!!!
.okay: Okay, whatever

whatToDoMaster: Master, what shall I do for thee?
.nothing: Nothing yet
`}));
