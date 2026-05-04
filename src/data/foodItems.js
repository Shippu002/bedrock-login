import bookingsImage from "../assets/bookings.jpg";
import foodHeroImage from "../assets/food-1.png";

export const foodItems = Array.from({ length: 6 }, (_, index) => ({
  id: `mega-chicken-${index + 1}`,
  title: "Mega chicken",
  description: "Eggs, toast, bacon sausage, fresh fruit",
  preparationTime: "Preparation takes: 39 - 40 min",
  tags: ["Lunch", "Vegetarian"],
  rating: "4.8",
  price: 200000,
  image: foodHeroImage,
  detailImage: bookingsImage,
}));
