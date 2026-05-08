import toiletriesOneImage from "../assets/toiletries-1.jpg";
import toiletriesTwoImage from "../assets/toiletries-2.jpg";

const toiletriesImages = [toiletriesOneImage, toiletriesTwoImage];

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
  image: toiletriesImages[index % toiletriesImages.length],
  detailImage: toiletriesImages[index % toiletriesImages.length],
}));
