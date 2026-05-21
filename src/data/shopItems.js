export const shopItems = [
  "Hand soap",
  "Body wash",
  "Shampoo",
  "Dental kit",
  "Body lotion",
  "Bath essentials",
].map((title, index) => ({
  id: `toiletry-${index + 1}`,
  title,
  description: "Toiletries",
  preparationTime: "Premium self care essentials",
  tags: ["Personal Care", "Toiletries", "Essentials"],
  rating: "4.8",
  price: 200000,
  image: "",
  detailImage: "",
}));
