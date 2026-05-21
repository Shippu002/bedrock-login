const foodCatalog = [
  {
    title: "Classic breakfast",
    description: "Eggs, toast, bacon sausage, fresh fruit",
    tags: ["Breakfast", "Continental"],
  },
  {
    title: "English breakfast",
    description: "Eggs, sausage, beans, toast and grilled tomatoes",
    tags: ["Breakfast", "Chef special"],
  },
  {
    title: "Pancake stack",
    description: "Golden pancakes with syrup and seasonal fruit",
    tags: ["Breakfast", "Sweet"],
  },
  {
    title: "Yam and egg sauce",
    description: "Boiled yam served with rich tomato egg sauce",
    tags: ["Breakfast", "Local"],
  },
  {
    title: "Oatmeal bowl",
    description: "Warm oats with banana, honey and nuts",
    tags: ["Breakfast", "Healthy"],
  },
  {
    title: "Akara breakfast",
    description: "Akara served with pap and fresh fruit",
    tags: ["Breakfast", "Local"],
  },
  {
    title: "Mega chicken",
    description: "Jollof rice served with grilled chicken",
    tags: ["Lunch", "Popular"],
  },
  {
    title: "Chicken pasta",
    description: "Creamy pasta with seasoned chicken strips",
    tags: ["Lunch", "Chef special"],
  },
  {
    title: "Fried rice combo",
    description: "Fried rice with chicken, plantain and salad",
    tags: ["Lunch", "Combo"],
  },
  {
    title: "Beef burger",
    description: "Juicy beef burger with fries and sauce",
    tags: ["Lunch", "Fast meal"],
  },
  {
    title: "Vegetable stir fry",
    description: "Fresh vegetables tossed with rice or noodles",
    tags: ["Lunch", "Vegetarian"],
  },
  {
    title: "Grilled chicken salad",
    description: "Mixed greens with grilled chicken and dressing",
    tags: ["Lunch", "Healthy"],
  },
  {
    title: "Dinner platter",
    description: "Rice, chicken, plantain and house sauce",
    tags: ["Dinner", "Popular"],
  },
  {
    title: "Peppered chicken",
    description: "Spicy peppered chicken with fried yam",
    tags: ["Dinner", "Spicy"],
  },
  {
    title: "Seafood rice",
    description: "Special rice cooked with prawns and fish",
    tags: ["Dinner", "Chef special"],
  },
  {
    title: "Grilled fish",
    description: "Grilled fish served with chips and vegetables",
    tags: ["Dinner", "Fresh"],
  },
  {
    title: "Ofada rice",
    description: "Ofada rice served with ayamase sauce",
    tags: ["Dinner", "Local"],
  },
  {
    title: "Chicken shawarma",
    description: "Loaded shawarma with chicken and creamy sauce",
    tags: ["Dinner", "Quick bite"],
  },
];

export const foodItems = foodCatalog.map((item, index) => ({
  id: `food-${index + 1}`,
  ...item,
  preparationTime: "Preparation takes: 39 - 40 min",
  rating: "4.8",
  price: 200000,
  image: "",
  detailImage: "",
}));
