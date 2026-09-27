// The 6 cabs + prices currently hard-coded in the old frontend (public/js/index.js).
const DZIRE_CLASS_PRICING = {
  local: { baseFare: 180, perKm: 14 },
  outstation: { minimumFare: 1400, perKm: 14, driverAllowance: 220 },
  airport: { baseFare: 220, perKm: 15 },
};

export const cabs = [
  {
    key: 'wagonr', name: 'WagonR', category: 'Hatchback', image: '/images/img_029.jpg',
    seats: 4, luggage: '2 Bags', fuel: 'CNG', transmission: 'Manual', sortOrder: 1,
    pricing: {
      local: { baseFare: 150, perKm: 13 },
      outstation: { minimumFare: 1200, perKm: 13, driverAllowance: 200 },
      airport: { baseFare: 200, perKm: 14 },
    },
  },
  {
    key: 'dzire', name: 'Swift Dzire', category: 'Sedan', image: '/images/img_031.jpg',
    seats: 4, luggage: '2 Bags', fuel: 'Petrol', transmission: 'Manual', sortOrder: 2,
    pricing: DZIRE_CLASS_PRICING,
  },
  {
    key: 'amaze', name: 'Honda Amaze', category: 'Sedan', image: '/images/img_033.jpg',
    seats: 4, luggage: '2 Bags', fuel: 'Petrol', transmission: 'Manual', sortOrder: 3,
    pricing: DZIRE_CLASS_PRICING,
  },
  {
    key: 'aura', name: 'Hyundai Aura', category: 'Sedan', image: '/images/img_035.jpg',
    seats: 4, luggage: '2 Bags', fuel: 'CNG', transmission: 'Manual', sortOrder: 4,
    pricing: DZIRE_CLASS_PRICING,
  },
  {
    key: 'ertiga', name: 'Maruti Ertiga', category: 'MPV', image: '/images/img_037.jpg',
    seats: 7, luggage: '4 Bags', fuel: 'CNG', transmission: 'Manual', sortOrder: 5,
    pricing: {
      local: { baseFare: 250, perKm: 18 },
      outstation: { minimumFare: 1600, perKm: 18, driverAllowance: 250 },
      airport: { baseFare: 300, perKm: 19 },
    },
  },
  {
    key: 'crysta', name: 'Innova Crysta', category: 'SUV', image: '/images/img_039.jpg',
    seats: 7, luggage: '4 Bags', fuel: 'Diesel', transmission: 'Automatic', sortOrder: 6,
    pricing: {
      local: { baseFare: 350, perKm: 22 },
      outstation: { minimumFare: 2200, perKm: 22, driverAllowance: 300 },
      airport: { baseFare: 450, perKm: 23 },
    },
  },
];
