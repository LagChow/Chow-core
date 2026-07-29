export const vendors = [
  {
    id: "olaiya-foods",
    name: "Olaiya Foods (New Hall)",
    coverImage: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80",
    rating: 4.5,
    reviews: "1k+",
    deliveryTime: "25-40 min",
    distance: "1.2 km",
    deliveryFee: "₦500",
    minOrder: "₦1,000",
    tags: ["Rice", "Swallow", "Local"],
    queueStatus: {
      demand: "Moderate",
      status: "Moderate",
      color: "yellow",
      time: "25-40 mins"
    },
    categories: [
      {
        id: "rice",
        name: "Rice Dishes",
        items: [
          {
            id: "jollof",
            name: "Classic Jollof Rice",
            description: "Smoky Nigerian Jollof rice served with plantain and your choice of protein.",
            price: 2500,
            image: "https://images.unsplash.com/photo-1662486790575-d143c748c1e2?auto=format&fit=crop&w=400&q=80",
            popular: true,
          }
        ]
      }
    ]
  },
  {
    id: "foodician",
    name: "Foodician",
    coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    reviews: "3k+",
    deliveryTime: "25-35 min",
    distance: "0.8 km",
    deliveryFee: "₦400",
    minOrder: "₦1,500",
    tags: ["Burgers", "Fast Food"],
    queueStatus: {
      demand: "High",
      status: "Rush Hour",
      color: "red",
      time: "25-35 mins"
    },
    categories: [
      {
        id: "burgers",
        name: "Burgers",
        items: [
          {
            id: "cheese-burger",
            name: "Double Cheese Burger",
            description: "Two juicy beef patties with extra cheese.",
            price: 4500,
            image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
            popular: true,
          }
        ]
      }
    ]
  },
  {
    id: "gaby",
    name: "Gaby",
    coverImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80",
    rating: 4.2,
    reviews: "800+",
    deliveryTime: "10-15 min",
    distance: "2.1 km",
    deliveryFee: "₦600",
    minOrder: "₦1,000",
    tags: ["Pasta", "Continental"],
    queueStatus: {
      demand: "Moderate",
      status: "Moderate",
      color: "yellow",
      time: "10-15 mins"
    },
    categories: [
      {
        id: "pasta",
        name: "Pasta",
        items: [
          {
            id: "spaghetti",
            name: "Spaghetti Bolognese",
            description: "Rich tomato sauce with minced meat.",
            price: 3500,
            image: "https://images.unsplash.com/photo-1621996311210-915147395eb1?auto=format&fit=crop&w=400&q=80",
            popular: true,
          }
        ]
      }
    ]
  },
  {
    id: "mavise",
    name: "Mavise",
    coverImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    reviews: "5k+",
    deliveryTime: "5-8 min",
    distance: "0.5 km",
    deliveryFee: "₦300",
    minOrder: "₦800",
    tags: ["Pastries", "Snacks"],
    queueStatus: {
      demand: "Low",
      status: "Available",
      color: "green",
      time: "5-8 mins"
    },
    categories: [
      {
        id: "pastries",
        name: "Pastries",
        items: [
          {
            id: "meatpie",
            name: "Classic Meatpie",
            description: "Flaky pastry filled with minced meat and potatoes.",
            price: 800,
            image: "https://images.unsplash.com/photo-1601000938259-9e92002320b2?auto=format&fit=crop&w=400&q=80",
            popular: true,
          }
        ]
      }
    ]
  },
  {
    id: "korede-spaghetti",
    name: "Korede Spaghetti",
    coverImage: "https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=1200&q=80",
    rating: 4.6,
    reviews: "2k+",
    deliveryTime: "15-20 min",
    distance: "1.0 km",
    deliveryFee: "₦400",
    minOrder: "₦1,200",
    tags: ["Pasta", "Local", "Spicy"],
    queueStatus: {
      demand: "High",
      status: "Busy",
      color: "red",
      time: "15-20 mins"
    },
    categories: [
      {
        id: "spaghetti",
        name: "Spaghetti Meals",
        items: [
          {
            id: "stir-fry-spag",
            name: "Stir-fry Spaghetti with Turkey",
            description: "Spicy stir-fried spaghetti loaded with veggies and served with peppered turkey.",
            price: 3200,
            image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80",
            popular: true,
          }
        ]
      }
    ]
  }
];

export function getVendorById(id: string) {
  return vendors.find(v => v.id === id) || vendors[0];
}
