// Initial data for KindMeal food rescue platform

export const INITIAL_AVAILABLE_MEALS = 100;

export function getDonorInitials(donorName) {
  if (!donorName) return 'KM';
  if (donorName.startsWith('MCC')) return 'MCC';
  const words = donorName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  if (words.length === 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words[0].length <= 3 && words[0] === words[0].toUpperCase()) return words[0];
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

export const INITIAL_FOOD_LISTINGS = [
  {
    id: 'listing-1',
    category: 'Cooked Meals',
    donor: 'MCC Community Canteen',
    quantity: 100,
    unit: 'meals',
    location: 'Chennai',
    deadline: 'Pickup before 2:00 PM',
    description: 'Freshly prepared vegetarian meals, packed and ready for pickup in eco-friendly warm containers.',
    status: 'AVAILABLE',
    typeBadge: 'Hot Meals',
    prepTime: 'Cooked 45 mins ago',
    dietary: 'Pure Vegetarian · Nutritionally Balanced'
  },
  {
    id: 'listing-2',
    category: 'Bakery Items',
    donor: 'FreshBite Bakery',
    quantity: 60,
    unit: 'packs',
    location: 'Avadi',
    deadline: 'Pickup before 5:00 PM',
    description: 'Fresh bakery items from today\'s surplus, including artisanal loaves, rolls, and packaged buns.',
    status: 'AVAILABLE',
    typeBadge: 'Baked Goods',
    prepTime: 'Baked Fresh Morning',
    dietary: 'Eggless Varieties · Sealed Packs'
  },
  {
    id: 'listing-3',
    category: 'Packaged Meals',
    donor: 'Green Leaf Restaurant',
    quantity: 80,
    unit: 'meals',
    location: 'Chennai',
    deadline: 'Pickup before 3:30 PM',
    description: 'Nutritious balanced packaged meal boxes from our lunch catering service, ready for immediate handover.',
    status: 'AVAILABLE',
    typeBadge: 'Lunch Boxes',
    prepTime: 'Packed at 12:15 PM',
    dietary: 'Rice, Lentils, Veggies · Sealed'
  },
  {
    id: 'listing-4',
    category: 'Cooked Meals',
    donor: 'Annapoorna Kitchens',
    quantity: 75,
    unit: 'meals',
    location: 'Chennai',
    deadline: 'Pickup before 4:00 PM',
    description: 'Wholesome hot South Indian meals with sambar rice, vegetable curry, and freshly pressed chapatis.',
    status: 'AVAILABLE',
    typeBadge: 'Hot Meals',
    prepTime: 'Cooked 30 mins ago',
    dietary: 'Pure Vegetarian · Ready to Eat'
  },
  {
    id: 'listing-5',
    category: 'Bakery Items',
    donor: 'Golden Crust Bakes',
    quantity: 45,
    unit: 'packs',
    location: 'Avadi',
    deadline: 'Pickup before 6:00 PM',
    description: 'Surplus whole wheat sandwich breads, milk buns, and evening snack biscuits in protective wraps.',
    status: 'AVAILABLE',
    typeBadge: 'Baked Goods',
    prepTime: 'Baked Today',
    dietary: '100% Vegetarian · Fresh Stock'
  },
  {
    id: 'listing-6',
    category: 'Packaged Meals',
    donor: 'Sunrise Catering',
    quantity: 50,
    unit: 'meals',
    location: 'Chennai',
    deadline: 'Pickup before 5:30 PM',
    description: 'Portioned corporate lunch boxes with vegetable biryani, raita, and seasonal steamed vegetables.',
    status: 'AVAILABLE',
    typeBadge: 'Bento Packs',
    prepTime: 'Packed 1 hr ago',
    dietary: 'Sealed Containers · Insulated'
  }
];

export const INITIAL_QUEUE = [
  {
    id: 'req-1',
    ngoName: 'Agaram Foundations',
    mealsRequested: 20,
    requestedAt: '11:49 AM',
    contactPerson: 'Sister Theresa',
    targetBeneficiary: 'NGO / Community Partner',
    foodListingId: 'listing-1',
    donorName: 'MCC Community Canteen',
    donorInitials: 'MCC',
    foodCategory: 'Cooked Meals',
    status: 'NEXT'
  },
  {
    id: 'req-2',
    ngoName: 'Asir Ilam Foundations',
    mealsRequested: 75,
    requestedAt: '11:50 AM',
    contactPerson: 'David Kumar',
    targetBeneficiary: 'NGO / Community Partner',
    foodListingId: 'listing-4',
    donorName: 'Annapoorna Kitchens',
    donorInitials: 'AK',
    foodCategory: 'Cooked Meals',
    status: 'WAITING'
  },
  {
    id: 'req-3',
    ngoName: 'Care Foundation',
    mealsRequested: 30,
    requestedAt: '11:54 AM',
    contactPerson: 'Ananya Sharma',
    targetBeneficiary: 'NGO / Community Partner',
    foodListingId: 'listing-2',
    donorName: 'FreshBite Bakery',
    donorInitials: 'FB',
    foodCategory: 'Bakery Items',
    status: 'WAITING'
  },
  {
    id: 'req-4',
    ngoName: 'Help Foundation',
    mealsRequested: 25,
    requestedAt: '11:58 AM',
    contactPerson: 'Ravi Verma',
    targetBeneficiary: 'NGO / Community Partner',
    foodListingId: 'listing-3',
    donorName: 'Green Leaf Restaurant',
    donorInitials: 'GL',
    foodCategory: 'Packaged Meals',
    status: 'WAITING'
  }
];

export const INITIAL_PROCESSED = [];
