t.module(`

"start"
"WHO AWAKENS ME FROM MY SLUMBER?!"
options:
  => "I do."
    ; [
      "userName" .get
      dup then
        dup "Thomas" = then
          "whatToDoMaster"
        else
          "be of service"
        end
      else
        "whoAreYou"
      end
    ] <<

"whoAreYou"
"What is your name?"
"userName" "doYouKnowMe" make-prompt

"doYouKnowMe"
"Peon of the dust, DO YOU KNOW WHO I AM?!!!!!"
options:
  => "No, who are you?"
    "whoIAm" <<

"be of service"
"How can I be of service?"
options:
  => "Show me something cool"
    ; [
      "https://omni.vi/demos/diffuse"
      "https://tokipona.org/"
      "https://www.window-swap.com/"
      "https://onio.club/"
      "https://melonland.net/"
      0 5 random
      dup "index: " swap + print
      while dup 0 > do
        print-stack
        nip
        print-stack
        1 -
      done
      drop
    ] <<
  => "Take me to your master"
    "mailto:thomasm1248@gmail.com" <<
  => "No need. I'm done"
    "exit" <<

"whoIAm"
"I AM THE LORD OF THIS GREAT SQUARE! I own every rectangle in this province and I rule from the left edge all the way to the right edge, and from the top edge all the way to the bottom edge! BOW BEFORE ME PEASANT!!! It is by my good-will that you are granted passage through this place."
options:
  => "Okay???"
    "exit" <<

"whatToDoMaster"
"Master, what shall I do for thee?"
options:
  => "Forget who I am."
    ; [
      null swap "userName" .set
      "exit"
    ] <<
  => "Nothing."
    "exit" <<

`);
