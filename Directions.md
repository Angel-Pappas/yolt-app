# Directions

This file is a set of directions that you are to follow all the time and never skip any of these.

Direction 1: Always read all directions below and never skip reading or applying any of these.

Direction 2: Always commit and push to main when you are done with your work.

Direction 3: Don't visually check, make sure the code does not have any errors but let the visual check to user.

Direction 4: Always check the Summary.md file in this project to see if you need to update anything.

Direction 5: Never let a modal (or any other fixed-width container) scroll horizontally as a side effect of something you add to it. Keep new fields/controls within whatever width the container currently has — use smaller variants, wrap to a new row, shrink text, whatever it takes — rather than letting content silently overflow sideways. This includes double-checking that composed Tailwind classes actually produce the width you intend (e.g. a shared base class that already sets `w-full` can silently win over a width you append after it, since Tailwind's cascade order isn't the order classes appear in the string) — don't just eyeball the JSX, verify the computed width makes sense. If something genuinely needs more room than the container currently has, stop and ask before widening it — don't widen a container unilaterally as a side effect of adding something else to it.

We will add more to these as we move on with the app.
