export interface SampleTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  text: string;
}

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'whatsapp-trip',
    name: 'WhatsApp Trip Itinerary',
    badge: 'Travel / Social',
    description: 'Informal group chat message with flight times, restaurant bookings, and tour meets',
    text: `Guys here is the finalized plan for our Barcelona weekend! 🌴✈️

Friday Sept 11:
- Flight BA472 lands at BCN 14:15. Grab bags and meet at Aerobus terminal.
- Check-in Hotel Arts (Carrer de la Marina 19) around 16:00.
- Tapas dinner at El Xampanyet (Montcada 22) booked for 20:30 sharp. Don't be late!

Saturday Sept 12:
- Sagrada Familia guided tour: Meet guide Marco at Passion Façade entrance at 10:00 AM (tickets valid until 12:30).
- Beach volleyball + paella lunch at Bogatell Beach: 14:00 - 17:00.
- Sunset rooftop drinks at Mirador del Carmel starting 19:30.

Sunday Sept 13:
- Park Güell morning stroll: 09:30 - 11:30 (Carretera del Carmel entry).
- Hotel checkout at 13:00.
- Head to airport for return flight departing 17:45.`
  },
  {
    id: 'syllabus-deadlines',
    name: 'Syllabus & Course Schedule',
    badge: 'Student / Academic',
    description: 'Messy lecture dates, assignment due dates, quiz times, and exam room locations',
    text: `CS 401: Distributed Systems — Fall Semester Schedule

Lectures:
- Welcome & Architecture Foundations: Sept 9, 2026 from 10:00 AM to 11:30 AM in Turing Hall 105.
- Consensus Protocols (Raft & Paxos): Sept 16, 2026, 10:00 AM - 11:30 AM in Turing Hall 105.

Office Hours & Review:
- TA Office Hours with Sarah: Sept 18, 2026, 14:00 to 16:00 via Zoom (link: meet.zoom.us/j/401ta).

Key Course Milestones & Deadlines:
- Lab 1 (RPC & Key-Value Store) submission due: Sept 22, 2026 by 23:59 on Canvas.
- Midterm Exam: Oct 14, 2026, 09:00 - 11:00 AM in Science Center Auditorium B.`
  },
  {
    id: 'freelance-milestones',
    name: 'Freelance Client Project Milestones',
    badge: 'Freelance / Work',
    description: 'Email thread containing sprint kickoffs, stakeholder demo, and launch deadline',
    text: `Hi Alex,
Thanks for the call earlier. Here are the agreed dates for the brand redesign sprint:

1. Kickoff & Discovery Workshop
Date: September 10, 2026
Time: 11:00 AM - 12:30 PM EST
Location: Google Meet (link sent in calendar invite)
Agenda: Review existing brand assets, discuss target audience personas.

2. Wireframe & User Flow Walkthrough
Date: September 17, 2026
Time: 3:00 PM - 4:00 PM EST
Location: Figma live screen share

3. Final Design Handoff & Prototype Sign-off
Date: September 25, 2026
Time: 10:00 AM - 11:00 AM EST

4. Beta Launch Deploy
Date: September 30, 2026
All day milestone.`
  },
  {
    id: 'admin-summit',
    name: 'Annual Tech Summit Agenda',
    badge: 'Admin / Conference',
    description: 'Conference email itinerary with keynote, workshop tracks, and networking reception',
    text: `2026 Innovation Summit Itinerary:

Day 1 — September 14, 2026:
- 08:30 AM - 09:30 AM: Registration & Continental Breakfast, Main Lobby
- 09:30 AM - 10:45 AM: Opening Keynote: The Future of Autonomous Agents, Grand Ballroom A
- 11:15 AM - 12:45 PM: Workshop Track: Building Production LLM Systems, Room 302
- 01:00 PM - 02:15 PM: Catered Networking Lunch, South Terrace
- 02:30 PM - 04:00 PM: Panel: Scalable Cloud Architectures, Hall C
- 05:30 PM - 07:30 PM: Evening Welcome Reception & Drinks, Sky Lounge`
  }
];
