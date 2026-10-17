// Work categories a worker can opt into. A camera operator is offered camera work, not catering,
// unless they opted into both.
const SKILLS = [
    'Catering helper', 'Waiter / server', 'Cook assistant', 'Decoration helper', 'Florist assistant',
    'Electrician / lighting', 'Sound technician', 'LED wall technician', 'Camera operator', 'Photography assistant',
    'Drone operator', 'Driver', 'Loader / labour', 'Housekeeping', 'Guest assistance / usher', 'Security',
    'Valet parking', 'Makeup assistant', 'Mehndi artist', 'Event supervisor'
];

const LEVELS = ['Fresher', 'Experienced', 'Expert'];
const levelRank = (l) => Math.max(0, LEVELS.indexOf(l));

module.exports = { SKILLS, LEVELS, levelRank };
