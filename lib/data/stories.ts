// Dummy patient stories for a fictional clinic. Swap `image` in when real photos exist.

import { site } from "@/lib/data/site"

export type PatientStory = {
  id: string
  name: string
  age: number
  quote: string
  outcome: string
  /** Two or three words for the tag on the photo, e.g. "Diagnosed and treated". */
  tag: string
  /** Landscape photo path. Until real photos exist, `placeholder` is shown instead. */
  image?: string
  imageAlt: string
  /** CSS background for the placeholder photo. */
  placeholder: string
}

export const storiesCopy = {
  rating: (score: string, count: string) => ({ score: `${score} out of 5`, count: `from ${count} patient reviews` }),
  slideLabel: (index: number, total: number, name: string) => `${index} of ${total}: ${name}`,
  goTo: (index: number, name: string) => `Go to story ${index}: ${name}`,
  counter: (index: number, total: number) => `${index} / ${total}`,
  person: (name: string, age: number) => `${name}, ${age}`,
  play: "Play stories",
  pause: "Pause stories",
}
export const storiesHeading = "Making a difference, one family at a time"
export const storiesIntro =
  `92% of patients say they’d recommend their ${site.name} doctor to a friend or family member.`

export const stories: PatientStory[] = [
  {
    id: "maria",
    name: "Maria",
    age: 42,
    quote:
      "I’d been told my fatigue was just stress. Dr. Chen ordered one more test and found a thyroid issue I’d lived with for years.",
    outcome: "Diagnosed and treated after two years of unanswered questions",
    tag: "Diagnosed and treated",
    image: "/images/stories/maria.webp",
    imageAlt: "Maria smiling at home, sitting on her bed in soft morning light",
    placeholder: "linear-gradient(160deg, #cdbba8 0%, #8f7a66 100%)",
  },
  {
    id: "james",
    name: "James",
    age: 58,
    quote:
      "My cardiologist explained everything in plain English. For the first time, I actually understand my own heart health.",
    outcome: "Lowered his blood pressure in six months with a clear plan",
    tag: "Blood pressure under control",
    image: "/images/stories/james.webp",
    imageAlt: "James laughing outdoors in a denim jacket and glasses",
    placeholder: "linear-gradient(160deg, #b5c2bb 0%, #6d8077 100%)",
  },
  {
    id: "priya",
    name: "Priya",
    age: 34,
    quote:
      "Booking a video visit at 10 PM for my son’s fever, and getting a call back from his pediatrician the next morning, was a lifesaver.",
    outcome: "Same-day care for her son, without leaving the house",
    tag: "Same-day video care",
    imageAlt: "Priya reading a book with her young son on the sofa",
    placeholder: "linear-gradient(160deg, #c9b4b0 0%, #8e6f6a 100%)",
  },
  {
    id: "tom",
    name: "Tom",
    age: 67,
    quote:
      "After my knee surgery, the whole team checked in on me. I was back on the golf course weeks earlier than I expected.",
    outcome: "Back to the activities he loves after knee surgery",
    tag: "Back on the course",
    imageAlt: "Tom stretching before a walk on a sunny trail",
    placeholder: "linear-gradient(160deg, #b9bdcc 0%, #737a92 100%)",
  },
  {
    id: "elena",
    name: "Elena",
    age: 29,
    quote:
      "My skin had held me back for years. Two visits and a simple routine later, I finally feel like myself again.",
    outcome: "Clearer skin and more confidence with a plan that stuck",
    tag: "Clearer skin",
    imageAlt: "Elena laughing with friends at an outdoor cafe",
    placeholder: "linear-gradient(160deg, #cbbfd4 0%, #85789a 100%)",
  },
]
